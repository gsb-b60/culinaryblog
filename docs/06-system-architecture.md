# Chapter 6 — System Architecture

Source: `srs.md` lines 1537-1623.

This chapter describes the overall software architecture of the Culinary Blog system. The system is designed on a Client-Server model with two separate tiers: Frontend (Next.js) and Backend (Node.js/Express.js), communicating via a REST API. The backend follows Clean Architecture combined with the CQRS pattern.

## 6.1. Architecture Overview

| Tier | Technology | Role | Communicates with |
|---|---|---|---|
| Client (Browser/Mobile) | Browser (Chrome/Firefox/Safari) | Users interact through the web UI | Next.js App |
| Frontend | Next.js 14+ App Router, TypeScript, Tailwind CSS, Auth.js v5, TanStack Query, React Hook Form + Zod | UI rendering, route management, client-side state. SSR/ISR for SEO. | — |
| Backend REST API (ingress) | Nginx Reverse Proxy — Nginx Alpine (Docker) | SSL termination, load balancing, static file caching, basic rate limiting. | Frontend :3000, Backend API :5000 |
| Backend API | Node.js 20 + Express.js (TypeScript) | Business logic, authentication, data access, background jobs. | PostgreSQL, Redis, MinIO, Email |
| Cache Layer | Redis 7 | Distributed cache for recipe/category/search results. Rate-limiting counters. | Backend API |
| Object Storage | MinIO (S3-compatible) | Stores image files: original, medium (800×600), thumbnail (300×300). | Backend API (via @aws-sdk/client-s3) |
| Database | PostgreSQL 16 | Persistent relational data storage. Full-text search via tsvector. | Backend API (via Prisma) |
| Observability | Pino + Seq, OpenTelemetry + Grafana/Jaeger | Logging, metrics, distributed tracing. | Backend API |

## 6.2. Backend Architecture — Clean Architecture

The backend follows Clean Architecture (Robert C. Martin) with the Dependency Rule: dependencies point inward only (toward Domain). There is never a reference from Domain/Application to Infrastructure.

### Domain Layer (src/domain)

| | |
|---|---|
| Role | System core. |
| Contains | Entities: Recipe, Category, User, RecipeStep, RecipeIngredient, RecipeImage; Value Objects: Slug, EmailAddress; Owned Entities: RecipeNutrition; Domain Events (optional): RecipePublishedEvent; Enums: RecipeDifficulty, RecipeStatus; Interfaces: IRecipeRepository, ICategoryRepository. No npm dependencies. |

### Application Layer (src/application)

| | |
|---|---|
| Role | Orchestration layer. |
| Contains | Commands (CQRS write): CreateRecipeCommand, PublishRecipeCommand, LoginCommand...; Queries (CQRS read): GetRecipesQuery, GetRecipeBySlugQuery...; Handlers (custom command bus): execute the business logic for each command/query; DTOs / Response models: RecipeDto, UserDto, PagedResult<T>; Validators (Zod schemas): validation rules for each command; Pipeline Behaviors: ValidationMiddleware, LoggingMiddleware, CachingMiddleware, PerformanceMiddleware; Service interfaces: IEmailService, IJwtService, IFileStorageService, ICurrentUser. |

### Infrastructure Layer (src/infrastructure)

| | |
|---|---|
| Role | Implements the application interfaces. |
| Contains | Prisma: PrismaService, schema.prisma, migrations, repositories; Repository implementations: RecipeRepository (Prisma + FTS), CategoryRepository; JWT Service: JwtService (jsonwebtoken); File Storage: MinioFileStorageService (@aws-sdk/client-s3); Email: NodemailerEmailService; Cache: RedisCacheService (ioredis); BullMQ job registrations; Prisma Middleware: AuditInterceptor (auto-set CreatedAt/UpdatedAt). |

### Presentation Layer (src/api)

| | |
|---|---|
| Role | HTTP interface. |
| Contains | Express Router modules: AuthRoutes, RecipesRoutes, CategoriesRoutes; Middleware: GlobalErrorHandler, CorrelationIdMiddleware, RateLimitMiddleware; DI Container: Express DI setup + plugin architecture (addApplication, addInfrastructure, addPresentation); OpenAPI: Scalar UI at /scalar, JSDoc/OpenAPI comments; Authentication: JWT Bearer + Google OAuth via Auth.js v5 (frontend) or the passport-google-oauth20 provider. |

## 6.3. CQRS Command Bus Pipeline

CQRS (Command Query Responsibility Segregation) separates the read and write models. Each request flows through the command bus pipeline in the following order:

| Order | Pipeline middleware | Responsibility | Applies to |
|---|---|---|---|
| 1 | LoggingMiddleware | Logs request type, parameters, elapsed time. Warns if > 500ms. | All Commands and Queries |
| 2 | ValidationMiddleware | Runs registered Zod validators. Throws ValidationError on failure. | All Commands and Queries with a Validator |
| 3 | CachingMiddleware | Checks the Redis cache before processing. Requires the Query to implement ICacheable. | Queries implementing ICacheable (GET endpoints) |
| 4 | Handler | Executes business logic: calls repositories, raises domain events, builds response DTOs. | All (mandatory) |
| 5 | CacheInvalidationMiddleware | Deletes related cache after a Command succeeds. Requires implementing ICacheInvalidator. | Data-changing Commands (Create/Update/Delete) |

## 6.4. Entity-Relationship Model (ERD summary)

The system uses PostgreSQL 16 with a Prisma schema. All entities share common fields: Id (UUID), CreatedAt, UpdatedAt, IsDeleted, Version.

| Entity | Relationships | PostgreSQL tables |
|---|---|---|
| Recipe | Many RecipeStep (1:N), Many RecipeIngredient (1:N), Many RecipeImage (1:N), One RecipeNutrition (1:1 Owned), One Category (N:1), One Author/User (N:1) | "recipes", "recipe_steps", "recipe_ingredients", "recipe_images", "recipe_nutrition" (owned — columns within recipes), "categories", "users" |
| User | Many Recipe (Author, 1:N), Many RefreshToken (1:N) | "users", "refresh_tokens" |
| Category | Many Recipe (1:N) | "categories" |
| RefreshToken | One User (N:1) | "refresh_tokens" |

## 6.5. Deployment — Docker Compose

The whole system is containerized with Docker Compose. Development uses docker-compose.yml; production uses docker-compose.prod.yml with an optimized build and secrets management.

| Service | Image | Port (host:container) | Volume / Dependency |
|---|---|---|---|
| nginx | nginx:alpine | 80:80, 443:443 | Depends: api, frontend. Volume: ./nginx/nginx.conf, ./ssl/ |
| api | culinaryblog-api (Dockerfile) | 5000:8080 | Depends: postgres, redis, minio. Env file: .env.production |
| frontend | culinaryblog-web (Dockerfile) | 3000:3000 | Depends: api |
| postgres | postgres:16-alpine | 5432:5432 | Volume: pgdata:/var/lib/postgresql/data. Env: POSTGRES_DB, USER, PASSWORD |
| redis | redis:7-alpine | 6379:6379 | Volume: redisdata:/data. Command: redis-server --appendonly yes |
| minio | minio/minio:latest | 9000:9000, 9001:9001 (Console) | Volume: miniodata:/data. Command: server /data --console-address :9001 |
| seq | datalust/seq:latest | 5341:80 | Volume: seqdata:/data. Dev only — not deployed to production |
| mailhog | mailhog/mailhog | 8025:8025 (UI), 1025:1025 (SMTP) | Dev only — email testing |