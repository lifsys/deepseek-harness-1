/**
 * OIDC and static-token identity provider for enterprise Host surfaces.
 * When `issuer` is configured, bearer JWTs are verified against the issuer
 * JWKS (discovery or an explicit `jwksUri`). Tests may inject a local JWKS
 * via programmatic `jwks`. Static token maps remain available for air-gapped
 * bootstrap without an IdP.
 * @module @deepseek-ai/dsh-trust-identity-oidc
 */

import { AsyncLocalStorage } from 'node:async_hooks'
import { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import {
  createLocalJWKSet,
  createRemoteJWKSet,
  customFetch,
  decodeProtectedHeader,
  jwtVerify,
  type JSONWebKeySet,
  type JWTPayload,
  type JWTVerifyGetKey,
} from 'jose'
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
  /**
   * Explicit JWKS URL. When omitted and `issuer` is set, the provider loads
   * `{issuer}/.well-known/openid-configuration` and uses `jwks_uri`.
   */
  readonly jwksUri?: string
  /**
   * Programmatic JWKS for tests. Not accepted from cordis.yml — production
   * deployments use discovery or `jwksUri`.
   */
  readonly jwks?: JSONWebKeySet
  /** Static token map for test and bootstrap modes. */
  readonly staticBindings?: readonly StaticPrincipalBinding[]
  /**
   * Optional HTTP client override for discovery and JWKS fetch (tests).
   * Not accepted from cordis.yml.
   */
  readonly fetch?: typeof globalThis.fetch
}

interface ResolvedSpec {
  readonly issuer: string | undefined
  readonly clientId: string | undefined
  readonly audience: string | undefined
  readonly jwksUri: string | undefined
  readonly jwks: JSONWebKeySet | undefined
  readonly staticByToken: ReadonlyMap<string, Principal>
  readonly fetch: typeof globalThis.fetch
  readonly usesCustomFetch: boolean
}

const requestStore = new AsyncLocalStorage<Principal | undefined>()

/**
 * OIDC-backed {@link TrustIdentityProvider} with JWKS signature verification
 * and optional static-token mode.
 */
