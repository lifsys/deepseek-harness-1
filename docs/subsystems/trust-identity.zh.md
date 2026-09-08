# Trust Identity

[English](trust-identity.md) | 中文

[dsh-trust-identity](../../packages/trust/trust-identity) 的 trust-identity seam 将已认证企业主体绑定到 Host RPC 与审计记录。匿名预览 profile 省略该服务。

源码：[`packages/trust/trust-identity/src/index.ts`](../../packages/trust/trust-identity/src/index.ts)

## Principal（主体）

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

## 方法

`authenticate(request)` 用 ingress 凭证交换主体。`currentPrincipal()` 读取活跃 Host 作用域。`requirePrincipal()` 在未认证时以 `TrustIdentityUnauthorizedError` fail-closed。

## Model Experience（模型体验）

None, as this package does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## 已知限制与 Deferred Work

- **SAML** — OIDC 提供方先行交付；SAML 适配器仍为 operator 自有扩展。

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.zh.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

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
