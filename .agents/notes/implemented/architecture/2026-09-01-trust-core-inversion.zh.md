# Agent Note：Trust core — on-prem 企业的 Cordis 能力反转

Status: implemented

[English](2026-09-01-trust-core-inversion.md) | 中文

## 问题

DeepSeek Harness 提供强 agent 安全——sandbox  confinement、一次性 approval、credential reference、仅追加 session log——并刻意不提供 privileged core（[architecture.md](../../../../docs/architecture.zh.md)）。匿名安装身份（`dsh-anonymous-user-id`）足以支持开发者预览；Host RPC 与 tool 执行未将决策绑定到已认证企业主体。EmberX 的 donor audit 命名同一缺口：Cordis 将每个 plugin 视为 peer-replaceable，因此未提供 trust kernel。

On-prem 单租户企业部署需要已认证用户、tool 执行前的基于角色授权、防篡改 session durability、可导出审计记录、vault 支持的 secrets，以及 fail-closed composition 准入——且不嵌入 EmberX Rust 或更改 agent loop。

## 决策

以 Cordis seam 形式添加原生 `packages/trust/` 能力族，受 EmberX 模式启发（哈希链日志、能力租约、签名准入），但在 TypeScript 中于 documented 强制点实现：

- **Ingress：** Host Typert RPC 上的 `ctx.trustIdentity.requirePrincipal()`（`dsh-api-gateway` 上的 `dsh-trust-gateway` consumer）。
- **Tool policy：** 在 approval 之前由 `dsh-trust-authorization-rbac` 注册单调 `tools/pre-execute` 守卫（`dsh-trust-authorization` 扩展而非替换 `ctx.approval`）。
- **Durability：** `ctx.trustLog` 哈希链 sidecar，在 session load 时 fail-closed 校验（persistence flush 上的 `dsh-trust-log-jsonl` consumer）。
- **Audit：** 并行 `ctx.trustAudit` 词汇（`dsh-trust-audit`），镜像 approval 决策；file 与 OTLP 提供方。
- **Enterprise profile：** `@deepseek-ai/dsh-enterprise` 在 `dsh-base` 之上堆叠 trust 包；默认 `web` 与 `headless` profile 保持不变。

EmberX 仅作模式 donor——无 runtime 依赖，无 Rust 嵌入。

## EmberX 模式映射

| EmberX 概念 | DSH seam | 说明 |
|---|---|---|
| Kernel identity | `ctx.trustIdentity` | OIDC 提供方；static-token 测试模式 |
| RBAC | `ctx.trustAuthorization` + rbac 提供方 | `cordis.yml` 中 config 驱动 role→permission 映射 |
| Kernel log integrity | `ctx.trustLog` | Sidecar 哈希链；不 bump `SESSION_FORMAT_VERSION` |
| Audit export | `ctx.trustAudit` | 与 model-facing session event 分离 |
| Capability leases | `ctx.trustLease` | Phase 2；cordis-host-runner generation fencing |
| Signed admission | `ctx.trustAdmission` | Phase 2；app-boot profile load |
| Vault secrets | `dsh-credentials-vault` | Phase 2；扩展现有 `ctx.credentials` |

## 非目标

- 多租户 SaaS control plane（延期）。
- SOC 2 或其他认证声明——控制映射仅使用 BUILT/PLANNED/ABSENT。
- 更改默认 `web`/`headless` 开发者预览立场。
- Phase 1 中 model-visible trust event——audit 使用并行词汇，必要时 `@dshScopeScan unsupported`。

## 已考虑的备选

- **嵌入 EmberX Rust crate** — 拒绝：违反原生 TypeScript/Cordis seam 选择；将 release 与 Rust toolchain 耦合。
- **仅可选 trust listener** — 拒绝：可绕过；强制属于 pipeline guard 与 RPC ingress。
- **Trust 元数据放入 `SessionEventMap`** — 延期：Phase 1 将完整性保留在 persistence sidecar 以避免 format churn。

## 后果

- Enterprise profile 加载顺序在 Host 面挂载之前 pin trust 服务。
- REAL composition 测试覆盖 401 未认证 RPC、RBAC deny，以及被篡改 log 拒绝。
- 子系统页与 `packages/trust/README.md` 记录该族；[architecture.md](../../../../docs/architecture.zh.md) extension map 列出 trust seam。
