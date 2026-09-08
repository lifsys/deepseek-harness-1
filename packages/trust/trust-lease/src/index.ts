/**
 * Scoped capability leases with fencing tokens (`ctx.trustLease`).
 * @module @deepseek-ai/dsh-trust-lease
 */

import { randomUUID } from 'node:crypto'
import { Context, Service } from '@deepseek-ai/cordis'
import type { Branded } from '@deepseek-ai/dsh-brand'

/** Opaque lease identifier. */
export type LeaseId = Branded<'LeaseId'>

/** Lease scope vocabulary. */
export type LeaseScope = 'subprocess' | 'fs-write' | 'web-fetch' | 'dynamic-plugin' | 'admin'

/** One active capability lease. */
export interface CapabilityLease {
  readonly id: LeaseId
  readonly scope: LeaseScope
  readonly fencingToken: number
  readonly expiresAt: number
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    trustLease: TrustLeaseProvider
  }
}

/** Abstract lease service. */
export abstract class TrustLeaseProvider extends Service {
  constructor(ctx: Context) {
    super(ctx, 'trustLease')
  }

  /**
   * Acquire one scoped lease.
   * @param scope - capability scope.
   * @param budgetMs - lease lifetime in milliseconds.
   * @returns active lease with fencing token.
   */
  abstract acquire(scope: LeaseScope, budgetMs: number): Promise<CapabilityLease>

  /**
   * Witness one effect against an active lease.
   * @param lease - lease presented by the caller.
   * @returns true when the lease remains valid.
   */
  abstract witness(lease: CapabilityLease): boolean

  /**
   * Revoke one lease immediately.
   * @param leaseId - lease to revoke.
   */
  abstract revoke(leaseId: LeaseId): Promise<void>
}

/** In-memory lease provider for enterprise profiles. */
export class MemoryTrustLeaseProvider extends TrustLeaseProvider {
  private readonly active = new Map<string, CapabilityLease>()
  private generation = 0

  /** @inheritdoc */
  acquire(scope: LeaseScope, budgetMs: number): Promise<CapabilityLease> {
    this.generation += 1
    const lease: CapabilityLease = {
      id: randomUUID() as LeaseId,
      scope,
      fencingToken: this.generation,
      expiresAt: Date.now() + budgetMs,
    }
    this.active.set(String(lease.id), lease)
    return Promise.resolve(lease)
  }

  /** @inheritdoc */
  witness(lease: CapabilityLease): boolean {
    const current = this.active.get(String(lease.id))
    return current !== undefined
      && current.fencingToken === lease.fencingToken
      && current.expiresAt >= Date.now()
  }

  /** @inheritdoc */
  revoke(leaseId: LeaseId): Promise<void> {
    this.active.delete(String(leaseId))
    return Promise.resolve()
  }
}

export default MemoryTrustLeaseProvider
