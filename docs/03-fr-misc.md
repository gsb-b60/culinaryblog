# Chapter 3 — Modules 3.4-3.7 (FR-SRCH, FR-FILE, FR-JOB, FR-OBS)

Source: `srs.md` lines 1130-1209.

## 3.4. Search & Pagination Module (FR-SRCH)

### FR-SRCH-001: Full-Text Search

| | |
|---|---|
| Requirement code | FR-SRCH-001 |
| Requirement name | Full-Text Recipe Search |
| Functional group | Search & Pagination Module (FR-SRCH) |
| Actor | All (Guest / Author / Admin) |
| Priority | M – Must Have |

**Description:**

The system provides full-text search (FTS) for recipes using PostgreSQL tsvector/tsquery with Vietnamese configuration. Results are ranked by ts_rank(). Supports approximate search with the unaccent extension (strips Vietnamese diacritics).

**Preconditions:**

1. PostgreSQL extensions unaccent and pg_trgm are installed.
2. A GIN index on the SearchVector column has been created.
3. The q parameter is non-empty, minimum 2 characters.

**Main flow (Happy Path):**

1. Client sends GET /api/v1/recipes/search?q=pho+bo&page=1&pageSize=10.
2. SearchRecipesQuery dispatched.
3. Handler builds a tsquery from the search terms: `"pho:* & bo:*"` (prefix matching).
4. Prisma raw query: `prisma.$queryRaw`SELECT * FROM "Recipes" WHERE "searchVector" @@ to_tsquery('vietnamese', ${query}) ORDER BY ts_rank("searchVector", to_tsquery('vietnamese', ${query})) DESC``.
5. Only return Status == Published recipes.
6. Apply pagination; return pagedResult with the relevanceScore field.

**Alternative / Exception flows:**

- A1 – Empty query or < 2 characters: HTTP 422.
- A2 – No results found: HTTP 200 with items = [].

| | |
|---|---|
| HTTP Method & Endpoint | GET /api/v1/recipes/search?q={searchTerm}&page={n}&pageSize={n} |
| HTTP Status Codes | 200 OK – success. 422 – invalid query. |

### FR-SRCH-002/003/004: Filtering, Sorting and Pagination (Summary)

The remaining three FRs of the Search module are built into FR-RCP-001 and FR-SRCH-001.

| FR code | Name | Query params | Description |
|---|---|---|---|
| FR-SRCH-002 | Filter recipes | categoryId, difficulty, maxCookTime, minServings | Filters results; filters combine with AND. |
| FR-SRCH-003 | Sorting | sort={field} (e.g., sort=-createdAt) | "-" prefix = descending. Default: -createdAt. |
| FR-SRCH-004 | Pagination | page={n}, pageSize={n} | Offset-based pagination. Response includes totalCount, totalPages. |

## 3.5. File Management Module (FR-FILE)

This module handles all binary file operations on MinIO S3-compatible storage. The IFileStorageService abstraction layer allows swapping implementations (MinIO ↔ AWS S3 ↔ local filesystem) without changing the Application layer.

| FR code | Name | Description | Technical constraints |
|---|---|---|---|
| FR-FILE-001 | Upload File to MinIO | `s3Client.send(new PutObjectCommand(...))` → string (public URL). Unique filename = `{folder}/{uuid}.{ext}`. | Max size: 5 MB. MIME: JPEG/PNG/WebP/AVIF. Magic bytes validation. Bucket: "culinary-blog". Policy: public-read. |
| FR-FILE-002 | Delete File from MinIO | `s3Client.send(new DeleteObjectCommand(...))`. Usually invoked from a BullMQ background job (fire-and-forget) after deleting a recipe. | If the object does not exist → do not throw (idempotent). Connection errors → BullMQ retry. |

## 3.6. Background Jobs Module (FR-JOB)

This module handles asynchronous background tasks using BullMQ. BullMQ runs with Redis as the queue backend. A dashboard manages jobs (Admin only). Supports 3 job types: Fire-and-forget (run immediately), Delayed (run after N seconds/minutes), and Recurring (cron schedule).

| FR code | Job name | Type | Trigger | Description | Retry policy |
|---|---|---|---|---|---|
| FR-JOB-001 | Welcome Email Job | Fire-and-forget | After FR-AUTH-001 succeeds | Sends an HTML welcome email. Template: user name, application link. | Auto retry 3 times with exponential backoff. |
| FR-JOB-002 | Image Resize / Thumbnail Job | Fire-and-forget | After FR-RCP-008 image upload succeeds | Creates thumbnail (300x300px) and medium image (800x600px). Stores all 3 versions on MinIO. | Retry 3 times. On failure: the original image still displays. |
| FR-JOB-003 | Sitemap Generation Job | Recurring | Daily at 02:00 AM UTC (cron: "0 2 * * *") | Generates sitemap.xml containing URLs of all Published recipes. Uploads to MinIO or saves to wwwroot. Pings Google Search Console. | Retry 2 times on failure. Logs results via Pino. |

## 3.7. System Observability Module (FR-OBS)

This module provides comprehensive observability across three pillars: Logging (Pino), Metrics (OpenTelemetry), and Distributed Tracing (OpenTelemetry). This is a mandatory requirement for production deployments.

| FR code | Name | Description | Technique / Tools |
|---|---|---|---|
| FR-OBS-001 | Health Check Endpoints | 3 endpoints: GET /health (aggregate), GET /health/live (liveness), GET /health/ready (readiness). | `terminus` or a custom health middleware. Liveness always returns healthy. Readiness fails when DB/Redis are down. |
| FR-OBS-002 | Structured Logging | Every HTTP request is logged with: CorrelationId, HTTP method/path/status, elapsed time, UserId. Command bus logging middleware logs all Commands/Queries. | Pino + pino-http. Sinks: Console (structured JSON), File (rolling daily). Log levels: Debug (dev), Information (prod), Warning/Error (always). |
| FR-OBS-003 | Distributed Tracing & Metrics | OpenTelemetry instrumentation for: HTTP request traces, database operation traces, custom business metrics. | `@opentelemetry/sdk-node`, OTLP exporter. Traces exported to Jaeger/Grafana Tempo (production). Metrics: request count, duration histogram, error rate. |