export class OidcTrustIdentityProvider extends TrustIdentityProvider {
  static Config = z.object({
    issuer: z.string(),
    clientId: z.string(),
    audience: z.string(),
    jwksUri: z.string(),
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
  private keyResolver: JWTVerifyGetKey | undefined
  private keyResolverPromise: Promise<JWTVerifyGetKey> | undefined

  constructor(ctx: Context, public config: Config) {
    super(ctx)
    this.spec = resolveSpec(config)
    if (this.spec.staticByToken.size === 0 && this.spec.issuer === undefined) {
      throw new Error('trust-identity-oidc: configure issuer or staticBindings')
    }
    if (this.spec.issuer !== undefined && this.spec.clientId === undefined) {
      throw new Error('trust-identity-oidc: clientId is required when issuer is configured')
    }
    if (this.spec.jwks !== undefined) {
      this.keyResolver = createLocalJWKSet(this.spec.jwks)
    }
  }

  /** @inheritdoc */
  async authenticate(request: AuthRequest): Promise<AuthSession | undefined> {
    const staticPrincipal = this.spec.staticByToken.get(request.credential)
    if (staticPrincipal !== undefined) return { principal: staticPrincipal }
    if (this.spec.issuer === undefined) return undefined
    const principal = await this.principalFromVerifiedJwt(request.credential)
    return principal === undefined ? undefined : { principal }
  }

  /** @inheritdoc */
  currentPrincipal(): Principal | undefined {
    return requestStore.getStore()
  }

  /** @inheritdoc */
  withPrincipal<T>(principal: Principal, run: () => T | Promise<T>): Promise<T> {
    return Promise.resolve(requestStore.run(principal, run))
  }

  /**
   * Verify a compact JWT against the issuer JWKS and map claims to a principal.
   * @param credential - compact JWT bearer credential.
   * @returns principal when signature and claims validate, else undefined.
   */
  private async principalFromVerifiedJwt(credential: string): Promise<Principal | undefined> {
    const parts = credential.split('.')
    if (parts.length !== 3) return undefined
    let headerAlg: string | undefined
    try {
      headerAlg = decodeProtectedHeader(credential).alg
    } catch {
      return undefined
    }
    if (headerAlg === undefined || headerAlg === 'none') return undefined

    const getKey = await this.getKeyResolver()
    let payload: JWTPayload
    try {
      const verified = await jwtVerify(credential, getKey, {
        issuer: this.spec.issuer,
        ...(this.spec.audience !== undefined ? { audience: this.spec.audience } : {}),
      })
      payload = verified.payload
    } catch {
      return undefined
    }
    return principalFromClaims(payload)
  }

  private getKeyResolver(): Promise<JWTVerifyGetKey> {
    if (this.keyResolver !== undefined) return Promise.resolve(this.keyResolver)
    if (this.keyResolverPromise === undefined) {
      this.keyResolverPromise = this.resolveRemoteKeySet().then((resolver) => {
        this.keyResolver = resolver
        return resolver
      })
    }
    return this.keyResolverPromise
  }

  private async resolveRemoteKeySet(): Promise<JWTVerifyGetKey> {
    const jwksUri = this.spec.jwksUri ?? await this.discoverJwksUri()
    if (!this.spec.usesCustomFetch) {
      return createRemoteJWKSet(new URL(jwksUri))
    }
    const fetchImpl = this.spec.fetch
    return createRemoteJWKSet(new URL(jwksUri), {
      // jose's customFetch option accepts fetch-compatible implementations.
      // @ts-expect-error jose typings lag fetch-compatible wrappers
      [customFetch]: (url, options) => fetchImpl(String(url), {
        method: options?.method ?? 'GET',
        headers: options?.headers as HeadersInit | undefined,
        signal: options?.signal,
        redirect: 'manual',
      }),
    })
  }

  private async discoverJwksUri(): Promise<string> {
    const issuer = this.spec.issuer
    if (issuer === undefined) {
      throw new Error('trust-identity-oidc: issuer required for JWKS discovery')
    }
    const discoveryUrl = `${issuer.replace(/\/+$/u, '')}/.well-known/openid-configuration`
    const response = await this.spec.fetch(discoveryUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5_000),
    })
    if (!response.ok) {
      throw new Error(`trust-identity-oidc: OIDC discovery HTTP ${response.status}`)
    }
    const body = await response.json() as { jwks_uri?: unknown }
    if (typeof body.jwks_uri !== 'string' || body.jwks_uri.length === 0) {
      throw new Error('trust-identity-oidc: OIDC discovery missing jwks_uri')
    }
    return body.jwks_uri
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
    jwksUri: config.jwksUri,
    jwks: config.jwks,
    staticByToken,
    fetch: config.fetch ?? globalThis.fetch.bind(globalThis),
    usesCustomFetch: config.fetch !== undefined,
  }
}

/**
 * Map verified JWT claims onto a {@link Principal}.
 * @param payload - verified JWT payload.
 * @returns principal, or undefined when no stable subject claim is present.
 */
function principalFromClaims(payload: JWTPayload): Principal | undefined {
  const subject = typeof payload.sub === 'string' && payload.sub.length > 0
    ? payload.sub
    : typeof payload.appid === 'string' && payload.appid.length > 0
      ? payload.appid
      : typeof payload.azp === 'string' && payload.azp.length > 0
        ? payload.azp
        : undefined
  if (subject === undefined) return undefined
  const rolesClaim = payload.roles ?? payload['dsh_roles']
  const roles = Array.isArray(rolesClaim)
    ? rolesClaim.filter((role): role is string => typeof role === 'string')
    : []
  const displayName = typeof payload.name === 'string' && payload.name.length > 0
    ? payload.name
    : typeof payload.preferred_username === 'string' && payload.preferred_username.length > 0
      ? payload.preferred_username
      : subject
  return {
    userId: userId(subject),
    displayName,
    roles: Object.freeze(roles),
  }
}

export { TrustIdentityUnauthorizedError }
export default OidcTrustIdentityProvider
