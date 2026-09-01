# Trust Identity

English

The trust-identity seam of [dsh-trust-identity](../../packages/trust/trust-identity) binds an authenticated enterprise principal to Host RPC and audit records. Anonymous preview profiles omit this service.

Source: [`packages/trust/trust-identity/src/index.ts`](../../packages/trust/trust-identity/src/index.ts)

## Principal

```ts type-equiv
interface Principal {
  readonly userId: UserId
  readonly displayName: string
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
