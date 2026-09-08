/** Boot-time composition admission: matching digests admit, anything else refuses. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import ConfigTrustAdmissionProvider, { digestManifest, TrustAdmissionRejectedError } from '@deepseek-ai/dsh-trust-admission'
import { apply, Config, name } from '../src/index.ts'

let context: Context | undefined

afterEach(async () => {
  await context?.fiber.dispose()
  context = undefined
})

const DIGEST = digestManifest('bundle: dsh-enterprise')

/**
 * Mount the admission provider with `manifests`, then the boot check with `expected`.
 * @param manifests - digests the installation admits.
 * @param expected - bundle rows the boot check presents.
 * @returns the mounted context, once both rows settle.
 */
async function boot(
  manifests: { id: string; digest: string }[],
  expected: { id: string; digest: string }[],
): Promise<Context> {
  const ctx = new Context()
  context = ctx
  await ctx.plugin(ConfigTrustAdmissionProvider, { manifests })
  await ctx.plugin({ name, inject: ['trustAdmission'], Config, apply }, { expected })
  return ctx
}

describe('trust admission boot check', () => {
  it('admits a composition whose digests match the configured manifests', async () => {
    const ctx = await boot([{ id: 'dsh-enterprise', digest: DIGEST }], [{ id: 'dsh-enterprise', digest: DIGEST }])
    expect(ctx.get('trustAdmission')).toBeDefined()
  })

  it('refuses a digest mismatch', async () => {
    await expect(boot(
      [{ id: 'dsh-enterprise', digest: DIGEST }],
      [{ id: 'dsh-enterprise', digest: digestManifest('tampered') }],
    )).rejects.toBeInstanceOf(TrustAdmissionRejectedError)
  })

  it('refuses a bundle the installation never admitted', async () => {
    await expect(boot([], [{ id: 'unknown-bundle', digest: DIGEST }]))
      .rejects.toThrow('unknown bundle unknown-bundle')
  })

  it('refuses an empty expectation rather than admitting every composition', async () => {
    await expect(boot([{ id: 'dsh-enterprise', digest: DIGEST }], []))
      .rejects.toThrow('expected needs at least one bundle manifest')
  })
})
