# Trust Log Integrity

English | [中文](trust-log.zh.md)

The trust-log seam of [dsh-trust-log](../../packages/trust/trust-log) stores hash-chain integrity metadata beside durable session logs. Tampered sidecars or event sequences fail closed on verification.

Source: [`packages/trust/trust-log/src/index.ts`](../../packages/trust/trust-log/src/index.ts)

## Verification

`verifySession(sessionId)` replays the canonical session log against the stored chain and throws `TrustLogTamperedError` on mismatch. Integrity metadata does not alter `SessionEventMap` in Phase 1.

## Model Experience

None, as this package does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## Known Limitations and Deferred Work

- **Signed checkpoints** — hash links ship in Phase 1; Ed25519 checkpoints remain optional hardening.

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

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

Types: [SessionEvent](session.md) · [SessionId](core.md)

Source: [`packages/trust/trust-log/src/index.ts`](../../packages/trust/trust-log/src/index.ts)
<!-- END GENERATED cordis-surface -->
