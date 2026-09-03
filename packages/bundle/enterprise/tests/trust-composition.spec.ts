import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Context, Service } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import Include from '@deepseek-ai/cordis-plugin-include'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
import { Session, SessionId, type SessionEvent } from '@deepseek-ai/dsh-session'
import AgentRegistry, { Inbox } from '@deepseek-ai/dsh-agent'
import type { Agent } from '@deepseek-ai/dsh-agent'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime, { defineContentToolFixture } from '@deepseek-ai/dsh-tools'
import OidcTrustIdentityProvider from '@deepseek-ai/dsh-trust-identity-oidc'
import { RbacTrustAuthorizationProvider } from '@deepseek-ai/dsh-trust-authorization-rbac'
import JsonlTrustLogProvider from '@deepseek-ai/dsh-trust-log-jsonl'
import { TrustLogTamperedError } from '@deepseek-ai/dsh-trust-log'
import SessionStore from '@deepseek-ai/dsh-session'
import TypertRegistry from '@deepseek-ai/dsh-typert-registry'
import TypertGatewayService from '@deepseek-ai/dsh-api-gateway'
import {
  bindTypertRemote,
  Remote,
} from '@deepseek-ai/dsh-typert-protocol'

let root: string | undefined
let context: Context | undefined

afterEach(async () => {
  await context?.fiber.dispose()
  context = undefined
  if (root !== undefined) await rm(root, { recursive: true, force: true })
  root = undefined
})

type FakeRpcResult =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly error: { readonly code: string; readonly message: string; readonly details: object } }

type FakeRpcHandler = (endpoint: string, payload: unknown, signal: AbortSignal) => Promise<FakeRpcResult>

class FakeConnectionService extends Service {
  handler: FakeRpcHandler | undefined

  constructor(ctx: Context) {
    super(ctx, 'connection')
  }

  get rpc() {
    const owner = this.ctx
    return {
      intercept: (
        _channel: string,
        _matches: (endpoint: string) => boolean,
        handler: FakeRpcHandler,
      ) =>
        owner.effect(() => {
          this.handler = handler
          return () => { this.handler = undefined }
        }),
    }
  }

  requestRejection(): undefined {
    return undefined
  }
}

class ProbeService extends Service {
  readonly typertRemote = bindTypertRemote(this, 'probe')

  constructor(ctx: Context) {
    super(ctx, 'probe')
  }

  @Remote
  ping(): string {
    return 'pong'
  }
}

function agent(ctx: Context): Agent {
  const scope = ctx.plugin(() => {})
  const id = SessionId('enterprise-trust-agent')
  const session = Session.create(id)
  const value: Agent = {
    id, options: {}, session, inbox: new Inbox(session, { inserted: () => {}, discarded: () => {}, claimed: () => {} }),
    status: 'idle',
    ctx: scope.ctx,
    send: () => {},
    followup: () => {}, steer: () => {}, inject: () => {}, cancel() {},
    runMaintenance: job => job(new AbortController().signal),
    whenIdle: () => Promise.resolve(),
  }
  ctx.agents.register(value)
  return value
}

function resultText(result: { content: { type: string; text?: string }[] }): string {
  return result.content.filter(block => block.type === 'text').map(block => block.text).join('')
}

