# Trust Audit

[English](trust-audit.md) | 中文

[dsh-trust-audit](../../packages/trust/trust-audit) 的 trust-audit seam 在会话日志旁记录企业审计事实。记录永不 model-visible。

源码：[`packages/trust/trust-audit/src/index.ts`](../../packages/trust/trust-audit/src/index.ts)

## Record types（记录类型）

闭合词汇包括 `auth/login`、`auth/logout`、`authz/denied`、`approval/decided`、`admin/policy-changed`、`credential/accessed` 与 `export/session`。

## Export（导出）

`export(sink, filter)` 将匹配记录写入 file 或 OTLP sink。operator 通过接入 `ctx.trustAudit` 的企业 tooling 运行导出。

## Model Experience（模型体验）

None, as this package does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## 已知限制与 Deferred Work

- **CEF formatting** — JSONL 与 OTLP sink 先行交付；CEF 导出仍在计划中。
