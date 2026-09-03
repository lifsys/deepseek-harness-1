# On-Prem Enterprise Deployment Hardening

English | [中文](on-prem-enterprise-hardening.zh.md)

Guidance for single-tenant enterprise installs composing `@deepseek-ai/dsh-enterprise` over `dsh-base`.

## Profile

Use `dsh --profile enterprise web` (or stack `@deepseek-ai/dsh-enterprise` on a custom profile). Default `web` and `headless` profiles remain unchanged.

## Identity

Configure `@deepseek-ai/dsh-trust-identity-oidc` with corporate issuer metadata, or use static bindings only in controlled bootstrap environments. Terminate TLS at the corporate ingress; do not expose the Host RPC port anonymously.

## Authorization

Declare roles explicitly in `cordis.patch.yml`. Deny sensitive tools through `denyTools` and least-privilege permission lists. Review RBAC denials in the audit log (`authz/denied` records).

## Audit and log integrity

File audit logs default to `$DSH_HOME/trust-audit/audit.jsonl`. Trust log sidecars live under `$DSH_HOME/trust-log/`. Back up both directories with the session persistence store during maintenance windows.

Export records for a SIEM with `dsh --profile trust-audit export`, which boots only the audit provider and writes JSONL to stdout or `--out`. Narrow an export with `--since`, `--until`, `--type`, and `--user`; see [dsh-trust-audit-cli](../packages/bundle/trust-audit-cli/README.md).

## Secrets

The enterprise patch resolves secrets from Vault and disables the base `credentials` row, so nothing resolves from `$DSH_HOME/.credentials.yaml` or a project `.env`. Set `DSH_VAULT_ADDR` and `DSH_VAULT_MOUNT` before boot; an unset address or mount refuses to load. The Vault token comes from the environment variable `DSH_VAULT_TOKEN_REF` names, defaulting to `VAULT_TOKEN`. Rotation happens in Vault: the provider reads through on each resolve and records a `credential/accessed` audit row carrying the reference, never the value.

## Network egress

Web fetch and OIDC discovery require outbound HTTPS to operator-approved endpoints. Air-gapped installs should use static identity bindings and disable providers that require external network access.

## Legal hold

Copy audit and trust-log directories before compaction or profile deletion. Session event logs remain authoritative for model replay; trust sidecars prove integrity.
