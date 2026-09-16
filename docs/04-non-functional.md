# Chapter 4 — Non-Functional Requirements (NFR)

Source: `srs.md` lines 1210-1470.

This section describes the system's quality attributes following the ISO/IEC 25010 (FURPS+) model. Each NFR is assigned an identifier, a priority, and specific quantitative measurement criteria. These NFRs constrain the architectural design and technology choices of the whole system.

| NFR code | Category | # Requirements | Priority |
|---|---|---|---|
| NFR-PERF | Performance | 5 | High |
| NFR-SEC | Security | 6 | Very high |
| NFR-USE | Usability | 4 | Medium |
| NFR-REL | Reliability | 3 | High |
| NFR-MAINT | Maintainability | 4 | Medium |
| NFR-SCALE | Scalability | 3 | High |
| NFR-SEO | SEO | 4 | High |

## 4.1. Performance (NFR-PERF)

All performance metrics are measured in a production environment under real load. The thresholds below apply to a warm-cache scenario (Redis hit rate ≥ 80%).

### NFR-PERF-001: API Response Time

| | |
|---|---|
| Description | API response time: p50 ≤ 150ms for all GET endpoints with cached data; p95 ≤ 500ms for all API endpoints (including write operations); p99 ≤ 1000ms in all cases. |
| Measured by | OpenTelemetry + Grafana / k6 load test. |
| Priority | High |

### NFR-PERF-002: Throughput

| | |
|---|---|
| Description | System handles ≥ 100 concurrent users without degradation. |
| Hardware | 2 vCPU, 4 GB RAM (single instance). Horizontal scaling: adding instances scales linearly. |
| Measured by | k6 smoke test → load test → stress test. |
| Priority | High |

### NFR-PERF-003: Cache Effectiveness

| | |
|---|---|
| Description | Redis cache hit rate ≥ 80% in steady-state. Cached objects: Category list (TTL = 30 min), Recipe detail (TTL = 5 min, cache-aside pattern), Search results (TTL = 1 min). |
| Cache invalidation | Event-driven — invalidate cache on Create/Update/Delete. |
| Priority | High |

### NFR-PERF-004: Database Query

| | |
|---|---|
| Description | All PostgreSQL queries: No N+1 query problem — must use Prisma `include` eager loading and projection; Indexes: every WHERE/ORDER BY column must have a corresponding B-tree index; Slow query log: warn when a query exceeds 100ms (Pino performance behavior); EXPLAIN ANALYZE must pass review before merging. |
| Priority | High |

### NFR-PERF-005: Frontend Performance (Core Web Vitals)

| | |
|---|---|
| Description | The Next.js frontend meets Google Core Web Vitals: LCP ≤ 2.5s; CLS ≤ 0.1; INP ≤ 200ms; First Load JS Bundle ≤ 200KB (gzipped). |
| Technique | ISR (Incremental Static Regeneration), Image Optimization (next/image), Code Splitting. |
| Measured by | Lighthouse CI. |
| Priority | High |

## 4.2. Security (NFR-SEC)

All security requirements comply with OWASP Top 10 (2021) and are verified via a security review before production release.

### NFR-SEC-001: Password & Hashing

| | |
|---|---|
| Description | Passwords must be hashed with `bcrypt` (bcryptjs) or `argon2` with a 16-byte salt, cost factor ≥ 10. Never store plaintext passwords. |
| Policy | Complexity: ≥ 8 characters, at least 1 uppercase + 1 lowercase + 1 digit + 1 special character (Zod password validation scheme). |
| Priority | Very high |

### NFR-SEC-002: JWT Token Security

| | |
|---|---|
| Description | Access Token: JWT signed with HS256 (jsonwebtoken), TTL = 15 min, claims: userId, email, roles, jti. Refresh Token: 128-bit cryptographically secure random bytes (crypto.randomBytes), hashed with SHA-256 (crypto.createHash('sha256')) before storing in DB, TTL = 7 days. |
| Rotation | Refresh token revoked immediately after use, a new token is issued (Refresh Token Rotation). |
| Detection | If a revoked refresh token is used again → revoke the entire family (Reuse Detection). |
| Priority | Very high |

### NFR-SEC-003: Rate Limiting

