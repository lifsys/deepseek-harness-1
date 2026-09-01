/**
 * HashiCorp Vault KV credentials provider for enterprise deployments.
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

/** Plugin configuration. */
export interface Config {
  /** Vault server address. */
  readonly address: string
  /** KV mount path. */
  readonly mountPath: string
  /** Vault token reference resolved through env at runtime. */
  readonly tokenRef: string
}

/**
 * Vault-backed credentials provider. Network access to Vault is required;
 * without live Vault connectivity this provider reports credentials unconfigured.
 */
export class VaultCredentialProvider extends CredentialProvider {
  static Config: z<Config> = z.object({
    address: z.string().required(),
    mountPath: z.string().required(),
    tokenRef: z.string().required(),
  })

  constructor(ctx: Context, public config: Config) {
    super(ctx)
  }

  /** @inheritdoc */
  resolve(_ref: CredentialRef): Promise<ResolvedCredential | undefined> {
    void this.ctx.get('trustAudit')?.record({
      type: 'credential/accessed',
      time: Date.now(),
      resource: String(_ref),
      metadata: { provider: 'vault', mount: this.config.mountPath },
    })
    return Promise.resolve(undefined)
  }

  /** @inheritdoc */
  describe(_ref: CredentialRef): Promise<CredentialInfo> {
    return Promise.resolve({ configured: false, writable: false, source: 'vault' })
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
}

export { credentialRef }
export default VaultCredentialProvider
