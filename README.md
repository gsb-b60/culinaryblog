# Culinary Blog - LetHimCook

Full-stack web application for sharing and discovering cooking recipes. Built with Clean Architecture backend and Next.js frontend.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js 20 LTS, Express.js, TypeScript |
| **Architecture** | Clean Architecture (4 layers) + CQRS |
| **Database** | PostgreSQL 16 (Prisma ORM) |
| **Cache/Queue** | Redis 7 (ioredis, BullMQ) |
| **Object Storage** | MinIO (S3-compatible) |
| **Auth** | JWT (HS256), Passport.js, Google OAuth 2.0 |
| **Frontend** | Next.js 14+ App Router, TypeScript, Tailwind CSS |
| **Deployment** | Docker Compose + Nginx |

---

## 🚀 Quick Start (Development)

### Prerequisites

- **Docker Desktop** 4.x+ (Windows/macOS) or Docker Engine 24+ (Linux)
- **Node.js 20+** (for local development without Docker)
- **Git** 2.40+

### 1. Clone & Configure

```bash
git clone <repository-url>
cd lethimcook
```

### 2. Start Infrastructure (Database, Redis, MinIO, etc.)

```bash
# Start all infrastructure services
docker-compose up -d

# Verify services are running
docker-compose ps
```

**Services started:**
| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache & BullMQ queue |
| MinIO | 9000/9001 | Object storage (API/Console) |
| Mailhog | 1025/8025 | Email testing (SMTP/UI) |
| Seq | 5341 | Log aggregation |

### 3. Configure Backend Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your settings (defaults work for Docker setup)
```

**Key environment variables:**
```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/lethimcook
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=lethimcook
```

### 4. Initialize Database & Seed Data

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
pnpm prisma:generate

# Push schema to database (creates tables)
pnpm db:push

# Seed database with sample data (20 categories, 100 recipes)
pnpm prisma:seed
```

### 5. Start Backend Server

```bash
# Development mode with hot reload
pnpm dev
```

Backend runs at: **http://localhost:3000** (or PORT from .env)

### 6. Start Frontend (Optional)

```bash
cd ../frontend
pnpm install
pnpm dev
```

Frontend runs at: **http://localhost:5173**

---

## 🐳 Full Docker Development Stack

Run everything (backend + frontend + infrastructure) with Docker Compose:

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

**Docker services:**
| Service | Port | Notes |
|---------|------|-------|
| nginx | 80/443 | Reverse proxy, SSL termination |
| api | 5000 | Backend API (internal: 8080) |
| frontend | 3000 | Next.js frontend |
| postgres | 5432 | Database |
| redis | 6379 | Cache/Queue |
| minio | 9000/9001 | Object storage |
| mailhog | 1025/8025 | Email testing |
| seq | 5341 | Log aggregation |

---

## 📚 API Documentation

- **Scalar UI (OpenAPI)**: http://localhost:3000/scalar (when backend running)
- **Base URL**: `/api/v1`
- **Health Checks**:
  - `GET /health` - Aggregate health
  - `GET /health/live` - Liveness probe
  - `GET /health/ready` - Readiness probe

### Key Endpoints

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `POST /auth/google`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| **Recipes** | `GET /recipes`, `GET /recipes/:slug`, `GET /recipes/search`, `POST /recipes`, `PUT /recipes/:id`, `PATCH /recipes/:id/publish`, `PATCH /recipes/:id/unpublish`, `PATCH /recipes/:id/archive`, `DELETE /recipes/:id` |
| **Categories** | `GET /categories`, `GET /categories/:slug`, `POST /categories` (Admin), `PUT /categories/:id` (Admin), `DELETE /categories/:id` (Admin) |
| **Recipe Steps** | `POST /recipes/:id/steps`, `PUT /recipes/:id/steps/:stepId`, `DELETE /recipes/:id/steps/:stepId` |
| **Recipe Ingredients** | `POST /recipes/:id/ingredients`, `PUT /recipes/:id/ingredients/:ingId`, `DELETE /recipes/:id/ingredients/:ingId` |

