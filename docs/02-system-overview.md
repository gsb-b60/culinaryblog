# Chapter 2 — System Overview

Source: `srs.md` lines 119-265.

## 2.1. Product Context

### 2.1.1. Position in the Ecosystem

Culinary Blog operates on an API-Driven Architecture model, in which the Backend (Node.js/Express.js) and Frontend (Next.js) are two independent systems communicating entirely over HTTP/JSON RESTful API. There is no traditional server-side rendering or shared view engine between the two tiers.

System context diagram:

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

**Figure 2.1.** Culinary Blog system context diagram

### 2.1.2. Relationship with External Systems

| External System | Role | Protocol / Standard | Integration Direction |
|---|---|---|---|
| PostgreSQL 16 | Primary relational database (RDBMS) | TCP + pg / Prisma Client | Backend → PostgreSQL |
| Redis 7 | Distributed Cache & Session Store | TCP + ioredis | Backend → Redis |
| MinIO (S3) | Object storage for recipe images | HTTP/S3 API + @aws-sdk/client-s3 | Backend → MinIO |
| Google OAuth 2.0 | Third-party login (Identity Provider) | HTTPS + OpenID Connect | Client ↔ Google ↔ Backend |
| BullMQ | Background job processing | Redis as queue backend | Backend (internal) |
| Pino / Seq | Structured log aggregation (development) | HTTP Sink → Seq | Backend → Seq |
| OpenTelemetry Collector | Distributed tracing & metrics (production) | OTLP / gRPC | Backend → Collector |
| Nginx (Reverse Proxy) | SSL termination, load balancing, static serving | HTTP/HTTPS | Client → Nginx → Services |

## 2.2. Product Functionality Summary

Culinary Blog provides 7 main functional groups, implemented through 27 detailed Functional Requirements in Chapter 3:

| Functional group | Group code | # FRs | Summary |
|---|---|---|---|
| Authentication & User Management | FR-AUTH | 7 | Registration, login (email + Google), JWT refresh token, logout, profile management. |
| Category Management | FR-CAT | 5 | CRUD of recipe categories — Admin permission. |
| Recipe Management | FR-RCP | 10 | Recipe CRUD, publish/archive, image/step/ingredient management. |
| Search & Pagination | FR-SRCH | 4 | Full-Text Search (PostgreSQL), filter, sort, offset pagination. |
| File Management | FR-FILE | 2 | Upload/Delete images on MinIO S3-compatible. |
| Background Jobs | FR-JOB | 3 | Welcome email, thumbnail generation, sitemap XML (BullMQ). |
| System Observability | FR-OBS | 3 | Health checks, structured logging, distributed tracing. |

## 2.3. User Classes and Characteristics

The system defines 3 actor types with different permissions:

| Role | Description | Condition | Main permissions | Service priority |
|---|---|---|---|---|
| Guest (Anonymous) | Unauthenticated users accessing the app without an account. | No account required | View recipe list & details (Published only), view categories, search. MUST NOT create/edit/delete. | High (the vast majority of users) |
| Author | Registered users who authenticated successfully. Auto-assigned on registration. | Valid account & JWT | Everything a Guest can do + Create/edit/delete OWN recipes + upload images, manage steps/ingredients + publish/archive own recipes. | High (content producers) |
| Admin | System managers with the highest privileges. Assigned manually via database seeding. | Valid account & Admin role | Everything an Author can do + Manage (CRUD) categories + edit/delete any Author's recipes + access BullMQ Dashboard (bull-board) + view structured logs. | Medium (small count) |

**Authorization note:** The system implements 3 authorization tiers: (1) **Role-Based Authorization** — permissions differ by role (Guest/Author/Admin). (2) **Resource-Based Authorization** — an Author may only edit/delete their own recipes (`AuthorId == currentUserId`). (3) **Policy-Based Authorization** — the "VerifiedAuthor" policy requires a confirmed email. Admin may bypass the resource ownership check.

## 2.4. Operating Environment

### 2.4.1. Server Environment (Production)

| Component | Minimum requirement | Recommended | Notes |
|---|---|---|---|
| Operating system | Linux Ubuntu 22.04 LTS / Debian 12 | Ubuntu 22.04 LTS / Debian 12 | Docker must be installed |
| Node.js runtime | Node.js 20 LTS (node:20-alpine) | Node.js 20.x latest patch | Provided via Docker image node:20-alpine |
| Node.js (build only) | Node.js 20 LTS | Node.js 22 LTS | Only needed when building Next.js; production uses standalone output |
| PostgreSQL | PostgreSQL 16.x | PostgreSQL 16.x | Required extensions: unaccent, pg_trgm |
| Redis | Redis 7.x | Redis 7.2.x | Persistent mode with AOF |
| MinIO | MinIO RELEASE.2024+ | MinIO latest stable | Bucket policy: public-read for recipe images |
| Docker | Docker Engine 24.x | Docker Engine 27.x + Compose v2 | Docker Compose for local dev and staging |
| Nginx | Nginx 1.24+ | Nginx 1.26+ (stable) | Reverse proxy, SSL termination |
| RAM | 4 GB minimum | 8 GB+ | More RAM needed if Redis cache grows large |
| CPU | 2 vCPU minimum | 4 vCPU+ | CPU-intensive: FTS indexing, image processing |
| Disk | 20 GB SSD minimum | 50 GB+ SSD | MinIO object storage consumes lots of disk |

