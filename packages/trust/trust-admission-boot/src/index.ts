/**
 * Validate enterprise composition at boot through configured manifests.
 * @module @deepseek-ai/dsh-trust-admission-boot
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { AdmissionManifest } from '@deepseek-ai/dsh-trust-admission'

export const name = 'trust-admission-boot'
export const inject = ['trustAdmission'] as const

/** Expected manifest rows validated during plugin apply. */
export interface Config {
  readonly expected: readonly AdmissionManifest[]
}

export const Config = z.object({
  expected: z.array(z.object({
    id: z.string().required(),
    digest: z.string().required(),
  })).default([]),
})

/** Fail closed when configured manifests do not match admission policy. */
export function apply(ctx: Context, config: Config): void {
  if (config.expected.length === 0) return
  ctx.trustAdmission.validateComposition(config.expected)
}
