import type { Logger } from 'pino';
import type { ZodType } from 'zod';

import { logger as defaultLogger } from '../../config-middleware/config/logger.js';
import { AppError } from '../../config-middleware/shared/errors/AppError.js';

import { createLoggingMiddleware } from './middlewares/loggingMiddleware.js';
import { createValidationMiddleware } from './middlewares/validationMiddleware.js';
import type { CommandMiddleware } from './types.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
type RegisteredHandler = (command: any) => Promise<any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface CommandBusOptions {
  logger?: Logger;
}

/**
 * Custom CQRS command bus.
 *
 * Pipeline order (docs/06-system-architecture §6.3):
 * 1. LoggingMiddleware        — logs command name/params/elapsed (warns > 500ms)
 * 2. ValidationMiddleware     — runs the registered Zod validator, throws ValidationError (422)
 * 3. [CachingMiddleware]      — queries only (not yet implemented; no cacheable auth commands)
 * 4. Handler                  — business logic
 * 5. [CacheInvalidation]      — data-changing commands (not yet implemented)
 */
export class CommandBus {
  private readonly handlers = new Map<string, RegisteredHandler>();

  private readonly validators = new Map<string, ZodType>();

  private readonly middlewares: CommandMiddleware[];

  constructor(options: CommandBusOptions = {}) {
    const logger = options.logger ?? defaultLogger;
    this.middlewares = [
      createLoggingMiddleware(logger),
      createValidationMiddleware(this.validators),
    ];
  }

  use(middleware: CommandMiddleware): void {
    this.middlewares.push(middleware);
  }

  register<C extends object, R>(
    commandClass: new (...args: never[]) => C,
    handler: (command: C) => Promise<R>,
    validator?: ZodType,
  ): void {
    this.handlers.set(commandClass.name, handler as RegisteredHandler);
    if (validator) {
      this.validators.set(commandClass.name, validator);
    }
  }

  async dispatch<R>(command: object): Promise<R> {
    const commandName = (command as { constructor?: { name?: string } }).constructor
      ?.name;
    const handler = commandName ? this.handlers.get(commandName) : undefined;
    if (!handler) {
      throw new AppError(
        500,
        `No handler registered for command "${commandName ?? 'unknown'}"`,
        'INTERNAL_ERROR',
      );
    }

    const result = await this.runPipeline(command, 0, () => handler(command));
    return result as R;
  }

  private async runPipeline(
    command: object,
    index: number,
    fallback: () => Promise<unknown>,
  ): Promise<unknown> {
    const middleware = this.middlewares[index];
    if (!middleware) {
      return fallback();
    }
    return middleware(command, () => this.runPipeline(command, index + 1, fallback));
  }
}
