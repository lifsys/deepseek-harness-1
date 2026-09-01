/**
 * Signed composition admission for enterprise bundles (`ctx.trustAdmission`).
 * @module @deepseek-ai/dsh-trust-admission
 */

import { createHash } from 'node:crypto'
import { Context, Service } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

/** One signed bundle manifest row. */
export interface AdmissionManifest {
  readonly id: string
  readonly digest: string
  readonly signature?: string
}

/** Fail-closed admission error. */
export class TrustAdmissionRejectedError extends Error {
  readonly code = 'admission-rejected' as const

  /** @param reason - auditable rejection reason without secret material. */
  constructor(readonly reason: string) {
    super(`trust admission rejected: ${reason}`)
    this.name = 'TrustAdmissionRejectedError'
  }
}

/** Plugin configuration. */
export interface Config {
  /** Known-good manifest digests keyed by bundle id. */
  readonly manifests: readonly AdmissionManifest[]
  /** When true, unsigned rows refuse load. */
  readonly requireSignature?: boolean
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    trustAdmission: TrustAdmissionProvider
  }
}

/** Abstract admission service. */
export abstract class TrustAdmissionProvider extends Service {
  constructor(ctx: Context) {
    super(ctx, 'trustAdmission')
  }

  /**
   * Validate one composition tree before profile mount completes.
   * @param manifests - candidate bundle manifests.
   * @throws {@link TrustAdmissionRejectedError} on unsigned or digest mismatch.
   */
  abstract validateComposition(manifests: readonly AdmissionManifest[]): void
}

/** Config-driven admission provider. */
export class ConfigTrustAdmissionProvider extends TrustAdmissionProvider {
  static Config = z.object({
    manifests: z.array(z.object({
      id: z.string().required(),
      digest: z.string().required(),
    })).default([]),
    requireSignature: z.boolean().default(false),
  })

  constructor(ctx: Context, public config: Config) {
    super(ctx)
  }

  /** @inheritdoc */
  validateComposition(manifests: readonly AdmissionManifest[]): void {
    const allowed = new Map((this.config.manifests ?? []).map(entry => [entry.id, entry]))
    for (const manifest of manifests) {
      const expected = allowed.get(manifest.id)
      if (expected === undefined) {
        throw new TrustAdmissionRejectedError(`unknown bundle ${manifest.id}`)
      }
      if (expected.digest !== manifest.digest) {
        throw new TrustAdmissionRejectedError(`digest mismatch for ${manifest.id}`)
      }
      if (this.config.requireSignature === true && manifest.signature === undefined) {
        throw new TrustAdmissionRejectedError(`unsigned bundle ${manifest.id}`)
      }
    }
  }
}

/** Compute a stable digest for one manifest payload. */
export function digestManifest(payload: string): string {
  return createHash('sha256').update(payload).digest('hex')
}

export default TrustAdmissionProvider