---

## 🗄️ Database Management

### Prisma Commands

```bash
cd backend

# Generate Prisma Client
pnpm prisma:generate

# Create migration
pnpm prisma:migrate

# Push schema (no migration history)
pnpm db:push

# Open Prisma Studio (GUI)
pnpm prisma:studio

# Seed database
pnpm prisma:seed

# Reset database (⚠️ destroys data)
pnpm prisma migrate reset
```

### Seed Data Details

Running `pnpm prisma:seed` creates:
- **1 Admin user**: `admin@lethimcook.com` / `Admin@123`
- **5 Author users**: `chef.*@lethimcook.com` / `Author@123`
- **20 Vietnamese food categories** (Món chính, Món khai vị, Món tráng miệng, etc.)
- **100 Published recipes** with:
  - 10-15 ingredients each (quantities, units, notes)
  - 5-8 steps each (titles, descriptions, timers)
  - Full nutrition information
  - Distributed across categories and authors

---

## 🔧 Development Workflow

### Backend Commands

```bash
cd backend

# Development with hot reload
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start

# Run tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Lint
pnpm lint
pnpm lint:fix

# Format code
pnpm format

# Check dependencies
pnpm deps:check
```

### Frontend Commands

```bash
cd frontend

# Development
pnpm dev

# Build
pnpm build

# Preview production build
pnpm preview

# Lint
pnpm lint
```

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Test connection manually
docker exec -it lethimcook-postgres psql -U admin -d lethimcook -c "SELECT 1;"
```

### Redis Connection Issues

```bash
# Check Redis
docker-compose ps redis
docker-compose logs redis

# Test Redis
docker exec -it lethimcook-redis redis-cli ping
```

### MinIO Issues

```bash
# Access MinIO Console at http://localhost:9001
# Default credentials: minioadmin / minioadmin

