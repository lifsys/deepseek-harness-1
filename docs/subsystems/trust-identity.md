# Trust Identity

English | [中文](trust-identity.zh.md)

The trust-identity seam of [dsh-trust-identity](../../packages/trust/trust-identity) binds an authenticated enterprise principal to Host RPC and audit records. Anonymous preview profiles omit this service.

Source: [`packages/trust/trust-identity/src/index.ts`](../../packages/trust/trust-identity/src/index.ts)

## Principal

```ts type-equiv
/** Authenticated principal attached to Host RPC and audit records. */
interface Principal {
  /** Stable user identity from the identity provider. */
  readonly userId: UserId
  /** Human-readable label for audit export; never used for authorization. */
  readonly displayName: string
  /** Role names supplied by the identity provider or mapped locally. */
  readonly roles: readonly string[]
}
```

## Methods

`authenticate(request)` exchanges an ingress credential for a principal. `currentPrincipal()` reads the active Host scope. `requirePrincipal()` fails closed with `TrustIdentityUnauthorizedError` when unauthenticated.

## Model Experience

None, as this package does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## Known Limitations and Deferred Work

- **SAML** — OIDC provider ships first; SAML adapters remain operator-owned extensions.

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

<a id="ctxtrustidentity--trustidentityprovider-abstract-seam"></a>

### `ctx.trustIdentity` — `TrustIdentityProvider` (abstract seam)

Abstract identity service. Providers authenticate ingress credentials and maintain the current principal for the active Host request scope.

```ts cordis-catalog
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
requirePrincipal(): Principal

/**
 * Bind one principal to the current async execution context for downstream RPC.
 * @param principal - authenticated principal to attach.
 * @param run - work executed while the principal remains bound.
 * @returns the result of `run`.
 */
abstract withPrincipal<T>(principal: Principal, run: () => T | Promise<T>): Promise<T>
```

Source: [`packages/trust/trust-identity/src/index.ts`](../../packages/trust/trust-identity/src/index.ts)
<!-- END GENERATED cordis-surface -->
