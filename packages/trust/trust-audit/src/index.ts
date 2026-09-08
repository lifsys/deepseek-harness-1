/**
 * Service Definition for enterprise audit records (`ctx.trustAudit`).
 * Audit vocabulary is parallel to the session log and never model-visible.
 * @module @deepseek-ai/dsh-trust-audit
 */

import { Context, Service } from '@deepseek-ai/cordis'
import type { TrustAuditFilter, TrustAuditRecord, TrustAuditSink } from './types.ts'

export type {
  TrustAuditFilter,
  TrustAuditRecord,
  TrustAuditRecordType,
  TrustAuditSink,
} from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    trustAudit: TrustAuditProvider
  }
}

/** Abstract audit service. */
export abstract class TrustAuditProvider extends Service {
  constructor(ctx: Context) {
    super(ctx, 'trustAudit')
  }

  /**
   * Append one audit record to every configured sink.
   * @param record - durable audit fact.
   */
  abstract record(record: TrustAuditRecord): Promise<void>

  /**
   * Export matching records to one sink.
   * @param sink - destination sink id.
   * @param filter - optional time and type filter.
   * @returns serialized export payload for CLI and operators.
   */
  abstract export(sink: TrustAuditSink, filter?: TrustAuditFilter): Promise<string>

  /**
   * Subscribe one in-process sink for live records.
   * @param listener - receives each committed record.
   * @returns disposer removing the listener.
   */
  abstract subscribe(listener: (record: TrustAuditRecord) => void): () => void
}

export default TrustAuditProvider
