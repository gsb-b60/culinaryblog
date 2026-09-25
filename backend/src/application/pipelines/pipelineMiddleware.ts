import { cacheService } from '../../infrastructure/cache/RedisCacheService.js';
import {
  MiddlewareHandler,
  Query,
  Command,
  ICacheable,
  ICacheInvalidator,
} from '../command-bus.js';

export const loggingMiddleware: MiddlewareHandler<any, any> = async (_request, next) => next();

export const validationMiddleware: MiddlewareHandler<any, any> = async (_request, next) => {
  // Validation is handled in commandBus.executeCommand/Query
  // This middleware can be used for additional validation if needed
  return next();
};

export const cachingMiddleware: MiddlewareHandler<Query<any>, any> = async (query, next) => {
  if (!isCacheable(query)) {
    return next();
  }

  const cacheKey = query.getCacheKey();
  const ttl = query.getCacheTtl();

  // Try to get from cache
  const cached = await cacheService.get(cacheKey);
  if (cached !== null) {
    // logger.debug({ cacheKey, message: 'Cache hit' });
    return cached as any;
  }

  // logger.debug({ cacheKey, message: 'Cache miss' });
  const result = await next();

  // Store in cache
  await cacheService.set(cacheKey, result, ttl);
  return result;
};

export const cacheInvalidationMiddleware: MiddlewareHandler<Command<any>, any> = async (
  command,
  next,
) => {
  const result = await next();

  if (isCacheInvalidator(command)) {
    const keysToInvalidate = command.getCacheKeysToInvalidate();
    for (const key of keysToInvalidate) {
      // Wildcard keys invalidate every public listing/detail entry that can
      // contain the recipe; exact keys are also supported for future commands.
      if (key.includes('*')) {
        await cacheService.deletePattern(key);
      } else {
        await cacheService.delete(key);
      }
    }
  }

  return result;
};

function isCacheable(query: any): query is Query<any> & ICacheable {
  return (
    query && typeof query.getCacheKey === 'function' && typeof query.getCacheTtl === 'function'
  );
}

function isCacheInvalidator(command: any): command is Command<any> & ICacheInvalidator {
  return command && typeof command.getCacheKeysToInvalidate === 'function';
}
