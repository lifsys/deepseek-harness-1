# Trust Audit

English

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
