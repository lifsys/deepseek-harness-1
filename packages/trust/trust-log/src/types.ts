/**
 * Trust log integrity errors and chain record types.
 * @module @deepseek-ai/dsh-trust-log/types
 */

import type { SessionId } from '@deepseek-ai/dsh-session'

/** One hash-chain link persisted beside the session log. */
export interface TrustLogLink {
  /** Monotonic event sequence within the session log. */
  readonly seq: number
  /** SHA-256 hex digest chaining this event to the previous link. */
  readonly digest: string
  /** Digest of the canonical event payload at this sequence. */
  readonly payloadDigest: string
}

/** Verified session export bundle. */
export interface VerifiedSessionExport {
  readonly sessionId: SessionId
  readonly links: readonly TrustLogLink[]
}

/** Fail-closed error when the stored hash chain does not match the session log. */
export class TrustLogTamperedError extends Error {
  /** @param sessionId - session whose chain failed verification. */
  constructor(readonly sessionId: SessionId, message: string) {
    super(message)
    this.name = 'TrustLogTamperedError'
  }
}
