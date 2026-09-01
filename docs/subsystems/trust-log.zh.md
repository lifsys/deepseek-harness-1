# Trust Log Integrity

[English](trust-log.md) | 中文

[dsh-trust-log](../../packages/trust/trust-log) 的 trust-log seam 在 durable 会话日志旁存储哈希链完整性元数据。被篡改的 sidecar 或事件序列在校验时 fail-closed。

源码：[`packages/trust/trust-log/src/index.ts`](../../packages/trust/trust-log/src/index.ts)

## Verification（校验）

`verifySession(sessionId)` 针对存储链重放 canonical 会话日志，不匹配时抛出 `TrustLogTamperedError`。Phase 1 中完整性元数据不更改 `SessionEventMap`。

## Model Experience（模型体验）

None, as this package does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## 已知限制与 Deferred Work

- **Signed checkpoints** — Phase 1 交付哈希链接；Ed25519 checkpoint 仍为可选加固。
