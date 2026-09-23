# LetHimCook Frontend

Next.js 14+ App Router frontend for Culinary Blog with TypeScript, Tailwind CSS, and Auth.js.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 10+
- Backend API running (see [backend README](../backend/README.md))

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit with your settings
```

### 3. Start Development Server
```bash
pnpm dev
```

Frontend runs at `http://localhost:3000`

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14+ App Router |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS |
| **Auth** | Auth.js v5 (NextAuth) |
| **State** | TanStack Query (React Query) |
| **Forms** | React Hook Form + Zod |
| **UI** | Headless UI / Radix UI |
| **Icons** | Lucide React |

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth route group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   │   ├── recipes/
│   │   │   └── categories/
│   │   ├── recipes/            # Public recipe pages
│   │   │   ├── [slug]/
│   │   │   └── search/
│   │   ├── categories/         # Category pages
│   │   │   └── [slug]/
│   │   ├── api/                # API routes (Auth.js)
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   │
│   ├── components/             # Reusable components
│   │   ├── ui/                 # Base UI components
│   │   ├── forms/              # Form components
│   │   ├── layout/             # Layout components
│   │   └── recipe/             # Recipe-specific components
│   │
│   ├── lib/                    # Utilities & config
│   │   ├── api/                # API client (TanStack Query)
│   │   ├── auth/               # Auth.js config
│   │   ├── utils/              # Helper functions
│   │   └── validations/        # Zod schemas
│   │
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript types
│   └── styles/                 # Additional styles
│
├── public/                     # Static assets
├── .env.example                # Environment template
├── .env.local                  # Local overrides (gitignored)
├── tailwind.config.ts          # Tailwind config
├── tsconfig.json               # TypeScript config
├── next.config.mjs             # Next.js config
└── eslint.config.js            # ESLint config
```

---

## 🔐 Authentication

### Auth.js v5 Configuration
- **Providers**: Credentials (email/password), Google OAuth
- **Session**: JWT strategy (stateless)
- **Callbacks**: JWT & session callbacks for custom claims
- **Pages**: Custom login/register/error pages

### Protected Routes
- Dashboard routes require authentication
- Middleware redirects unauthenticated users to `/auth/login`
- Role-based access: Author/Admin for dashboard

---

## 🎨 Styling

### Tailwind CSS
- Utility-first, no custom CSS overrides
- Responsive breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- Dark mode support (class strategy)

### Component Patterns
- Base UI components in `components/ui/`
- Compound components for complex UI
- Server Components by default, Client Components when needed

---

## 📡 API Integration

### TanStack Query
- **Client**: `lib/api/client.ts`
- **Hooks**: `hooks/useRecipes.ts`, `hooks/useCategories.ts`, etc.
- **Mutations**: Optimistic updates with rollback
- **Cache**: 5 min TTL for recipe details, 15 min for lists

### API Client Pattern
```typescript
// lib/api/recipes.ts
export const recipeApi = {
  getList: (params) => api.get('/recipes', { params }),
  getDetail: (slug) => api.get(`/recipes/${slug}`),
  create: (data) => api.post('/recipes', data),
  update: (id, data) => api.put(`/recipes/${id}`, data),
  publish: (id) => api.patch(`/recipes/${id}/publish`),
};
```

---

## 🌐 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:3000/api/v1` | Backend API base URL |
| `NEXTAUTH_SECRET` | Yes | - | Auth.js secret |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` | App URL |
| `GOOGLE_CLIENT_ID` | No | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | - | Google OAuth secret |

---

## 🧪 Testing

```bash
# Unit/Component tests
pnpm test

# E2E tests (Playwright)
pnpm test:e2e

# Visual regression
pnpm test:visual
```

### Test Structure
```
tests/
├── unit/           # Component tests (Testing Library)
├── integration/    # API integration tests
└── e2e/           # Playwright E2E tests
```

---

## 📱 Pages & Routes

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Home (featured recipes + categories) | No |
| `/recipes` | Recipe list with filters | No |
| `/recipes/[slug]` | Recipe detail (ISR) | No |
| `/categories` | Category list | No |
| `/categories/[slug]` | Category + recipes | No |
| `/search` | Full-text search results | No |
| `/auth/login` | Login page | No |
| `/auth/register` | Register page | No |
| `/dashboard` | Author/Admin dashboard | Yes |
| `/dashboard/recipes` | Manage own recipes | Author+ |
| `/dashboard/recipes/new` | Create recipe wizard | Author+ |
| `/dashboard/recipes/[id]/edit` | Edit recipe | Owner/Admin |
| `/dashboard/categories` | Manage categories | Admin |
| `/profile` | User profile | Yes |

---

## 🚀 Deployment

### Docker
```bash
# Build image
docker build -t lethimcook-web .

# Run container
docker run -p 3000:3000 lethimcook-web
```

### Vercel (Recommended)
1. Connect GitHub repo to Vercel
2. Add environment variables
3. Deploy automatically on push

### Standalone Output
```bash
# next.config.mjs
output: 'standalone'
```
Produces minimal `standalone/` folder for Docker.

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript strict config |
| `tailwind.config.ts` | Tailwind theme & plugins |
| `next.config.mjs` | Next.js config (images, rewrites) |
| `eslint.config.js` | ESLint flat config |
| `.prettierrc` | Prettier formatting |
| `postcss.config.js` | PostCSS plugins |

---

## 📚 Resources

- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Auth.js v5](https://authjs.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)