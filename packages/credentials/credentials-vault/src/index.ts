/**
 * HashiCorp Vault KV credentials provider for enterprise deployments.
 * Performs real HTTP KV reads against a configured Vault address. Without a
 * reachable Vault, resolution fails closed (returns unconfigured / rejects).
 * Live Vault operator credentials are required for production; tests inject
 * {@link Config.fetch}.
 * @module @deepseek-ai/dsh-credentials-vault
 */

import { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import {
  CredentialProvider,
  credentialRef,
  type CredentialInfo,
  type CredentialKey,
  type CredentialRecord,
  type CredentialRecordEntry,
  type CredentialRecordInfo,
  type CredentialRef,
  type ResolvedCredential,
} from '@deepseek-ai/dsh-credentials'
import type {} from '@deepseek-ai/dsh-trust-audit'
import type {} from '@deepseek-ai/dsh-trust-identity'

/** Fetch-compatible HTTP client used by the Vault provider. */
export type VaultFetch = (input: string, init?: RequestInit) => Promise<Response>

/** Plugin configuration. */
export interface Config {
  /** Vault server address, for example `https://vault.example.com`. */
  readonly address: string
  /** KV v2 mount path prefix before `/data/<secret path>`. */
  readonly mountPath: string
  /** Environment variable name holding the Vault token. */
  readonly tokenRef: string
  /**
   * Optional HTTP client override for tests. Production uses global `fetch`.
   * Not accepted from cordis.yml — only programmatic plugin config.
   */
  readonly fetch?: VaultFetch
  /** Request timeout in milliseconds. @default 5000 */
  readonly timeoutMs?: number
}

interface ResolvedSpec {
  readonly address: string
  readonly mountPath: string
  readonly tokenRef: string
  readonly fetch: VaultFetch
  readonly timeoutMs: number
}

/**
 * Resolve runtime parameters. Defaulting happens here, never inside {@link resolve}.
 * @param config - validated plugin config.
 * @returns frozen runtime spec.
 */
export function resolveSpec(config: Config): ResolvedSpec {
  const address = config.address.replace(/\/+$/u, '')
  const mountPath = config.mountPath.replace(/^\/+|\/+$/gu, '')
  if (address.length === 0) throw new Error('credentials-vault: address must be non-empty')
  if (mountPath.length === 0) throw new Error('credentials-vault: mountPath must be non-empty')
  if (config.tokenRef.length === 0) throw new Error('credentials-vault: tokenRef must be non-empty')
  return {
    address,
    mountPath,
    tokenRef: config.tokenRef,
    fetch: config.fetch ?? globalThis.fetch.bind(globalThis),
    timeoutMs: config.timeoutMs ?? 5_000,
  }
}

/** Fail-closed error when Vault is unreachable or returns a non-success status. */
export class VaultCredentialUnavailableError extends Error {
  /** Stable machine-readable failure category. */
  readonly code = 'vault-unavailable' as const

  /** @param reason - correction-oriented diagnostic without secret values. */
  constructor(reason: string) {
    super(`credentials-vault: ${reason}`)
    this.name = 'VaultCredentialUnavailableError'
  }
}

/**
 * Vault-backed credentials provider. Network access to Vault is required;
 * unreachable Vault fails closed rather than falling back to local secrets.
 */
export class VaultCredentialProvider extends CredentialProvider {
  static Config: z<Config> = z.object({
    address: z.string().required(),
    mountPath: z.string().required(),
    tokenRef: z.string().required(),
    timeoutMs: z.number().step(1).min(1).max(120_000).default(5_000),
  })

  private readonly spec: ResolvedSpec

  constructor(ctx: Context, public config: Config) {
    super(ctx)
    this.spec = resolveSpec(config)
  }

  /** @inheritdoc */
  async resolve(ref: CredentialRef): Promise<ResolvedCredential | undefined> {
    await this.auditAccess(ref)
    return this.fetchSecret(ref)
  }

  /** @inheritdoc */
  async describe(ref: CredentialRef): Promise<CredentialInfo> {
    try {
      const resolved = await this.fetchSecret(ref)
      return {
        configured: resolved !== undefined,
        writable: false,
        ...(resolved !== undefined ? { source: 'vault' } : {}),
      }
    } catch (error: unknown) {
      if (error instanceof VaultCredentialUnavailableError) {
        return { configured: false, writable: false, source: 'vault' }
      }
      throw error
    }
  }

  private async fetchSecret(ref: CredentialRef): Promise<ResolvedCredential | undefined> {
    const token = process.env[this.spec.tokenRef]
    if (token === undefined || token.length === 0) {
      throw new VaultCredentialUnavailableError(`token env ${this.spec.tokenRef} is unset`)
    }
    const url = `${this.spec.address}/v1/${this.spec.mountPath}/data/${encodeURIComponent(String(ref))}`
    let response: Response
    try {
      response = await this.spec.fetch(url, {
        method: 'GET',
        headers: {
          'X-Vault-Token': token,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(this.spec.timeoutMs),
      })
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error)
      throw new VaultCredentialUnavailableError(`request failed: ${reason}`)
    }
    if (response.status === 404) return undefined
    if (!response.ok) {
      throw new VaultCredentialUnavailableError(`HTTP ${response.status} from Vault`)
    }
    const body = await response.json() as {
      data?: { data?: Record<string, unknown> }
    }
    const value = body.data?.data?.value
    if (typeof value !== 'string' || value.length === 0) return undefined
    return { value, source: 'vault' }
  }

  /** @inheritdoc */
  set(_ref: CredentialRef, _value: string): Promise<void> {
    return Promise.reject(new Error('vault provider does not support reference writes'))
  }

  /** @inheritdoc */
  unset(_ref: CredentialRef): Promise<void> {
    return Promise.resolve()
  }

  /** @inheritdoc */
  readRecord(_key: CredentialKey): Promise<CredentialRecord | undefined> {
    return Promise.resolve(undefined)
  }

  /** @inheritdoc */
  describeRecord(_key: CredentialKey): Promise<CredentialRecordInfo> {
    return Promise.resolve({ configured: false, writable: false })
  }

  /** @inheritdoc */
  listRecords(): Promise<readonly CredentialRecordEntry[]> {
    return Promise.resolve([])
  }

  /** @inheritdoc */
  modifyRecord(
    _key: CredentialKey,
    _mutate: (current: CredentialRecord | undefined) => Promise<CredentialRecord | undefined>,
  ): Promise<CredentialRecord | undefined> {
    return Promise.resolve(undefined)
  }

  /** @inheritdoc */
  deleteRecord(_key: CredentialKey): Promise<void> {
    return Promise.resolve()
  }

  private async auditAccess(ref: CredentialRef): Promise<void> {
    const audit = this.ctx.get('trustAudit')
    if (audit === undefined) return
    const identity = this.ctx.get('trustIdentity')
    const principal = identity?.currentPrincipal()
    await audit.record({
      type: 'credential/accessed',
      time: Date.now(),
      ...(principal !== undefined ? { userId: principal.userId } : {}),
      resource: String(ref),
      metadata: { provider: 'vault', mount: this.spec.mountPath },
    })
  }
}

export { credentialRef }
export default VaultCredentialProvider
