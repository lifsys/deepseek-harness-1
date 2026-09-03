/** Package-owned invariant companion. @module @deepseek-ai/dsh-trust-lease/invariant */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

export const name = 'trust-lease-invariant'
export const inject = ['invariants']

// No runtime invariant: in-memory leases are process-local maps without an independent event stream.
const install: InvariantInstaller = () => {}

export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-trust-lease', install))
