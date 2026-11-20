import { metrics } from '@opentelemetry/api';
import { Request, Response, NextFunction } from 'express';

import { logger } from '../../config-middleware/config/logger.js';
import { getActiveTraceFields } from '../../config-middleware/shared/tracing/index.js';

interface Histogram {
  count: number;
  sum: number;
  buckets: number[];
}

const requestCounts = new Map<string, number>();
const requestDurations = new Map<string, Histogram>();
const errorCounts = new Map<'4xx' | '5xx', number>();

const meter = metrics.getMeter('lethimcook-api');
const requestCounter = meter.createCounter('http.server.request_count', { description: 'Total HTTP requests' });
const requestDuration = meter.createHistogram('http.server.request_duration_ms', { description: 'HTTP request duration in milliseconds' });
const clientErrorCounter = meter.createCounter('http.server.client_error_count', { description: 'Total HTTP 4xx responses' });
const serverErrorCounter = meter.createCounter('http.server.server_error_count', { description: 'Total HTTP 5xx responses' });

function routeLabel(req: Request): string {
  const route = req.route?.path;
  if (typeof route === 'string') return route;
  return req.path.startsWith('/api/') ? req.path.replace(/[0-9a-f-]{20,}/gi, ':id') : req.path;
}

function escapeLabel(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

export function requestMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const started = process.hrtime.bigint();
  res.once('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    const route = routeLabel(req);
    const labels = `${req.method}|${route}|${res.statusCode}`;
    const metricAttributes = { method: req.method, route, status: String(res.statusCode) };
    const durationAttributes = { method: req.method, route };
    requestCounter.add(1, metricAttributes);
    requestDuration.record(durationMs, durationAttributes);
    requestCounts.set(labels, (requestCounts.get(labels) ?? 0) + 1);
    if (res.statusCode >= 400) {
      const errorClass = res.statusCode >= 500 ? '5xx' : '4xx';
      errorCounts.set(errorClass, (errorCounts.get(errorClass) ?? 0) + 1);
      if (errorClass === '4xx') clientErrorCounter.add(1, metricAttributes);
      else serverErrorCounter.add(1, metricAttributes);
    }
    if (durationMs > 500) logger.warn({ method: req.method, path: route, elapsedMs: durationMs }, 'Slow HTTP request');

    const histogram = requestDurations.get(`${req.method}|${route}`) ?? {
      count: 0,
      sum: 0,
      buckets: [0, 0, 0, 0, 0, 0],
    };
    histogram.count += 1;
    histogram.sum += durationMs;
    [10, 50, 100, 250, 500].forEach((limit, index) => {
      if (durationMs <= limit) histogram.buckets[index] = (histogram.buckets[index] ?? 0) + 1;
    });
    histogram.buckets[5] = (histogram.buckets[5] ?? 0) + 1;
    requestDurations.set(`${req.method}|${route}`, histogram);

    logger.info({
      ...getActiveTraceFields(),
      correlationId: (req as Request & { correlationId?: string }).correlationId,
      method: req.method,
      path: route,
      statusCode: res.statusCode,
      elapsedMs: Math.round(durationMs * 100) / 100,
      userId: (req as Request & { user?: { id?: string } }).user?.id,
    }, 'HTTP request completed');
  });
  next();
}

export function renderMetrics(): string {
  const lines = [
    '# HELP http_requests_total Total HTTP requests by method, route and status.',
    '# TYPE http_requests_total counter',
  ];
  for (const [key, value] of requestCounts) {
    const [method, route, status] = key.split('|');
    lines.push(`http_requests_total{method="${escapeLabel(method!)}",route="${escapeLabel(route!)}",status="${status}"} ${value}`);
  }
  lines.push('# HELP http_errors_total Total HTTP error responses by status class.', '# TYPE http_errors_total counter');
  for (const errorClass of ['4xx', '5xx'] as const) {
    lines.push(`http_errors_total{status_class="${errorClass}"} ${errorCounts.get(errorClass) ?? 0}`);
  }
  lines.push('# HELP http_request_duration_ms HTTP request duration in milliseconds.', '# TYPE http_request_duration_ms histogram');
  for (const [key, histogram] of requestDurations) {
    const [method, route] = key.split('|');
    const labels = `method="${escapeLabel(method!)}",route="${escapeLabel(route!)}"`;
    [10, 50, 100, 250, 500, '+Inf'].forEach((bucket, index) => {
      lines.push(`http_request_duration_ms_bucket{${labels},le="${bucket}"} ${histogram.buckets[index]}`);
    });
    lines.push(`http_request_duration_ms_sum{${labels}} ${histogram.sum}`);
    lines.push(`http_request_duration_ms_count{${labels}} ${histogram.count}`);
  }
  return `${lines.join('\n')}\n`;
}

export function resetMetrics(): void {
  requestCounts.clear();
  requestDurations.clear();
  errorCounts.clear();
}
