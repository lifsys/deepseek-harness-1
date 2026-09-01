/**
 * Config-driven RBAC provider and monotonic `tools/pre-execute` guard.
 * @module @deepseek-ai/dsh-trust-authorization-rbac
 */

import { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { Principal } from '@deepseek-ai/dsh-trust-identity'
import {
  TrustAuthorizationProvider,
  trustAction,
  trustResource,
  type AuthorizationDecision,
  type TrustAction,
  type TrustResource,
} from '@deepseek-ai/dsh-trust-authorization'
import type { PreToolDecision } from '@deepseek-ai/dsh-tools'

/** One role→permission mapping entry. Permission strings accept `*` or `tool:<name>` patterns. */
export interface RolePermissions {
  readonly role: string
  readonly permissions: readonly string[]
}

/** Plugin configuration. */
export interface Config {
  /** Role permission table; no hidden defaults — every role must be declared. */
  readonly roles: readonly RolePermissions[]
  /** Actions denied even when a permission would allow them. */
  readonly denyTools: readonly string[]
}

interface ResolvedSpec {
  readonly byRole: ReadonlyMap<string, readonly string[]>
  readonly denyTools: ReadonlySet<string>
}

/**
 * RBAC {@link TrustAuthorizationProvider} with explicit cordis.yml role maps.
 */
export class RbacTrustAuthorizationProvider extends TrustAuthorizationProvider {
  static Config = z.object({
    roles: z.array(z.object({
      role: z.string().required(),
      permissions: z.array(z.string()).required(),
    })).required(),
    denyTools: z.array(z.string()).default([]),
  })

  private readonly spec: ResolvedSpec

  constructor(ctx: Context, public config: Config) {
    super(ctx)
    this.spec = resolveSpec(config)
    ctx.on('tools/pre-execute', async (exec, next): Promise<PreToolDecision> => {
      const identity = ctx.get('trustIdentity')
      const principal = identity?.currentPrincipal()
      if (principal === undefined) return { kind: 'deny', reason: 'authentication required' }
      const resource = trustResource(`tool:${exec.name}`)
      const decision = this.authorize(principal, trustAction('execute'), resource)
      if (!decision.allowed) {
        void ctx.get('trustAudit')?.record({
          type: 'authz/denied',
          time: Date.now(),
          userId: principal.userId,
          action: 'execute',
          resource: String(resource),
          reason: decision.reason ?? 'permission-denied',
        })
        return { kind: 'deny', reason: `authorization denied for tool ${exec.name}` }
      }
      return next()
    }, { prepend: true })
  }

  /** @inheritdoc */
  authorize(principal: Principal, action: TrustAction, resource: TrustResource): AuthorizationDecision {
    if (this.spec.denyTools.has(stripToolName(resource))) {
      return { allowed: false, reason: 'permission-denied' }
    }
    const roles = this.effectiveRoles(principal)
    if (roles.length === 0) return { allowed: false, reason: 'unknown-role' }
    for (const role of roles) {
      const permissions = this.spec.byRole.get(role)
      if (permissions === undefined) continue
      if (permissions.some(p => matchesPermission(p, action, resource))) {
        return { allowed: true }
      }
    }
    return { allowed: false, reason: 'permission-denied' }
  }

  /** @inheritdoc */
  effectiveRoles(principal: Principal): readonly string[] {
    return principal.roles
  }
}

function resolveSpec(config: Config): ResolvedSpec {
  const byRole = new Map<string, readonly string[]>()
  for (const entry of config.roles) byRole.set(entry.role, Object.freeze([...entry.permissions]))
  return { byRole, denyTools: new Set(config.denyTools) }
}

function stripToolName(resource: TrustResource): string {
  const text = String(resource)
  return text.startsWith('tool:') ? text.slice('tool:'.length) : text
}

function matchesPermission(permission: string, action: TrustAction, resource: TrustResource): boolean {
  if (permission === '*') return true
  if (permission === `action:${String(action)}`) return true
  if (permission === String(resource)) return true
  if (permission.endsWith('*') && String(resource).startsWith(permission.slice(0, -1))) return true
  return false
}

export default RbacTrustAuthorizationProvider
