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

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.zh.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

<a id="ctxtrustlog--trustlogprovider-abstract-seam"></a>

### `ctx.trustLog` — `TrustLogProvider` (abstract seam)

Abstract trust-log service wrapping durable session persistence.

```ts cordis-catalog
/**
 * Verify one session's hash chain against its durable event log.
 * @param sessionId - session to verify.
 * @throws {@link TrustLogTamperedError} when the chain does not match.
 */
abstract verifySession(sessionId: SessionId): Promise<void>

/**
 * Append integrity metadata for one newly persisted event batch.
 * @param sessionId - owning session.
 * @param events - contiguous events appended in this flush.
 */
abstract extendChain(sessionId: SessionId, events: readonly SessionEvent[]): Promise<void>

/**
 * Export the verified chain for one session.
 * @param sessionId - session to export.
 * @returns verified link list after {@link verifySession} succeeds.
 */
abstract exportVerified(sessionId: SessionId): Promise<VerifiedSessionExport>

/**
 * Write an optional signed checkpoint for long-running sessions.
 * @param sessionId - session receiving the checkpoint.
 */
abstract checkpoint(sessionId: SessionId): Promise<void>
```

Types: [SessionEvent](session.zh.md) · [SessionId](core.zh.md)

Source: [`packages/trust/trust-log/src/index.ts`](../../packages/trust/trust-log/src/index.ts)
<!-- END GENERATED cordis-surface -->
