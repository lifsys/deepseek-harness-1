import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'
export const name = 'enterprise-invariant'
export const inject = ['invariants']
// No runtime invariant: the package is a static patch-list carrier; inserted trust rows own their own invariants.
const install: InvariantInstaller = () => {}
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-enterprise', install))
