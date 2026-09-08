/**
 * The audit-export app's command-line provider: it parses the `export`
 * subcommand and publishes {@link TRUST_AUDIT_EXPORT_SERVICE}. The runner row is
 * an ordinary consumer whose lazy config waits for that service.
 * @module @deepseek-ai/dsh-trust-audit-cli/startup
 */

import { Command } from 'commander'
import type { Context } from '@deepseek-ai/cordis'
import { parseCmdline } from '@deepseek-ai/dsh-cmdline'
import type { TrustAuditRecordType, TrustAuditSink } from '@deepseek-ai/dsh-trust-audit'

/** Stable Cordis plugin name. */
export const name = 'trust-audit-export-startup'

/** Services required before the export request can be resolved. */
export const inject = ['cmdlineArgs']

/** Service provided by this plugin and injected by the export runner. */
export const TRUST_AUDIT_EXPORT_SERVICE = 'trustAuditExport'

/** Sinks this command accepts, in help order. */
const SINKS: readonly TrustAuditSink[] = ['file', 'jsonl', 'otel']

/** Audit record types this command accepts for `--type`. */
const RECORD_TYPES: readonly TrustAuditRecordType[] = [
  'auth/login',
  'auth/logout',
  'authz/denied',
  'approval/decided',
  'admin/policy-changed',
  'credential/accessed',
  'export/session',
]

/** What the runner row reads from {@link TRUST_AUDIT_EXPORT_SERVICE}. */
export interface TrustAuditExportValues {
  /** Destination sink the provider serializes for. */
  sink: TrustAuditSink
  /** Lower bound on record time in epoch milliseconds, when given. */
  since?: number
  /** Upper bound on record time in epoch milliseconds, when given. */
  until?: number
  /** Record types to keep, when given. */
  types?: readonly TrustAuditRecordType[]
  /** Principal whose records to keep, when given. */
  userId?: string
  /** File the payload is written to; stdout when absent. */
  out?: string
}

interface ExportOptions {
  sink: string
  since?: string
  until?: string
  type?: string[]
  user?: string
  out?: string
}

/** Repeatable single-value collector: `--type auth/login --type authz/denied`. */
const collect = (value: string, previous: string[] = []): string[] => [...previous, value]

/**
 * This app's command tree: `export` with its filter flags and help text.
 * @returns a fresh program, so one process can parse more than once (tests).
 */
function trustAuditCommand(): Command {
  const program = new Command()
    .name('dsh --profile trust-audit')
    .description('Export enterprise trust audit records recorded by the trust-audit seam.')
    .helpOption('-h, --help', 'show this help')
  program
    .command('export')
    .description('Serialize matching audit records through the mounted trust-audit provider.')
    .helpOption('-h, --help', 'show this help')
    .option('--sink <name>', `destination sink (${SINKS.join(', ')})`, 'jsonl')
    .option('--since <epochMs>', 'keep records at or after this epoch-millisecond time')
    .option('--until <epochMs>', 'keep records at or before this epoch-millisecond time')
    .option('--type <recordType>', 'keep only this record type (repeatable)', collect)
    .option('--user <userId>', 'keep only records bound to this principal')
    .option('--out <path>', 'write the payload to this file instead of stdout')
    .addHelpText('after', `
Examples:
  dsh --profile trust-audit export                              print every record as JSONL
  dsh --profile trust-audit export --type authz/denied          print denial records only
  dsh --profile trust-audit export --since 1756800000000 --out audit.jsonl
`)
  return program
}

/**
 * Reject a flag whose value is not a finite epoch-millisecond integer.
 * @param command - the command that reports the usage error.
 * @param flag - user-facing flag name for the diagnostic.
 * @param raw - the flag's raw text, or `undefined` when it was omitted.
 * @returns the parsed time, or `undefined` when the flag was omitted.
 */
function epochMs(command: Command, flag: string, raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value < 0) {
    command.error(`error: ${flag} needs an epoch-millisecond integer, got ${JSON.stringify(raw)}`)
  }
  return value
}

/**
 * Parse and provide the export request as an ordinary Cordis service. An
 * unknown sink or record type is a usage error, so on rejection (and on
 * `--help`) nothing is provided.
 * @param ctx - plugin context carrying the command line.
 */
export function apply(ctx: Context): void {
  const program = trustAuditCommand()
  const exportCommand = program.commands.find(command => command.name() === 'export')
  /* v8 ignore next -- the command is registered above */
  if (exportCommand === undefined) throw new Error('trust-audit-export-startup: export command missing')
  exportCommand.action((options: ExportOptions) => {
    const sink = options.sink as TrustAuditSink
    if (!SINKS.includes(sink)) {
      exportCommand.error(`error: --sink must be one of ${SINKS.join(', ')}, got ${JSON.stringify(options.sink)}`)
    }
    const types = options.type
    for (const type of types ?? []) {
      if (!RECORD_TYPES.includes(type as TrustAuditRecordType)) {
        exportCommand.error(`error: --type must be one of ${RECORD_TYPES.join(', ')}, got ${JSON.stringify(type)}`)
      }
    }
    const since = epochMs(exportCommand, '--since', options.since)
    const until = epochMs(exportCommand, '--until', options.until)
    ctx.provide(TRUST_AUDIT_EXPORT_SERVICE, {
      sink,
      ...since !== undefined ? { since } : {},
      ...until !== undefined ? { until } : {},
      ...types !== undefined ? { types: types as readonly TrustAuditRecordType[] } : {},
      ...options.user !== undefined ? { userId: options.user } : {},
      ...options.out !== undefined ? { out: options.out } : {},
    } satisfies TrustAuditExportValues)
  })
  parseCmdline(ctx, program)
}
