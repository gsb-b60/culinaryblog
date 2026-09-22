import { MiddlewareHandler } from '../command-bus.js';
import { Query } from '../command-bus.js';
import { ICacheable } from '../command-bus.js';
import { ICacheInvalidator } from '../command-bus.js';
import { cacheService } from '../../infrastructure/cache/RedisCacheService.js';

export const loggingMiddleware: MiddlewareHandler<any, any> = async (request, next) => {
  const startTime = Date.now();
  const type = request.type;
  
  // Log request start
  // logger.debug({ type, message: 'Request started' });
  
  try {
    const result = await next();
    const duration = Date.now() - startTime;
    
    // logger.info({ type, duration, message: 'Request completed' });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    // logger.error({ type, duration, error: error instanceof Error ? error.message : 'Unknown error', message: 'Request failed' });
    throw error;
  }
};

export const validationMiddleware: MiddlewareHandler<any, any> = async (request, next) => {
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

export const cacheInvalidationMiddleware: MiddlewareHandler<Command<any>, any> = async (command, next) => {
  const result = await next();

  if (isCacheInvalidator(command)) {
    const keysToInvalidate = command.getCacheKeysToInvalidate();
    for (const key of keysToInvalidate) {
      await cacheService.delete(key);
      // logger.debug({ cacheKey: key, message: 'Cache invalidated' });
    }
  }

  return result;
};

function isCacheable(query: any): query is Query<any> & ICacheable {
  return query && typeof query.getCacheKey === 'function' && typeof query.getCacheTtl === 'function';
}

function isCacheInvalidator(command: any): command is Command<any> & ICacheInvalidator {
  return command && typeof command.getCacheKeysToInvalidate === 'function';
}