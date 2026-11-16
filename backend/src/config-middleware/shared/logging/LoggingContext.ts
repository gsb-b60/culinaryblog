import { AsyncLocalStorage } from 'node:async_hooks';

interface LoggingContext {
  correlationId: string;
}

const loggingContext = new AsyncLocalStorage<LoggingContext>();

export function runWithCorrelationId(correlationId: string, callback: () => void): void {
  loggingContext.run({ correlationId }, callback);
}

export function getCorrelationId(): string | undefined {
  return loggingContext.getStore()?.correlationId;
}
