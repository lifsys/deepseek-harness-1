---
description: "Package map for the trust capability family: identity, authorization, tamper-evident logs, audit export, leases, and admission for on-prem enterprise."
kind: "package-group"
---

# trust/ — enterprise trust core

English

## Summary

The `trust/` group adds a native Cordis trust layer for on-prem single-tenant enterprise: authenticated principals, RBAC before tool execution, hash-chained session integrity, exportable audit records, capability leases, and signed composition admission. Default developer profiles omit these packages; `@deepseek-ai/dsh-enterprise` stacks them over `dsh-base`.

## Packages

| Package | Role | ctx key |
|---|---|---|
| [`trust-identity/`](trust-identity/README.md) | Authenticated principal vocabulary | `ctx.trustIdentity` |
| [`trust-identity-oidc/`](trust-identity-oidc/README.md) | OIDC and static-token identity provider | registers `ctx.trustIdentity` |
| [`trust-authorization/`](trust-authorization/README.md) | RBAC evaluation service | `ctx.trustAuthorization` |
| [`trust-authorization-rbac/`](trust-authorization-rbac/README.md) | Config-driven RBAC and tools guard | registers `ctx.trustAuthorization` |
| [`trust-log/`](trust-log/README.md) | Session log integrity metadata | `ctx.trustLog` |
| [`trust-log-jsonl/`](trust-log-jsonl/README.md) | JSONL hash-chain sidecar provider | registers `ctx.trustLog` |
| [`trust-audit/`](trust-audit/README.md) | Enterprise audit record vocabulary | `ctx.trustAudit` |
| [`trust-audit-file/`](trust-audit-file/README.md) | Append-only local audit log | registers `ctx.trustAudit` |
| [`trust-audit-otel/`](trust-audit-otel/README.md) | OTLP audit export sink | composes with `ctx.trustAudit` |
| [`trust-lease/`](trust-lease/README.md) | Capability leases with fencing tokens | `ctx.trustLease` |
| [`trust-admission/`](trust-admission/README.md) | Signed composition admission | `ctx.trustAdmission` |

## Related documentation

- [Trust identity subsystem](../../docs/subsystems/trust-identity.md)
- [Trust authorization subsystem](../../docs/subsystems/trust-authorization.md)
- [Trust log subsystem](../../docs/subsystems/trust-log.md)
- [Trust audit subsystem](../../docs/subsystems/trust-audit.md)
- [Agent Note: trust core inversion](../../.agents/notes/implemented/architecture/2026-09-01-trust-core-inversion.md)

## Model Experience

None, as this group does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly; trust enforcement runs at Host RPC ingress and the tool pipeline.

## Known Limitations and Deferred Work

- **Live OIDC discovery** — static-token mode ships for tests; full IdP integration requires operator-supplied issuer metadata and network egress to the corporate IdP.
