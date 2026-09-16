# Chapter 5 — External Interfaces

Source: `srs.md` lines 1471-1536.

This chapter describes all interfaces between the Culinary Blog system and external entities: end users, hardware, third-party software, and network communication. All communication goes over HTTPS (TLS 1.2+) in production.

## 5.1. User Interface (UI)

The system provides a single web interface built on the Next.js App Router, operating as a Single Page Application (SPA) with Server-Side Rendering (SSR) and Incremental Static Regeneration (ISR).

| Screen / Route | Description | Rendering type | Auth required |
|---|---|---|---|
| / | Home page: featured recipes + categories | ISR (revalidate=3600) | No |
| /recipes | All recipes list with filter/sort/search | SSR (dynamic) | No |
| /recipes/[slug] | Recipe detail: ingredients, steps, nutrition, JSON-LD | ISR (revalidate=300) | No |
| /categories | Category list | ISR (revalidate=3600) | No |
| /categories/[slug] | Recipes by category | ISR (revalidate=600) | No |
| /auth/login | Login form (email/password + Google OAuth button) | CSR | No (redirect if already logged in) |
| /auth/register | New account registration form | CSR | No |
| /dashboard | Author/Admin overview page | CSR | Required (Author/Admin) |
| /dashboard/recipes | Manage the user's recipes | CSR | Required |
| /dashboard/recipes/new | New recipe form (multi-step wizard) | CSR | Required (Author/Admin) |
| /dashboard/recipes/[id]/edit | Recipe edit form | CSR | Required (Owner/Admin) |
| /dashboard/categories | Category management (Admin only) | CSR | Required (Admin) |
| /profile | View and edit personal info | CSR | Required |
| /search | Full-text search results page | SSR | No |

## 5.2. Software Interface — REST API

The backend provides a RESTful JSON API. All endpoints are prefixed with /api/v1. See Chapter 8 for details.

| Specification | Value |
|---|---|
| Protocol | HTTP/1.1 and HTTP/2 over HTTPS (TLS 1.2+). Nginx SSL termination. |
| Base URL (dev) | http://localhost:5000/api/v1 |
| Base URL (prod) | https://api.culinaryblog.com/api/v1 |
| Content-Type | application/json; charset=utf-8 (request and response). Multipart/form-data for file upload endpoints. |
| Authentication | Bearer Token in the Authorization header: `Authorization: Bearer <access_token>`. Refresh token: in the request body (not cookies, to avoid CSRF). |
| Response format | Success: `{ "data": {...}, "meta": { "page":1, "pageSize":10, "total":100 } }`. Error: RFC 7807 Problem Details `{ "type", "title", "status", "detail", "errors":{} }`. |
| Versioning | URL path versioning: /api/v1/. On breaking changes → /api/v2/ (v1 maintained for at least 6 months). |
| CORS headers | Access-Control-Allow-Origin: <configured-origins>; Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS; Access-Control-Allow-Headers: Content-Type, Authorization, X-Correlation-ID. |
| Rate limit headers | X-RateLimit-Limit: 100; X-RateLimit-Remaining: 87; X-RateLimit-Reset: 1700000000 (Unix timestamp); Retry-After: 30 (seconds, when 429). |
| Correlation ID | X-Correlation-ID header: auto-generated if absent from the request, returned in the response. Attached to all log entries (Pino bindings — logger.child({ correlationId })). |

## 5.3. Third-Party Service Interfaces

| Service | Purpose | Protocol / SDK | Configuration / Secrets |
|---|---|---|---|
| Google OAuth 2.0 | Login / registration with Google accounts | OAuth 2.0 Authorization Code + PKCE (`passport-google-oauth20`). Redirect URI: /api/v1/auth/google/callback. Scopes: openid, email, profile. | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (.env / env var). Google Cloud Console → OAuth 2.0 Client ID. |
| MinIO (S3-compatible) | Recipe image file storage | AWS SDK for JavaScript (@aws-sdk/client-s3, @aws-sdk/s3-request-presigner). Endpoint override for MinIO. Presigned URL for direct browser upload (optional). | MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET_NAME. Docker service: minio:9000. |
| BullMQ | Background job processing | npm: bullmq + ioredis. Workers run in a separate process. Dashboard: /admin/queues (Admin only, policy protected). | REDIS_URL shared with Redis. UI library: bull-board. |
| Pino + Seq | Structured logging & log aggregation | pino, pino-http, transport to the Seq HTTP ingest API. | SEQ_SERVER_URL = http://seq:5341 (Docker). Production: Elastic / Grafana Loki. |
| OpenTelemetry | Distributed tracing & metrics | @opentelemetry/sdk-node, OTLP exporter. Tracing: HTTP requests, Prisma, Express middleware. | OTEL_EXPORTER_OTLP_ENDPOINT. Development: Seq OTLP. Production: Grafana Tempo / Jaeger. |
| SMTP / Email | Sends welcome email (FR-JOB-001) | `nodemailer` (IEmailSender). SMTP connection over TLS. | SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD. Development: Mailhog (Docker). |
| Google Search Console | Ping sitemap update | HTTP GET: https://www.google.com/ping?sitemap={url}. No API key needed. Called in FR-JOB-003. | — |

## 5.4. Hardware Interface

The system is a web application and does not communicate directly with specialized hardware. Minimum server hardware requirements:

| Component | Development (local) | Production (minimum) |
|---|---|---|
| CPU | 2 cores (Intel/AMD/ARM64 — Apple M-series supported via Docker) | 2 vCPU (VPS/Cloud instance, x86_64) |
| RAM | 8 GB (runs full Docker Compose: API + PG + Redis + MinIO + Seq) | 4 GB (API + dependencies separately) |
| Storage | 20 GB SSD (Docker images + database data + MinIO volumes) | 50 GB SSD (production data growth) |
| Network | Internet connection (npm packages, Google OAuth) | Bandwidth ≥ 1 Gbps, static IP |
| Browser client | Chrome 112+, Firefox 113+, Safari 16+, Edge 112+ (ES2020+) | Same — IE11 not supported |