# Technology Stack & Architecture

Consolidated reference for the Culinary Blog platform. This doc synthesizes the stack and architecture scattered across the other sub-docs; for deep detail see the cross-linked files.

- Related docs: [02-system-overview.md](./02-system-overview.md), [04-non-functional.md](./04-non-functional.md), [05-external-interfaces.md](./05-external-interfaces.md), [06-system-architecture.md](./06-system-architecture.md), [07-data-model.md](./07-data-model.md), [08-rest-api.md](./08-rest-api.md)

## Part 1 — Technology Stack

### Backend (Node.js / Express)

- **Runtime**: Node.js 20 LTS (`node:20-alpine` docker image) — [02-system-overview §2.4](./02-system-overview.md), [06-system-architecture](./06-system-architecture.md)
- **Language**: TypeScript, strict mode, `tsc --noEmit` in CI — [04-non-functional §NFR-MAINT-001](./04-non-functional.md)
- **HTTP Framework**: Express.js v4+, no MVC framework — [02-system-overview CONS-003](./02-system-overview.md)
- **Architecture Pattern**: Clean Architecture (4 layers) + CQRS custom command bus — Domain / Application / Infrastructure / Presentation — [06-system-architecture §6.2](./06-system-architecture.md), §6.3
- **ORM**: Prisma — Client, Migrate, `$transaction`, `$queryRaw` for FTS — [02-system-overview CONS-006](./02-system-overview.md), [03-fr-misc FR-SRCH-001](./03-fr-misc.md)
- **Database**: PostgreSQL 16.x — extensions `unaccent` + `pg_trgm`, `tsvector`/`tsquery` FTS — [02-system-overview §2.4.1](./02-system-overview.md)
- **Auth**: Passport.js — `passport-local`, `passport-google-oauth20` (OAuth2 Authorization Code + PKCE) — [05-external-interfaces §5.3](./05-external-interfaces.md)
- **JWT**: jsonwebtoken — HS256, access token TTL 15 min, claims: userId, email, roles, jti — [04-non-functional §NFR-SEC-002](./04-non-functional.md)
- **Password Hashing**: bcryptjs + argon2 — salt 16 bytes, cost factor ≥ 10 — [04-non-functional §NFR-SEC-001](./04-non-functional.md)
- **Validation**: Zod — schemas run via command-bus ValidationMiddleware (no route-handler validation) — [02-system-overview CONS-008](./02-system-overview.md)
- **Cache**: Redis 7 + ioredis — distributed cache, rate-limit counters, BullMQ backend — [05-external-interfaces §5.3](./05-external-interfaces.md)
- **In-Process Cache**: node-cache — category list cache, TTL 60 min — [03-fr-catalog FR-CAT-001](./03-fr-catalog.md)
- **Object Storage**: MinIO (S3-compatible) — `@aws-sdk/client-s3`, bucket `culinary-blog`, public-read — [05-external-interfaces §5.3](./05-external-interfaces.md)
- **Background Jobs**: BullMQ — Redis backend, fire-and-forget / delayed / recurring; dashboard via bull-board (Admin) — [03-fr-misc §3.6](./03-fr-misc.md)
- **File Upload**: multer — limits, magic-bytes MIME validation, max 5 MB, JPEG/PNG/WebP/AVIF — [02-system-overview CONS-007](./02-system-overview.md)
- **Logging**: Pino + pino-http — structured JSON, CorrelationId/RequestPath/UserId bindings — [02-system-overview CONS-010](./02-system-overview.md)
- **Log Aggregation**: Seq (dev) / Elastic or Grafana Loki (prod) — HTTP sink to Seq at `http://seq:5341` — [05-external-interfaces §5.3](./05-external-interfaces.md)
- **Tracing & Metrics**: OpenTelemetry — `@opentelemetry/sdk-node`, OTLP exporter → Grafana Tempo / Jaeger — [03-fr-misc §3.7](./03-fr-misc.md)
- **Rate Limiting**: express-rate-limit — auth 10/min/IP, general 100/min/IP, upload 5/min/IP — [04-non-functional §NFR-SEC-003](./04-non-functional.md)
- **Email**: nodemailer — IEmailSender, SMTP over TLS — [05-external-interfaces §5.3](./05-external-interfaces.md)
- **Health Checks**: terminus / custom middleware — `/health`, `/health/live`, `/health/ready` — [03-fr-misc §3.7](./03-fr-misc.md)
- **Error Responses**: RFC 7807 — `application/problem+json` Problem Details — [02-system-overview CONS-005](./02-system-overview.md)
- **API Docs**: Scalar UI — auto-generated at `/scalar` from JSDoc/OpenAPI comments — [06-system-architecture §6.2 Presentation](./06-system-architecture.md)

