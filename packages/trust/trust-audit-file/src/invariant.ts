/** Package-owned invariant companion. @module @deepseek-ai/dsh-trust-audit-file/invariant */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

export const name = 'trust-audit-file-invariant'
export const inject = ['invariants']

// No runtime invariant: append-only file writes are durability concerns covered by provider tests.
const install: InvariantInstaller = () => {}

export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-trust-audit-file', install))
