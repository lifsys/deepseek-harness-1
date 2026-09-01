---
description: "Enterprise trust-core bundle layering identity, RBAC, audit, and log integrity over dsh-base."
kind: "bundle"
---

# @deepseek-ai/dsh-enterprise

English

## Summary

Opt-in enterprise bundle stacking trust-core packages over `dsh-base`. Default `web` and `headless` profiles do not include this layer.

## Profile

`dsh --profile enterprise web` composes `dsh-base`, `dsh-web-app`, and this bundle.

## Model Experience

None, as this bundle does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## Known Limitations and Deferred Work

- **Live OIDC** — static token bindings ship for tests; corporate IdP integration is operator-configured.
