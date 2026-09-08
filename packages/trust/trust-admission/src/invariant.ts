/** Package-owned invariant companion. @module @deepseek-ai/dsh-trust-admission/invariant */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

export const name = 'trust-admission-invariant'
export const inject = ['invariants']

// No runtime invariant: admission is a config-table lookup with no mutable event relation.
const install: InvariantInstaller = () => {}

export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-trust-admission', install))
