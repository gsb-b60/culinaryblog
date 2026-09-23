import type { Logger } from 'pino';

import type { CommandMiddleware } from '../types.js';

const SLOW_COMMAND_MS = 500;

const REDACTED_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
]);

function redactCommand(command: object): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(command)) {
    params[key] = REDACTED_KEYS.has(key) ? '[REDACTED]' : value;
  }
  return params;
}

export function createLoggingMiddleware(logger: Logger): CommandMiddleware {
  return async (command, next) => {
    const commandName = command.constructor?.name ?? 'UnknownCommand';
    const startedAt = Date.now();
    try {
      return await next();
    } finally {
      const durationMs = Date.now() - startedAt;
      const payload = {
        command: commandName,
        durationMs,
        params: redactCommand(command),
      };
      if (durationMs > SLOW_COMMAND_MS) {
        logger.warn({ ...payload }, 'Slow command');
      } else {
        logger.info(payload, 'Command processed');
      }
    }
  };
}
