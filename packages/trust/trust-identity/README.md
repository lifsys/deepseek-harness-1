---
description: "Service Definition for authenticated principal vocabulary and Host ingress contract."
kind: "package-reference"
---

# @deepseek-ai/dsh-trust-identity

English | [中文](README.zh.md)

## Summary

`dsh-trust-identity` binds an authenticated enterprise principal to Host RPC and audit records. Mount it when enterprise profiles need a fail-closed identity seam; anonymous preview profiles omit the service.

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

Load the service definition, then mount an identity provider such as `dsh-trust-identity-oidc`.

### When to choose it

Choose it for on-prem enterprise Host surfaces that must reject unauthenticated RPC. Omit it from default developer-preview profiles.

### Minimal configuration

```yaml
- name: '@deepseek-ai/dsh-trust-identity'
- name: '@deepseek-ai/dsh-trust-identity-oidc'
```

The generated [configuration catalog](../../../docs/config-catalog.md) lists provider fields when composed.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

`ctx.trustIdentity` exposes `authenticate`, `currentPrincipal`, and `requirePrincipal`. Source: [`src/index.ts`](src/index.ts).

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Trust identity subsystem](../../../docs/subsystems/trust-identity.md)
- [Package group map](../README.md)

-----

<a id="model-experience"></a>
## Model Experience

None, as this package does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **SAML adapters** — OIDC ships first through the sibling provider package.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
