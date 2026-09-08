/**
 * Append-only local audit log provider composing {@link TrustAuditProvider}.
 * @module @deepseek-ai/dsh-trust-audit-file
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import {
  TrustAuditProvider,
  type TrustAuditFilter,
  type TrustAuditRecord,
  type TrustAuditSink,
} from '@deepseek-ai/dsh-trust-audit'

/** Plugin configuration. */
export interface Config {
  /** Audit log directory; defaults to `$DSH_HOME/trust-audit`. */
  readonly path?: string
}

/**
 * File-backed audit provider for air-gapped on-prem installs.
 */
export class FileTrustAuditProvider extends TrustAuditProvider {
  static Config = z.object({
    path: z.string(),
  })

  private readonly listeners = new Set<(record: TrustAuditRecord) => void>()
  private readonly filePath: string

  constructor(ctx: Context, public config: Config) {
    super(ctx)
    const root = config.path ?? join(resolveDshHome(), 'trust-audit')
    this.filePath = join(root, 'audit.jsonl')
  }

  /** @inheritdoc */
  async record(record: TrustAuditRecord): Promise<void> {
    await mkdir(join(this.filePath, '..'), { recursive: true })
    await writeFile(this.filePath, `${JSON.stringify(record)}\n`, { flag: 'a' })
    for (const listener of this.listeners) listener(record)
  }

  /** @inheritdoc */
  async export(sink: TrustAuditSink, filter?: TrustAuditFilter): Promise<string> {
    if (sink !== 'file' && sink !== 'jsonl') {
      throw new Error(`trust-audit-file: sink ${sink} is not supported by the file provider`)
    }
    let text: string
    try {
      text = await readFile(this.filePath, 'utf8')
    } catch {
      return ''
    }
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    const filtered = lines.filter(line => matchesFilter(JSON.parse(line) as TrustAuditRecord, filter))
    return `${filtered.join('\n')}${filtered.length > 0 ? '\n' : ''}`
  }

  /** @inheritdoc */
  subscribe(listener: (record: TrustAuditRecord) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
}

function matchesFilter(record: TrustAuditRecord, filter: TrustAuditFilter | undefined): boolean {
  if (filter === undefined) return true
  if (filter.since !== undefined && record.time < filter.since) return false
  if (filter.until !== undefined && record.time > filter.until) return false
  if (filter.userId !== undefined && record.userId !== filter.userId) return false
  if (filter.types !== undefined && !filter.types.includes(record.type)) return false
  return true
}

export default FileTrustAuditProvider
