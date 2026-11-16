import { metrics } from '@opentelemetry/api';
import { Request, Response, NextFunction } from 'express';

const bucketBoundariesSeconds = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
const requestCounter = metrics.getMeter('lethimcook-http').createCounter(
  'lethimcook.http.server.request.count',
  { description: 'Number of completed HTTP requests' },
);
const errorCounter = metrics.getMeter('lethimcook-http').createCounter(
  'lethimcook.http.server.error.count',
  { description: 'Number of completed HTTP 4xx and 5xx requests' },
);
const requestDuration = metrics.getMeter('lethimcook-http').createHistogram(
  'lethimcook.http.server.request.duration',
  { description: 'HTTP request duration in seconds', unit: 's' },
);

interface Histogram {
  count: number;
  sum: number;
  buckets: number[];
}

const histograms = new Map<string, Histogram>();
const requestCounts = new Map<string, number>();
const errorCounts = new Map<string, number>();

function labelsKey(method: string, route: string, statusCode: number): string {
  return JSON.stringify({ method, route, status_code: statusCode });
}

function escapeLabel(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

function formatLabels(key: string): string {
  const labels = JSON.parse(key) as Record<string, string | number>;
  return `{${Object.entries(labels)
    .map(([name, value]) => `${name}="${escapeLabel(String(value))}"`)
    .join(',')}}`;
}

export function recordHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  durationSeconds: number,
): void {
  const attributes = { method, route, status_code: String(statusCode) };
  const key = labelsKey(method, route, statusCode);
  requestCounts.set(key, (requestCounts.get(key) ?? 0) + 1);
  requestCounter.add(1, attributes);
  requestDuration.record(durationSeconds, attributes);

  if (statusCode >= 400) {
    errorCounts.set(key, (errorCounts.get(key) ?? 0) + 1);
    errorCounter.add(1, attributes);
  }

  const histogram = histograms.get(key) ?? {
    count: 0,
    sum: 0,
    buckets: bucketBoundariesSeconds.map(() => 0),
  };
  histogram.count += 1;
  histogram.sum += durationSeconds;
  bucketBoundariesSeconds.forEach((boundary, index) => {
    if (durationSeconds <= boundary) {
      histogram.buckets[index] = (histogram.buckets[index] ?? 0) + 1;
    }
  });
  histograms.set(key, histogram);
}

export function renderPrometheusMetrics(): string {
  const lines = [
    '# HELP lethimcook_http_requests_total Number of completed HTTP requests.',
    '# TYPE lethimcook_http_requests_total counter',
  ];
  for (const [key, count] of requestCounts) {
    lines.push(`lethimcook_http_requests_total${formatLabels(key)} ${count}`);
  }

  lines.push(
    '# HELP lethimcook_http_errors_total Number of completed HTTP 4xx and 5xx requests.',
    '# TYPE lethimcook_http_errors_total counter',
  );
  for (const [key, count] of errorCounts) {
    lines.push(`lethimcook_http_errors_total${formatLabels(key)} ${count}`);
  }

  lines.push(
    '# HELP lethimcook_http_request_duration_seconds HTTP request duration in seconds.',
    '# TYPE lethimcook_http_request_duration_seconds histogram',
  );
  for (const [key, histogram] of histograms) {
    const labels = formatLabels(key);
    bucketBoundariesSeconds.forEach((boundary, index) => {
      lines.push(
        `lethimcook_http_request_duration_seconds_bucket${labels.slice(0, -1)},le="${boundary}"} ${histogram.buckets[index]}`,
      );
    });
    lines.push(
      `lethimcook_http_request_duration_seconds_bucket${labels.slice(0, -1)},le="+Inf"} ${histogram.count}`,
      `lethimcook_http_request_duration_seconds_sum${labels} ${histogram.sum}`,
      `lethimcook_http_request_duration_seconds_count${labels} ${histogram.count}`,
    );
  }
  return `${lines.join('\n')}\n`;
}

export function httpMetricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.path === '/metrics') {
    next();
    return;
  }

  const start = process.hrtime.bigint();
  res.once('finish', () => {
    const routePath = (req.route as { path?: string | string[] } | undefined)?.path;
    const route = typeof routePath === 'string'
      ? `${req.baseUrl}${routePath}` || '/'
      : 'unmatched';
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1_000_000_000;
    recordHttpRequest(req.method, route, res.statusCode, durationSeconds);
  });
  next();
}