describe('enterprise trust REAL composition', () => {
  it('unauthenticated Host RPC returns unauthorized', async () => {
    context = new Context()
    await context.plugin(FakeConnectionService)
    await context.plugin(OidcTrustIdentityProvider, {
      staticBindings: [{
        token: 'enterprise-admin-token',
        principal: { userId: 'admin-1', displayName: 'Admin', roles: ['admin'] },
      }],
    })
    await context.plugin(TypertRegistry)
    await context.plugin(TypertGatewayService)
    await context.plugin(ProbeService)

    const connection = context.get('connection') as unknown as FakeConnectionService
    const handler = connection.handler
    expect(handler).toBeTypeOf('function')
    const result = await handler!('probe/ping', { args: {} }, new AbortController().signal)
    expect(result).toEqual({
      ok: false,
      error: {
        code: 'unauthorized',
        message: 'authentication required',
        details: {},
      },
    })
  })

  it('authenticated Host RPC succeeds when principal is bound', async () => {
    context = new Context()
    await context.plugin(FakeConnectionService)
    await context.plugin(OidcTrustIdentityProvider, {
      staticBindings: [{
        token: 'enterprise-admin-token',
        principal: { userId: 'admin-1', displayName: 'Admin', roles: ['admin'] },
      }],
    })
    await context.plugin(TypertRegistry)
    await context.plugin(TypertGatewayService)
    await context.plugin(ProbeService)

    const handler = (context.get('connection') as unknown as FakeConnectionService).handler!
    const session = await context.trustIdentity.authenticate({ credential: 'enterprise-admin-token' })
    const result = await context.trustIdentity.withPrincipal(session!.principal, () =>
      handler('probe/ping', { args: {} }, new AbortController().signal))
    expect(result).toEqual({ ok: true, value: 'pong' })
  })

  it('RBAC denyTools blocks danger-full-access through cordis.yml tools/pre-execute', async () => {
    root = await mkdtemp(join(tmpdir(), 'dsh-enterprise-rbac-'))
    const configPath = join(root, 'cordis.yml')
    await writeFile(configPath, [
      "- name: '@deepseek-ai/dsh-agent'",
      "- name: '@deepseek-ai/dsh-system-prompt'",
      "- name: '@deepseek-ai/dsh-tools'",
      "- name: '@deepseek-ai/dsh-trust-identity-oidc'",
      '  config:',
      '    staticBindings:',
      '      - token: enterprise-dev-token',
      '        principal:',
      '          userId: dev-1',
      '          displayName: Developer',
      '          roles: [developer]',
      "- name: '@deepseek-ai/dsh-trust-authorization-rbac'",
      '  config:',
      '    roles:',
      '      - role: developer',
      '        permissions: [tool:Read]',
      '      - role: admin',
      '        permissions: ["*"]',
      '    denyTools: [danger-full-access]',
      '',
    ].join('\n'))

    context = new Context()
    context.baseUrl = pathToFileURL(root).href + '/'
    await context.plugin(Loader)
    context.loader.builtins.include = Include
    const modules = new Map<string, unknown>([
      ['@deepseek-ai/dsh-agent', AgentRegistry],
      ['@deepseek-ai/dsh-system-prompt', SystemPrompt],
      ['@deepseek-ai/dsh-tools', ToolRuntime],
      ['@deepseek-ai/dsh-trust-identity-oidc', OidcTrustIdentityProvider],
      ['@deepseek-ai/dsh-trust-authorization-rbac', RbacTrustAuthorizationProvider],
    ])
    context.loader.internal = {
      version: 'v2',
      async import(specifier: string) {
        if (!modules.has(specifier)) throw new Error(`unexpected Loader import: ${specifier}`)
        return modules.get(specifier)
      },
    } as unknown as NonNullable<typeof context.loader.internal>
    await context.loader.create({ name: 'cordis:include', config: { path: pathToFileURL(configPath).href } })
    await context.loader.await()

    let ran = false
    context.tools.register(defineContentToolFixture({
      name: 'danger-full-access',
      description: 'escalation probe',
      parameters: {},
      async execute() {
        ran = true
        return [{ type: 'text', text: 'should not run' }]
      },
    }))

    const owner = agent(context)
    const session = await context.trustIdentity.authenticate({ credential: 'enterprise-dev-token' })
    expect(session).toBeDefined()
    const result = await context.trustIdentity.withPrincipal(session!.principal, () =>
      context!.tools.execute({
        signal: new AbortController().signal,
        callId: ToolCallId('deny-1'),
        name: 'danger-full-access',
        arguments: {},
        agent: owner,
      }))
    expect(ran).toBe(false)
    expect(result.isError).toBe(true)
    expect(resultText(result)).toContain('authorization denied')
  })

  it('tampered trust-log hash chain refuses verify and persistence load', async () => {
    root = await mkdtemp(join(tmpdir(), 'dsh-enterprise-log-'))
    const chainRoot = join(root, 'trust-log')
    context = new Context()
    await context.plugin(SessionStore)
    const eventsHolder: { events: SessionEvent[] } = { events: [] }
    context.provide('sessionPersistence', {
      async load(id: SessionId) {
        return { meta: { id }, events: eventsHolder.events }
      },
    } as never)
    await context.plugin(JsonlTrustLogProvider, { root: chainRoot })

    const session = context.sessions.create()
    session.append('turn/start', { turn: 1 })
    eventsHolder.events = [...session.events]
    await context.trustLog.extendChain(session.id, [...session.events])
    const chainPath = join(chainRoot, `${session.id}.chain.jsonl`)
    const text = await readFile(chainPath, 'utf8')
    await writeFile(chainPath, text.replace(/[0-9a-f]{64}/, `${'0'.repeat(64)}`), 'utf8')
    await expect(context.trustLog.verifySession(session.id)).rejects.toBeInstanceOf(TrustLogTamperedError)
    await expect(context.sessionPersistence.load(session.id)).rejects.toBeInstanceOf(TrustLogTamperedError)
  })
})
