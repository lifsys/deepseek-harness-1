/**
 * OTLP audit export provider forwarding records to session telemetry sinks.
 * @module @deepseek-ai/dsh-trust-audit-otel
 */

import type {} from '@deepseek-ai/dsh-session-telemetry'
import {
  TrustAuditProvider,
  type TrustAuditFilter,
  type TrustAuditRecord,
  type TrustAuditSink,
} from '@deepseek-ai/dsh-trust-audit'

/**
 * Audit provider that mirrors records into the session telemetry pipeline.
 * Telemetry delivery is the durable path; the retained records answer
 * `export` for the lifetime of this provider only.
 */
export class OtelTrustAuditProvider extends TrustAuditProvider {
  static inject = ['sessionTelemetry']

  private readonly emitted: TrustAuditRecord[] = []
  private readonly listeners = new Set<(record: TrustAuditRecord) => void>()

  /** @inheritdoc */
  record(record: TrustAuditRecord): Promise<void> {
    this.emitted.push(record)
    this.ctx.get('sessionTelemetry')?.emit({
      channel: 'ops',
      time: record.time,
      severity: record.type === 'authz/denied' ? 'warn' : 'info',
      attributes: {
        'trust.audit.type': record.type,
        ...(record.userId !== undefined ? { 'trust.audit.user_id': String(record.userId) } : {}),
      },
      body: record,
    })
    for (const listener of this.listeners) listener(record)
    return Promise.resolve()
  }

  /** @inheritdoc */
  export(sink: TrustAuditSink, filter?: TrustAuditFilter): Promise<string> {
    if (sink !== 'otel') throw new Error('trust-audit-otel: export supports otel sink only')
    const filtered = this.emitted.filter(record => matchesFilter(record, filter))
    return Promise.resolve(`${filtered.map(record => JSON.stringify(record)).join('\n')}\n`)
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

export default OtelTrustAuditProvider
