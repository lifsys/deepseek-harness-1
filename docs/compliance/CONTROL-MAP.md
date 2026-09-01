# DSH Control Map (Draft)

English

This document maps common enterprise controls to DeepSeek Harness trust-core mechanisms. Status vocabulary: **BUILT**, **PLANNED**, **ABSENT**. This is not a certification claim.

| Control area | Mechanism | Status |
|---|---|---|
| Authenticated Host access | `ctx.trustIdentity` + api-gateway `requirePrincipal` | BUILT |
| Role-based tool denial | `ctx.trustAuthorization` + `tools/pre-execute` guard | BUILT |
| Tamper-evident session logs | `ctx.trustLog` hash-chain sidecar | BUILT |
| Exportable audit trail | `ctx.trustAudit` file + OTLP providers | BUILT |
| Vault-backed secrets | `dsh-credentials-vault` | PLANNED (provider scaffold; live Vault BLOCKED-FOR-REAL-WORLD) |
| Signed bundle admission | `ctx.trustAdmission` | BUILT (config digest validation) |
| Dynamic plugin leases | `ctx.trustLease` | BUILT |
| SOC 2 Type II attestation | — | ABSENT |
| Multi-tenant SaaS isolation | — | ABSENT |

## Evidence expectations

- Deny-path REAL composition tests cover unauthenticated RPC (401), RBAC tool denial, and tampered trust-chain refusal.
- Operators retain file audit logs under `$DSH_HOME/trust-audit/audit.jsonl` when the file provider is composed.
