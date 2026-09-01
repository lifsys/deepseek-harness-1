/**
 * Lease checks for cordis-host-runner dynamic plugin activation.
 * @module @deepseek-ai/dsh-trust-lease-runner
 */

import type { Context } from '@deepseek-ai/cordis'
import type { PreToolDecision } from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-trust-lease'

export const name = 'trust-lease-runner'
export const inject = ['trustLease'] as const

/** Require a dynamic-plugin lease before selected tool execution proceeds. */
export function apply(ctx: Context): void {
  ctx.on('tools/pre-execute', async (exec, next): Promise<PreToolDecision> => {
    if (exec.name !== 'dynamic_cordis_invoke') return next()
    const lease = await ctx.trustLease.acquire('dynamic-plugin', 60_000)
    if (!ctx.trustLease.witness(lease)) {
      return { kind: 'deny', reason: 'dynamic plugin lease expired' }
    }
    return next()
  }, { prepend: true })
}
