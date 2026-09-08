/**
 * Validate enterprise composition at boot through configured manifests.
 * @module @deepseek-ai/dsh-trust-admission-boot
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { AdmissionManifest } from '@deepseek-ai/dsh-trust-admission'

export const name = 'trust-admission-boot'
export const inject = ['trustAdmission']

/** Expected manifest rows validated during plugin apply. */
export interface Config {
  /** Bundle manifests this installation admits; an empty list is refused. */
  readonly expected: readonly AdmissionManifest[]
}

export const Config = z.object({
  expected: z.array(z.object({
    id: z.string().required(),
    digest: z.string().required(),
  })).default([]),
})

/**
 * Fail closed when the composed bundles do not match admission policy.
 * @param ctx - plugin context carrying the admission seam.
 * @param config - the bundle rows this installation admits.
 * @throws when no row is declared, because an admission gate with an empty
 * expectation admits every composition without saying so.
 */
export function apply(ctx: Context, config: Config): void {
  if (config.expected.length === 0) {
    throw new Error('trust-admission-boot: expected needs at least one bundle manifest; an empty list admits every composition')
  }
  ctx.trustAdmission.validateComposition(config.expected)
}
