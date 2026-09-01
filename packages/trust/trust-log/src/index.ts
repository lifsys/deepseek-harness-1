/**
 * Service Definition for tamper-evident session log integrity (`ctx.trustLog`).
 * Hash metadata lives in a persistence sidecar; the canonical session log format
 * is unchanged in Phase 1.
 * @module @deepseek-ai/dsh-trust-log
 */

import { Context, Service } from '@deepseek-ai/cordis'
import type { SessionEvent, SessionId } from '@deepseek-ai/dsh-session'
import type { VerifiedSessionExport } from './types.ts'

export { TrustLogTamperedError } from './types.ts'
export type { TrustLogLink, VerifiedSessionExport } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    trustLog: TrustLogProvider
  }
}

/** Abstract trust-log service wrapping durable session persistence. */
export abstract class TrustLogProvider extends Service {
  constructor(ctx: Context) {
    super(ctx, 'trustLog')
  }

  /**
   * Verify one session's hash chain against its durable event log.
   * @param sessionId - session to verify.
   * @throws {@link TrustLogTamperedError} when the chain does not match.
   */
  abstract verifySession(sessionId: SessionId): Promise<void>

  /**
   * Append integrity metadata for one newly persisted event batch.
   * @param sessionId - owning session.
   * @param events - contiguous events appended in this flush.
   */
  abstract extendChain(sessionId: SessionId, events: readonly SessionEvent[]): Promise<void>

  /**
   * Export the verified chain for one session.
   * @param sessionId - session to export.
   * @returns verified link list after {@link verifySession} succeeds.
   */
  abstract exportVerified(sessionId: SessionId): Promise<VerifiedSessionExport>

  /**
   * Write an optional signed checkpoint for long-running sessions.
   * @param sessionId - session receiving the checkpoint.
   */
  abstract checkpoint(sessionId: SessionId): Promise<void>
}

export default TrustLogProvider
