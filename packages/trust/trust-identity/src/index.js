/**
 * Service Definition for authenticated principal vocabulary (`ctx.trustIdentity`).
 * Enterprise Host surfaces require a bound principal; anonymous preview profiles
 * omit this service.
 * @module @deepseek-ai/dsh-trust-identity
 */
import { Service } from '@deepseek-ai/cordis';
/** Machine-readable failure when no authenticated principal is available. */
export class TrustIdentityUnauthorizedError extends Error {
    /** Wire and RPC error category. */
    code = 'unauthorized';
    /**
     * @param message - correction-oriented diagnostic without credential values.
     */
    constructor(message = 'authentication required') {
        super(message);
        this.name = 'TrustIdentityUnauthorizedError';
    }
}
/**
 * Abstract identity service. Providers authenticate ingress credentials and
 * maintain the current principal for the active Host request scope.
 */
export class TrustIdentityProvider extends Service {
    constructor(ctx) {
        super(ctx, 'trustIdentity');
    }
    /**
     * Require an authenticated principal for the current Host request scope.
     * @returns the active principal.
     * @throws {@link TrustIdentityUnauthorizedError} when no principal is bound.
     */
    requirePrincipal() {
        const principal = this.currentPrincipal();
        if (principal === undefined)
            throw new TrustIdentityUnauthorizedError();
        return principal;
    }
}
export default TrustIdentityProvider;
//# sourceMappingURL=index.js.map