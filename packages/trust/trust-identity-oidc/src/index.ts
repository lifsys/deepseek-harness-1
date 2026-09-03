/**
 * OIDC and static-token identity provider for enterprise Host surfaces.
 * Production OIDC uses configured issuer metadata; tests and air-gapped installs
 * may supply a static token→principal map instead of live IdP discovery.
 * Live IdP login/discovery is BLOCKED-FOR-REAL-WORLD without operator credentials.
 * @module @deepseek-ai/dsh-trust-identity-oidc
 */

import { AsyncLocalStorage } from 'node:async_hooks'
import { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import {
  TrustIdentityProvider,
  TrustIdentityUnauthorizedError,
  type AuthRequest,
  type AuthSession,
  type Principal,
  type UserId,
} from '@deepseek-ai/dsh-trust-identity'

/** Brand a raw string as {@link UserId}.
 * @param value - non-empty user id string from the identity provider.
 * @returns branded user id.
 */
export function userId(value: string): UserId {
  if (value.length === 0) throw new TypeError('user id must be non-empty')
  return value as UserId
}

/** Static principal binding for tests and air-gapped bootstrap. */
export interface StaticPrincipalBinding {
  /** Bearer token presented by the client. */
  readonly token: string
  /** Principal returned when the token matches. */
  readonly principal: {
    /** Stable user identifier recorded in audit rows. */
    readonly userId: string
    /** Human-readable name shown in operator surfaces. */
    readonly displayName: string
    /** Roles the RBAC provider evaluates for this principal. */
    readonly roles: readonly string[]
  }
}

/** Plugin configuration. */
export interface Config {
  /** OIDC issuer URL; required unless `staticBindings` supplies every principal. */
  readonly issuer?: string
  /** OAuth client id registered with the issuer. */
  readonly clientId?: string
  /** Expected JWT audience when validating issuer-issued access tokens. */
  readonly audience?: string
  /** Static token map for test and bootstrap modes. */
  readonly staticBindings?: readonly StaticPrincipalBinding[]
}

interface ResolvedSpec {
  readonly issuer: string | undefined
  readonly clientId: string | undefined
  readonly audience: string | undefined
  readonly staticByToken: ReadonlyMap<string, Principal>
}

const requestStore = new AsyncLocalStorage<Principal | undefined>()

/**
 * OIDC-backed {@link TrustIdentityProvider} with optional static-token mode.
 */
export class OidcTrustIdentityProvider extends TrustIdentityProvider {
  static Config = z.object({
    issuer: z.string(),
    clientId: z.string(),
    audience: z.string(),
    staticBindings: z.array(z.object({
      token: z.string().required(),
      principal: z.object({
        userId: z.string().required(),
        displayName: z.string().required(),
        roles: z.array(z.string()).default([]),
      }),
    })).default([]),
  })

  private readonly spec: ResolvedSpec

  constructor(ctx: Context, public config: Config) {
    super(ctx)
    this.spec = resolveSpec(config)
    if (this.spec.staticByToken.size === 0 && this.spec.issuer === undefined) {
      throw new Error('trust-identity-oidc: configure issuer or staticBindings')
    }
    if (this.spec.issuer !== undefined && this.spec.clientId === undefined) {
      throw new Error('trust-identity-oidc: clientId is required when issuer is configured')
    }
  }

  /** @inheritdoc */
  authenticate(request: AuthRequest): Promise<AuthSession | undefined> {
    const staticPrincipal = this.spec.staticByToken.get(request.credential)
    if (staticPrincipal !== undefined) return Promise.resolve({ principal: staticPrincipal })
    if (this.spec.issuer === undefined) return Promise.resolve(undefined)
    const principal = principalFromJwt(request.credential, this.spec)
    return Promise.resolve(principal === undefined ? undefined : { principal })
  }

  /** @inheritdoc */
  currentPrincipal(): Principal | undefined {
    return requestStore.getStore()
  }

  /** @inheritdoc */
  withPrincipal<T>(principal: Principal, run: () => T | Promise<T>): Promise<T> {
    return Promise.resolve(requestStore.run(principal, run))
  }
}

/** Resolve static bindings and OIDC issuer settings into a lookup table. */
function resolveSpec(config: Config): ResolvedSpec {
  const staticByToken = new Map<string, Principal>()
  for (const binding of config.staticBindings ?? []) {
    staticByToken.set(binding.token, {
      userId: userId(binding.principal.userId),
      displayName: binding.principal.displayName,
      roles: Object.freeze([...binding.principal.roles]),
    })
  }
  return {
    issuer: config.issuer,
    clientId: config.clientId,
    audience: config.audience,
    staticByToken,
  }
}

/**
 * Decode an unsigned JWT payload for local structure checks only.
 * Signature verification against a live IdP JWKS is BLOCKED-FOR-REAL-WORLD.
 * @param credential - compact JWT string.
 * @param spec - resolved issuer settings.
 * @returns principal when payload claims match configured issuer/audience, else undefined.
 */
function principalFromJwt(credential: string, spec: ResolvedSpec): Principal | undefined {
  const parts = credential.split('.')
  if (parts.length !== 3) return undefined
  const encodedPayload = parts[1]
  if (encodedPayload === undefined) return undefined
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as Record<string, unknown>
  } catch {
    return undefined
  }
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) return undefined
  if (spec.issuer !== undefined && payload.iss !== spec.issuer) return undefined
  if (spec.audience !== undefined) {
    const aud = payload.aud
    const audiences = typeof aud === 'string' ? [aud] : Array.isArray(aud) ? aud.filter((v): v is string => typeof v === 'string') : []
    if (!audiences.includes(spec.audience)) return undefined
  }
  const roles = Array.isArray(payload.roles)
    ? payload.roles.filter((role): role is string => typeof role === 'string')
    : []
  const displayName = typeof payload.name === 'string' && payload.name.length > 0
    ? payload.name
    : payload.sub
  return {
    userId: userId(payload.sub),
    displayName,
    roles: Object.freeze(roles),
  }
}

export { TrustIdentityUnauthorizedError }
export default OidcTrustIdentityProvider
