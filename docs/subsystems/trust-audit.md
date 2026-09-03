# Trust Audit

English | [中文](trust-audit.zh.md)

The trust-audit seam of [dsh-trust-audit](../../packages/trust/trust-audit) records enterprise audit facts parallel to the session log. Records are never model-visible.

Source: [`packages/trust/trust-audit/src/index.ts`](../../packages/trust/trust-audit/src/index.ts)

## Record types

Closed vocabulary includes `auth/login`, `auth/logout`, `authz/denied`, `approval/decided`, `admin/policy-changed`, `credential/accessed`, and `export/session`.

## Export

`export(sink, filter)` writes matching records to file or OTLP sinks. Operators run export through enterprise tooling wired to `ctx.trustAudit`.

## Model Experience

None, as this package does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## Known Limitations and Deferred Work

- **CEF formatting** — JSONL and OTLP sinks ship first; CEF export remains planned.

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

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
