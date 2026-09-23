# LetHimCook Backend API

Clean Architecture backend for Culinary Blog built with Node.js, Express, TypeScript, and Prisma.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 10+
- Docker (for PostgreSQL, Redis, MinIO)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Infrastructure
```bash
# From project root
docker-compose up -d

# Verify services
docker-compose ps
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Setup Database
```bash
# Generate Prisma Client
pnpm prisma:generate

# Push schema to database
pnpm db:push

# Seed with sample data
pnpm prisma:seed
```

### 5. Start Development Server
```bash
pnpm dev
```

Server runs at `http://localhost:3000` (or configured PORT)

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start with hot reload (tsx watch) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run production build |
| `pnpm test` | Run tests with Vitest |
| `pnpm test:watch` | Watch mode for tests |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm format` | Format with Prettier |
| `pnpm prisma:generate` | Generate Prisma Client |
| `pnpm prisma:migrate` | Run migrations |
| `pnpm prisma:studio` | Open Prisma Studio GUI |
| `pnpm prisma:seed` | Seed database |
| `pnpm db:push` | Push schema changes |
| `pnpm deps:check` | Check dependency rules |

---

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── domain/                 # Enterprise Business Rules
│   ├── entities/           # Recipe, Category, User, Step, Ingredient, Image
│   ├── value-objects/      # Slug, EmailAddress
│   ├── enums/              # RecipeDifficulty, RecipeStatus, UserRole
│   ├── repositories/       # Repository interfaces (IRecipeRepository, etc.)
│   └── events/             # Domain events
│
├── application/            # Application Business Rules
│   ├── commands/           # CQRS Write (CreateRecipeCommand, etc.)
│   ├── queries/            # CQRS Read (GetRecipesQuery, etc.)
│   ├── handlers/           # Command/Query handlers
│   ├── dtos/               # Data Transfer Objects
│   ├── validators/         # Zod validation schemas
│   ├── pipelines/          # Command bus middleware
│   └── interfaces/         # Service interfaces (IEmailService, etc.)
│
├── infrastructure/         # Frameworks & Drivers
│   ├── persistence/        # Prisma repositories
│   ├── auth/               # JWT, Password, Passport strategies
│   ├── file-storage/       # MinIO S3 service
│   ├── email/              # Nodemailer service
│   ├── cache/              # Redis cache service
│   ├── jobs/               # BullMQ queues & workers
│   └── health/             # Health check service
│
├── presentation/           # Interface Adapters
│   ├── routes/             # Express routers
│   ├── middleware/         # Error handling, auth, rate limit
│   ├── di/                 # Dependency injection container
│   └── docs/               # OpenAPI/Scalar setup
│
└── index.ts                # Application entry point
```

### Key Patterns

- **CQRS**: Commands (write) vs Queries (read) separation
- **Command Bus**: Pipeline middleware (Logging → Validation → Caching → Handler → CacheInvalidation)
- **Repository Pattern**: Domain depends on interfaces, Infrastructure implements them
- **Dependency Injection**: Centralized container with plugin architecture
- **Soft Delete**: `isDeleted` flag on all entities
- **Optimistic Locking**: `version` field for concurrency control

---

## 🗄️ Database Schema

### Core Models

| Model | Description |
|-------|-------------|
| `User` | Accounts with roles (GUEST/AUTHOR/ADMIN) |
| `RefreshToken` | JWT refresh tokens (hashed, rotatable) |
| `Category` | Recipe categories with slugs |
| `Recipe` | Aggregate root with nutrition, steps, ingredients, images |
| `RecipeStep` | Ordered cooking steps |
| `RecipeIngredient` | Ingredients with quantities/units |
| `RecipeImage` | MinIO image URLs (original/medium/thumbnail) |

### Key Features
- UUID primary keys
- BaseEntity fields: `createdAt`, `updatedAt`, `isDeleted`, `version`
- Full-text search via PostgreSQL `tsvector` (Vietnamese with `unaccent`)
- Proper indexes on all query fields
- Cascade deletes for recipe children

---

## 🔐 Authentication

### JWT Tokens
- **Access Token**: 15 min, HS256, claims: `userId`, `email`, `roles`, `jti`
- **Refresh Token**: 7 days, 128-bit random, SHA-256 hashed in DB
- **Rotation**: Refresh token revoked on use, new token issued
- **Reuse Detection**: Revoked token family invalidated

### Roles & Permissions
| Role | Permissions |
|------|-------------|
| **GUEST** | View published recipes, categories, search |
| **AUTHOR** | Guest + create/edit/delete own recipes, upload images, manage steps/ingredients |
| **ADMIN** | Author + manage categories, edit/delete any recipe, access BullMQ dashboard |

### Resource Ownership
- Authors can only modify their own recipes
- Admins bypass ownership checks
- Double-checked at application layer

---

## 📡 API Endpoints

