# DSH Control Map (Draft)

[English](CONTROL-MAP.md) | 中文

本文将常见企业控制映射到 DeepSeek Harness trust-core 机制。状态词汇：**BUILT**、**PLANNED**、**ABSENT**。这不是认证声明。

| 控制域 | 机制 | 状态 |
|---|---|---|
| 已认证 Host 访问 | `ctx.trustIdentity` + api-gateway `requirePrincipal` | BUILT |
| 基于角色的 tool 拒绝 | `ctx.trustAuthorization` + `tools/pre-execute` 守卫 | BUILT |
| 防篡改会话日志 | `ctx.trustLog` 哈希链 sidecar | BUILT |
| 可导出审计轨迹 | `ctx.trustAudit` file + OTLP 提供方 | BUILT |
| Vault 支持的 secrets | `dsh-credentials-vault` | PLANNED（提供方 scaffold；live Vault BLOCKED-FOR-REAL-WORLD） |
| 签名 bundle 准入 | `ctx.trustAdmission` | BUILT（config digest 校验） |
| 动态插件租约 | `ctx.trustLease` | BUILT |
| SOC 2 Type II attestation | — | ABSENT |
| 多租户 SaaS 隔离 | — | ABSENT |

## 证据期望

- Deny-path REAL composition 测试覆盖未认证 RPC（401）、RBAC tool 拒绝，以及被篡改 trust-chain 拒绝。
- 组合 file 提供方时，operator 在 `$DSH_HOME/trust-audit/audit.jsonl` 保留 file 审计日志。
