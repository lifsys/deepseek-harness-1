# Trust Authorization

[English](trust-authorization.md) | 中文

[dsh-trust-authorization](../../packages/trust/trust-authorization) 的 trust-authorization seam 在人类审批或工具执行前评估 RBAC。授权决定主体是否可被询问；[user-approval](approval.zh.md) 在授权通过后决定 consent。

源码：[`packages/trust/trust-authorization/src/index.ts`](../../packages/trust/trust-authorization/src/index.ts)

## Decision（决策）

```ts type-equiv
/** One authorization decision. */
interface AuthorizationDecision {
  /** Whether the principal may perform the action. */
  readonly allowed: boolean
  /** Closed reason when denied. */
  readonly reason?: AuthorizationDenialReason
}
```

## 强制

[dsh-trust-authorization-rbac](../../packages/trust/trust-authorization-rbac) 在审批 listener 之前注册单调 `tools/pre-execute` 守卫。暴露管理操作的 Host RPC controller 在方法入口调用 `require()`。

## Model Experience（模型体验）

None, as this package does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## 已知限制与 Deferred Work

- **Resource-level ABAC** — Phase 1 仅交付 RBAC；属性策略仍为未来工作。
