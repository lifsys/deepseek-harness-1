# On-Prem Enterprise Deployment Hardening

English

Guidance for single-tenant enterprise installs composing `@deepseek-ai/dsh-enterprise` over `dsh-base`.

## Profile

Use `dsh --profile enterprise web` (or stack `@deepseek-ai/dsh-enterprise` on a custom profile). Default `web` and `headless` profiles remain unchanged.

## Identity

Configure `@deepseek-ai/dsh-trust-identity-oidc` with corporate issuer metadata, or use static bindings only in controlled bootstrap environments. Terminate TLS at the corporate ingress; do not expose the Host RPC port anonymously.

## Authorization

Declare roles explicitly in `cordis.patch.yml`. Deny sensitive tools through `denyTools` and least-privilege permission lists. Review RBAC denials in the audit log (`authz/denied` records).

## Audit and log integrity

File audit logs default to `$DSH_HOME/trust-audit/audit.jsonl`. Trust log sidecars live under `$DSH_HOME/trust-log/`. Back up both directories with the session persistence store during maintenance windows.

## Network egress

Web fetch and OIDC discovery require outbound HTTPS to operator-approved endpoints. Air-gapped installs should use static identity bindings and disable providers that require external network access.

## Legal hold

Copy audit and trust-log directories before compaction or profile deletion. Session event logs remain authoritative for model replay; trust sidecars prove integrity.
