# Agent Note: Trust-core 验收收据

Status: implemented

[English](2026-09-03-trust-core-accept-receipt.md) | 中文

## Problem

`feature/trust-core` 上的 trust-core 工作需要一份唯一的持久记录，逐条说明该分支交付了什么、哪条命令证明它，以及哪些残留项无法由仓库改动关闭。没有它，验收只能依赖散文声明而非可复现证据。

## Decision

本笔记就是该记录。每一行都写出产生其判定的命令；只有当该命令在本分支上以零退出时，该行才是 PASS。

### 计划成功标准

| 标准 | 判定 | 证据 |
|---|---|---|
| 管理员在企业 IdP 之后部署 `dsh --profile enterprise web`，且不存在匿名 Host 访问 | 强制部分 PASS，真实 IdP 为 BLOCKED-FOR-REAL-WORLD | `pnpm exec vitest run packages/bundle/enterprise`——不带 `Authorization` 头的 RPC 与携带未知 Bearer 凭据的 RPC 都返回 `unauthorized`；有效 Bearer 凭据绑定 principal 并给出应答。强制路径跑在 Loader 组合的树上，而不是手工搭建的 context。真实 OIDC JWKS 校验需要 operator 的 IdP 凭据。 |
| 每次敏感工具拒绝与审批都产生绑定 `UserId` 的可导出审计记录 | PASS | `pnpm exec vitest run packages/bundle/enterprise`——RBAC 通过组合的 `cordis.yml` 拒绝 `danger-full-access` 并记录 `authz/denied`。`pnpm exec vitest run packages/bundle/trust-audit-cli`——`dsh --profile trust-audit export` 序列化这些记录，并可用 `--type` 与 `--user` 收窄。 |
| 被篡改的会话文件在加载时失败关闭并可审计 | PASS | `pnpm exec vitest run packages/bundle/enterprise packages/trust/trust-log-jsonl`——被改动的哈希链同时拒绝 `verifySession` 与被包装的 `sessionPersistence.load`。 |
| 密钥从 Vault 解析且访问只按引用记录 | provider 与组合 PASS，真实 Vault 为 BLOCKED-FOR-REAL-WORLD | `pnpm exec vitest run packages/credentials/credentials-vault`——经注入 `fetch` 的 KV v2 读取、token 未设置与非成功状态下的失败关闭，以及只携带引用与 mount、绝不含值的 `credential/accessed` 记录。企业补丁现在按 `DSH_VAULT_ADDR` / `DSH_VAULT_MOUNT` / `DSH_VAULT_TOKEN_REF` 启用 Vault 行，并禁用 base 的 `credentials` 行。真实 Vault 需要 operator 凭据。 |
| 默认 `web` 与 `headless` profile 保持不变 | PASS | `packages/boot/app-boot/src/profile.ts`——`web` 与 `headless` 模板未被触及；企业配置项只经 `enterprise` 与 `trust-audit` 模板到达。 |

### 审计后续项

