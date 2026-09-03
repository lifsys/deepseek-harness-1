/** Package-owned invariant companion. @module @deepseek-ai/dsh-trust-audit-cli/invariant */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

export const name = 'trust-audit-cli-invariant'
export const inject = ['invariants']
// No runtime invariant: the export runner owns one terminal process action and
// registers no event stream or mutable data whose relation could be checked.
const install: InvariantInstaller = () => {}

export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-trust-audit-cli', install))