Base URL: `/api/v1`

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | - | Register new account |
| POST | `/auth/login` | - | Email/password login |
| POST | `/auth/google` | - | Google OAuth login |
| POST | `/auth/refresh` | - | Refresh access token |
| POST | `/auth/logout` | Bearer | Revoke refresh token |
| GET | `/auth/me` | Bearer | Get current user |
| PATCH | `/auth/me` | Bearer | Update profile |

### Recipes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/recipes` | - | List published (paginated, filtered) |
| GET | `/recipes/:slug` | - | Recipe detail (steps, ingredients, images) |
| GET | `/recipes/search` | - | Full-text search |
| POST | `/recipes` | Author/Admin | Create draft recipe |
| PUT | `/recipes/:id` | Owner/Admin | Update recipe |
| PATCH | `/recipes/:id/publish` | Owner/Admin | Publish recipe |
| PATCH | `/recipes/:id/unpublish` | Owner/Admin | Unpublish recipe |
| PATCH | `/recipes/:id/archive` | Owner/Admin | Archive recipe |
| DELETE | `/recipes/:id` | Owner/Admin | Delete recipe |

### Categories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/categories` | - | List all with recipe counts |
| GET | `/categories/:slug` | - | Category detail + recipes |
| POST | `/categories` | Admin | Create category |
| PUT | `/categories/:id` | Admin | Update category |
| DELETE | `/categories/:id` | Admin | Delete category (if empty) |

### Recipe Images/Steps/Ingredients
Nested under `/recipes/:id/images`, `/recipes/:id/steps`, `/recipes/:id/ingredients`

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test --coverage
```

### Test Structure
```
tests/
├── setup.ts              # Global test setup
├── unit/                 # Unit tests (Application layer)
│   ├── commands/
│   ├── queries/
│   └── validators/
├── integration/          # Integration tests (API endpoints)
└── e2e/                  # End-to-end tests (Playwright)
```

---

## 📊 Observability

### Health Checks
- `GET /health` - Aggregate (DB, Redis, MinIO)
- `GET /health/live` - Liveness (always healthy if process alive)
- `GET /health/ready` - Readiness (DB + Redis ready)

### Logging
- **Pino** structured JSON logging
- Every entry includes: `correlationId`, `requestPath`, `userId`
- Dev: Pretty printed | Prod: JSON to Seq/Elastic/Grafana Loki

### Tracing
- **OpenTelemetry** instrumentation
- HTTP requests, Prisma queries, Express middleware
- Exporters: OTLP → Jaeger/Grafana Tempo (prod)

### Metrics
- Request count, duration histogram, error rate
- Custom business metrics via OpenTelemetry

---

## 🐳 Docker

### Development
```bash
# Infrastructure only
docker-compose up -d

# Full stack (API + Frontend + Nginx)
docker-compose up --build -d
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

### Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment |
| `PORT` | No | `3000` | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection |
| `JWT_ACCESS_SECRET` | Yes | - | Access token secret (32+ chars) |
| `JWT_REFRESH_SECRET` | Yes | - | Refresh token secret (32+ chars) |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token TTL |
| `GOOGLE_CLIENT_ID` | No | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | - | Google OAuth secret |
| `GOOGLE_CALLBACK_URL` | No | - | OAuth redirect URI |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Allowed origins |
| `S3_ENDPOINT` | No | - | MinIO/S3 endpoint |
| `S3_BUCKET` | No | - | Bucket name |
| `S3_ACCESS_KEY` | No | - | Access key |
| `S3_SECRET_KEY` | No | - | Secret key |
| `S3_REGION` | No | `us-east-1` | S3 region |
| `SMTP_HOST` | No | - | SMTP server |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_USER` | No | - | SMTP username |
| `SMTP_PASS` | No | - | SMTP password |
| `SMTP_FROM` | No | - | From email |

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript strict mode config |
| `.eslintrc.json` | ESLint Airbnb + TypeScript |
| `.prettierrc` | Prettier formatting |
| `vitest.config.ts` | Vitest test config |
| `dependency-cruiser.config.js` | Architecture dependency rules |
| `prisma/schema.prisma` | Database schema |
| `docker-compose.yml` | Infrastructure services |

---

## 📝 Seed Data

```bash
pnpm prisma:seed
```

Creates:
- 1 Admin + 5 Authors
- 20 Vietnamese categories
- 100 Published recipes with 10-15 ingredients & 5-8 steps each

---

## 🚨 Common Issues

### Port Already in Use
```bash
# Find process
lsof -i :3000
# Kill it
kill -9 <PID>
```

### Prisma Client Out of Sync
```bash
pnpm prisma:generate
pnpm db:push
```

### Migration Failed
```bash
pnpm prisma migrate reset  # ⚠️ destroys data
pnpm db:push
pnpm prisma:seed
```

### Redis Connection Refused
```bash
docker-compose restart redis
```

---

## 📚 Resources

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js](https://expressjs.com/)
- [Zod Validation](https://zod.dev/)
- [Passport.js](https://www.passportjs.org/)