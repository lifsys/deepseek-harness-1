---
description: "HashiCorp Vault KV credentials provider for enterprise deployments."
kind: "package-reference"
---

# @deepseek-ai/dsh-credentials-vault

English | [中文](README.zh.md)

## Summary

HashiCorp Vault KV credentials provider for enterprise deployments. Mount it in an enterprise composition when Host surfaces need Vault KV backend. Default `web` and `headless` profiles omit this package.

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

Choose it when enterprise Host enforcement needs Vault KV backend. Omit it from developer-preview profiles that stay anonymous.

### Minimal configuration

```yaml
- name: '@deepseek-ai/dsh-credentials-vault'
```

The generated [configuration catalog](../../../docs/config-catalog.md) lists every accepted field when the provider exposes config.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The package registers on ctx.credentials. Source lives under `src/`.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Package group map](../../trust/README.md)
- [Subsystem reference](../../../docs/subsystems/credentials.md)

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through consumers of ctx.credentials, which resolve each credential reference and own every model-facing use a value authorizes.

#### KV Cache effect

No direct invalidation; resolved values never enter a request prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Phase 1 scope** — Live Vault integration is BLOCKED-FOR-REAL-WORLD; scaffold only.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
