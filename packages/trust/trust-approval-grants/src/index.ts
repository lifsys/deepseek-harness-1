/**
 * Admin-scoped persistent approval grants for enterprise profiles.
 * @module @deepseek-ai/dsh-trust-approval-grants
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { Principal } from '@deepseek-ai/dsh-trust-identity'
import { trustAction, trustResource } from '@deepseek-ai/dsh-trust-authorization'
import type { ApprovalOutcome } from '@deepseek-ai/dsh-user-approval'
import type {} from '@deepseek-ai/dsh-user-approval'

/** One stored approval grant scoped to admin policy. */
export interface ApprovalGrant {
  readonly toolName: string
  readonly principalId: string
  readonly expiresAt: number
}

export interface Config {
  readonly grants: readonly ApprovalGrant[]
}

export const name = 'trust-approval-grants'
export const inject = ['trustAuthorization', 'trustIdentity'] as const

export const Config = z.object({
  grants: z.array(z.object({
    toolName: z.string().required(),
    principalId: z.string().required(),
    expiresAt: z.number().required(),
  })).default([]),
})

const grantIndex = (config: Config): ReadonlyMap<string, ApprovalGrant> => {
  const map = new Map<string, ApprovalGrant>()
  for (const grant of config.grants) {
    map.set(`${grant.principalId}:${grant.toolName}`, grant)
  }
  return map
}

/** Allow admin-scoped grants to bypass repeated approval for declared tools. */
export function apply(ctx: Context, config: Config): void {
  const grants = grantIndex(config)
  ctx.on('approval/request', async (req, next): Promise<ApprovalOutcome> => {
    const identity = ctx.get('trustIdentity')
    const principal: Principal | undefined = identity?.currentPrincipal()
    if (principal === undefined) return next()
    ctx.trustAuthorization.require(
      principal,
      trustAction('execute'),
      trustResource(`tool:${req.toolName}`),
    )
    const grant = grants.get(`${String(principal.userId)}:${req.toolName}`)
    if (grant !== undefined && grant.expiresAt >= Date.now()) {
      return 'allowed-once'
    }
    return next()
  })
}
