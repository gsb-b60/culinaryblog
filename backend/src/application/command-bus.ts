import { logger } from '../../config-middleware/config/logger.js';

export abstract class Command<TResponse = void> {
  abstract readonly type: string;
}

export abstract class Query<TResponse = void> {
  abstract readonly type: string;
}

export interface ICommandHandler<TCommand extends Command<TResponse>, TResponse> {
  execute(command: TCommand): Promise<TResponse>;
}

export interface IQueryHandler<TQuery extends Query<TResponse>, TResponse> {
  execute(query: TQuery): Promise<TResponse>;
}

export interface IValidator<T> {
  validate(input: T): Promise<void>;
}

export interface ICacheable {
  getCacheKey(): string;
  getCacheTtl(): number;
}

export interface ICacheInvalidator {
  getCacheKeysToInvalidate(): string[];
}

export type MiddlewareHandler<T extends Command<any> | Query<any>, TResponse> = (
  request: T,
  next: () => Promise<TResponse>
) => Promise<TResponse>;

export class CommandBus {
  private commandHandlers = new Map<string, ICommandHandler<any, any>>();
  private queryHandlers = new Map<string, IQueryHandler<any, any>>();
  private validators = new Map<string, IValidator<any>>();
  private middlewares: MiddlewareHandler<any, any>[] = [];

  registerCommandHandler<TCommand extends Command<TResponse>, TResponse>(
    commandType: string,
    handler: ICommandHandler<TCommand, TResponse>
  ): void {
    this.commandHandlers.set(commandType, handler);
  }

  registerQueryHandler<TQuery extends Query<TResponse>, TResponse>(
    queryType: string,
    handler: IQueryHandler<TQuery, TResponse>
  ): void {
    this.queryHandlers.set(queryType, handler);
  }

  registerValidator<T extends Command<any> | Query<any>>(
    requestType: string,
    validator: IValidator<T>
  ): void {
    this.validators.set(requestType, validator);
  }

  use(middleware: MiddlewareHandler<any, any>): void {
    this.middlewares.push(middleware);
  }

  async executeCommand<TCommand extends Command<TResponse>, TResponse>(
    command: TCommand
  ): Promise<TResponse> {
    const handler = this.commandHandlers.get(command.type);
    if (!handler) {
      throw new Error(`No handler registered for command: ${command.type}`);
    }

    const validator = this.validators.get(command.type);
    if (validator) {
      await validator.validate(command);
    }

    return this.runPipeline(command, () => handler.execute(command));
  }

  async executeQuery<TQuery extends Query<TResponse>, TResponse>(
    query: TQuery
  ): Promise<TResponse> {
    const handler = this.queryHandlers.get(query.type);
    if (!handler) {
      throw new Error(`No handler registered for query: ${query.type}`);
    }

    const validator = this.validators.get(query.type);
    if (validator) {
      await validator.validate(query);
    }

    // Check cache for cacheable queries
    if (this.isCacheable(query)) {
      const cacheKey = query.getCacheKey();
      // Cache check would be implemented in middleware
    }

    return this.runPipeline(query, () => handler.execute(query));
  }

  private isCacheable(request: Command<any> | Query<any>): request is Query<any> & ICacheable {
    return 'getCacheKey' in request && typeof request.getCacheKey === 'function';
  }

  private async runPipeline<T extends Command<any> | Query<any>, TResponse>(
    request: T,
    handler: () => Promise<TResponse>
  ): Promise<TResponse> {
    let index = 0;

    const next = async (): Promise<TResponse> => {
      if (index >= this.middlewares.length) {
        return handler();
      }

      const middleware = this.middlewares[index++];
      return middleware(request, next);
    };

    const startTime = Date.now();
    try {
      const result = await next();
      const duration = Date.now() - startTime;
      
      if (duration > 500) {
        logger.warn({ 
          type: request.type, 
          duration,
          message: 'Slow request detected' 
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error({ 
        type: request.type, 
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Request failed' 
      });
      throw error;
    }
  }
}

export const commandBus = new CommandBus();