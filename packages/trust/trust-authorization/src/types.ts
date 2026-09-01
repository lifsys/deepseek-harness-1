/**
 * Trust authorization branded types and denial reasons.
 * @module @deepseek-ai/dsh-trust-authorization/types
 */

import type { Branded } from '@deepseek-ai/dsh-brand'

/** Closed denial reason exported to audit and RPC surfaces. */
export type AuthorizationDenialReason =
  | 'unauthenticated'
  | 'unknown-role'
  | 'permission-denied'
  | 'resource-denied'

/** Resource identifier evaluated by RBAC (`tool:<name>`, `session`, etc.). */
export type TrustResource = Branded<'TrustResource'>

/** Action requested against a resource (`execute`, `read`, `admin`, etc.). */
export type TrustAction = Branded<'TrustAction'>

/** One authorization decision. */
export interface AuthorizationDecision {
  /** Whether the principal may perform the action. */
  readonly allowed: boolean
  /** Closed reason when denied. */
  readonly reason?: AuthorizationDenialReason
}
