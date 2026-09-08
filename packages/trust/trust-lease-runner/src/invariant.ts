/** Package-owned invariant companion. @module @deepseek-ai/dsh-trust-lease-runner/invariant */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

export const name = 'trust-lease-runner-invariant'
export const inject = ['invariants']

// No runtime invariant: lease checks are pre-execute denials covered by the tools pipeline.
const install: InvariantInstaller = () => {}

export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-trust-lease-runner', install))
