# Agent Note: Trust-core operator surfaces and enterprise secrets policy

Status: implemented

English | [中文](2026-09-03-trust-core-operator-surfaces.zh.md)

## Problem

Three trust-core deliverables were mounted but not usable by an operator. `ctx.trustAudit.export` had no caller, so an exportable audit stream existed only as a service method. The enterprise patch shipped Vault disabled behind a placeholder address while re-enabling a row id (`credentials-local`) that `dsh-base` does not declare, so enterprise installs silently kept the writable on-disk credential store. `trust-lease-runner` gated one tool name compiled into the plugin, and `trust-admission-boot` returned early on an empty expectation, so an admission row could mount and admit every composition without saying so.

## Decision

- Ship `@deepseek-ai/dsh-trust-audit-cli` as a bundle plus one-shot app over `dsh-base`, reached through the `trust-audit` profile template: `dsh --profile trust-audit export [--sink|--since|--until|--type|--user|--out]`. The launcher owns only profile selection, so the command lives in an app that parses its own flag family through `parseCmdline`, exactly as `dsh-headless` does. The bundle mounts the file audit provider alone, so an export never boots the enterprise Host surface.
- Make Vault the enterprise credential source: the patch enables `credentials-vault` from `DSH_VAULT_ADDR` / `DSH_VAULT_MOUNT` / `DSH_VAULT_TOKEN_REF` and disables the base `credentials` row. A missing address or mount fails validation at load instead of resolving secrets from disk.
- Move the lease-gated tool list and lease budget into validated `Config`, and revoke the lease once the gated execution settles.
- Reject an empty `expected` list in `trust-admission-boot`, and ship that row disabled in the enterprise patch because admitted digests are site-specific.
- Restore `sessionPersistence.load` through `ctx.effect` on disposal, and scope the file audit provider's subscriber set to the instance.

## Alternatives considered

- **A `dsh trust audit export` launcher subcommand** — rejected: [application launch](../../../../docs/architecture.md#application-launch) reserves Node application launch for `dsh` profiles, and a launcher subcommand that boots a Cordis tree is a second launcher.
- **Reuse the `enterprise` profile for the export** — rejected: that profile boots the Web app, which owns the command line, and an audit export would then require a running Host.
- **Keep Vault disabled with a receipt waiver** — rejected: the shipped default decided the security posture. A profile that fails closed on an unset Vault address states the posture in the composition rather than in prose.
- **Compute admission digests in the bundle** — rejected: a bundle that signs itself proves nothing; the digests belong to the installation that admits them.

## Consequences

Default `web` and `headless` profiles are unchanged. The enterprise profile no longer boots without Vault configuration, and the read-only Vault provider rejects credential writes from the Web Models page. Live Vault operator credentials and live IdP JWKS verification remain BLOCKED-FOR-REAL-WORLD; the acceptance evidence is recorded in [the trust-core ACCEPT receipt](2026-09-03-trust-core-accept-receipt.md).
