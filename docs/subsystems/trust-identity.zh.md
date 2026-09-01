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
