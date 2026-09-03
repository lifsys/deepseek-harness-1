# On-Prem Enterprise Deployment Hardening

[English](on-prem-enterprise-hardening.md) | 中文

面向在 `dsh-base` 之上 compose `@deepseek-ai/dsh-enterprise` 的单租户企业安装的指南。

## Profile

使用 `dsh --profile enterprise web`（或在自定义 profile 上堆叠 `@deepseek-ai/dsh-enterprise`）。默认 `web` 与 `headless` profile 保持不变。

## Identity（身份）

用企业 issuer 元数据配置 `@deepseek-ai/dsh-trust-identity-oidc`，或仅在受控 bootstrap 环境使用 static binding。在企业 ingress 终止 TLS；不要匿名暴露 Host RPC 端口。

## Authorization（授权）

在 `cordis.patch.yml` 中显式声明角色。通过 `denyTools` 与最小权限 permission 列表拒绝敏感工具。在审计日志中审查 RBAC 拒绝（`authz/denied` 记录）。

## Audit and log integrity（审计与日志完整性）

File 审计日志默认位于 `$DSH_HOME/trust-audit/audit.jsonl`。Trust log sidecar 位于 `$DSH_HOME/trust-log/`。维护窗口期间与 session persistence 存储一起备份两个目录。

用 `dsh --profile trust-audit export` 为 SIEM 导出记录：它只启动审计 provider，并把 JSONL 写到 stdout 或 `--out`。用 `--since`、`--until`、`--type` 与 `--user` 收窄导出；见 [dsh-trust-audit-cli](../packages/bundle/trust-audit-cli/README.zh.md)。

## Secrets（密钥）

企业补丁从 Vault 解析密钥并禁用 base 的 `credentials` 行，因此不会有任何内容来自 `$DSH_HOME/.credentials.yaml` 或项目 `.env`。启动前设置 `DSH_VAULT_ADDR` 与 `DSH_VAULT_MOUNT`；地址或 mount 未设置会拒绝加载。Vault token 来自 `DSH_VAULT_TOKEN_REF` 指定的环境变量，默认 `VAULT_TOKEN`。轮换在 Vault 内发生：provider 每次 resolve 都直读，并记录携带引用（绝不含值）的 `credential/accessed` 审计行。

## Network egress（网络出站）

Web fetch 与 OIDC discovery 需要向 operator 批准的 endpoint 出站 HTTPS。气隙安装应使用 static 身份 binding，并禁用需要外部网络访问的提供方。

## Legal hold（法律保全）

在 compaction 或 profile 删除前复制 audit 与 trust-log 目录。Session event 日志仍是 model replay 的权威来源；trust sidecar 证明完整性。
