import { logger } from '../../config/logger.js';

export function initTracing(): void {
  if (process.env.NODE_ENV !== 'production') {
    logger.info('Tracing disabled in non-production mode');
    return;
  }

  try {
    // Lazily required on purpose: the OpenTelemetry packages are optional and
    // only needed in production. Keeping them inside try/catch means a missing
    // or broken tracing dependency degrades gracefully instead of crashing the
    // API at import time, which a top-level `import` would not allow.
    /* eslint-disable @typescript-eslint/no-var-requires */
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
    const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
    const { Resource } = require('@opentelemetry/resources');
    const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
    /* eslint-enable @typescript-eslint/no-var-requires */

    const sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'lethimcook-api',
      }),
      traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
      }),
      instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
    });

    sdk.start();
    logger.info('OpenTelemetry tracing initialized');
  } catch {
    logger.warn('OpenTelemetry packages not available, tracing disabled');
  }
}
