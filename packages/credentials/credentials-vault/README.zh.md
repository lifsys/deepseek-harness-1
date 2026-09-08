---
description: "HashiCorp Vault KV credentials provider for enterprise deployments。"
kind: "package-reference"
---

# @deepseek-ai/dsh-credentials-vault

[English](README.md) | 中文

## 概述

HashiCorp Vault KV credentials provider for enterprise deployments。当 Host 面需要Vault KV backend时，在企业 composition 中挂载它。默认 `web` 与 `headless` profile 不包含此包。

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

与 `@deepseek-ai/dsh-enterprise` 或等价的自定义 profile 一起 compose，该 profile 需挂载 trust-core 系列。

### 何时选用

当企业 Host 强制需要Vault KV backend时选用。匿名开发者预览 profile 应省略。

### 最小配置

```yaml
- name: '@deepseek-ai/dsh-credentials-vault'
```

当提供方暴露 config 时，生成的[配置目录](../../../docs/config-catalog.zh.md)列出全部字段。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部 — 点击展开</summary>

该包registers on ctx.credentials。源码位于 `src/`。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [包组地图](../../trust/README.zh.md)
- [子系统参考](../../../docs/subsystems/credentials.zh.md)

-----

<a id="model-experience"></a>
## Model Experience（模型体验）

Indirectly, through consumers of ctx.credentials, which resolve each credential reference and own every model-facing use a value authorizes.

#### KV Cache effect

No direct invalidation; resolved values never enter a request prefix.

## 已知限制与 Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **BLOCKED-FOR-REAL-WORLD — 真实 Vault** — CI 不覆盖生产 HashiCorp Vault（或 Azure Key Vault）连通性、AppRole/Kubernetes 认证与运维签发的 token。该 provider 会发起真实 HTTP KV v2 读取，并在 Vault 不可达或 `tokenRef` 未设置时 fail-closed；在企业补丁中启用 vault 行后，用 `VAULT_TOKEN=… dsh --profile enterprise …` 对真实 Vault 取证。
- **写入路径** — 仍不支持 Vault reference/record 写入；请在 Vault 侧轮换密钥。
- **本地凭证仍启用** — 在证明 Vault 可用之前，企业补丁仍保持 `credentials-local` 启用。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>