| 项 | 判定 | 证据 |
|---|---|---|
| 调用 `ctx.trustAudit.export` 的 `dsh trust audit export` | PASS，调用形式为 `dsh --profile trust-audit export` | `@deepseek-ai/dsh-trust-audit-cli` 交付该 bundle、命令行 provider 与 runner；八个 REAL-composition 用例覆盖每个 flag 与两类用法拒绝。启动器只拥有 profile 选择，因此该命令位于由 profile 启动的应用中（[application launch](../../../../docs/architecture.zh.md#application-launch)）。 |
| 企业密钥策略：不得让 `credentials-vault` 禁用而本地存储仍然在线 | PASS | `packages/bundle/enterprise/cordis.patch.yml`——Vault 行已启用并由 operator 配置；base 的 `credentials` 行已禁用。此前的补丁还重新启用了 `dsh-base` 并未声明的行 id（`credentials-local`），因此那次禁用根本没有指向对象。 |
| 租约门控可配置，而非编译进代码 | PASS | `pnpm exec vitest run packages/trust/trust-lease-runner`——`gatedTools` 与 `budgetMs` 是受校验的 config；未门控工具绕过门控，门控工具在被见证的租约下运行并释放它，无法见证的租约则拒绝。 |
| 准入不能静默放行 | PASS | `pnpm exec vitest run packages/trust/trust-admission-boot`——空的 `expected` 列表拒绝加载；摘要不匹配与未知 bundle 均被拒绝。企业补丁默认关闭该行，因为准入摘要因站点而异。 |
| 上游推送或 PR | FAIL——该 operator 只读 | `git push --dry-run upstream feature/trust-core` → `ERROR: Permission to deepseek-ai/deepseek-harness.git denied to lifsys.` `gh pr create --repo deepseek-ai/deepseek-harness --base master --head lifsys:feature/trust-core` → `GraphQL: lifsys does not have the correct permissions to execute CreatePullRequest`。没有任何上游 pull request 处于打开状态。 |

### Gate 结果

| 命令 | 结果 |
|---|---|
| `pnpm run typecheck` | PASS（exit 0） |
| `pnpm run lint` | PASS（exit 0） |
| `pnpm run test:docs` | PASS（exit 0） |
| `pnpm run verify-cordis-config` | PASS |
| `pnpm run verify-package-invariants` | PASS |
| `pnpm run verify-export-jsdoc` | PASS |
| `pnpm run verify-config-catalog` | PASS——trust 与 Vault 的配置声明现在渲染进 `docs/config-catalog.md`；生成器已认识 `RequestInit`/`Response` 这两个 fetch 全局类型 |
| `pnpm run verify-cordis-catalog` | PASS——六个 trust 服务各自归属子系统页面，且每页都带有生成的 `cordis-surface` 区域 |
| 覆盖 `packages/trust`、`packages/bundle/enterprise`、`packages/bundle/trust-audit-cli`、`packages/credentials/credentials-vault`、`packages/api/gateway` 的 `pnpm exec vitest run` | PASS（17 个文件，304 个用例） |
| `pnpm exec vitest run scripts/project-doc-site.spec.ts scripts/test-invariants.spec.ts scripts/verify-application-entrypoints.spec.ts` | PASS |

`pnpm run test:coverage` 是 CI 的逐文件覆盖率 gate，这里不预演；由 CI 拥有。

有八个会派生子进程或全仓扫描的 `scripts/` 套件（`publint-all`、`oxlint-contract`、`gen-third-party-notices`、`locale-dictionary-parity`、`session-fixture-layout`、`change-scope`、`client-build-environment`、`gen-client-catalog`）在本机上非确定性失败：每次运行失败的子集都不同，且失败形式是 5 秒 Vitest 超时与 `spawnSync` 返回 null 状态，而非断言不符。它们与本分支改动的内容无关。该信号由 CI 在自有硬件上负责。

### 发布

Forgejo（`origin` 与 `forgejo`，`ssh://git@repo.lifsys.one:2222/lifsys/deepseek-harness.git`）承载 `feature/trust-core`，提交为 `48efefaa4b`，上述每条判定都在该提交上测得；本次收据更新是紧随其后的提交。GitHub fork `lifsys/deepseek-harness-1` 承载同一分支与同一提交。供维护者开 pull request 的上游对比：<https://github.com/deepseek-ai/deepseek-harness/compare/master...lifsys:deepseek-harness-1:feature/trust-core>。

上游贡献的上报路径：分支已发布且可从 fork 评审，因此 `deepseek-ai/deepseek-harness` 的维护者，或任何在该仓库拥有 pull request 权限的账号，都可以从上面的对比链接开 pull request。本仓库内的任何改动都无法关闭这一步。

## Alternatives considered

- **以上游合并为由宣称 ACCEPT** — 拒绝：operator 的凭据无法推送到 `deepseek-ai/deepseek-harness`，无法核实的声明比记录下来的拒绝更糟。
- **在本收据中豁免 Vault 缺口而不是关闭它** — 拒绝：决定企业安装是否从磁盘解析密钥的是发布出去的组合，而不是一份笔记。
- **只记录聚合 gate 结果** — 拒绝：聚合结果掩盖了每条命令实际证明的是哪一条要求。

## Consequences

两项残留由 operator 凭据把关，无法在本仓库内关闭：面向企业 IdP 的真实 OIDC JWKS 校验，以及使用真实 operator 凭据的 Vault 读取。计划中的其余部分均已实现、已组合，并被上述命令覆盖。上游贡献需要具备写权限的维护者，或由获授权账号从 fork 打开 pull request。
