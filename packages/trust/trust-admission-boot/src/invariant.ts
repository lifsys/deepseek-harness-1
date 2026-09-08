/** Package-owned invariant companion. @module @deepseek-ai/dsh-trust-admission-boot/invariant */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

export const name = 'trust-admission-boot-invariant'
export const inject = ['invariants']

// No runtime invariant: admission validation is a one-shot boot check with no durable event stream.
const install: InvariantInstaller = () => {}

export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-trust-admission-boot', install))
