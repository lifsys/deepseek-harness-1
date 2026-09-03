# Agent Note: Trust-core acceptance receipt

Status: implemented

English | [中文](2026-09-03-trust-core-accept-receipt.zh.md)

## Problem

The trust-core work on `feature/trust-core` needed a single durable record stating, requirement by requirement, what the branch delivers, which command proves it, and which residual items no repository change can close. Without it, acceptance rested on prose claims rather than reproducible evidence.

## Decision

This note is that record. Every row names the command that produced its verdict; a row is PASS only when the named command exited zero on this branch.

### Plan success criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| Admin deploys `dsh --profile enterprise web` behind a corporate IdP with no anonymous Host access | PASS for enforcement, BLOCKED-FOR-REAL-WORLD for a live IdP | `pnpm exec vitest run packages/bundle/enterprise` — an RPC with no `Authorization` header and an RPC with an unknown Bearer credential both return `unauthorized`; a valid Bearer credential binds the principal and answers. Enforcement runs through a Loader-composed tree, not a hand-built context. Live OIDC JWKS verification needs operator IdP credentials. |
| Every sensitive tool denial and approval produces an exportable audit record tied to `UserId` | PASS | `pnpm exec vitest run packages/bundle/enterprise` — RBAC denies `danger-full-access` through the composed `cordis.yml` and records `authz/denied`. `pnpm exec vitest run packages/bundle/trust-audit-cli` — `dsh --profile trust-audit export` serializes those records and narrows them by `--type` and `--user`. |
| Tampered session files fail closed on load with an auditable error | PASS | `pnpm exec vitest run packages/bundle/enterprise packages/trust/trust-log-jsonl` — a mutated hash chain rejects both `verifySession` and the wrapped `sessionPersistence.load`. |
| Secrets resolve from Vault with access logged by reference only | PASS for the provider and composition, BLOCKED-FOR-REAL-WORLD for a live Vault | `pnpm exec vitest run packages/credentials/credentials-vault` — KV v2 reads over an injected `fetch`, fail-closed errors on unset token and non-success status, and a `credential/accessed` record carrying the reference and mount, never the value. The enterprise patch now enables the Vault row from `DSH_VAULT_ADDR` / `DSH_VAULT_MOUNT` / `DSH_VAULT_TOKEN_REF` and disables the base `credentials` row. A live Vault needs operator credentials. |
| Default `web` and `headless` profiles remain unchanged | PASS | `packages/boot/app-boot/src/profile.ts` — the `web` and `headless` templates are untouched; enterprise rows arrive only through the `enterprise` and `trust-audit` templates. |

### Audit follow-ups

| Item | Verdict | Evidence |
|---|---|---|
| `dsh trust audit export` calling `ctx.trustAudit.export` | PASS, invoked as `dsh --profile trust-audit export` | `@deepseek-ai/dsh-trust-audit-cli` ships the bundle, the command-line provider, and the runner; eight REAL-composition cases cover every flag and both usage rejections. The launcher owns profile selection only, so the command lives in a profile-launched app ([application launch](../../../../docs/architecture.md#application-launch)). |
| Enterprise secrets policy: no `credentials-vault` disabled beside a live local store | PASS | `packages/bundle/enterprise/cordis.patch.yml` — the Vault row is enabled and operator-configured; the base `credentials` row is disabled. The previous patch also re-enabled a row id (`credentials-local`) that `dsh-base` does not declare, so the disable had no referent at all. |
| Lease gating is configurable, not compiled in | PASS | `pnpm exec vitest run packages/trust/trust-lease-runner` — `gatedTools` and `budgetMs` are validated config; an ungated tool bypasses the gate, a gated tool runs under a witnessed lease and releases it, and an unwitnessable lease denies. |
| Admission cannot admit silently | PASS | `pnpm exec vitest run packages/trust/trust-admission-boot` — an empty `expected` list refuses to load; a digest mismatch and an unknown bundle both reject. The enterprise patch ships the row disabled because admitted digests are site-specific. |
| Upstream push or PR | FAIL — read-only for this operator | `git push --dry-run upstream feature/trust-core` → `ERROR: Permission to deepseek-ai/deepseek-harness.git denied to lifsys.` No upstream pull request is open. |

### Gate results

| Command | Result |
|---|---|
| `pnpm run typecheck` | PASS (exit 0) |
| `pnpm run lint` | PASS (exit 0) |
| `pnpm run test:docs` | PASS (exit 0) |
| `pnpm run verify-cordis-config` | PASS |
| `pnpm run verify-package-invariants` | PASS |
| `pnpm run verify-export-jsdoc` | PASS |
| `pnpm run verify-config-catalog` | PASS — the trust and Vault config declarations now render into `docs/config-catalog.md`; the generator learned `RequestInit`/`Response` as fetch globals |
| `pnpm run verify-cordis-catalog` | PASS — the six trust services own subsystem pages, and each page carries its generated `cordis-surface` region |
| `pnpm exec vitest run` over `packages/trust`, `packages/bundle/enterprise`, `packages/bundle/trust-audit-cli`, `packages/credentials/credentials-vault`, `packages/api/gateway` | PASS (17 files, 304 tests) |
| `pnpm exec vitest run scripts/project-doc-site.spec.ts scripts/test-invariants.spec.ts scripts/verify-application-entrypoints.spec.ts` | PASS |

`pnpm run test:coverage` is the CI per-file coverage gate and is not rehearsed here; CI owns it.

Eight `scripts/` suites that spawn subprocesses or sweep the whole workspace (`publint-all`, `oxlint-contract`, `gen-third-party-notices`, `locale-dictionary-parity`, `session-fixture-layout`, `change-scope`, `client-build-environment`, `gen-client-catalog`) fail non-deterministically on this host: a different subset fails on each run, and the failures are 5-second Vitest timeouts and null `spawnSync` statuses rather than assertion mismatches. They touch nothing this branch changes. CI owns that signal on its own hardware.

### Publication

Forgejo (`origin` and `forgejo`, `ssh://git@repo.lifsys.one:2222/lifsys/deepseek-harness.git`) carries `feature/trust-core`. The GitHub fork `lifsys/deepseek-harness-1` carries the same branch. Upstream comparison for a maintainer-opened pull request: <https://github.com/deepseek-ai/deepseek-harness/compare/master...lifsys:deepseek-harness-1:feature/trust-core>.

## Alternatives considered

- **Claim ACCEPT on upstream merge** — rejected: the operator's credentials cannot push to `deepseek-ai/deepseek-harness`, and an unverifiable claim is worse than a recorded denial.
- **Waive the Vault gap in this receipt instead of closing it** — rejected: the shipped composition, not a note, decides whether an enterprise install resolves secrets from disk.
- **Record only the aggregate gate result** — rejected: an aggregate hides which requirement each command actually proves.

## Consequences

Two residual items are operator-credential gated and cannot close in this repository: live OIDC JWKS verification against a corporate IdP, and a live Vault read with real operator credentials. Everything else in the plan is implemented, composed, and covered by the commands above. The upstream contribution needs a maintainer with write access, or a pull request opened from the fork by an account authorized to do so.
