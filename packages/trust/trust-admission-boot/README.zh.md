---
description: "Validate composition at app-boot load。"
kind: "package-reference"
---

# @deepseek-ai/dsh-trust-admission-boot

[English](README.md) | 中文

## 概述

Validate composition at app-boot load。当 Host 面需要app-boot admission hook时，在企业 composition 中挂载它。默认 `web` 与 `headless` profile 不包含此包。

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

当企业 Host 强制需要app-boot admission hook时选用。匿名开发者预览 profile 应省略。

### 最小配置

```yaml
- name: '@deepseek-ai/dsh-trust-admission-boot'
  config:
    expected:
      - id: dsh-enterprise
        digest: <sha256 of the admitted bundle manifest>
```

`expected` 列出本安装组合的 bundle 行。以空列表挂载该行会拒绝加载，因为不期望任何内容的准入检查等于准入一切组合。

当提供方暴露 config 时，生成的[配置目录](../../../docs/config-catalog.zh.md)列出全部字段。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部 — 点击展开</summary>

该包consumes ctx.trustAdmission。源码位于 `src/`。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [包组地图](../README.zh.md)
- [子系统参考](../../../docs/subsystems/trust-audit.zh.md)

-----

<a id="model-experience"></a>
## Model Experience（模型体验）

None, as this package does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## 已知限制与 Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Phase 1 范围** — Fails closed when admission service is composed without a policy.

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>
