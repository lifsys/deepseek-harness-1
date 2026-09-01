/**
 * Mirror approval audit events to {@link TrustAuditProvider}.
 * @module @deepseek-ai/dsh-trust-approval-audit
 */

import type { Context } from '@deepseek-ai/cordis'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-trust-audit'
import type {} from '@deepseek-ai/dsh-trust-identity'
import type {} from '@deepseek-ai/dsh-user-approval'

export const name = 'trust-approval-audit'
export const inject = ['trustAudit', 'trustIdentity'] as const

/** Record approval decisions in the enterprise audit log. */
export function apply(ctx: Context): void {
  ctx.on('session/event', (_session, event: SessionEvent) => {
    if (event.type !== 'approval/decided') return
    const principal = ctx.trustIdentity.currentPrincipal()
    void ctx.trustAudit.record({
      type: 'approval/decided',
      time: Date.now(),
      ...(principal !== undefined ? { userId: principal.userId } : {}),
      outcome: event.data.outcome,
      metadata: { requestId: String(event.data.id) },
    })
  }, { global: true })
}
