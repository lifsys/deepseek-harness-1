/**
 * The operator audit-export app over a real Loader tree: the parsed request
 * becomes injected runner config, the runner exports through the mounted
 * trust-audit provider, and help or usage errors export nothing.
 */

import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import Include from '@deepseek-ai/cordis-plugin-include'
import { internals as cmdlineInternals, provideCmdline } from '@deepseek-ai/dsh-cmdline'
import FileTrustAuditProvider from '@deepseek-ai/dsh-trust-audit-file'
import type { TrustAuditRecord } from '@deepseek-ai/dsh-trust-audit'
import type { UserId } from '@deepseek-ai/dsh-trust-identity'
import { afterEach, describe, expect, it } from 'vitest'
import { apply as runnerApply, Config as RunnerConfig, internals as runnerInternals } from '../src/index.ts'
import { apply as startupApply, TRUST_AUDIT_EXPORT_SERVICE } from '../src/startup.ts'

/** What one boot of the fixture tree observed. */
interface Observed {
  exits: number[]
  out: string
  err: string
}

const disposers: (() => Promise<void>)[] = []

afterEach(async () => {
  for (const dispose of disposers.splice(0)) await dispose()
  cmdlineInternals.stdout = process.stdout
  cmdlineInternals.stderr = process.stderr
  runnerInternals.stdout = process.stdout
  runnerInternals.stderr = process.stderr
})

const RECORDS: readonly TrustAuditRecord[] = [
  { type: 'auth/login', time: 1_000, userId: 'admin-1' as UserId },
  { type: 'authz/denied', time: 2_000, userId: 'dev-1' as UserId, action: 'execute', resource: 'tool:danger-full-access' },
  { type: 'credential/accessed', time: 3_000, userId: 'admin-1' as UserId, resource: 'DEEPSEEK_API_KEY' },
]

/**
 * Boot the bundle's three rows through the Loader over a seeded audit log.
 * @param args - the invocation's inner arguments.
 * @returns the temp audit root and the observed process effects.
 */
async function bootExport(args: string[]): Promise<{ root: string; observed: Observed }> {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-trust-audit-cli-'))
  const auditRoot = join(dir, 'audit-home')
  // The provider appends to this file at runtime; an operator export reads a
  // log an earlier enterprise run already wrote.
  mkdirSync(auditRoot, { recursive: true })
  writeFileSync(join(auditRoot, 'audit.jsonl'), RECORDS.map(record => `${JSON.stringify(record)}\n`).join(''))
  const observed: Observed = { exits: [], out: '', err: '' }

  // Loader imports through Node's resolver, so these fixtures delegate to the
  // source-plane plugins already imported by this test.
  writeFileSync(join(dir, 'provider.mjs'), 'export default globalThis.__trustAuditCli.provider\n')
  writeFileSync(join(dir, 'startup.mjs'), `
export const name = 'trust-audit-export-startup'
export const inject = ['cmdlineArgs']
export const apply = ctx => globalThis.__trustAuditCli.startupApply(ctx)
`)
  writeFileSync(join(dir, 'runner.mjs'), `
export const name = 'trust-audit-export'
export const inject = ['trustAudit']
export const Config = globalThis.__trustAuditCli.runnerConfig
export const apply = (ctx, config) => globalThis.__trustAuditCli.runnerApply(ctx, config)
`)
  writeFileSync(join(dir, 'cordis.yml'), [
    '- id: trust-audit',
    `  name: ${pathToFileURL(join(dir, 'provider.mjs')).href}`,
    '  config:',
    `    path: ${JSON.stringify(auditRoot)}`,
    '- id: trust-audit-export-startup',
    `  name: ${pathToFileURL(join(dir, 'startup.mjs')).href}`,
    '- id: trust-audit-export',
    `  name: ${pathToFileURL(join(dir, 'runner.mjs')).href}`,
    `  inject: [${TRUST_AUDIT_EXPORT_SERVICE}]`,
    '  config:',
    '    sink: !!js ctx.trustAuditExport.sink',
    '    since: !!js ctx.trustAuditExport.since',
    '    until: !!js ctx.trustAuditExport.until',
    '    types: !!js ctx.trustAuditExport.types',
    '    userId: !!js ctx.trustAuditExport.userId',
    '    out: !!js ctx.trustAuditExport.out',
    '',
  ].join('\n'))

  const stdout = { write: (chunk: string) => { observed.out += chunk; return true } }
  const stderr = { write: (chunk: string) => { observed.err += chunk; return true } }
  cmdlineInternals.stdout = stdout
  cmdlineInternals.stderr = stderr
  runnerInternals.stdout = stdout
  runnerInternals.stderr = stderr
  ;(globalThis as unknown as { __trustAuditCli: unknown }).__trustAuditCli = {
    provider: FileTrustAuditProvider,
    startupApply,
    runnerApply,
    runnerConfig: RunnerConfig,
  }

  const ctx = new Context()
  await ctx.plugin(Loader)
  ctx.loader.builtins.include = Include
  provideCmdline(ctx, { args, exit: code => void observed.exits.push(code) })
  await ctx.loader.create({ name: 'cordis:include', config: { path: pathToFileURL(join(dir, 'cordis.yml')).href } })
  await ctx.loader.await()
  disposers.push(async () => { await ctx.fiber.dispose() })
  return { root: dir, observed }
}