### 2.4.2. Development Environment

| Component | Requirement |
|---|---|
| Node.js | Node.js 20+ LTS with npm 10+ |
| Docker Desktop | Docker Desktop 4.x+ (Windows/macOS) or Docker Engine (Linux) — to run PostgreSQL, Redis, MinIO locally |
| IDE / Editor | VS Code (with ESLint, Prettier extensions) / WebStorm |
| Git | Git 2.40+ with Git LFS (if storing large assets) |
| Postman / Scalar | Postman or Scalar UI (built-in, served at /scalar) to test the API |

### 2.4.3. Client Browser Requirements

| Browser | Minimum version | Notes |
|---|---|---|
| Google Chrome | 90+ | Primary recommendation — best for Developer Tools |
| Mozilla Firefox | 88+ | Fully supported |
| Microsoft Edge | 90+ (Chromium) | Fully supported (Chromium-based) |
| Safari | 14+ (macOS 11+) | Fully supported; Safari 13 and below NOT guaranteed |
| Mobile Chrome (Android) | 90+ | Responsive design, touch-friendly |
| Mobile Safari (iOS) | iOS 14+ | Fully supported |
| Internet Explorer | Any version | Not supported (EOL) |

## 2.5. Design and Implementation Constraints

The following constraints are mandatory and non-negotiable throughout development:

| Constraint code | Type | Constraint description |
|---|---|---|
| CONS-001 | Architecture | Backend MUST follow Clean Architecture with 4 separate layers: Domain, Application, Infrastructure, Presentation. The Domain layer must not depend on any external library. |
| CONS-002 | Pattern | CQRS with an in-house command bus is the mandatory pattern for the Application layer. Each use case is implemented as a separate Command or Query Handler. |
| CONS-003 | Language / Framework | Backend: Node.js/Express.js (TypeScript, no MVC framework). Frontend: Next.js App Router (no Pages Router). |
| CONS-004 | Security | Authentication MUST use stateless JWT (15-minute access token, 7-day refresh token). Passwords MUST be hashed with bcrypt (Argon2id). |
| CONS-005 | API Design | API MUST follow RESTful design. Error responses MUST follow RFC 7807 (application/problem+json). API versioning via URL path (/api/v1/). |
| CONS-006 | Database | PostgreSQL is the only DBMS. Migrations via Prisma Migrate. No raw SQL written directly (use Prisma Client, or parameterized Raw SQL through Prisma `$queryRaw`). |
| CONS-007 | File Upload | Max upload size 5 MB. Accepted formats: image/jpeg, image/png, image/webp, image/avif only. Validate MIME type (not just extension). |
| CONS-008 | Validation | Input validation MUST go through Zod combined with command bus pipeline middleware. No validation inside route handlers. |
| CONS-009 | Container | The app MUST be packaged in Docker. Multi-stage Dockerfile (builder → node:20-alpine runtime). Docker Compose for local development. |
| CONS-010 | Logging | Structured logging with Pino is mandatory. Every log entry MUST have CorrelationId, RequestPath, and UserId (when authenticated). |

## 2.6. Assumptions and Dependencies

### 2.6.1. Assumptions

- The development environment has an Internet connection to pull Docker images and npm packages.
- PostgreSQL, Redis, and MinIO are provided via Docker Compose in development, and as managed services (or VPS) in production.
- End users have modern browsers and a sufficiently stable Internet connection to load images from MinIO.
- Seed data is generated with the @faker-js/faker library: 50 sample recipes and 5 sample authors.
- An email service (SendGrid or SMTP) is configured before production deployment to send welcome emails.
- Expected initial data scale: ≤ 10,000 recipes, ≤ 5,000 users, ≤ 50 categories — fits a single-server deployment.

### 2.6.2. External Dependencies

| Dependency | Version | Impact if unavailable | Contingency plan |
|---|---|---|---|
| Google OAuth 2.0 API | v2 (OpenID Connect) | High — Google login lost | Email/password login still works. Show "Google login temporarily unavailable" message. |
| MinIO / S3 | MinIO RELEASE.2024+ | High — cannot upload/view images | Fallback to local FileSystem storage (development only). Production requires MinIO. |
| Redis | 7.x | Medium — cache lost, performance degrades | System continues working but every request hits the database. Cache-miss graceful degradation. |
| PostgreSQL | 16.x | Very high — entire system stops | Periodic backups (pg_dump). Readiness probe will fail, Nginx returns 503. |
| BullMQ (via Redis) | latest | Low — background jobs don't run | Fire-and-forget jobs are lost; recurring jobs skip a cycle. No impact on core functionality. |