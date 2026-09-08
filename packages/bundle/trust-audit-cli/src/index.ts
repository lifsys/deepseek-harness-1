/**
 * @deepseek-ai/dsh-trust-audit-cli — the operator audit-export app. The bundle
 * patch rides over dsh-base with no Host, HTTP, or browser plugins: it mounts
 * the file audit provider, parses one `export` invocation, calls
 * `ctx.trustAudit.export`, writes the payload to stdout or a file, and exits.
 * @module @deepseek-ai/dsh-trust-audit-cli
 */

import { writeFile } from 'node:fs/promises'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { TrustAuditFilter, TrustAuditRecordType, TrustAuditSink } from '@deepseek-ai/dsh-trust-audit'
import type { UserId } from '@deepseek-ai/dsh-trust-identity'
// Empty type imports carry the loader Context merge for the settlement await
// and the cmdline Context merge for the appExit host value.
import type {} from '@deepseek-ai/cordis-plugin-loader'
import type {} from '@deepseek-ai/dsh-cmdline'

/** Stable Cordis plugin name. */
export const name = 'trust-audit-export'

/** The audit seam this runner exports from. */
export const inject = ['trustAudit']

/** Plugin config: the export request resolved from this app's provider service. */
export interface Config {
  /** Destination sink the mounted provider serializes for. */
  sink: TrustAuditSink
  /** Lower bound on record time in epoch milliseconds. */
  since?: number
  /** Upper bound on record time in epoch milliseconds. */
  until?: number
  /** Record types to keep; every type when absent. */
  types?: readonly string[]
  /** Principal whose records to keep; every principal when absent. */
  userId?: string
  /** File the payload is written to; stdout when absent. */
  out?: string
}

export const Config = z.object({
  sink: z.union([z.const('file'), z.const('jsonl'), z.const('otel')]).required(),
  since: z.number().step(1).min(0),
  until: z.number().step(1).min(0),
  types: z.array(z.string()),
  userId: z.string(),
  out: z.string(),
})

/** Process-facing effects of one export: output streams plus the launcher's bounded exit request. */
interface ExportIo {
  stdout: { write(chunk: string): unknown }
  stderr: { write(chunk: string): unknown }
  /** Request process exit with `code` after the tree disposes. */
  exit(code: number): void
}

/** The process streams the runner writes to; tests substitute captures. */
export const internals: { stdout: ExportIo['stdout']; stderr: ExportIo['stderr'] } = {
  stdout: process.stdout,
  stderr: process.stderr,
}

/**
 * Build the provider filter from the validated config, omitting absent bounds
 * so a provider distinguishes "no bound" from "bound at zero". An empty type
 * list means every type, not no type: config validation materializes the
 * omitted array, and a literal empty `types` would match nothing.
 * @param config - validated export request.
 * @returns the filter passed to `trustAudit.export`.
 */
function filterOf(config: Config): TrustAuditFilter {
  const types = config.types ?? []
  return {
    ...config.since !== undefined ? { since: config.since } : {},
    ...config.until !== undefined ? { until: config.until } : {},
    ...types.length > 0 ? { types: types as readonly TrustAuditRecordType[] } : {},
    ...config.userId !== undefined ? { userId: config.userId as UserId } : {},
  }
}

/**
 * Export matching audit records and request process exit.
 * @param ctx - plugin context carrying the audit seam and the Loader settlement await.
 * @param config - validated export request.
 * @param io - process-facing effects.
 */
async function run(ctx: Context, config: Config, io: ExportIo): Promise<void> {
  // Loader siblings mount concurrently. Await the complete application so the
  // audit provider row is mounted before the export reads it.
  await ctx.get('loader')?.await()
  const audit = ctx.get('trustAudit')
  // Early process shutdown can dispose the tree while settlement is pending.
  if (audit === undefined) return
  const payload = await audit.export(config.sink, filterOf(config))
  if (config.out === undefined) {
    io.stdout.write(payload)
  } else {
    await writeFile(config.out, payload, 'utf8')
    io.stderr.write(`dsh: wrote ${config.out}\n`)
  }
  io.exit(0)
}

/**
 * Mount the audit-export runner.
 * @param ctx - plugin context carrying the audit seam and the launcher-provided exit request.
 * @param config - validated export request.
 */
export function apply(ctx: Context, config: Config): void {
  // Read through the global service store, not the property proxy: appExit is
  // an optional host value, never an injected dependency.
  const exit = ctx.get('appExit')
  if (exit === undefined) {
    throw new Error('trust-audit-export: the launcher must provide ctx.appExit before the tree mounts')
  }
  const io: ExportIo = { stdout: internals.stdout, stderr: internals.stderr, exit }
  void run(ctx, config, io).catch((error: unknown) => {
    io.stderr.write(`dsh: ${error instanceof Error ? error.message : String(error)}\n`)
    io.exit(1)
  })
}
