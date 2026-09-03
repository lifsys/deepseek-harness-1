/**
 * JSONL sidecar hash-chain provider for session persistence.
 * @module @deepseek-ai/dsh-trust-log-jsonl
 */

import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { snapshotSessionEvent } from '@deepseek-ai/dsh-session'
import type { SessionEvent, SessionId } from '@deepseek-ai/dsh-session'
import type { SessionInspection, SessionPersistence } from '@deepseek-ai/dsh-session-persistence'
import {
  TrustLogProvider,
  TrustLogTamperedError,
  type TrustLogLink,
  type VerifiedSessionExport,
} from '@deepseek-ai/dsh-trust-log'

/** Plugin configuration. */
export interface Config {
  /** Directory storing `<sessionId>.chain.jsonl` sidecars. */
  readonly root: string
}

/** One persisted sidecar line. */
interface ChainRecord {
  seq: number
  digest: string
  payloadDigest: string
}

/**
 * Hash-chain {@link TrustLogProvider} with JSONL sidecar files.
 * Wraps `sessionPersistence.load` to refuse tampered chains fail-closed.
 */
export class JsonlTrustLogProvider extends TrustLogProvider {
  static inject = ['sessions'] as const

  static Config: z<Config> = z.object({
    root: z.string().required(),
  })

  constructor(ctx: Context, public config: Config) {
    super(ctx)
    ctx.on('session/event', (session, event) => {
      void this.extendChain(session.id, [event]).catch((error: unknown) => {
        ctx.logger.warn('trust-log-jsonl: failed to extend chain for session %s', session.id)
        ctx.logger.warn(error)
      })
    }, { global: true })
    ctx.inject(['sessionPersistence'], (scoped) => {
      wrapPersistenceLoad(scoped.sessionPersistence, (id, events) => this.verifyEvents(id, events))
    })
  }

  /** @inheritdoc */
  async verifySession(sessionId: SessionId): Promise<void> {
    const session = this.ctx.sessions.get(sessionId)
    if (session === undefined) throw new TrustLogTamperedError(sessionId, `session ${sessionId} is not loaded`)
    await this.verifyEvents(sessionId, session.events)
  }

  /**
   * Verify one event sequence against the persisted hash chain.
   * @param sessionId - session identity for the sidecar path.
   * @param events - canonical event sequence to check.
   * @throws {@link TrustLogTamperedError} when digests do not match.
   */
  async verifyEvents(sessionId: SessionId, events: readonly SessionEvent[]): Promise<void> {
    const links = await this.readChain(sessionId)
    if (links.length === 0 && events.length === 0) return
    if (links.length === 0 && events.length > 0) {
      throw new TrustLogTamperedError(sessionId, `missing trust chain for session ${sessionId}`)
    }
    let prev = ''
    for (const [index, event] of events.entries()) {
      const seq = index + 1
      const link = links.find(entry => entry.seq === seq)
      const payloadDigest = digestPayload(event)
      const expected = chainDigest(prev, payloadDigest)
      if (link === undefined || link.digest !== expected || link.payloadDigest !== payloadDigest) {
        throw new TrustLogTamperedError(sessionId, `tampered trust chain at seq ${seq} for session ${sessionId}`)
      }
      prev = expected
    }
    if (links.length > events.length) {
      throw new TrustLogTamperedError(sessionId, `trust chain has extra links for session ${sessionId}`)
    }
  }

  /** @inheritdoc */
  async extendChain(sessionId: SessionId, events: readonly SessionEvent[]): Promise<void> {
    if (events.length === 0) return
    await mkdir(this.config.root, { recursive: true })
    const existing = await this.readChain(sessionId)
    let prev = existing.at(-1)?.digest ?? ''
    const lines: string[] = []
    let seq = existing.length
    for (const event of events) {
      seq += 1
      const payloadDigest = digestPayload(event)
      const digest = chainDigest(prev, payloadDigest)
      lines.push(`${JSON.stringify({ seq, digest, payloadDigest } satisfies ChainRecord)}\n`)
      prev = digest
    }
    const path = chainPath(this.config.root, sessionId)
    await writeFile(path, lines.join(''), { flag: 'a' })
  }

  /** @inheritdoc */
  async exportVerified(sessionId: SessionId): Promise<VerifiedSessionExport> {
    await this.verifySession(sessionId)
    const links = await this.readChain(sessionId)
    return { sessionId, links }
  }

  /** @inheritdoc */
  async checkpoint(_sessionId: SessionId): Promise<void> {
    // Phase 1 stores only hash links; signed checkpoints are optional Phase 2 work.
  }

  private async readChain(sessionId: SessionId): Promise<TrustLogLink[]> {
    const path = chainPath(this.config.root, sessionId)
    let text: string
    try {
      text = await readFile(path, 'utf8')
    } catch {
      return []
    }
    const links: TrustLogLink[] = []
    for (const line of text.split('\n')) {
      if (line.trim().length === 0) continue
      const parsed = JSON.parse(line) as ChainRecord
      links.push({ seq: parsed.seq, digest: parsed.digest, payloadDigest: parsed.payloadDigest })
    }
    return links
  }
}

/**
 * Wrap persistence load so tampered chains refuse before the inspection returns.
 * @param persistence - active session persistence service.
 * @param verify - fail-closed verifier for the loaded event sequence.
 */
function wrapPersistenceLoad(
  persistence: SessionPersistence,
  verify: (id: SessionId, events: readonly SessionEvent[]) => Promise<void>,
): void {
  const tagged = persistence as SessionPersistence & { [LOAD_WRAPPED]?: true }
  if (tagged[LOAD_WRAPPED] === true) return
  tagged[LOAD_WRAPPED] = true
  const original = persistence.load.bind(persistence)
  persistence.load = async (id: SessionId): Promise<SessionInspection> => {
    const inspection = await original(id)
    await verify(id, inspection.events)
    return inspection
  }
}

const LOAD_WRAPPED = Symbol.for('@deepseek-ai/dsh-trust-log-jsonl.loadWrapped')

function chainPath(root: string, sessionId: SessionId): string {
  return join(root, `${sessionId}.chain.jsonl`)
}

function digestPayload(event: SessionEvent): string {
  return createHash('sha256').update(JSON.stringify(snapshotSessionEvent(event))).digest('hex')
}

function chainDigest(prev: string, payloadDigest: string): string {
  return createHash('sha256').update(`${prev}:${payloadDigest}`).digest('hex')
}

export default JsonlTrustLogProvider
