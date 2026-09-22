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

## 📖 Documentation

See [`docs/`](./docs/) for complete SRS documentation:
- [Architecture](./docs/06-system-architecture.md)
- [Data Model](./docs/07-data-model.md)
- [REST API](./docs/08-rest-api.md)
- [Tech Stack](./docs/tech-stack-architecture.md)