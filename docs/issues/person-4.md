# Person 4 — Jobs + Observability

**5 issues** covering FR-JOB (2) and FR-OBS (3).

---

### Issue #30 — FR-JOB-001: Welcome Email Job

| | |
|---|---|
| Assignee | Person 4 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-misc.md` §3.6 FR-JOB-001 |
| Trigger | After FR-AUTH-001 (registration) succeeds |
| Status | ⬜ Open |

**Description:**

Send an HTML welcome email after successful registration. Uses BullMQ fire-and-forget job with Redis as queue backend. Template includes user name and application link. Retry policy: auto-retry 3 times with exponential backoff.

**Main Flow:**

1. Registration succeeds (FR-AUTH-001 step 10).
2. Push job: `welcomeEmailQueue.add('welcome', { userId, email })`.
3. BullMQ worker picks up job.
4. Render HTML email template with user name + app link.
5. Send via nodemailer (SMTP over TLS) — `IEmailSender` interface.
6. Log result via Pino.

**Alternative / Exception Flows:**

- A1 — SMTP failure → auto-retry 3 times with exponential backoff.
- A2 — All retries exhausted → log error, do not fail registration (fire-and-forget).

**Expected Result:**

Welcome email sent. Registration does not fail if email fails.

**Acceptance Criteria:**

- [ ] Registration triggers welcome email job (fire-and-forget)
- [ ] HTML email contains user's name and application link
- [ ] Sent via nodemailer (IEmailSender abstraction)
- [ ] SMTP failure retries 3 times with exponential backoff
- [ ] Email failure does NOT fail the registration request
- [ ] Job result logged via Pino
- [ ] Dev environment: Mailhog captures test emails (port 1025)

---

### Issue #31 — FR-JOB-003: Sitemap Generation Job

| | |
|---|---|
| Assignee | Person 4 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-misc.md` §3.6 FR-JOB-003 |
| Trigger | Recurring — daily at 02:00 AM UTC (cron: `0 2 * * *`) |
| Status | ⬜ Open |

**Description:**

Generate `sitemap.xml` containing URLs of all Published recipes. Upload to MinIO or save to wwwroot. Ping Google Search Console after updating. Uses BullMQ recurring job. Retry policy: 2 retries on failure. Logs results via Pino.

**Main Flow:**

1. BullMQ recurring job triggers daily at 02:00 AM UTC.
2. Query all Published recipes (slug, updatedAt).
3. Query all category pages.
4. Generate XML sitemap: `<loc>`, `<lastmod>`, `<changefreq>`, `<priority>`.
5. Upload sitemap.xml to MinIO (or save to wwwroot).
6. Ping Google Search Console: `GET https://www.google.com/ping?sitemap={url}`.
7. Log results via Pino.

**Alternative / Exception Flows:**

- A1 — Generation failure → retry 2 times.
- A2 — Google ping failure → log warning, do not fail the job.

**Expected Result:**

sitemap.xml generated, stored, and Google notified.

**Acceptance Criteria:**

- [ ] Recurring job runs daily at 02:00 AM UTC (cron `0 2 * * *`)
- [ ] sitemap.xml includes ALL published recipe URLs
- [ ] sitemap.xml includes category page URLs
- [ ] Format: standard sitemap with `<loc>`, `<lastmod>`, `<changefreq>`, `<priority>`
- [ ] sitemap.xml uploaded to MinIO or saved to wwwroot
- [ ] Google Search Console pinged after update
- [ ] Failure retries 2 times
- [ ] Results logged via Pino

---

### Issue #32 — FR-OBS-001: Health Check Endpoints

