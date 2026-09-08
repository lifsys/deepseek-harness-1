---
description: "在命令行序列化 trust 审计记录的 operator 审计导出 bundle，供导出 on-prem 审计轨迹的用户阅读。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-trust-audit-cli

[English](README.md) | 中文

## 概述

`dsh-trust-audit-cli` 是 `dsh --profile trust-audit export` 背后的一次性 operator 应用。它在 `dsh-base` 之上运行，不挂载 Host、HTTP server、Web runtime 或浏览器插件；它挂载文件审计 provider，调用 `ctx.trustAudit.export`，把载荷写到 stdout 或文件，然后退出。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [延伸阅读](#further-exploration)
- [Model Experience（模型体验）](#model-experience)
- [已知限制与 deferred work](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

### 安装到 profile

```text
dsh plugin --profile trust-audit add @deepseek-ai/dsh-trust-audit-cli
dsh plugin --profile trust-audit remove @deepseek-ai/dsh-trust-audit-cli
```

`trust-audit` profile 模板已列出该 bundle，因此 `dsh --profile trust-audit export` 会在首次使用时初始化它。

### 导出记录

```text
dsh --profile trust-audit export                              print every record as JSONL
dsh --profile trust-audit export --type authz/denied          print denial records only
dsh --profile trust-audit export --since 1756800000000 --out audit.jsonl
```

`--sink` 选择已挂载 provider 序列化的目标（`file`、`jsonl` 或 `otel`）；`--since`、`--until`、`--type` 与 `--user` 收窄记录集合；`--out` 写文件而非 stdout。未知 sink 或记录类型是用法错误，不导出任何内容。

该 profile 读取的审计日志，与企业 profile 下 `@deepseek-ai/dsh-trust-audit-file` 写入的仅追加文件相同，因此导出不会启动企业 Host 表面。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部 — 点击展开</summary>

`src/startup.ts` 用 commander 解析调用并把请求发布为 `trustAuditExport` 服务；runner 行通过惰性 config 读取它，并在导出前等待 Loader settlement。源码：[`cordis.patch.yml`](cordis.patch.yml)、[`src/startup.ts`](src/startup.ts)、[`src/index.ts`](src/index.ts)。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [Trust 审计子系统](../../../docs/subsystems/trust-audit.zh.md)
- [企业 bundle](../enterprise/README.zh.md)
- [On-prem 企业加固](../../../docs/on-prem-enterprise-hardening.zh.md)

-----

<a id="model-experience"></a>
## Model Experience（模型体验）

None, as this bundle runs no model turn and contributes no model-visible request context.

#### KV Cache effect

Independent of model request assembly.

## 已知限制与 Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Provider 拥有的 sink** — 只有挂载了 OTLP 审计 provider 时 `--sink otel` 才成功；文件 provider 拒绝它。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>
