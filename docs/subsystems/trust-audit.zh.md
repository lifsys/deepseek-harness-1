# Trust Audit

[English](trust-audit.md) | 中文

[dsh-trust-audit](../../packages/trust/trust-audit) 的 trust-audit seam 在会话日志旁记录企业审计事实。记录永不 model-visible。

源码：[`packages/trust/trust-audit/src/index.ts`](../../packages/trust/trust-audit/src/index.ts)

## Record types（记录类型）

闭合词汇包括 `auth/login`、`auth/logout`、`authz/denied`、`approval/decided`、`admin/policy-changed`、`credential/accessed` 与 `export/session`。

## Export（导出）

`export(sink, filter)` 将匹配记录写入 file 或 OTLP sink。operator 通过接入 `ctx.trustAudit` 的企业 tooling 运行导出。

## Model Experience（模型体验）

None, as this package does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## 已知限制与 Deferred Work

- **CEF formatting** — JSONL 与 OTLP sink 先行交付；CEF 导出仍在计划中。

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.zh.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

<a id="ctxtrustaudit--trustauditprovider-abstract-seam"></a>

### `ctx.trustAudit` — `TrustAuditProvider` (abstract seam)

Abstract audit service.

```ts cordis-catalog
/**
 * Append one audit record to every configured sink.
 * @param record - durable audit fact.
 */
abstract record(record: TrustAuditRecord): Promise<void>

/**
 * Export matching records to one sink.
 * @param sink - destination sink id.
 * @param filter - optional time and type filter.
 * @returns serialized export payload for CLI and operators.
 */
abstract export(sink: TrustAuditSink, filter?: TrustAuditFilter): Promise<string>

/**
 * Subscribe one in-process sink for live records.
 * @param listener - receives each committed record.
 * @returns disposer removing the listener.
 */
abstract subscribe(listener: (record: TrustAuditRecord) => void): () => void
```

Source: [`packages/trust/trust-audit/src/index.ts`](../../packages/trust/trust-audit/src/index.ts)
<!-- END GENERATED cordis-surface -->
