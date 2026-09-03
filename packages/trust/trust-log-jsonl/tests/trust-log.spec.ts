import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import SessionStore from '@deepseek-ai/dsh-session'
import { TrustLogTamperedError } from '@deepseek-ai/dsh-trust-log'
import type {} from '@deepseek-ai/dsh-trust-log'
import JsonlTrustLogProvider from '../src/index.ts'

async function boot(root: string): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(JsonlTrustLogProvider, { root })
  return ctx
}

describe('trust log jsonl', () => {
  it('refuses tampered hash chains on verify', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-trust-log-'))
    try {
      const ctx = await boot(root)
      const session = ctx.sessions.create()
      session.append('turn/start', { turn: 1 })
      await ctx.trustLog.extendChain(session.id, [...session.events])
      const chainPath = join(root, `${session.id}.chain.jsonl`)
      const text = await readFile(chainPath, 'utf8')
      await writeFile(chainPath, text.replace(/[0-9a-f]{64}/, '0'.repeat(64)), 'utf8')
      await expect(ctx.trustLog.verifySession(session.id)).rejects.toBeInstanceOf(TrustLogTamperedError)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