# Check bucket exists
docker exec -it lethimcook-minio mc ls lethimcook/lethimcook
```

### Port Conflicts

If ports are in use, modify `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Change host port
```

### Reset Everything

```bash
# Complete reset
docker-compose down -v
rm -rf backend/node_modules backend/dist
rm -rf frontend/node_modules frontend/dist
docker-compose up --build -d
cd backend && pnpm install && pnpm prisma:generate && pnpm db:push && pnpm prisma:seed
```

---

## 📁 Project Structure

```
lethimcook/
├── backend/
│   ├── src/
│   │   ├── domain/           # Pure business logic (entities, VOs, enums, repos)
│   │   ├── application/      # CQRS (commands, queries, handlers, DTOs, validators)
│   │   ├── infrastructure/   # Prisma repos, auth, file storage, email, cache, jobs
│   │   ├── presentation/     # Express routes, middleware, DI, OpenAPI
│   │   ├── config-middleware/ # Shared config (env, logger, DB, tracing)
│   │   └── index.ts          # App entry point
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Seed data
│   └── docker-compose.yml    # Infrastructure services
├── frontend/
│   └── src/
│       ├── app/              # Next.js App Router pages
│       ├── components/       # React components
│       └── lib/              # Utilities, API client
├── docs/                     # SRS documentation
└── docker-compose.yml        # Full stack
```

---

## 🔐 Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| PostgreSQL | admin | admin |
| MinIO Console | minioadmin | minioadmin |
| Admin User | admin@lethimcook.com | Admin@123 |
| Author Users | chef.nguyen@lethimcook.com | Author@123 |

---

## 📄 License

ISC License - See LICENSE file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 👥 Team & Issue Assignment

**34 issues** across 7 FR modules (AUTH, CAT, RCP, SRCH, FILE, JOB, OBS). Full issue details: [`docs/issues/`](./docs/issues/).

### Team Split

| Person | Name | Role | Focus Areas | Issues | File |
|---|---|---|---|---|---|
| **1** | **Nguyen Dinh Hieu** | **Leader** | Auth + Transactions + Image Storage + Algorithm | #1–#14 | [person-1.md](./docs/issues/person-1.md) |
| **2** | **Bich Tran** | Teammate | Categories + Recipe Read | #15–#21 | [person-2.md](./docs/issues/person-2.md) |
| **3** | **Tran Duc Anh** | Teammate | Recipe Lifecycle + Search Params | #22–#29 | [person-3.md](./docs/issues/person-3.md) |
| **4** | **Nguyen Huynh Thanh** | Teammate | Jobs + Observability | #30–#34 | [person-4.md](./docs/issues/person-4.md) |

### Issue Assignees

| Issue | FR | Assignee |
|---|---|---|
| #1 | FR-AUTH-001: User Registration | Nguyen Dinh Hieu |
| #2 | FR-AUTH-002: Local Login | Nguyen Dinh Hieu |
| #3 | FR-AUTH-003: Google OAuth 2.0 Login | Nguyen Dinh Hieu |
| #4 | FR-AUTH-004: Refresh Access Token | Nguyen Dinh Hieu |
| #5 | FR-AUTH-005: Logout / Token Revocation | Nguyen Dinh Hieu |
| #6 | FR-AUTH-006: View Profile | Nguyen Dinh Hieu |
| #7 | FR-AUTH-007: Update Profile | Nguyen Dinh Hieu |
| #8 | FR-RCP-003: Create New Recipe ⭐ | Nguyen Dinh Hieu |
| #9 | FR-RCP-004: Update Recipe | Nguyen Dinh Hieu |
| #10 | FR-FILE-001: Upload File to MinIO | Nguyen Dinh Hieu |
| #11 | FR-FILE-002: Delete File from MinIO | Nguyen Dinh Hieu |
| #12 | FR-RCP-008: Recipe Image Management | Nguyen Dinh Hieu |
| #13 | FR-SRCH-001: Full-Text Search | Nguyen Dinh Hieu |
| #14 | FR-JOB-002: Thumbnail Generation Job | Nguyen Dinh Hieu |
| #15 | FR-CAT-001: View Category List | Bich Tran |
| #16 | FR-CAT-002: View Category Detail and Recipes | Bich Tran |
| #17 | FR-CAT-003: Create New Category [Admin] | Bich Tran |
| #18 | FR-CAT-004: Update Category [Admin] | Bich Tran |
| #19 | FR-CAT-005: Delete Category [Admin] | Bich Tran |
| #20 | FR-RCP-001: View Recipe List | Bich Tran |
| #21 | FR-RCP-002: View Recipe Detail | Bich Tran |
| #22 | FR-RCP-005: Publish/Unpublish Recipe | Tran Duc Anh |
| #23 | FR-RCP-006: Archive Recipe | Tran Duc Anh |
| #24 | FR-RCP-007: Delete Recipe | Tran Duc Anh |
| #25 | FR-RCP-009: Ingredient Management (CRUD) | Tran Duc Anh |
| #26 | FR-RCP-010: Steps Management (CRUD) | Tran Duc Anh |
| #27 | FR-SRCH-002: Filtering Recipes | Tran Duc Anh |
| #28 | FR-SRCH-003: Sorting Recipes | Tran Duc Anh |
| #29 | FR-SRCH-004: Pagination | Tran Duc Anh |
| #30 | FR-JOB-001: Welcome Email Job | Nguyen Huynh Thanh |
| #31 | FR-JOB-003: Sitemap Generation Job | Nguyen Huynh Thanh |
| #32 | FR-OBS-001: Health Check Endpoints | Nguyen Huynh Thanh |
| #33 | FR-OBS-002: Structured Logging | Nguyen Huynh Thanh |
| #34 | FR-OBS-003: Distributed Tracing & Metrics | Nguyen Huynh Thanh |

---

## 📖 Documentation

See [`docs/`](./docs/) for complete SRS documentation:
- [Architecture](./docs/06-system-architecture.md)
- [Data Model](./docs/07-data-model.md)
- [REST API](./docs/08-rest-api.md)
- [Tech Stack](./docs/tech-stack-architecture.md)