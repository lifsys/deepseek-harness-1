import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { userId } from '@deepseek-ai/dsh-trust-identity-oidc'
import { trustAction, trustResource } from '@deepseek-ai/dsh-trust-authorization'
import { RbacTrustAuthorizationProvider } from '../src/index.ts'

async function boot(): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(RbacTrustAuthorizationProvider, {
    roles: [
      { role: 'developer', permissions: ['tool:Read'] },
      { role: 'admin', permissions: ['*'] },
    ],
    denyTools: ['danger-full-access'],
  })
  return ctx
}

describe('RBAC authorization', () => {
  it('denies escalated tools for developer role', async () => {
    const ctx = await boot()
    const principal = {
      userId: userId('dev'),
      displayName: 'Dev',
      roles: ['developer'] as readonly string[],
    }
    const decision = ctx.trustAuthorization.authorize(
      principal,
      trustAction('execute'),
      trustResource('tool:danger-full-access'),
    )
    expect(decision.allowed).toBe(false)
    expect(decision.reason).toBe('permission-denied')
  })

  it('denyTools overrides wildcard allow for admin', async () => {
    const ctx = await boot()
    const principal = {
      userId: userId('admin'),
      displayName: 'Admin',
      roles: ['admin'] as readonly string[],
    }
    const decision = ctx.trustAuthorization.authorize(
      principal,
      trustAction('execute'),
      trustResource('tool:danger-full-access'),
    )
    expect(decision.allowed).toBe(false)
  })
})
