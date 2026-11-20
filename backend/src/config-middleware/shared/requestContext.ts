import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  correlationId: string;
  userId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(requestContext: RequestContext, callback: () => T): T {
  return storage.run(requestContext, callback);
}

export function getRequestContext(): Readonly<RequestContext> | undefined {
  return storage.getStore();
}

export function setRequestUserId(userId: string): void {
  const requestContext = storage.getStore();
  if (requestContext) requestContext.userId = userId;
}
