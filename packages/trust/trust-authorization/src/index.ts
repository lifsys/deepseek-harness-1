/**
 * Service Definition for RBAC evaluation (`ctx.trustAuthorization`).
 * Authorization decides whether a principal may be asked or execute an action;
 * {@link ApprovalService} handles human consent after authorization passes.
 * @module @deepseek-ai/dsh-trust-authorization
 */

import { Context, Service } from '@deepseek-ai/cordis'
import type { Principal } from '@deepseek-ai/dsh-trust-identity'
import type {
  AuthorizationDecision,
  AuthorizationDenialReason,
  TrustAction,
  TrustResource,
} from './types.ts'

export type {
  AuthorizationDecision,
  AuthorizationDenialReason,
  TrustAction,
  TrustResource,
} from './types.ts'

/** Machine-readable failure when authorization denies an action. */
export class TrustAuthorizationDeniedError extends Error {
  /** Wire and RPC error category. */
  readonly code = 'forbidden' as const
  /** Closed denial reason for audit export. */
  readonly reason: AuthorizationDenialReason

  /**
   * @param reason - closed denial category.
   * @param message - correction-oriented diagnostic.
   */
  constructor(reason: AuthorizationDenialReason, message: string) {
    super(message)
    this.name = 'TrustAuthorizationDeniedError'
    this.reason = reason
  }
}

/** Brand a resource string for RBAC evaluation. */
export function trustResource(value: string): TrustResource {
  if (value.length === 0) throw new TypeError('trust resource must be non-empty')
  return value as TrustResource
}

/** Brand an action string for RBAC evaluation. */
export function trustAction(value: string): TrustAction {
  if (value.length === 0) throw new TypeError('trust action must be non-empty')
  return value as TrustAction
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    trustAuthorization: TrustAuthorizationProvider
  }
}

/** Abstract authorization service. */
export abstract class TrustAuthorizationProvider extends Service {
  constructor(ctx: Context) {
    super(ctx, 'trustAuthorization')
  }

  /**
   * Evaluate one principal against an action and resource.
   * @param principal - authenticated principal; unauthenticated callers must fail closed upstream.
   * @param action - requested action.
   * @param resource - target resource identifier.
   * @returns allow/deny decision with closed reason when denied.
   */
  abstract authorize(
    principal: Principal,
    action: TrustAction,
    resource: TrustResource,
  ): AuthorizationDecision

  /**
   * Resolve effective role names for one principal.
   * @param principal - authenticated principal.
   * @returns role names used for permission lookup.
   */
  abstract effectiveRoles(principal: Principal): readonly string[]

  /**
   * Require authorization for one action; throws on denial.
   * @param principal - authenticated principal.
   * @param action - requested action.
   * @param resource - target resource.
   * @throws {@link TrustAuthorizationDeniedError} when denied.
   */
  require(
    principal: Principal,
    action: TrustAction,
    resource: TrustResource,
  ): void {
    const decision = this.authorize(principal, action, resource)
    if (decision.allowed) return
    throw new TrustAuthorizationDeniedError(
      decision.reason ?? 'permission-denied',
      `authorization denied for ${String(action)} on ${String(resource)}`,
    )
  }
}

export default TrustAuthorizationProvider
