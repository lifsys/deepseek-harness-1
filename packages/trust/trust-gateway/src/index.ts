/**
 * Host RPC identity guard marker plugin. Enforcement lives in api-gateway invokeRpc.
 * @module @deepseek-ai/dsh-trust-gateway
 */

import type { Context } from '@deepseek-ai/cordis'

export const name = 'trust-gateway'
export const inject = ['trustIdentity']

/** Marker plugin ensuring trust identity mounts before Host RPC surfaces. */
export function apply(_ctx: Context): void {}

export { TrustIdentityUnauthorizedError } from '@deepseek-ai/dsh-trust-identity'
