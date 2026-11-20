import { context, isSpanContextValid, trace } from '@opentelemetry/api';
import { createRequire } from 'node:module';

import { logger } from '../../config/logger.js';

const require = createRequire(import.meta.url);

let tracingSdk: { shutdown: () => Promise<void> } | undefined;

export function getActiveTraceFields(): { traceId?: string; spanId?: string } {
  const spanContext = trace.getSpan(context.active())?.spanContext();
  return spanContext && isSpanContextValid(spanContext)
    ? { traceId: spanContext.traceId, spanId: spanContext.spanId }
    : {};
}

export function initTracing(): void {
  try {
    // Keep telemetry imports lazy so a collector or optional exporter failure
    // never prevents the API from starting.
    /* eslint-disable @typescript-eslint/no-var-requires */
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
    const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
    const { PrismaInstrumentation } = require('@prisma/instrumentation');
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
    const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
    const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
    const { Resource } = require('@opentelemetry/resources');
    const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
    /* eslint-enable @typescript-eslint/no-var-requires */

    const traceEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';
    const metricEndpoint = traceEndpoint.replace(/\/v1\/traces\/?$/, '/v1/metrics');
    const sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'lethimcook-api',
      }),
      traceExporter: new OTLPTraceExporter({ url: traceEndpoint }),
      metricReaders: [
        new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({ url: metricEndpoint }),
          exportIntervalMillis: 30000,
        }),
      ],
      instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
        new PrismaInstrumentation(),
      ],
    });

    tracingSdk = sdk;
    sdk.start();
    logger.info({ traceEndpoint, metricEndpoint }, 'OpenTelemetry tracing and metrics initialized');
  } catch (error) {
    logger.warn({ err: error }, 'OpenTelemetry initialization failed; tracing and metrics disabled');
  }
}

export async function shutdownTracing(): Promise<void> {
  await tracingSdk?.shutdown();
  tracingSdk = undefined;
}