### Frontend (Next.js)

- **Framework**: Next.js App Router (14+, no Pages Router) — [02-system-overview CONS-003](./02-system-overview.md)
- **Language**: TypeScript — [README](./README.md)
- **Styling**: Tailwind CSS — utility-first, no overrides — [04-non-functional §NFR-USE-001](./04-non-functional.md)
- **Auth**: Auth.js v5 — Google OAuth callback handling on the frontend — [05-external-interfaces §5.3](./05-external-interfaces.md), [06-system-architecture §6.1](./06-system-architecture.md)
- **Server State**: TanStack Query — caching, background refetch, optimistic updates — [06-system-architecture §6.1](./06-system-architecture.md)
- **Forms**: React Hook Form + Zod — inline validation, error messages beside fields — [04-non-functional §NFR-USE-003](./04-non-functional.md)
- **Rendering**: SSR / ISR / CSR — SSR dynamic routes, ISR with revalidate intervals, CSR dashboard — [05-external-interfaces §5.1](./05-external-interfaces.md)

### Testing & Quality

- **Backend Unit Tests**: Vitest (≥ 80% line coverage, Application layer)
- **Frontend Tests**: Jest + Testing Library
- **E2E**: Playwright (5 critical flows)
- **Load Testing**: k6 (smoke → load → stress)
- **Perf/SEO Checks**: Lighthouse CI
- **Static Analysis**: ESLint (Airbnb), Prettier, `tsc --noEmit`, dependency-cruiser/ts-prune
- **Security Scanning**: truffleHog / gitleaks pre-commit hooks

Source: [04-non-functional](./04-non-functional.md) §NFR-MAINT-001/002, §NFR-PERF-002/005, §NFR-SEC-007.

### Infrastructure & Deployment

- **Containerization**: Docker multi-stage build (`builder` → `node:20-alpine`) — [02-system-overview CONS-009](./02-system-overview.md)
- **Orchestration (dev)**: Docker Compose — [06-system-architecture §6.5](./06-system-architecture.md)
- **Reverse Proxy**: Nginx (reverse proxy, SSL termination, load balancer) — [06-system-architecture §6.1](./06-system-architecture.md)
- **CDN**: Cloudflare (static assets `_next/static`) — [04-non-functional §NFR-SCALE-003](./04-non-functional.md)
- **Monitoring**: Uptime Robot / Better Uptime, Grafana — [04-non-functional §NFR-REL-001](./04-non-functional.md)

## Part 2 — Architecture Summary

### 2.1. System Context

Culinary Blog runs on an API-Driven Architecture: two independent systems (Next.js frontend and Node.js/Express backend) communicate purely over HTTP/JSON REST APIs. No shared view engine or traditional SSR coupling between tiers.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CULINARY BLOG SYSTEM                         │
│                                                                 │
│   ┌──────────────────┐        ┌───────────────────────────────┐  │
│   │  NEXT.JS FRONTEND│◄──────►│  NODE.JS/EXPRESS API         │  │
│   │  (App Router)    │  REST  │  (Express.js + Clean Arch)    │  │
│   │  Port: 3000      │  JSON  │  Port: 5000                  │  │
│   └──────────────────┘        └──────────────┬────────────────┘  │
│                                             │                  │
│   ┌──────┐ ┌────────┐  ┌────────┐  ┌────────┐ ┌───────────┐   │
│   │ Pgsql│ │ Redis  │  │ MinIO  │  │ BullMQ │ │Google Auth│   │
│   │:5432 │ │:6379   │  │:9000   │  │ Jobs   │ │ OAuth2.0  │   │
│   └──────┘ └────────┘  └────────┘  └────────┘ └───────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

Source: [02-system-overview §2.1.1](./02-system-overview.md)

### 2.2. Backend Clean Architecture

The backend follows the Clean Architecture (Robert C. Martin) Dependency Rule: dependencies point inward only, toward Domain. Domain/Application never reference Infrastructure.

