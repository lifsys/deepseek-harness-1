/**
 * Request-scoped AsyncLocalStorage for Host RPC handlers that need HTTP headers.
 * @module @deepseek-ai/dsh-client-connection/rpc-request-scope
 */
/**
 * Run work with the current Fetch {@link Request} bound for nested RPC handlers.
 * @param request - inbound Fetch request that owns this RPC dispatch.
 * @param run - work executed while the request remains bound.
 * @returns the result of `run`.
 */
export declare function withRpcRequest<T>(request: Request, run: () => T | Promise<T>): Promise<T>
/**
 * Read the Fetch request bound to the current Host RPC dispatch, when any.
 * @returns the active request, or `undefined` outside an RPC Fetch dispatch.
 */
export declare function currentRpcRequest(): Request | undefined
//# sourceMappingURL=rpc-request-scope.d.ts.map
