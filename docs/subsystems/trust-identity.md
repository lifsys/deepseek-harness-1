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
