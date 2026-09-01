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
