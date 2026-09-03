# Agent Note: Trust-core enforcement hardening

Status: implemented

English | [中文](2026-09-03-trust-core-enforcement-hardening.zh.md)

## Problem

The Phase 1 trust-core packages mounted services and unit-tested deny paths, but several plan-required enforcement edges were incomplete: Host RPC called `requirePrincipal` without binding a principal from Bearer credentials; Vault resolved to `undefined` without HTTP; OIDC Config omitted issuer fields; trust-log verification ran only on an explicit `verifySession` call; admission/lease packages default-exported abstract Service Definitions; and REAL composition coverage for 401 / RBAC deny / tampered-log refusal was missing.

## Decision

- Bind enterprise principals on the Host RPC invoke path: Connection stores the active Fetch `Request` in AsyncLocalStorage; api-gateway authenticates a Bearer credential (or an already-bound principal) before `invoke`, mapping failures to `unauthorized`.
- Implement Vault KV v2 HTTP reads with injectable `fetch`, fail-closed errors, and `credential/accessed` audit (ref only).
- Complete OIDC static-token mode plus issuer/clientId/audience Config; parse JWT claims for structure checks only (JWKS verification remains BLOCKED-FOR-REAL-WORLD).
- Wrap `sessionPersistence.load` in `dsh-trust-log-jsonl` so tampered sidecars refuse load.
- Default-export concrete admission and lease providers; mount `dsh-trust-gateway` in the enterprise patch.
- Add REAL composition tests under `packages/bundle/enterprise/tests/`.

## Alternatives considered

- **Keep requirePrincipal without Bearer binding** — rejected: enterprise Host RPC would always 401 once identity is mounted, with no authenticated success path.
- **Import Vault SDK as a hard dependency** — rejected: KV v2 HTTP plus injectable `fetch` covers the seam without coupling CI to a live Vault agent.
- **Full JWKS verification in this change** — deferred: needs operator IdP credentials; claim parsing plus static tokens unblock tests while README marks live IdP as BLOCKED-FOR-REAL-WORLD.

## Consequences

Default `web`/`headless` stay unchanged. Live IdP JWKS verification and live Vault operator auth remain BLOCKED-FOR-REAL-WORLD and are documented in package README Known Limitations.
