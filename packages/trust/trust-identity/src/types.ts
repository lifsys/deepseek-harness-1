/**
 * Trust identity branded types.
 * @module @deepseek-ai/dsh-trust-identity/types
 */

import type { Branded } from '@deepseek-ai/dsh-brand'

/** Opaque enterprise user identifier bound to audit and authorization decisions. */
export type UserId = Branded<'UserId'>

/** Names one configured identity provider instance in cordis.yml. */
export type IdentityProviderRef = Branded<'IdentityProviderRef'>

/** Authenticated principal attached to Host RPC and audit records. */
export interface Principal {
  /** Stable user identity from the identity provider. */
  readonly userId: UserId
  /** Human-readable label for audit export; never used for authorization. */
  readonly displayName: string
  /** Role names supplied by the identity provider or mapped locally. */
  readonly roles: readonly string[]
}

/** Credential presented at authentication time. */
export interface AuthRequest {
  /** Bearer token, session cookie value, or provider-specific credential. */
  readonly credential: string
  /** Optional provider override when multiple are composed. */
  readonly provider?: IdentityProviderRef
}

/** Result of a successful authentication exchange. */
export interface AuthSession {
  /** The authenticated principal. */
  readonly principal: Principal
  /** Opaque provider session handle when the provider maintains server-side state. */
  readonly providerSessionId?: string
}
