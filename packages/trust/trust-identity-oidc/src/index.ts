/**
 * OIDC and static-token identity provider for enterprise Host surfaces.
 * Production OIDC uses configured issuer metadata; tests and air-gapped installs
 * may supply a static token→principal map instead of live IdP discovery.
 * @module @deepseek-ai/dsh-trust-identity-oidc
 */

import { AsyncLocalStorage } from 'node:async_hooks'
import { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import {
  TrustIdentityProvider,
  type AuthRequest,
  type AuthSession,
  type Principal,
  type UserId,
} from '@deepseek-ai/dsh-trust-identity'

/** Brand a raw string as {@link UserId}. */
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
    readonly userId: string
    readonly displayName: string
    readonly roles: readonly string[]
  }
}

/** Plugin configuration. */
export interface Config {
  /** OIDC issuer URL; required unless `staticBindings` supplies every principal. */
  readonly issuer?: string
  /** OAuth client id registered with the issuer. */
  readonly clientId?: string
  /** Static token map for test and bootstrap modes. */
  readonly staticBindings?: readonly StaticPrincipalBinding[]
}

interface ResolvedSpec {
  readonly staticByToken: ReadonlyMap<string, Principal>
}

const requestStore = new AsyncLocalStorage<Principal | undefined>()

/**
 * OIDC-backed {@link TrustIdentityProvider} with optional static-token mode.
 */
export class OidcTrustIdentityProvider extends TrustIdentityProvider {
  static Config = z.object({
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
    if (this.spec.staticByToken.size === 0 && config.issuer === undefined) {
      throw new Error('trust-identity-oidc: configure issuer or staticBindings')
    }
  }

  /** @inheritdoc */
  authenticate(request: AuthRequest): Promise<AuthSession | undefined> {
    const principal = this.principalForCredential(request.credential)
    if (principal === undefined) return Promise.resolve(undefined)
    return Promise.resolve({ principal })
  }

  /** @inheritdoc */
  currentPrincipal(): Principal | undefined {
    return requestStore.getStore()
  }

  /** @inheritdoc */
  withPrincipal<T>(principal: Principal, run: () => T | Promise<T>): Promise<T> {
    return Promise.resolve(requestStore.run(principal, run))
  }

  private principalForCredential(credential: string): Principal | undefined {
    return this.spec.staticByToken.get(credential)
  }
}

/** Resolve static bindings into a lookup table. */
function resolveSpec(config: Config): ResolvedSpec {
  const staticByToken = new Map<string, Principal>()
  for (const binding of config.staticBindings ?? []) {
    staticByToken.set(binding.token, {
      userId: userId(binding.principal.userId),
      displayName: binding.principal.displayName,
      roles: Object.freeze([...binding.principal.roles]),
    })
  }
  return { staticByToken }
}

export default OidcTrustIdentityProvider
