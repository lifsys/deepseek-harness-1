---
description: "已认证主体词汇与 Host ingress 契约的 Service Definition。"
kind: "package-reference"
---

# @deepseek-ai/dsh-trust-identity

[English](README.md) | 中文

## 概述

`dsh-trust-identity` 将已认证企业主体绑定到 Host RPC 与审计记录。当企业 profile 需要 fail-closed 身份 seam 时挂载；匿名预览 profile 省略该服务。

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

加载 Service Definition，然后挂载身份提供方，例如 `dsh-trust-identity-oidc`。

### 何时选用

on-prem 企业 Host 面必须拒绝未认证 RPC 时选用。默认开发者预览 profile 应省略。

### 最小配置

```yaml
- name: '@deepseek-ai/dsh-trust-identity'
- name: '@deepseek-ai/dsh-trust-identity-oidc'
```

组合后，生成的[配置目录](../../../docs/config-catalog.zh.md)列出提供方字段。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部 — 点击展开</summary>

`ctx.trustIdentity` 暴露 `authenticate`、`currentPrincipal` 与 `requirePrincipal`。源码：[`src/index.ts`](src/index.ts)。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [Trust identity 子系统](../../../docs/subsystems/trust-identity.zh.md)
- [包组地图](../README.zh.md)

-----

<a id="model-experience"></a>
## Model Experience（模型体验）

None, as this package does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## 已知限制与 Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **SAML 适配器** — OIDC 通过同级提供方包先行交付。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>