| | |
|---|---|
| Description | Per-IP request limits to prevent brute force and DDoS: Auth endpoints (/auth/*): 10 requests/min/IP; General API: 100 requests/min/IP; Upload endpoints: 5 requests/min/IP. |
| Implementation | `express-rate-limit` (Fixed Window, sliding window for auth). HTTP 429 when exceeded, with a Retry-After header. |
| Priority | Very high |

### NFR-SEC-004: Input Validation & File Upload Security

| | |
|---|---|
| Description | All input is validated at the Application Layer (Zod) BEFORE processing: SQL Injection — Prisma parameterized queries (no raw SQL with user input); XSS — input sanitization + Content-Security-Policy header; MIME Validation — read magic bytes (don't trust the Content-Type header) on upload; File size — check before reading the stream (multer limits, never buffer the whole file in memory first); Path Traversal — GUID-based filename generation (uuid), never using the user-supplied filename. |
| Priority | Very high |

### NFR-SEC-005: HTTPS & CORS

| | |
|---|---|
| Description | All traffic must go through HTTPS (TLS 1.2+): Nginx redirects HTTP → HTTPS, HSTS header (max-age=31536000). |
| CORS | `cors` package: only allow origins configured via .env (no wildcard `*`). Allowed Origins: http://localhost:3000 (dev), https://domain.com (prod). |
| Cookie | SameSite=Strict, Secure=true (if using a cookie for the refresh token). |
| Priority | Very high |

### NFR-SEC-006: Authorization & Resource Ownership

| | |
|---|---|
| Description | Authorization checks at the Application Layer (not just the Presentation Layer): `authorize(roles)` middleware (Passport.js) verifies ResourceOwnership — an Author can only delete their own recipes; Role-based policies — "AuthorPolicy", "AdminPolicy" (no hardcoded role strings); Sensitive endpoints (DELETE, PATCH publish) — double-check the user ID before committing; Audit trail — log every write operation with userId + timestamp (Pino). |
| Priority | Very high |

### NFR-SEC-007: Secrets Management

| | |
|---|---|
| Description | Never commit secrets to Git: Development — `.env` (dotenv, .env.example contains only placeholders); Production — environment variables (Docker Compose env_file / Kubernetes Secrets); Rotation — recommended JWT signing key rotation every 90 days; Scanning — pre-commit hook checking with truffleHog/gitleaks. |
| Priority | Very high |

## 4.3. Usability (NFR-USE)

### NFR-USE-001: Responsive Design

| | |
|---|---|
| Description | The UI renders correctly at all breakpoints: Mobile — 320px–767px (single column, touch-friendly); Tablet — 768px–1199px (2-column grid); Desktop — ≥ 1200px (full layout). |
| Framework | Tailwind CSS utility-first. No CSS framework overrides. Testing: Chrome DevTools responsive mode + BrowserStack (iOS, Android). |
| Priority | Medium |

### NFR-USE-002: Accessibility (a11y)

| | |
|---|---|
| Description | WCAG 2.1 Level AA compliance: Semantic HTML5 (<article>, <nav>, <main>, <aside>); ARIA attributes (aria-label, aria-expanded, role on interactive elements); Keyboard navigation — all features usable with keyboard (Tab, Enter, Escape); Color contrast ratio ≥ 4.5:1 (text) and ≥ 3:1 (UI components). |
| Screen reader | Test with NVDA (Windows) and VoiceOver (macOS/iOS). |
| Priority | Medium |

### NFR-USE-003: Error Messages

| | |
|---|---|
| Description | Error messages must be clear and actionable: API — return RFC 7807 Problem Details (type, title, status, detail, errors{}); Frontend — display next to the erroring field (React Hook Form inline validation); Server errors (5xx) — show a friendly message, never expose a stack trace; I18n-ready — error messages use error codes (no hardcoded Vietnamese/English strings). |
| Priority | Medium |

### NFR-USE-004: Loading States

| | |
|---|---|
| Description | Every async operation must have visual feedback: Loading skeleton — shown while fetching data (no blank screen); Optimistic update — UI updates immediately, rollback on API failure; Toast notification — confirms success/failure after write operations; Progress indicator — image upload shows a realtime progress bar (%). |
| Priority | Medium |

## 4.4. Reliability (NFR-REL)

### NFR-REL-001: Uptime SLA

| | |
|---|---|
| Description | System uptime ≥ 99.5% (~3.65 hours downtime/year). |
| Policy | Maintenance window — announced 48 hours in advance via a banner; Health check — /health/ready probe every 10 seconds (Kubernetes readiness probe); Monitoring — Uptime Robot / Better Uptime alerts when down > 1 minute. |
| Priority | High |

### NFR-REL-002: Error Handling & Resilience

| | |
|---|---|
| Description | The system handles errors gracefully and never crashes entirely: Global Error Handling Middleware — catches all unhandled errors → returns 500 Problem Details + logs (Pino); Database connection pool — Prisma auto-reconnects, 30s timeout; Redis failover — if Redis is down → fall back to the database (no cache), never throw; BullMQ retry — each job max 3 retries with exponential backoff; Circuit Breaker — (optional advanced) `opossum` or custom for external HTTP calls. |
| Priority | High |

### NFR-REL-003: Data Durability

| | |
|---|---|
| Description | Data is not lost on restart or crash: PostgreSQL WAL (Write-Ahead Logging) — guarantees ACID; Backup — automatic pg_dump daily at 03:00 AM, retained 30 days; MinIO — file data on persistent volumes (not ephemeral container storage); Refresh tokens — stored in DB (not Redis) to survive restarts; Soft delete — Recipe is marked IsDeleted instead of physically deleted (recoverable). |
| Priority | High |

## 4.5. Maintainability (NFR-MAINT)

### NFR-MAINT-001: Code Quality

| | |
|---|---|
| Description | All code must pass static analysis before merge: Node.js/TypeScript — ESLint (Airbnb ruleset), Prettier; no compiler warnings in CI builds (tsc --noEmit); Code review — at least 1 reviewer approves each Pull Request. |
| Priority | Medium |

### NFR-MAINT-002: Test Coverage

| | |
|---|---|
| Description | Minimum test coverage: Unit tests — ≥ 80% line coverage (Application layer commands, queries, validators); Integration tests — every API endpoint has at least 1 happy path + 1 error case; E2E tests — 5 critical user flows (register, login, create recipe, publish, search). |
| Tool | Vitest (backend unit), Jest + Testing Library (frontend), Playwright (E2E). |
| Priority | Medium |

### NFR-MAINT-003: Documentation

| | |
|---|---|
| Description | Mandatory technical documentation: README.md — dev environment setup guide (Docker Compose) in < 5 minutes; API documentation — auto-generated from JSDoc/OpenAPI comments + Scalar/Swagger UI at /scalar; Architecture Decision Records (ADR) — records every important architecture decision; CHANGELOG.md — updated every release (Keep a Changelog + SemVer). |
| Priority | Medium |

### NFR-MAINT-004: Clean Architecture Compliance

| | |
|---|---|
| Description | Strict adherence to Clean Architecture dependency rules: Domain layer — NO dependency on any other layer, no npm packages beyond Zod; Application layer — depends only on Domain, does NOT reference Infrastructure; Infrastructure layer — depends on Application (implements interfaces). |
| CQRS | Commands change state, Queries read data — never mixed. |
| Verification | Dependency rules verified via custom ESLint rule / ts-prune / dependency-cruiser in CI. |
| Priority | Medium |

## 4.6. Scalability (NFR-SCALE)

### NFR-SCALE-001: Stateless Backend

| | |
|---|---|
| Description | The API is designed to be stateless to support horizontal scaling: JWT authentication (jsonwebtoken, no server-side sessions); distributed cache (Redis, not in-memory node-cache) for all shared state; distributed lock (`redlock`) for singleton tasks (sitemap generation); BullMQ runs with multiple workers, Redis as the shared queue. |
| Priority | High |

### NFR-SCALE-002: Database Scaling

| | |
|---|---|
| Description | Database scaling strategy: Connection pooling — pg-pool built-in pool (max 100 connections/instance); Read replica (optional) — Prisma read/write splitting via multi-client setup; Index strategy — B-tree for equality/range, GIN for full-text search (tsvector); Table partitioning — (advanced) partition Recipe by CreatedAt when > 1 million rows. |
| Priority | High |

### NFR-SCALE-003: Infrastructure Scaling

| | |
|---|---|
| Description | Infrastructure can scale horizontally: Docker — each service is a separate container (API, Postgres, Redis, MinIO, Nginx); Nginx — load balancer upstream pool for multiple API instances; MinIO — Distributed Mode (4+ nodes) for production storage scaling; CDN — static assets (Next.js `_next/static`) served via CDN (Cloudflare). |
| Priority | High |

## 4.7. SEO Optimization (NFR-SEO)

### NFR-SEO-001: Structured Data

| | |
|---|---|
| Description | Every recipe page must have JSON-LD Schema.org Recipe markup: @type: "Recipe"; attributes: name, description, image, author, datePublished, prepTime, cookTime, totalTime, recipeYield, recipeIngredient[], recipeInstructions[], nutrition. |
| Validate | Google Rich Results Test — must pass 100%. Result: Rich Snippets on Google Search (star rating, time, ingredients). |
| Priority | High |

### NFR-SEO-002: Meta Tags & Open Graph

| | |
|---|---|
| Description | Every page must have: <title> — "{Recipe Name} | Culinary Blog" (≤ 60 chars); <meta name="description"> — 150–160 char description; Open Graph — og:title, og:description, og:image (1200×630px), og:url, og:type; Twitter Card — summary_large_image; Canonical URL — avoids duplicate content (slug-based URL); Robots — index, follow (published) | noindex (draft/archived). |
| Priority | High |

### NFR-SEO-003: Sitemap & Robots

| | |
|---|---|
| Description | Automatic XML sitemap: Generated by FR-JOB-003 (BullMQ Recurring Job, daily at 02:00 AM UTC); includes all Published recipes + category pages + static pages; format: standard sitemap.xml with <loc>, <lastmod>, <changefreq>, <priority>; Robots.txt — allows all crawlers, declares the Sitemap URL; pings Google Search Console after updating the sitemap. |
| Priority | High |

### NFR-SEO-004: URL Structure

| | |
|---|---|
| Description | URLs must be SEO-friendly: Recipes — /recipes/{slug}, slug lowercased, hyphenated, no diacritics; Categories — /categories/{slug}; Slug generation — auto from title (slugify), unique, never changes after publish; Redirect — if the slug changes (draft) → 301 redirect from the old slug to the new; no query params for primary content (used only for filter/sort/pagination). |
| Priority | High |