/**
 * OTLP audit export provider forwarding records to session telemetry sinks.
 * @module @deepseek-ai/dsh-trust-audit-otel
 */

import {
  TrustAuditProvider,
  type TrustAuditFilter,
  type TrustAuditRecord,
  type TrustAuditSink,
} from '@deepseek-ai/dsh-trust-audit'

const buffered: TrustAuditRecord[] = []

/**
 * Audit provider that mirrors records into the session telemetry pipeline.
 */
export class OtelTrustAuditProvider extends TrustAuditProvider {
  static inject = ['sessionTelemetry'] as const

  /** @inheritdoc */
  async record(record: TrustAuditRecord): Promise<void> {
    buffered.push(record)
    const telemetry = this.ctx.get('sessionTelemetry')
    telemetry?.emit({
      channel: 'ops',
      time: record.time,
      severity: record.type === 'authz/denied' ? 'warn' : 'info',
      attributes: {
        'trust.audit.type': record.type,
        ...(record.userId !== undefined ? { 'trust.audit.user_id': String(record.userId) } : {}),
      },
      body: record,
    })
  }

  /** @inheritdoc */
  async export(sink: TrustAuditSink, filter?: TrustAuditFilter): Promise<string> {
    if (sink !== 'otel') throw new Error('trust-audit-otel: export supports otel sink only')
    const filtered = buffered.filter(record => matchesFilter(record, filter))
    return `${filtered.map(record => JSON.stringify(record)).join('\n')}\n`
  }

  /** @inheritdoc */
  subscribe(listener: (record: TrustAuditRecord) => void): () => void {
    const wrapper = (record: TrustAuditRecord) => { listener(record) }
    return () => { void wrapper }
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