- **Domain** (`src/domain`) — Entities (Recipe, Category, User, RecipeStep, RecipeIngredient, RecipeImage), Value Objects (Slug, EmailAddress), Owned Entity (RecipeNutrition), Enums (RecipeDifficulty, RecipeStatus), repository interfaces. No npm dependencies.
- **Application** (`src/application`) — CQRS Commands/Queries, Handlers, DTOs (`PagedResult<T>`), Zod Validators, pipeline behaviors, service interfaces (IEmailService, IJwtService, IFileStorageService, ICurrentUser).
- **Infrastructure** (`src/infrastructure`) — Prisma service/repos/migrations, JwtService, MinioFileStorageService, NodemailerEmailService, RedisCacheService, BullMQ jobs, AuditInterceptor middleware.
- **Presentation** (`src/api`) — Express routers (Auth, Recipes, Categories), middleware (GlobalErrorHandler, CorrelationId, RateLimit), DI container, Scalar/OpenAPI, JWT + Google OAuth wiring.

Source: [06-system-architecture §6.2](./06-system-architecture.md)

### 2.3. CQRS Command Bus Pipeline

Every request flows through ordered pipeline middleware:

1. **LoggingMiddleware** — Logs request type/params/elapsed time; warns > 500ms. *Applies to: All Commands & Queries.*
2. **ValidationMiddleware** — Runs registered Zod validators; throws ValidationError. *Applies to: Commands/Queries with validators.*
3. **CachingMiddleware** — Checks Redis cache before handling. *Applies to: Queries implementing `ICacheable` (GET).*
4. **Handler** — Executes business logic, calls repositories, builds DTOs. *Applies to: All (mandatory).*
5. **CacheInvalidationMiddleware** — Deletes related cache after success. *Applies to: Data-changing Commands.*

Source: [06-system-architecture §6.3](./06-system-architecture.md)

### 2.4. Caching & Rendering Strategy

- **Category List** — node-cache, key `categories:all`, TTL 60 min
- **Recipe Detail (API)** — cache-aside via Redis, TTL 5 min (60 min per FR-RCP-002)
- **Recipe List (API)** — apicache, TTL 15 min
- **Search Results** — Redis, TTL 1 min
- **Cache Invalidation** — Event-driven on Create/Update/Delete (command bus middleware)
- **Frontend Pages** — ISR revalidate: home 3600s, recipe detail 300s, category 600s; dashboard/profile CSR
- **Image Optimization** — `next/image`, ISR; images served from MinIO via CDN

Sources: [04-non-functional §NFR-PERF-003](./04-non-functional.md), [05-external-interfaces §5.1](./05-external-interfaces.md)

### 2.5. Deployment Topology (Docker Compose)

- **nginx** (`nginx:alpine`) — Ports `80:80`, `443:443`. Depends api + frontend; SSL termination, load balancer.
- **api** (`culinaryblog-api`) — Port `5000:8080`. Depends postgres, redis, minio.
- **frontend** (`culinaryblog-web`) — Port `3000:3000`. Depends api.
- **postgres** (`postgres:16-alpine`) — Port `5432:5432`. Volume `pgdata`.
- **redis** (`redis:7-alpine`) — Port `6379:6379`. Volume `redisdata`; AOF enabled.
- **minio** (`minio/minio:latest`) — Ports `9000:9000`, `9001:9001` (console). Volume `miniodata`.
- **seq** (`datalust/seq:latest`) — Port `5341:80`. Dev only.
- **mailhog** (`mailhog/mailhog`) — Ports `8025:8025` (UI), `1025:1025` (SMTP). Dev only.

Source: [06-system-architecture §6.5](./06-system-architecture.md)

### 2.6. Key Architecture Decisions (summary)

- **API-driven, stateless backend** — JWT auth, Redis for shared state, horizontal scaling. ([04-non-functional §NFR-SCALE-001](./04-non-functional.md))
- **CQRS + custom command bus** — mandatory for the Application layer. ([02-system-overview CONS-002](./02-system-overview.md))
- **Prisma as the single data-access path** — no raw SQL with user input; PostgreSQL-only. ([02-system-overview CONS-006](./02-system-overview.md))
- **RFC 7807 errors + versioned URL paths** (`/api/v1/`). ([02-system-overview CONS-005](./02-system-overview.md))
- **Soft delete + optimistic concurrency** via `IsDeleted` / `Version` on all entities. ([07-data-model §7.1](./07-data-model.md))
- **Docker containerization** — multi-stage build; Compose for dev. ([02-system-overview CONS-009](./02-system-overview.md))
