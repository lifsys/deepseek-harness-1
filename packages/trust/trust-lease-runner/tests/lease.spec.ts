/** Lease gating on the tool pipeline: only configured tools need a lease. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
import { Session, SessionId } from '@deepseek-ai/dsh-session'
import AgentRegistry, { Inbox } from '@deepseek-ai/dsh-agent'
import type { Agent } from '@deepseek-ai/dsh-agent'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime, { defineContentToolFixture } from '@deepseek-ai/dsh-tools'
import MemoryTrustLeaseProvider, { type CapabilityLease, type LeaseId, type LeaseScope } from '@deepseek-ai/dsh-trust-lease'
import { apply as leaseRunner } from '../src/index.ts'

let context: Context | undefined

/** Lease lifecycle the runner drove during one execution. */
const journal: string[] = []

afterEach(async () => {
  await context?.fiber.dispose()
  context = undefined
  journal.length = 0
})

/** Records the acquire/revoke pair the runner drives around a gated execution. */
class RecordingLeaseProvider extends MemoryTrustLeaseProvider {
  /** @inheritdoc */
  override async acquire(scope: LeaseScope, budgetMs: number): Promise<CapabilityLease> {
    const lease = await super.acquire(scope, budgetMs)
    journal.push(`acquire:${scope}:${budgetMs}`)
    return lease
  }

  /** @inheritdoc */
  override async revoke(id: LeaseId): Promise<void> {
    journal.push('revoke')
    await super.revoke(id)
  }
}

/** Stands in for a grant that expired between acquisition and use. */
class ExpiredLeaseProvider extends RecordingLeaseProvider {
  /** @inheritdoc */
  override witness(_lease: CapabilityLease): boolean {
    return false
  }
}

/** Register one Agent whose scope the tool executor runs under. */
function agent(ctx: Context): Agent {
  const scope = ctx.plugin(() => {})
  const id = SessionId('trust-lease-runner-agent')
  const session = Session.create(id)
  const value: Agent = {
    id,
    options: {},
    session,
    inbox: new Inbox(session, { inserted: () => {}, discarded: () => {}, claimed: () => {} }),
    status: 'idle',
    ctx: scope.ctx,
    send: () => {},
    followup: () => {},
    steer: () => {},
    inject: () => {},
    cancel() {},
    runMaintenance: job => job(new AbortController().signal),
    whenIdle: () => Promise.resolve(),
  }
  ctx.agents.register(value)
  return value
}

/**
 * Mount the tool pipeline, one lease provider, and the runner over two probe tools.
 * @param gatedTools - the runner's configured gate list.
 * @param provider - the lease provider under test.
 * @returns the tools that ran and an executor for one probe.
 */
async function bench(gatedTools: string[], provider: typeof MemoryTrustLeaseProvider): Promise<{
  ran: string[]
  execute: (name: string) => Promise<{ isError?: boolean; content: { type: string; text?: string }[] }>
}> {
  const ctx = new Context()
  context = ctx
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(provider)
  ctx.plugin({ name: 'trust-lease-runner', inject: ['trustLease'], apply: leaseRunner }, { gatedTools, budgetMs: 60_000 })
  const ran: string[] = []
  for (const name of ['dynamic_cordis_invoke', 'Read']) {
    ctx.tools.register(defineContentToolFixture({
      name,
      description: 'lease probe',
      parameters: {},
      execute() {
        ran.push(name)
        return Promise.resolve([{ type: 'text' as const, text: `${name} ran` }])
      },
    }))
  }
  const owner = agent(ctx)
  return {
    ran,
    execute: (name: string) => ctx.tools.execute({
      signal: new AbortController().signal,
      callId: ToolCallId(`lease-${name}`),
      name,
      arguments: {},
      agent: owner,
    }),
  }
}

describe('trust lease runner', () => {
  it('runs a gated tool under a witnessed lease and releases it afterwards', async () => {
    const { ran, execute } = await bench(['dynamic_cordis_invoke'], RecordingLeaseProvider)
    const result = await execute('dynamic_cordis_invoke')
    expect(result.isError).toBeFalsy()
    expect(ran).toEqual(['dynamic_cordis_invoke'])
    expect(journal).toEqual(['acquire:dynamic-plugin:60000', 'revoke'])
  })

  it('leaves an ungated tool alone', async () => {
    const { ran, execute } = await bench(['dynamic_cordis_invoke'], ExpiredLeaseProvider)
    const result = await execute('Read')
    expect(result.isError).toBeFalsy()
    expect(ran).toEqual(['Read'])
    expect(journal).toEqual([])
  })

  it('denies a gated tool whose lease cannot be witnessed', async () => {
    const { ran, execute } = await bench(['dynamic_cordis_invoke'], ExpiredLeaseProvider)
    const result = await execute('dynamic_cordis_invoke')
    expect(result.isError).toBe(true)
    expect(result.content.map(block => block.text ?? '').join('')).toContain('lease expired')
    expect(ran).toEqual([])
    expect(journal).toEqual(['acquire:dynamic-plugin:60000'])
  })
})
