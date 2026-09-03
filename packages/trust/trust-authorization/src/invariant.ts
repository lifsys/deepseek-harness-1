/** Package-owned invariant companion. @module @deepseek-ai/dsh-trust-authorization/invariant */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

export const name = 'trust-authorization-invariant'
export const inject = ['invariants']

// No runtime invariant: Service Definition exposes abstract methods only; providers own decisions.
const install: InvariantInstaller = () => {}

export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-trust-authorization', install))
