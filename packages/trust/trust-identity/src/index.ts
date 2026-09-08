/**
 * Service Definition for authenticated principal vocabulary (`ctx.trustIdentity`).
 * Enterprise Host surfaces require a bound principal; anonymous preview profiles
 * omit this service.
 * @module @deepseek-ai/dsh-trust-identity
 */

import { Context, Service } from '@deepseek-ai/cordis'
import type { AuthRequest, AuthSession, Principal } from './types.ts'

export type { AuthRequest, AuthSession, IdentityProviderRef, Principal, UserId } from './types.ts'

/** Machine-readable failure when no authenticated principal is available. */
export class TrustIdentityUnauthorizedError extends Error {
  /** Wire and RPC error category. */
  readonly code = 'unauthorized' as const

  /**
   * @param message - correction-oriented diagnostic without credential values.
   */
  constructor(message = 'authentication required') {
    super(message)
    this.name = 'TrustIdentityUnauthorizedError'
  }
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    trustIdentity: TrustIdentityProvider
  }
}

/**
 * Abstract identity service. Providers authenticate ingress credentials and
 * maintain the current principal for the active Host request scope.
 */
export abstract class TrustIdentityProvider extends Service {
  constructor(ctx: Context) {
    super(ctx, 'trustIdentity')
  }

  /**
   * Exchange one ingress credential for an authenticated principal.
   * @param request - provider credential material.
   * @returns the authenticated session, or `undefined` when the credential is invalid.
   */
  abstract authenticate(request: AuthRequest): Promise<AuthSession | undefined>

  /**
   * Return the principal bound to the current Host request scope.
   * @returns the active principal, or `undefined` while unauthenticated.
   */
  abstract currentPrincipal(): Principal | undefined

  /**
   * Require an authenticated principal for the current Host request scope.
   * @returns the active principal.
   * @throws {@link TrustIdentityUnauthorizedError} when no principal is bound.
   */
  requirePrincipal(): Principal {
    const principal = this.currentPrincipal()
    if (principal === undefined) throw new TrustIdentityUnauthorizedError()
    return principal
  }

  /**
   * Bind one principal to the current async execution context for downstream RPC.
   * @param principal - authenticated principal to attach.
   * @param run - work executed while the principal remains bound.
   * @returns the result of `run`.
   */
  abstract withPrincipal<T>(principal: Principal, run: () => T | Promise<T>): Promise<T>
}

export default TrustIdentityProvider
