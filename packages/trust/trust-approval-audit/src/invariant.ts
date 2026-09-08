/** Package-owned invariant companion. @module @deepseek-ai/dsh-trust-approval-audit/invariant */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

export const name = 'trust-approval-audit-invariant'
export const inject = ['invariants']

// No runtime invariant: mirrors approval session events into trustAudit without owning a separate stream.
const install: InvariantInstaller = () => {}

export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-trust-approval-audit', install))
