import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { TrustIdentityUnauthorizedError } from '@deepseek-ai/dsh-trust-identity'
import OidcTrustIdentityProvider, { userId } from '../src/index.ts'

function encodeJwt(payload: Record<string, unknown>): string {
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
      issuer: 'https://idp.example.com',
    })).rejects.toThrow(/clientId/)
  })

  it('accepts issuer-shaped JWT claims without live IdP JWKS verification', async () => {
    const ctx = new Context()
    await ctx.plugin(OidcTrustIdentityProvider, {
      issuer: 'https://idp.example.com',
      clientId: 'dsh-enterprise',
      audience: 'dsh-api',
    })
    const credential = encodeJwt({
      sub: 'user-9',
      iss: 'https://idp.example.com',
      aud: 'dsh-api',
      name: 'Pat',
      roles: ['developer'],
    })
    const session = await ctx.trustIdentity.authenticate({ credential })
    expect(session?.principal).toEqual({
      userId: userId('user-9'),
      displayName: 'Pat',
      roles: ['developer'],
    })
    const wrongIssuer = encodeJwt({
      sub: 'user-9',
      iss: 'https://other.example.com',
      aud: 'dsh-api',
    })
    await expect(ctx.trustIdentity.authenticate({ credential: wrongIssuer })).resolves.toBeUndefined()
  })
})
