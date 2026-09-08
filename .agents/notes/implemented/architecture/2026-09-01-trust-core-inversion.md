# Agent Note: Trust core — Cordis capability inversion for on-prem enterprise

Status: implemented

English | [中文](2026-09-01-trust-core-inversion.zh.md)

## Problem

DeepSeek Harness ships strong agent safety — sandbox confinement, one-shot approval, credential references, append-only session logs — and deliberately no privileged core ([architecture.md](../../../../docs/architecture.md)). Anonymous install identity (`dsh-anonymous-user-id`) suffices for developer preview; Host RPC and tool execution do not bind decisions to an authenticated enterprise principal. EmberX's donor audit names the same gap: a trust kernel is not supplied because Cordis treats every plugin as peer-replaceable.

On-prem single-tenant enterprise deployments need authenticated users, role-based authorization before tool execution, tamper-evident session durability, exportable audit records, vault-backed secrets, and fail-closed composition admission — without embedding EmberX Rust or changing the agent loop.

## Decision

Add a native `packages/trust/` capability family as Cordis seams inspired by EmberX patterns (hash-chained logs, capability leases, signed admission) but implemented in TypeScript on documented enforcement points:

- **Ingress:** `ctx.trustIdentity.requirePrincipal()` on Host Typert RPC (`dsh-trust-gateway` consumer on `dsh-api-gateway`).
- **Tool policy:** monotonic `tools/pre-execute` guard registered by `dsh-trust-authorization-rbac` before approval (`dsh-trust-authorization` extends, not replaces, `ctx.approval`).
- **Durability:** `ctx.trustLog` hash chain sidecar verified fail-closed on session load (`dsh-trust-log-jsonl` consumer on persistence flush).
- **Audit:** parallel `ctx.trustAudit` vocabulary (`dsh-trust-audit`) mirrored from approval decisions; file and OTLP providers.
- **Enterprise profile:** `@deepseek-ai/dsh-enterprise` stacks trust packages over `dsh-base`; default `web` and `headless` profiles stay unchanged.

EmberX remains a pattern donor only — no runtime dependency, no Rust embedding.

## EmberX pattern mapping

| EmberX concept | DSH seam | Notes |
|---|---|---|
| Kernel identity | `ctx.trustIdentity` | OIDC provider; static-token test mode |
| RBAC | `ctx.trustAuthorization` + rbac provider | Config-driven role→permission map in `cordis.yml` |
| Kernel log integrity | `ctx.trustLog` | Sidecar hash chain; does not bump `SESSION_FORMAT_VERSION` |
| Audit export | `ctx.trustAudit` | Separate from model-facing session events |
| Capability leases | `ctx.trustLease` | Phase 2; cordis-host-runner generation fencing |
| Signed admission | `ctx.trustAdmission` | Phase 2; app-boot profile load |
| Vault secrets | `dsh-credentials-vault` | Phase 2; extends existing `ctx.credentials` |

## Non-goals

- Multi-tenant SaaS control plane (deferred).
- SOC 2 or other certification claims — control map uses BUILT/PLANNED/ABSENT only.
- Changing default `web`/`headless` developer-preview stance.
- Model-visible trust events in Phase 1 — audit uses parallel vocabulary with `@dshScopeScan unsupported` where needed.

## Alternatives considered

- **Embed EmberX Rust crates** — rejected: violates native TypeScript/Cordis seam choice; couples release to Rust toolchain.
- **Optional trust listeners only** — rejected: bypassable; enforcement belongs in pipeline guards and RPC ingress.
- **Trust metadata inside `SessionEventMap`** — deferred: Phase 1 keeps integrity in persistence sidecar to avoid format churn.

## Consequences

- Enterprise profile load order pins trust services before Host surfaces mount.
- REAL composition tests cover 401 unauthenticated RPC, RBAC deny, and tampered log refusal.
- Subsystem pages and `packages/trust/README.md` document the family; [architecture.md](../../../../docs/architecture.md) extension map lists trust seams.
