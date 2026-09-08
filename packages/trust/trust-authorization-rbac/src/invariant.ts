/** Package-owned invariant companion. @module @deepseek-ai/dsh-trust-authorization-rbac/invariant */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

export const name = 'trust-authorization-rbac-invariant'
export const inject = ['invariants']

// No runtime invariant: pre-execute denials are tool-pipeline outcomes already checked by tools invariants.
const install: InvariantInstaller = () => {}

export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-trust-authorization-rbac', install))
