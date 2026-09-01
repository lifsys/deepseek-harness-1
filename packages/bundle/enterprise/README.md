---
description: "Enterprise trust-core bundle layering identity, RBAC, audit, and log integrity over dsh-base, for users composing or customizing a profile."
kind: "package-bundle"
---

# @deepseek-ai/dsh-enterprise

English | [中文](README.zh.md)

## Summary

`dsh-enterprise` stacks the trust-core packages over `dsh-base` for on-prem single-tenant deployments: authenticated Host RPC, RBAC before tools run, tamper-evident session sidecars, exportable audit records, capability leases, and signed composition admission. Default `web` and `headless` profiles omit this layer; add it when enterprise enforcement is required.

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

### Install into a profile

```text
dsh plugin --profile enterprise add @deepseek-ai/dsh-enterprise
dsh plugin --profile enterprise remove @deepseek-ai/dsh-enterprise
```

Run `dsh --profile enterprise web` after reconciling the profile bundles. The patch activates trust identity, RBAC, audit, log integrity, leases, and admission rows declared in `cordis.patch.yml`.

### What you get

Authenticated Host RPC ingress, RBAC denial before approval, hash-chain session verification, append-only audit export, and signed bundle admission checks. Each inserted row's package owns its enforcement semantics; see [packages/trust/](../../trust/README.md).

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The bundle is a patch-list carrier: `cordis.patch.yml` inserts trust-core plugin rows after `dsh-base`. Source: [`cordis.patch.yml`](cordis.patch.yml), [`src/index.ts`](src/index.ts).

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Trust package group](../../trust/README.md)
- [On-prem enterprise hardening](../../../docs/on-prem-enterprise-hardening.md)
- [Control map draft](../../../docs/compliance/CONTROL-MAP.md)

-----

<a id="model-experience"></a>
## Model Experience

None, as this bundle does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Live OIDC** — static token bindings ship for tests; corporate IdP integration is operator-configured.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