/**
 * Wait until the runner's asynchronous export has settled.
 * @param observed - the boot's observed effects.
 */
async function settled(observed: Observed): Promise<void> {
  for (let attempt = 0; attempt < 50 && observed.exits.length === 0; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}

describe('trust audit export REAL composition', () => {
  it('exports every recorded audit line through the mounted provider', async () => {
    const { observed } = await bootExport(['export'])
    await settled(observed)
    expect(observed.exits).toEqual([0])
    const lines = observed.out.split('\n').filter(line => line.length > 0)
    expect(lines.map(line => (JSON.parse(line) as TrustAuditRecord).type))
      .toEqual(['auth/login', 'authz/denied', 'credential/accessed'])
  })

  it('narrows the export by record type and principal', async () => {
    const { observed } = await bootExport(['export', '--type', 'authz/denied', '--user', 'dev-1'])
    await settled(observed)
    expect(observed.exits).toEqual([0])
    const lines = observed.out.split('\n').filter(line => line.length > 0)
    expect(lines).toHaveLength(1)
    expect((JSON.parse(lines[0] ?? '{}') as TrustAuditRecord).resource).toBe('tool:danger-full-access')
  })

  it('narrows the export by time bounds', async () => {
    const { observed } = await bootExport(['export', '--since', '2000', '--until', '2000'])
    await settled(observed)
    const lines = observed.out.split('\n').filter(line => line.length > 0)
    expect(lines.map(line => (JSON.parse(line) as TrustAuditRecord).type)).toEqual(['authz/denied'])
  })

  it('writes the payload to --out instead of stdout', async () => {
    const target = join(mkdtempSync(join(tmpdir(), 'dsh-trust-audit-out-')), 'audit.jsonl')
    const { observed } = await bootExport(['export', '--out', target])
    await settled(observed)
    expect(observed.out).toBe('')
    expect(observed.err).toContain('dsh: wrote')
    expect(readFileSync(target, 'utf8').split('\n').filter(line => line.length > 0)).toHaveLength(3)
  })

  it('rejects an unsupported sink and exports nothing', async () => {
    const { observed } = await bootExport(['export', '--sink', 'syslog'])
    expect(observed.err).toContain('--sink must be one of')
    expect(observed.out).toBe('')
    expect(observed.exits).toEqual([1])
  })

  it('rejects an unknown record type and exports nothing', async () => {
    const { observed } = await bootExport(['export', '--type', 'auth/unknown'])
    expect(observed.err).toContain('--type must be one of')
    expect(observed.out).toBe('')
    expect(observed.exits).toEqual([1])
  })

  it('rejects a non-integer time bound', async () => {
    const { observed } = await bootExport(['export', '--since', 'yesterday'])
    expect(observed.err).toContain('--since needs an epoch-millisecond integer')
    expect(observed.exits).toEqual([1])
  })

  it('prints its own help and leaves the runner pending', async () => {
    const { observed } = await bootExport(['--help'])
    expect(observed.out).toContain('dsh --profile trust-audit')
    expect(observed.out).toContain('Export enterprise trust audit records')
    expect(observed.exits).toEqual([0])
  })
})
