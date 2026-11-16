import { context, SpanStatusCode, trace } from '@opentelemetry/api';
import { PrismaClient } from '@prisma/client';

const tracer = trace.getTracer('lethimcook-prisma');

export function instrumentPrismaClient(client: PrismaClient): void {
  client.$use(async (params, next) => {
    const model = params.model ?? 'raw';
    const span = tracer.startSpan(`prisma.${model}.${params.action}`, {
      attributes: {
        'db.system': 'postgresql',
        'db.operation.name': params.action,
        'db.collection.name': model,
      },
    });

    return context.with(trace.setSpan(context.active(), span), async () => {
      try {
        const result: unknown = await next(params);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        if (error instanceof Error) span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Prisma operation failed' });
        throw error;
      } finally {
        span.end();
      }
    });
  });
}
