/**
 * Enterprise audit record vocabulary.
 * @module @deepseek-ai/dsh-trust-audit/types
 */

import type { UserId } from '@deepseek-ai/dsh-trust-identity'

/** Closed audit record types; separate from model-facing session events. */
export type TrustAuditRecordType =
  | 'auth/login'
  | 'auth/logout'
  | 'authz/denied'
  | 'approval/decided'
  | 'admin/policy-changed'
  | 'credential/accessed'
  | 'export/session'

/** One append-only audit record. */
export interface TrustAuditRecord {
  readonly type: TrustAuditRecordType
  readonly time: number
  readonly userId?: UserId
  readonly action?: string
  readonly resource?: string
  readonly reason?: string
  readonly outcome?: string
  readonly metadata?: Readonly<Record<string, string>>
}

/** Filter for export and subscription. */
export interface TrustAuditFilter {
  readonly since?: number
  readonly until?: number
  readonly types?: readonly TrustAuditRecordType[]
  readonly userId?: UserId
}

/** Export sink identifier. */
export type TrustAuditSink = 'file' | 'otel' | 'jsonl'
