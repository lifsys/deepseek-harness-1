# Trust Authorization

English

The trust-authorization seam of [dsh-trust-authorization](../../packages/trust/trust-authorization) evaluates RBAC before human approval or tool execution. Authorization decides whether a principal may be asked; [user-approval](../subsystems/approval.md) decides consent after authorization passes.

Source: [`packages/trust/trust-authorization/src/index.ts`](../../packages/trust/trust-authorization/src/index.ts)

## Decision

```ts type-equiv
interface AuthorizationDecision {
  readonly allowed: boolean
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
