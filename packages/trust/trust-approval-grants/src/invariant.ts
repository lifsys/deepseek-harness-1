/** Package-owned invariant companion. @module @deepseek-ai/dsh-trust-approval-grants/invariant */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

export const name = 'trust-approval-grants-invariant'
export const inject = ['invariants']

// No runtime invariant: grant storage is deferred; the companion reserves ownership only.
const install: InvariantInstaller = () => {}

export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-trust-approval-grants', install))
