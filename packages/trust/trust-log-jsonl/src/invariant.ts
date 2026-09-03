/** Package-owned invariant companion. @module @deepseek-ai/dsh-trust-log-jsonl/invariant */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

export const name = 'trust-log-jsonl-invariant'
export const inject = ['invariants']

// No runtime invariant: hash-chain correctness requires file round-trip tests rather than a live companion.
const install: InvariantInstaller = () => {}

export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-trust-log-jsonl', install))
