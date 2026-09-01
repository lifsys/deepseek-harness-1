import { describe, expect, it } from 'vitest'
import { TrustIdentityUnauthorizedError } from '@deepseek-ai/dsh-trust-identity'

describe('TrustIdentityUnauthorizedError', () => {
  it('carries unauthorized code for RPC mapping', () => {
    const error = new TrustIdentityUnauthorizedError()
    expect(error.code).toBe('unauthorized')
    expect(error.name).toBe('TrustIdentityUnauthorizedError')
  })
})
