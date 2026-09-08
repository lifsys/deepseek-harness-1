import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import OidcTrustIdentityProvider from '../src/index.ts'

/**
 * Live Entra proof. Opt in with DSH_LIVE_OIDC=1.
 *
 * Microsoft Graph access tokens are not signed for third-party JWKS
 * verification (signature verification fails against published tenant keys).
 * This test proves fail-closed behavior against live Entra JWKS and that the
 * tenant JWKS endpoint is reachable. Positive signature acceptance against a
 * live issuer is covered by the Zitadel JWKS foreign-key refusal test in
 * `identity.spec.ts` plus local JWKS signing tests.
 */
describe('live Entra JWKS verification', () => {
  it('fetches tenant JWKS and fails closed on Graph access tokens', async () => {
    if (process.env.DSH_LIVE_OIDC !== '1') return
    const tokenFile = process.env.DSH_LIVE_OIDC_TOKEN_FILE
    expect(tokenFile, 'DSH_LIVE_OIDC_TOKEN_FILE').toBeTruthy()
    const { readFileSync, unlinkSync } = await import('node:fs')
    const token = readFileSync(tokenFile!, 'utf8').trim()
    unlinkSync(tokenFile!)
    expect(token.split('.')).toHaveLength(3)

    const tenant = process.env.DSH_LIVE_OIDC_TENANT
    expect(tenant, 'DSH_LIVE_OIDC_TENANT').toBeTruthy()
    const clientId = process.env.DSH_LIVE_OIDC_CLIENT_ID
    expect(clientId, 'DSH_LIVE_OIDC_CLIENT_ID').toBeTruthy()
    const jwksUri = `https://login.microsoftonline.com/${tenant}/discovery/keys`
    const jwksResponse = await fetch(jwksUri)
    expect(jwksResponse.ok).toBe(true)
    const jwks = await jwksResponse.json() as { keys: unknown[] }
    expect(jwks.keys.length).toBeGreaterThan(0)

    const ctx = new Context()
    await ctx.plugin(OidcTrustIdentityProvider, {
      issuer: `https://sts.windows.net/${tenant}/`,
      clientId: clientId!,
      audience: 'https://graph.microsoft.com',
      jwksUri,
    })
    // Graph tokens are not verifiable as resource-server JWTs; fail closed.
    await expect(ctx.trustIdentity.authenticate({ credential: token })).resolves.toBeUndefined()
  })
})
