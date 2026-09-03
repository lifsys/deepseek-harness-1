/** Package-owned invariant companion. @module @deepseek-ai/dsh-trust-identity-oidc/invariant */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

export const name = 'trust-identity-oidc-invariant'
export const inject = ['invariants']

// No runtime invariant: request-scoped principal binding has no durable event stream to pair.
const install: InvariantInstaller = () => {}

export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-trust-identity-oidc', install))
