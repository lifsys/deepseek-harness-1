---
description: "Service Definition for authenticated principal vocabulary and Host ingress contract."
kind: "reference"
---

# @deepseek-ai/dsh-trust-identity

English

## Service API

`ctx.trustIdentity` owns authenticated principal vocabulary for enterprise Host surfaces.

- `authenticate(request)` — exchange ingress credentials.
- `currentPrincipal()` — read the active principal.
- `requirePrincipal()` — fail closed when unauthenticated.

## Model Experience

None, as this package does not contribute model-visible request context directly.

#### KV Cache effect

Independent of model request assembly.

## Known Limitations and Deferred Work

- **SAML adapters** — OIDC ships first through the sibling provider package.