| | |
|---|---|
| Assignee | Person 4 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-misc.md` §3.7 FR-OBS-001 |
| Endpoints | `GET /health` · `GET /health/live` · `GET /health/ready` |
| Status | ⬜ Open |

**Description:**

Three health check endpoints. `/health` = aggregate health of all dependencies (DB, Redis, MinIO). `/health/live` = liveness probe (always healthy unless process crashed). `/health/ready` = readiness probe (fails when DB/Redis are down). Use `terminus` or custom health middleware.

**Main Flow:**

1. `GET /health/live` → always 200 (process is alive).
2. `GET /health/ready` → check DB connection + Redis connection:
   - Both up → 200
   - Either down → 503
3. `GET /health` → check all dependencies (DB, Redis, MinIO):
   - All healthy → 200 with `{ "status": "Healthy", "entries": { ... } }`
   - Any down → 503 with per-dependency status

**Expected Result:**

Health endpoints return correct status based on dependency health.

**Acceptance Criteria:**

- [ ] `/health/live` always returns 200 (unless process crashed)
- [ ] `/health/ready` returns 200 when DB + Redis are up
- [ ] `/health/ready` returns 503 when DB or Redis is down
- [ ] `/health` returns aggregate status with per-dependency detail
- [ ] `/health` returns 503 if any dependency is down
- [ ] Response format: `{ "status": "Healthy", "entries": { "database": { "status": "Healthy" }, ... } }`
- [ ] No authentication required on any health endpoint

---

### Issue #33 — FR-OBS-002: Structured Logging

| | |
|---|---|
| Assignee | Person 4 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-misc.md` §3.7 FR-OBS-002 |
| Endpoint | Middleware (applies to all HTTP requests) |
| Status | ⬜ Open |

**Description:**

Every HTTP request logged with: CorrelationId, HTTP method/path/status, elapsed time, UserId (when authenticated). Command bus logging middleware logs all Commands/Queries. Uses Pino + pino-http. Sinks: Console (structured JSON), File (rolling daily). Log levels: Debug (dev), Information (prod), Warning/Error (always).

**Main Flow:**

1. Request arrives → `CorrelationIdMiddleware` generates/reads `X-Correlation-ID`.
2. Attach correlationId to Pino child logger: `logger.child({ correlationId })`.
3. After response: log `{ correlationId, method, path, statusCode, elapsedMs, userId? }`.
4. Command bus `LoggingMiddleware`: logs each Command/Query dispatch, warns if > 500ms.
5. Sink: Console (structured JSON) + File (rolling daily).

**Expected Result:**

Every request logged with correlation ID and timing. Slow queries warned.

**Acceptance Criteria:**

- [ ] Every HTTP request logged with: CorrelationId, method, path, status, elapsed time
- [ ] UserId included in log when user is authenticated
- [ ] `X-Correlation-ID` header auto-generated if absent, returned in response
- [ ] CorrelationId attached to all related log entries (Pino child bindings)
- [ ] Command bus logs all Commands/Queries with elapsed time
- [ ] Warn logged when request > 500ms
- [ ] Output: structured JSON (Console) + rolling daily file
- [ ] Log level by env: Debug (dev), Information (prod), Warning/Error (always)
- [ ] Logs sent to Seq in dev (`http://seq:5341`)

---

### Issue #34 — FR-OBS-003: Distributed Tracing & Metrics

| | |
|---|---|
| Assignee | Person 4 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-misc.md` §3.7 FR-OBS-003 |
| Endpoint | OpenTelemetry SDK (application-wide) |
| Status | ⬜ Open |

**Description:**

OpenTelemetry instrumentation for HTTP request traces, database operation traces, and custom business metrics. Uses `@opentelemetry/sdk-node` with OTLP exporter. Traces exported to Jaeger/Grafana Tempo (production). Metrics: request count, duration histogram, error rate.

**Main Flow:**

1. Initialize OpenTelemetry SDK at application startup.
2. Auto-instrument HTTP requests (incoming/outgoing).
3. Auto-instrument Prisma database operations.
4. Custom business metrics:
   - Request count (counter)
   - Request duration (histogram)
   - Error rate (counter for 4xx/5xx)
5. Export traces via OTLP to collector endpoint.
6. Metrics exposed for scraping (Prometheus format or OTLP).

**Expected Result:**

Distributed traces for HTTP + DB operations. Business metrics collected.

**Acceptance Criteria:**

- [ ] OpenTelemetry SDK initialized at app startup
- [ ] HTTP requests auto-instrumented (spans created)
- [ ] Prisma/DB operations auto-instrumented (spans created)
- [ ] Traces exported via OTLP to `OTEL_EXPORTER_OTLP_ENDPOINT`
- [ ] Metric: request count (total, by route, by status)
- [ ] Metric: request duration histogram (p50, p95, p99)
- [ ] Metric: error rate (4xx, 5xx counts)
- [ ] Works in dev (Seq OTLP) and prod (Grafana Tempo / Jaeger)
- [ ] No performance degradation from instrumentation overhead
