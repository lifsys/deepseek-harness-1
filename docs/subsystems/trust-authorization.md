# Trust Authorization

English | [中文](trust-authorization.zh.md)

The trust-authorization seam of [dsh-trust-authorization](../../packages/trust/trust-authorization) evaluates RBAC before human approval or tool execution. Authorization decides whether a principal may be asked; [user-approval](../subsystems/approval.md) decides consent after authorization passes.

Source: [`packages/trust/trust-authorization/src/index.ts`](../../packages/trust/trust-authorization/src/index.ts)

## Decision

```ts type-equiv
/** One authorization decision. */
interface AuthorizationDecision {
  /** Whether the principal may perform the action. */
  readonly allowed: boolean
  /** Closed reason when denied. */
  readonly reason?: AuthorizationDenialReason
}
```

## Enforcement

[dsh-trust-authorization-rbac](../../packages/trust/trust-authorization-rbac) registers a monotonic `tools/pre-execute` guard before approval listeners. Host RPC controllers call `require()` at method entry when they expose admin operations.

## Model Experience

None, as this package does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## Known Limitations and Deferred Work

- **Resource-level ABAC** — Phase 1 ships RBAC only; attribute policies remain future work.

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

<a id="ctxtrustadmission--trustadmissionprovider-abstract-seam"></a>

### `ctx.trustAdmission` — `TrustAdmissionProvider` (abstract seam)

Abstract admission service.

```ts cordis-catalog
/**
 * Validate one composition tree before profile mount completes.
 * @param manifests - candidate bundle manifests.
 * @throws {@link TrustAdmissionRejectedError} on unsigned or digest mismatch.
 */
abstract validateComposition(manifests: readonly AdmissionManifest[]): void
```

Source: [`packages/trust/trust-admission/src/index.ts`](../../packages/trust/trust-admission/src/index.ts)

<a id="ctxtrustauthorization--trustauthorizationprovider-abstract-seam"></a>

### `ctx.trustAuthorization` — `TrustAuthorizationProvider` (abstract seam)

Abstract authorization service.

```ts cordis-catalog
/**
 * Evaluate one principal against an action and resource.
 * @param principal - authenticated principal; unauthenticated callers must fail closed upstream.
 * @param action - requested action.
 * @param resource - target resource identifier.
 * @returns allow/deny decision with closed reason when denied.
 */
abstract authorize( principal: Principal, action: TrustAction, resource: TrustResource, ): AuthorizationDecision

/**
 * Resolve effective role names for one principal.
 * @param principal - authenticated principal.
 * @returns role names used for permission lookup.
 */
abstract effectiveRoles(principal: Principal): readonly string[]

/**
 * Require authorization for one action; throws on denial.
 * @param principal - authenticated principal.
 * @param action - requested action.
 * @param resource - target resource.
 * @throws {@link TrustAuthorizationDeniedError} when denied.
 */
require( principal: Principal, action: TrustAction, resource: TrustResource, ): void
```

Types: [Principal](trust-identity.md)

Source: [`packages/trust/trust-authorization/src/index.ts`](../../packages/trust/trust-authorization/src/index.ts)

<a id="ctxtrustlease--trustleaseprovider-abstract-seam"></a>

### `ctx.trustLease` — `TrustLeaseProvider` (abstract seam)

Abstract lease service.

```ts cordis-catalog
/**
 * Acquire one scoped lease.
 * @param scope - capability scope.
 * @param budgetMs - lease lifetime in milliseconds.
 * @returns active lease with fencing token.
 */
abstract acquire(scope: LeaseScope, budgetMs: number): Promise<CapabilityLease>

/**
 * Witness one effect against an active lease.
 * @param lease - lease presented by the caller.
 * @returns true when the lease remains valid.
 */
abstract witness(lease: CapabilityLease): boolean

/**
 * Revoke one lease immediately.
 * @param leaseId - lease to revoke.
 */
abstract revoke(leaseId: LeaseId): Promise<void>
```

Source: [`packages/trust/trust-lease/src/index.ts`](../../packages/trust/trust-lease/src/index.ts)
<!-- END GENERATED cordis-surface -->
