import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

let sdk: NodeSDK | undefined;

function getSignalEndpoint(
  signal: 'traces' | 'metrics',
  configuredEndpoint: string,
): string {
  const endpoint = new URL(configuredEndpoint);
  const path = endpoint.pathname.replace(/\/$/, '');
  if (!path.endsWith(`/v1/${signal}`)) {
    endpoint.pathname = path.endsWith('/v1')
      ? `${path}/${signal}`
      : `${path}/v1/${signal}`;
  }
  return endpoint.toString();
}

export async function initTracing(): Promise<void> {
  if (sdk) return;

  const metricsEndpoint = env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT;
  const metricReader = metricsEndpoint
    ? new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: getSignalEndpoint('metrics', metricsEndpoint),
      }),
      exportIntervalMillis: 60_000,
    })
    : undefined;
  const tracesEndpoint = env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318';

  sdk = new NodeSDK({
    resource: resourceFromAttributes({ 'service.name': env.OTEL_SERVICE_NAME }),
    traceExporter: new OTLPTraceExporter({
      url: getSignalEndpoint('traces', tracesEndpoint),
    }),
    ...(metricReader ? { metricReader } : {}),
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
    ],
  });

  sdk.start();
  logger.info({
    serviceName: env.OTEL_SERVICE_NAME,
    metricsExporterEnabled: Boolean(metricsEndpoint),
  }, 'OpenTelemetry initialized');
}

export async function shutdownTracing(): Promise<void> {
  if (!sdk) return;
  const activeSdk = sdk;
  sdk = undefined;
  await activeSdk.shutdown();
}
