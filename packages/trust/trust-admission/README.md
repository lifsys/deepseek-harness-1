---
description: "Signed composition admission for enterprise bundles."
kind: "package-reference"
---

# @deepseek-ai/dsh-trust-admission

English | [中文](README.zh.md)

## Summary

Signed composition admission for enterprise bundles. Mount it in an enterprise composition when Host surfaces need signed bundle admission. Default `web` and `headless` profiles omit this package.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Compose this package with `@deepseek-ai/dsh-enterprise` or an equivalent custom profile that mounts the trust-core family.

### When to choose it

Choose it when enterprise Host enforcement needs signed bundle admission. Omit it from developer-preview profiles that stay anonymous.

### Minimal configuration

```yaml
- name: '@deepseek-ai/dsh-trust-admission'
```

The generated [configuration catalog](../../../docs/config-catalog.md) lists every accepted field when the provider exposes config.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The package ctx.trustAdmission. Source lives under `src/`.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Package group map](../README.md)
- [Subsystem reference](../../../docs/subsystems/trust-audit.md)

-----

<a id="model-experience"></a>
## Model Experience

None, as this package does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Phase 1 scope** — Signature verification uses config digest validation only in Phase 1.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
