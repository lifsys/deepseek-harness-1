---
description: "The trust package group: enterprise identity, RBAC, log integrity, audit export, leases, and admission for on-prem profiles."
kind: "package-group"
---

# trust/ — enterprise trust core

English | [中文](README.zh.md)

## Summary

The `trust/` group adds a native Cordis trust layer for on-prem single-tenant enterprise: authenticated principals, RBAC before tool execution, hash-chained session integrity, exportable audit records, capability leases, and signed composition admission. Default developer profiles omit these packages; `@deepseek-ai/dsh-enterprise` stacks them over `dsh-base`.

## Table of Contents

- [Packages](#packages)
- [Related documentation](#related-documentation)
- [Dev Note](#dev-note)

-----

<a id="packages"></a>
## Packages

| Package | Role | ctx key |
|---|---|---|
| [`trust-identity/`](trust-identity/README.md) | Authenticated principal vocabulary | `ctx.trustIdentity` |
| [`trust-identity-oidc/`](trust-identity-oidc/README.md) | OIDC and static-token identity provider | registers `ctx.trustIdentity` |
| [`trust-gateway/`](trust-gateway/README.md) | Host RPC identity guard | consumes `ctx.trustIdentity` |
| [`trust-authorization/`](trust-authorization/README.md) | RBAC evaluation service | `ctx.trustAuthorization` |
| [`trust-authorization-rbac/`](trust-authorization-rbac/README.md) | Config-driven RBAC and tools guard | registers `ctx.trustAuthorization` |
| [`trust-log/`](trust-log/README.md) | Session log integrity metadata | `ctx.trustLog` |
| [`trust-log-jsonl/`](trust-log-jsonl/README.md) | JSONL hash-chain sidecar provider | registers `ctx.trustLog` |
| [`trust-audit/`](trust-audit/README.md) | Enterprise audit record vocabulary | `ctx.trustAudit` |
| [`trust-audit-file/`](trust-audit-file/README.md) | Append-only local audit log | registers `ctx.trustAudit` |
| [`trust-audit-otel/`](trust-audit-otel/README.md) | OTLP audit export sink | composes with `ctx.trustAudit` |
| [`trust-approval-audit/`](trust-approval-audit/README.md) | Approval decision audit mirror | consumes `ctx.trustAudit` |
| [`trust-approval-grants/`](trust-approval-grants/README.md) | Admin-scoped persistent approval grants | extends `ctx.approval` |
| [`trust-lease/`](trust-lease/README.md) | Capability leases with fencing tokens | `ctx.trustLease` |
| [`trust-lease-runner/`](trust-lease-runner/README.md) | Dynamic plugin lease checks | consumes `ctx.trustLease` |
| [`trust-admission/`](trust-admission/README.md) | Signed composition admission | `ctx.trustAdmission` |
| [`trust-admission-boot/`](trust-admission-boot/README.md) | App-boot admission validation | consumes `ctx.trustAdmission` |

-----

<a id="related-documentation"></a>
## Related documentation

- [Trust identity subsystem](../../docs/subsystems/trust-identity.md) — principal vocabulary and Host ingress contract.
- [Trust authorization subsystem](../../docs/subsystems/trust-authorization.md) — RBAC decisions and tool guards.
- [Trust log subsystem](../../docs/subsystems/trust-log.md) — hash-chain verification semantics.
- [Trust audit subsystem](../../docs/subsystems/trust-audit.md) — enterprise audit record vocabulary.
- [Agent Note: trust core inversion](../../.agents/notes/implemented/architecture/2026-09-01-trust-core-inversion.md) — design rationale and EmberX mapping.

-----

<a id="dev-note"></a>
## Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
