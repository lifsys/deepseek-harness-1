import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import type { TrustAuditRecord } from '@deepseek-ai/dsh-trust-audit'
import { TrustAuditProvider } from '@deepseek-ai/dsh-trust-audit'
import VaultCredentialProvider, {
  VaultCredentialUnavailableError,
  resolveSpec,
} from '../src/index.ts'

class MemoryAudit extends TrustAuditProvider {
  readonly records: TrustAuditRecord[] = []

  record(record: TrustAuditRecord): Promise<void> {
    this.records.push(record)
    return Promise.resolve()
  }

  export(): Promise<string> {
    return Promise.resolve('')
  }

  subscribe(): () => void {
    return () => {}
  }
}

const previousToken = process.env.VAULT_TOKEN

afterEach(() => {
  if (previousToken === undefined) delete process.env.VAULT_TOKEN
  else process.env.VAULT_TOKEN = previousToken
})

describe('credentials-vault', () => {
  it('resolveSpec rejects empty address and mountPath', () => {
    expect(() => resolveSpec({
      address: '',
      mountPath: 'secret/data/dsh',
      tokenRef: 'VAULT_TOKEN',
    })).toThrow(/address/)
    expect(() => resolveSpec({
      address: 'https://vault.example.com',
      mountPath: '',
      tokenRef: 'VAULT_TOKEN',
    })).toThrow(/mountPath/)
  })

  it('fails closed when Vault token env is unset', async () => {
    delete process.env.VAULT_TOKEN
    const ctx = new Context()
    await ctx.plugin(VaultCredentialProvider, {
      address: 'https://vault.example.com',
      mountPath: 'secret/data/dsh',
      tokenRef: 'VAULT_TOKEN',
      fetch: async () => new Response('{}'),
    })
    await expect(ctx.credentials.resolve(credentialRef('DEEPSEEK_API_KEY')))
      .rejects.toBeInstanceOf(VaultCredentialUnavailableError)
  })

  it('reads KV v2 secrets over mocked HTTP and audits credential/accessed', async () => {
    process.env.VAULT_TOKEN = 'test-token'
    const ctx = new Context()
    await ctx.plugin(MemoryAudit)
    const calls: Array<{ url: string; token: string | null }> = []
    await ctx.plugin(VaultCredentialProvider, {
      address: 'https://vault.example.com/',
      mountPath: 'secret/data/dsh',
      tokenRef: 'VAULT_TOKEN',
      fetch: async (url, init) => {
        calls.push({
          url,
          token: new Headers(init?.headers).get('X-Vault-Token'),
        })
        return new Response(JSON.stringify({
          data: { data: { value: 'secret-value' } },
        }), { status: 200 })
      },
    })
    const resolved = await ctx.credentials.resolve(credentialRef('DEEPSEEK_API_KEY'))
    expect(resolved).toEqual({ value: 'secret-value', source: 'vault' })
    expect(calls).toEqual([{
      url: 'https://vault.example.com/v1/secret/data/dsh/data/DEEPSEEK_API_KEY',
      token: 'test-token',
    }])
    expect(ctx.get('trustAudit')).toBeDefined()
    const audit = ctx.get('trustAudit') as MemoryAudit
    expect(audit.records).toEqual([expect.objectContaining({
      type: 'credential/accessed',
      resource: 'DEEPSEEK_API_KEY',
      metadata: { provider: 'vault', mount: 'secret/data/dsh' },
    })])
  })

  it('fails closed on non-success Vault HTTP status', async () => {
    process.env.VAULT_TOKEN = 'test-token'
    const ctx = new Context()
    await ctx.plugin(VaultCredentialProvider, {
      address: 'https://vault.example.com',
      mountPath: 'secret/data/dsh',
      tokenRef: 'VAULT_TOKEN',
      fetch: async () => new Response('nope', { status: 503 }),
    })
    await expect(ctx.credentials.resolve(credentialRef('DEEPSEEK_API_KEY')))
      .rejects.toBeInstanceOf(VaultCredentialUnavailableError)
  })
})
