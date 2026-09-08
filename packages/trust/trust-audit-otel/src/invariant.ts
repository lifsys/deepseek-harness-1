/** Package-owned invariant companion. @module @deepseek-ai/dsh-trust-audit-otel/invariant */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

export const name = 'trust-audit-otel-invariant'
export const inject = ['invariants']

// No runtime invariant: OTLP export is a sink handoff with no package-local event pairing.
const install: InvariantInstaller = () => {}

export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-trust-audit-otel', install))
