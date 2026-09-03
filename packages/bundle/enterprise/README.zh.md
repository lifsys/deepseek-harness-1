---
description: "在 dsh-base 之上堆叠身份、RBAC、审计与日志完整性的企业 trust-core bundle，供组装或定制 profile 的用户阅读。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-enterprise

[English](README.md) | 中文

## 概述

`dsh-enterprise` 在 `dsh-base` 之上堆叠 trust-core 包，面向 on-prem 单租户部署：已认证 Host RPC、工具运行前 RBAC、防篡改会话 sidecar、可导出审计记录、能力租约，以及签名 composition 准入。默认 `web` 与 `headless` profile 省略该层；需要企业强制时添加。

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
dsh plugin --profile enterprise add @deepseek-ai/dsh-enterprise
dsh plugin --profile enterprise remove @deepseek-ai/dsh-enterprise
```

reconcile profile bundles 后运行 `dsh --profile enterprise web`。补丁在 `cordis.patch.yml` 中激活 trust 身份、RBAC、审计、日志完整性、租约与准入行。

### 你将获得

已认证 Host RPC ingress、审批前的 RBAC 拒绝、哈希链会话校验、仅追加审计导出，以及签名 bundle 准入检查。每个插入行由其包拥有强制语义；见 [packages/trust/](../../trust/README.zh.md)。

### 密钥

企业密钥从 Vault 解析：该补丁挂载 `@deepseek-ai/dsh-credentials-vault` 并禁用 base 的 `credentials` 行，因此不会有密钥来自 `$DSH_HOME/.credentials.yaml` 或项目 `.env`。启动前设置 `DSH_VAULT_ADDR` 与 `DSH_VAULT_MOUNT`——地址或 mount 未设置会拒绝加载，而不是回退到磁盘密钥——并把 Vault token 放入 `DSH_VAULT_TOKEN_REF` 指定的环境变量（默认 `VAULT_TOKEN`）。Vault provider 是只读的，因此 Web Models 页面的凭据写入会被拒绝。

### 准入

`trust-admission-boot` 默认关闭，因为准入摘要因站点而异。把本安装组合的 bundle manifest 记录到 `trust-admission` 与 `trust-admission-boot`，然后启用该行。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部 — 点击展开</summary>

该 bundle 是 patch-list 载体：`cordis.patch.yml` 在 `dsh-base` 之后插入 trust-core 插件行。源码：[`cordis.patch.yml`](cordis.patch.yml)、[`src/index.ts`](src/index.ts)。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [Trust 包组](../../trust/README.zh.md)
- [On-prem 企业加固](../../../docs/on-prem-enterprise-hardening.zh.md)
- [控制映射草案](../../../docs/compliance/CONTROL-MAP.zh.md)

-----

<a id="model-experience"></a>
## Model Experience（模型体验）

None, as this bundle does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## 已知限制与 Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Live OIDC** — static token 绑定用于测试；企业 IdP 集成由 operator 配置。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>
