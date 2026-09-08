/**
 * Request-scoped AsyncLocalStorage for Host RPC handlers that need HTTP headers.
 * @module @deepseek-ai/dsh-client-connection/rpc-request-scope
 */
import { AsyncLocalStorage } from 'node:async_hooks';
const store = new AsyncLocalStorage();
/**
 * Run work with the current Fetch {@link Request} bound for nested RPC handlers.
 * @param request - inbound Fetch request that owns this RPC dispatch.
 * @param run - work executed while the request remains bound.
 * @returns the result of `run`.
 */
export function withRpcRequest(request, run) {
    return Promise.resolve(store.run(request, run));
}
/**
 * Read the Fetch request bound to the current Host RPC dispatch, when any.
 * @returns the active request, or `undefined` outside an RPC Fetch dispatch.
 */
export function currentRpcRequest() {
    return store.getStore();
}
//# sourceMappingURL=rpc-request-scope.js.map