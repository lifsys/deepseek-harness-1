---
description: "OIDC and static-token identity provider for enterprise Host surfaces。"
kind: "package-reference"
---

# @deepseek-ai/dsh-trust-identity-oidc

[English](README.md) | 中文

## 概述

OIDC and static-token identity provider for enterprise Host surfaces。当 Host 面需要OIDC or static-token bindings时，在企业 composition 中挂载它。默认 `web` 与 `headless` profile 不包含此包。

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

当企业 Host 强制需要OIDC or static-token bindings时选用。匿名开发者预览 profile 应省略。

### 最小配置

```yaml
- name: '@deepseek-ai/dsh-trust-identity-oidc'
```

当提供方暴露 config 时，生成的[配置目录](../../../docs/config-catalog.zh.md)列出全部字段。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部 — 点击展开</summary>

该包registers ctx.trustIdentity。源码位于 `src/`。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [包组地图](../README.zh.md)
- [子系统参考](../../../docs/subsystems/trust-identity.zh.md)

-----

<a id="model-experience"></a>
## Model Experience（模型体验）

None, as this package does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## 已知限制与 Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **BLOCKED-FOR-REAL-WORLD — 真实 IdP** — CI 不覆盖授权码登录、JWKS 签名校验、token 刷新，以及对 Okta/Entra/Keycloak 的 SAML。静态 token 模式与未签名 JWT claim 解析（issuer/audience/`sub`）供测试与气隙引导使用；在接入 JWKS 校验并对照真实 issuer 取证之前，不要把 claim 解析当作生产 IdP 校验。
- **匿名预览** — 默认 `web`/`headless` profile 省略本 provider；Host RPC 仅保留浏览器会话 cookie。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>
