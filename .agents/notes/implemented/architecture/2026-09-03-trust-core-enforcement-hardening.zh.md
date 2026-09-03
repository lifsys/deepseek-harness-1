# Agent Note: Trust-core 强制执行加固

Status: implemented

[English](2026-09-03-trust-core-enforcement-hardening.md) | 中文

## 问题

Phase 1 trust-core 包已挂载服务并覆盖单元拒绝路径，但计划要求的若干强制点仍不完整：Host RPC 调用 `requirePrincipal` 却未从 Bearer 凭证绑定主体；Vault 在无 HTTP 时解析为 `undefined`；OIDC Config 缺少 issuer 字段；trust-log 校验仅在显式 `verifySession` 时运行；admission/lease 默认导出抽象 Service Definition；缺少 401 / RBAC 拒绝 / 篡改日志拒绝的 REAL composition 覆盖。

## 决策

- 在 Host RPC invoke 路径绑定企业主体：Connection 用 AsyncLocalStorage 保存活跃 Fetch `Request`；api-gateway 在 `invoke` 前认证 Bearer（或已绑定主体），失败映射为 `unauthorized`。
- 实现带可注入 `fetch` 的 Vault KV v2 HTTP 读取、fail-closed 错误，以及仅含引用的 `credential/accessed` 审计。
- 补齐 OIDC 静态 token 模式与 issuer/clientId/audience Config；仅做 JWT claim 结构解析（JWKS 校验仍为 BLOCKED-FOR-REAL-WORLD）。
- 在 `dsh-trust-log-jsonl` 包装 `sessionPersistence.load`，使篡改 sidecar 在加载时拒绝。
- 默认导出具体的 admission/lease provider；在企业补丁中挂载 `dsh-trust-gateway`。
- 在 `packages/bundle/enterprise/tests/` 增加 REAL composition 测试。

## 备选方案

- **保留 requirePrincipal 但不绑定 Bearer** — 否决：一旦挂载 identity，企业 Host RPC 将始终 401，没有已认证成功路径。
- **将 Vault SDK 作为硬依赖引入** — 否决：KV v2 HTTP 加可注入 `fetch` 即可覆盖该 seam，无需把 CI 绑到真实 Vault agent。
- **在本变更中完成完整 JWKS 校验** — 推迟：需要运维 IdP 凭据；claim 解析加静态 token 可解锁测试，同时 README 将真实 IdP 标为 BLOCKED-FOR-REAL-WORLD。

## 后果

默认 `web`/`headless` 保持不变。真实 IdP JWKS 校验与真实 Vault 运维认证仍为 BLOCKED-FOR-REAL-WORLD，并记录在包 README Known Limitations。
