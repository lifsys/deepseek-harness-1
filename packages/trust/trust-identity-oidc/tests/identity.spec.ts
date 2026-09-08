import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { exportJWK, generateKeyPair, SignJWT, type JSONWebKeySet } from 'jose'
import { TrustIdentityUnauthorizedError } from '@deepseek-ai/dsh-trust-identity'
import OidcTrustIdentityProvider, { userId } from '../src/index.ts'

const ISSUER = 'https://idp.example.com'
const AUDIENCE = 'dsh-api'

async function localJwks(): Promise<{
  jwks: JSONWebKeySet
  sign: (payload: Record<string, unknown>) => Promise<string>
}> {
  const { privateKey, publicKey } = await generateKeyPair('RS256')
  const jwk = await exportJWK(publicKey)
  jwk.kid = 'test-key'
  jwk.alg = 'RS256'
  jwk.use = 'sig'
  return {
    jwks: { keys: [jwk] },
    sign: payload => new SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key', typ: 'JWT' })
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey),
  }
}

function encodeUnsignedJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${header}.${body}.sig`
}

describe('trust identity', () => {
  it('requirePrincipal fails closed without a bound principal', async () => {
    const ctx = new Context()
    await ctx.plugin(OidcTrustIdentityProvider, {
      staticBindings: [{
        token: 'admin-token',
        principal: { userId: 'u1', displayName: 'Admin', roles: ['admin'] },
      }],
    })
    expect(() => ctx.trustIdentity.requirePrincipal()).toThrow(TrustIdentityUnauthorizedError)
  })

  it('authenticates static tokens and binds the principal for withPrincipal', async () => {
    const ctx = new Context()
    await ctx.plugin(OidcTrustIdentityProvider, {
      staticBindings: [{
        token: 'admin-token',
        principal: { userId: 'u1', displayName: 'Admin', roles: ['admin'] },
      }],
    })
    const session = await ctx.trustIdentity.authenticate({ credential: 'admin-token' })
    expect(session?.principal.userId).toBe(userId('u1'))
    await ctx.trustIdentity.withPrincipal(session!.principal, () => {
      expect(ctx.trustIdentity.currentPrincipal()?.displayName).toBe('Admin')
    })
  })

  it('rejects load without issuer or staticBindings', async () => {
    const ctx = new Context()
    await expect(ctx.plugin(OidcTrustIdentityProvider, {})).rejects.toThrow(/issuer or staticBindings/)
  })

  it('requires clientId when issuer is configured', async () => {
    const ctx = new Context()
    await expect(ctx.plugin(OidcTrustIdentityProvider, {
      issuer: ISSUER,
    })).rejects.toThrow(/clientId/)
  })

  it('verifies JWTs against an injected JWKS and rejects unsigned tokens', async () => {
    const { jwks, sign } = await localJwks()
    const ctx = new Context()
    await ctx.plugin(OidcTrustIdentityProvider, {
      issuer: ISSUER,
      clientId: 'dsh-enterprise',
      audience: AUDIENCE,
      jwks,
    })
    const credential = await sign({
      sub: 'user-9',
      name: 'Pat',
      roles: ['developer'],
    })
    const session = await ctx.trustIdentity.authenticate({ credential })
    expect(session?.principal).toEqual({
      userId: userId('user-9'),
      displayName: 'Pat',
      roles: ['developer'],
    })

    const unsigned = encodeUnsignedJwt({
      sub: 'user-9',
      iss: ISSUER,
      aud: AUDIENCE,
      name: 'Pat',
      roles: ['developer'],
    })
    await expect(ctx.trustIdentity.authenticate({ credential: unsigned })).resolves.toBeUndefined()

    const wrongIssuer = await new SignJWT({ sub: 'user-9' })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key', typ: 'JWT' })
      .setIssuer('https://other.example.com')
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign((await generateKeyPair('RS256')).privateKey)
    await expect(ctx.trustIdentity.authenticate({ credential: wrongIssuer })).resolves.toBeUndefined()
  })

  it('discovers live Zitadel JWKS and refuses tokens signed by a foreign key', async () => {
    const issuer = 'https://id.lifsys.one'
    const discovery = await fetch(`${issuer}/.well-known/openid-configuration`)
    expect(discovery.ok).toBe(true)
    const { jwks_uri: jwksUri } = await discovery.json() as { jwks_uri: string }
    expect(jwksUri).toMatch(/^https:\/\//)

    const { privateKey } = await generateKeyPair('RS256')
    const foreign = await new SignJWT({ sub: 'foreign-user', name: 'Foreign' })
      .setProtectedHeader({ alg: 'RS256', kid: 'foreign', typ: 'JWT' })
      .setIssuer(issuer)
      .setAudience('dsh-api')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey)

    const ctx = new Context()
    await ctx.plugin(OidcTrustIdentityProvider, {
      issuer,
      clientId: 'dsh-enterprise',
      audience: 'dsh-api',
      jwksUri,
    })
    await expect(ctx.trustIdentity.authenticate({ credential: foreign })).resolves.toBeUndefined()
  })
})
