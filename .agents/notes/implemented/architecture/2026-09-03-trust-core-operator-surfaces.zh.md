# Agent Note: Trust-core operator 表面与企业密钥策略

Status: implemented

[English](2026-09-03-trust-core-operator-surfaces.md) | 中文

## Problem

三项 trust-core 交付物已挂载，但 operator 无法使用。`ctx.trustAudit.export` 没有调用方，因此可导出审计流只作为一个服务方法存在。企业补丁把 Vault 以占位地址禁用发布，同时重新启用了 `dsh-base` 并未声明的行 id（`credentials-local`），于是企业安装静默保留了可写的磁盘凭据存储。`trust-lease-runner` 门控的工具名被编进插件，`trust-admission-boot` 在期望为空时提前返回，因此准入行可以挂载并在不作声的情况下准入一切组合。

## Decision

- 发布 `@deepseek-ai/dsh-trust-audit-cli`：一个位于 `dsh-base` 之上的 bundle 加一次性应用，通过 `trust-audit` profile 模板触达：`dsh --profile trust-audit export [--sink|--since|--until|--type|--user|--out]`。启动器只拥有 profile 选择，因此该命令位于一个通过 `parseCmdline` 解析自身 flag 家族的应用中，与 `dsh-headless` 完全一致。该 bundle 只挂载文件审计 provider，因此导出永远不会启动企业 Host 表面。
- 让 Vault 成为企业凭据来源：补丁按 `DSH_VAULT_ADDR` / `DSH_VAULT_MOUNT` / `DSH_VAULT_TOKEN_REF` 启用 `credentials-vault`，并禁用 base 的 `credentials` 行。地址或 mount 缺失会在加载时校验失败，而不是从磁盘解析密钥。
- 把租约门控工具列表与租约预算移入受校验的 `Config`，并在门控执行结束后撤销租约。
- 在 `trust-admission-boot` 中拒绝空的 `expected` 列表，并在企业补丁中默认关闭该行，因为准入摘要因站点而异。
- 通过 `ctx.effect` 在释放时还原 `sessionPersistence.load`，并把文件审计 provider 的订阅集合限定到实例。

## Alternatives considered

- **`dsh trust audit export` 启动器子命令** — 拒绝：[application launch](../../../../docs/architecture.zh.md#application-launch) 把 Node 应用启动保留给 `dsh` profile，而一个启动 Cordis 树的启动器子命令就是第二个启动器。
- **复用 `enterprise` profile 做导出** — 拒绝：该 profile 启动 Web 应用，后者拥有命令行，审计导出因此需要一个运行中的 Host。
- **保留 Vault 禁用并在收据中豁免** — 拒绝：发布的默认值决定了安全姿态。一个在 Vault 地址未设置时失败关闭的 profile，把姿态写进组合而不是散文。
- **在 bundle 内计算准入摘要** — 拒绝：自己给自己签名的 bundle 什么也证明不了；摘要属于准入它的那次安装。

## Consequences

默认 `web` 与 `headless` profile 保持不变。企业 profile 在没有 Vault 配置时不再启动，只读的 Vault provider 会拒绝 Web Models 页面的凭据写入。真实 Vault operator 凭据与真实 IdP JWKS 校验仍为 BLOCKED-FOR-REAL-WORLD；验收证据记录在[trust-core ACCEPT 收据](2026-09-03-trust-core-accept-receipt.zh.md)中。
