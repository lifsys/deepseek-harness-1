import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'
export const name = 'credentials-vault-invariant'
export const inject = ['invariants']
// No runtime invariant: Vault HTTP resolve outcomes are fail-closed provider results with no independent event stream to pair against.
const install: InvariantInstaller = () => {}
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-credentials-vault', install))
