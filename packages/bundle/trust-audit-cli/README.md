---
description: "Operator audit-export bundle that serializes trust audit records from the command line, for users exporting an on-prem audit trail."
kind: "package-bundle"
---

# @deepseek-ai/dsh-trust-audit-cli

English | [中文](README.zh.md)

## Summary

`dsh-trust-audit-cli` is the one-shot operator app behind `dsh --profile trust-audit export`. It rides over `dsh-base` with no Host, HTTP server, Web runtime, or browser plugin, mounts the file audit provider, calls `ctx.trustAudit.export`, writes the payload to stdout or a file, and exits.

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
dsh plugin --profile trust-audit add @deepseek-ai/dsh-trust-audit-cli
dsh plugin --profile trust-audit remove @deepseek-ai/dsh-trust-audit-cli
```

The `trust-audit` profile template already lists this bundle, so `dsh --profile trust-audit export` initializes it on first use.

### Export records

```text
dsh --profile trust-audit export                              print every record as JSONL
dsh --profile trust-audit export --type authz/denied          print denial records only
dsh --profile trust-audit export --since 1756800000000 --out audit.jsonl
```

`--sink` selects the destination the mounted provider serializes for (`file`, `jsonl`, or `otel`); `--since`, `--until`, `--type`, and `--user` narrow the record set; `--out` writes a file instead of stdout. An unknown sink or record type is a usage error and exports nothing.

The audit log this profile reads is the same append-only file `@deepseek-ai/dsh-trust-audit-file` writes under the enterprise profile, so an export never boots the enterprise Host surface.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

`src/startup.ts` parses the invocation with commander and publishes the request as the `trustAuditExport` service; the runner row reads it through lazy config and awaits Loader settlement before exporting. Source: [`cordis.patch.yml`](cordis.patch.yml), [`src/startup.ts`](src/startup.ts), [`src/index.ts`](src/index.ts).

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Trust audit subsystem](../../../docs/subsystems/trust-audit.md)
- [Enterprise bundle](../enterprise/README.md)
- [On-prem enterprise hardening](../../../docs/on-prem-enterprise-hardening.md)

-----

<a id="model-experience"></a>
## Model Experience

None, as this bundle runs no model turn and contributes no model-visible request context.

#### KV Cache effect

Independent of model request assembly.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Provider-owned sinks** — `--sink otel` succeeds only when an OTLP audit provider is mounted; the file provider rejects it.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
