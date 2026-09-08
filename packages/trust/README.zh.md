---
description: "trust 包组地图：面向 on-prem profile 的企业身份、RBAC、日志完整性、审计导出、租约与准入。"
kind: "package-group"
---

# trust/ — 企业 trust core

[English](README.md) | 中文

## 概述

`trust/` 组为 on-prem 单租户企业添加原生 Cordis trust 层：已认证主体、工具执行前的 RBAC、哈希链会话完整性、可导出审计记录、能力租约，以及签名 composition 准入。默认开发者 profile 省略这些包；`@deepseek-ai/dsh-enterprise` 在 `dsh-base` 之上堆叠它们。

## 目录

- [包](#packages)
- [相关文档](#related-documentation)
- [开发备注](#dev-note)

-----

<a id="packages"></a>
## 包

| 包 | 职责 | ctx 键 |
|---|---|---|
| [`trust-identity/`](trust-identity/README.zh.md) | 已认证主体词汇 | `ctx.trustIdentity` |
| [`trust-identity-oidc/`](trust-identity-oidc/README.zh.md) | OIDC 与 static-token 身份提供方 | 注册 `ctx.trustIdentity` |
| [`trust-gateway/`](trust-gateway/README.zh.md) | Host RPC 身份守卫 | 消费 `ctx.trustIdentity` |
| [`trust-authorization/`](trust-authorization/README.zh.md) | RBAC 评估服务 | `ctx.trustAuthorization` |
| [`trust-authorization-rbac/`](trust-authorization-rbac/README.zh.md) | 配置驱动 RBAC 与 tools 守卫 | 注册 `ctx.trustAuthorization` |
| [`trust-log/`](trust-log/README.zh.md) | 会话日志完整性元数据 | `ctx.trustLog` |
| [`trust-log-jsonl/`](trust-log-jsonl/README.zh.md) | JSONL 哈希链 sidecar 提供方 | 注册 `ctx.trustLog` |
| [`trust-audit/`](trust-audit/README.zh.md) | 企业审计记录词汇 | `ctx.trustAudit` |
| [`trust-audit-file/`](trust-audit-file/README.zh.md) | 仅追加本地审计日志 | 注册 `ctx.trustAudit` |
| [`trust-audit-otel/`](trust-audit-otel/README.zh.md) | OTLP 审计导出 sink | 与 `ctx.trustAudit` 组合 |
| [`trust-approval-audit/`](trust-approval-audit/README.zh.md) | 审批决策审计镜像 | 消费 `ctx.trustAudit` |
| [`trust-approval-grants/`](trust-approval-grants/README.zh.md) | 管理员范围持久审批 grant | 扩展 `ctx.approval` |
| [`trust-lease/`](trust-lease/README.zh.md) | 带 fencing token 的能力租约 | `ctx.trustLease` |
| [`trust-lease-runner/`](trust-lease-runner/README.zh.md) | 动态插件租约检查 | 消费 `ctx.trustLease` |
| [`trust-admission/`](trust-admission/README.zh.md) | 签名 composition 准入 | `ctx.trustAdmission` |
| [`trust-admission-boot/`](trust-admission-boot/README.zh.md) | app-boot 准入校验 | 消费 `ctx.trustAdmission` |

-----

<a id="related-documentation"></a>
## 相关文档

- [Trust identity 子系统](../../docs/subsystems/trust-identity.zh.md)——主体词汇与 Host ingress 契约。
- [Trust authorization 子系统](../../docs/subsystems/trust-authorization.zh.md)——RBAC 决策与 tool 守卫。
- [Trust log 子系统](../../docs/subsystems/trust-log.zh.md)——哈希链校验语义。
- [Trust audit 子系统](../../docs/subsystems/trust-audit.zh.md)——企业审计记录词汇。
- [Agent Note：trust core 反转](../../.agents/notes/implemented/architecture/2026-09-01-trust-core-inversion.zh.md)——设计 rationale 与 EmberX 映射。

-----

<a id="dev-note"></a>
## 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>
