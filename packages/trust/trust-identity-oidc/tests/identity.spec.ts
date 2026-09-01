import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { TrustIdentityUnauthorizedError } from '@deepseek-ai/dsh-trust-identity'
import OidcTrustIdentityProvider, { userId } from '../src/index.ts'

async function boot(): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(OidcTrustIdentityProvider, {
    staticBindings: [{
      token: 'admin-token',
      principal: { userId: 'u1', displayName: 'Admin', roles: ['admin'] },
    }],
  })
  return ctx
}

describe('trust identity', () => {
  it('requirePrincipal fails closed without a bound principal', async () => {
    const ctx = await boot()
    expect(() => ctx.trustIdentity.requirePrincipal()).toThrow(TrustIdentityUnauthorizedError)
  })

  it('authenticates static tokens and binds the principal for withPrincipal', async () => {
    const ctx = await boot()
    const session = await ctx.trustIdentity.authenticate({ credential: 'admin-token' })
    expect(session?.principal.userId).toBe(userId('u1'))
    await ctx.trustIdentity.withPrincipal(session!.principal, () => {
      expect(ctx.trustIdentity.currentPrincipal()?.displayName).toBe('Admin')
    })
  })
})
