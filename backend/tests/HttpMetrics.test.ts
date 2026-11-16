import { recordHttpRequest, renderPrometheusMetrics } from '../src/infrastructure/observability/HttpMetrics.js';

describe('HTTP metrics', () => {
  it('renders request, error, and duration histogram metrics with bounded route labels', () => {
    const route = '/metrics-test-route';
    recordHttpRequest('GET', route, 503, 0.2);

    const output = renderPrometheusMetrics();
    expect(output).toContain(
      `lethimcook_http_requests_total{method="GET",route="${route}",status_code="503"} 1`,
    );
    expect(output).toContain(
      `lethimcook_http_errors_total{method="GET",route="${route}",status_code="503"} 1`,
    );
    expect(output).toContain(
      `lethimcook_http_request_duration_seconds_bucket{method="GET",route="${route}",status_code="503",le="0.25"} 1`,
    );
    expect(output).toContain(
      `lethimcook_http_request_duration_seconds_count{method="GET",route="${route}",status_code="503"} 1`,
    );
  });
});
