/**
 * Lease checks for dynamic plugin activation on the tool pipeline.
 * @module @deepseek-ai/dsh-trust-lease-runner
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { PreToolDecision } from '@deepseek-ai/dsh-tools'
import type { LeaseScope } from '@deepseek-ai/dsh-trust-lease'

export const name = 'trust-lease-runner'
export const inject = ['trustLease']

/** Plugin configuration. */
export interface Config {
  /** Tool names that need a live `dynamic-plugin` lease before they execute. */
  readonly gatedTools: readonly string[]
  /** Lease lifetime granted for one gated execution, in milliseconds. */
  readonly budgetMs: number
}

export const Config = z.object({
  gatedTools: z.array(z.string()).required(),
  budgetMs: z.number().step(1).min(1).max(3_600_000).default(60_000),
})

/** The scope this consumer acquires; the tool pipeline gates plugin activation. */
const SCOPE: LeaseScope = 'dynamic-plugin'

/**
 * Require a dynamic-plugin lease before a gated tool executes.
 * @param ctx - plugin context carrying the lease seam and the tool pipeline.
 * @param config - the gated tool names and the per-execution lease budget.
 */
export function apply(ctx: Context, config: Config): void {
  const gated = new Set(config.gatedTools)
  ctx.on('tools/pre-execute', async (exec, next): Promise<PreToolDecision> => {
    if (!gated.has(exec.name)) return next()
    const lease = await ctx.trustLease.acquire(SCOPE, config.budgetMs)
    if (!ctx.trustLease.witness(lease)) {
      return { kind: 'deny', reason: `dynamic plugin lease expired for tool ${exec.name}` }
    }
    try {
      return await next()
    } finally {
      await ctx.trustLease.revoke(lease.id)
    }
  }, { prepend: true })
}
