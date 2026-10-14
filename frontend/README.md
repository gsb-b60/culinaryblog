# LetHimCook Frontend

React 19 + React Router + Vite frontend for Culinary Blog, built with TypeScript
and Tailwind CSS.

## Run locally

Requirements: Node.js 20+ (a version supported by the installed Vite), pnpm,
and the backend API with PostgreSQL running.

From this directory:

    pnpm install
    pnpm dev

The development URL is http://localhost:5173. Vite keeps this port fixed.

Configure VITE_API_BASE_URL in .env.local, for example:

    VITE_API_BASE_URL=http://localhost:3000/api/v1

.env.local overrides .env. Use the actual PORT configured in backend/.env.
Backend CORS_ORIGINS must include http://localhost:5173. Restart Vite after
changing environment values.

## Recipe filtering — issue #35

Open http://localhost:5173/recipes or choose **Khám phá công thức** on the home
page. Signed-in users can choose **Công thức** from the dashboard.

Select category/difficulty, enter maximum cooking minutes and minimum servings,
then apply. All filters combine with AND. Applying filters resets page one;
changing pages preserves filters. Reload, shared links and browser Back/Forward
restore the applied filter values. The page supports loading/error/empty states
and retrying failures without signing in.

[Detailed implementation analysis and E2E instructions](../docs/recipe-filtering-e2e.md).

## Commands

| Command | Purpose |
|---|---|
| pnpm dev | Vite development server on port 5173 |
| pnpm build | TypeScript checks and production build |
| pnpm preview | Preview the production build |
| pnpm test | Vitest + React Testing Library tests |
| pnpm test:e2e | Playwright browser tests with real API/PostgreSQL |
| pnpm lint | ESLint |

For E2E with an installed Microsoft Edge on Windows:

    $env:E2E_BROWSER_CHANNEL = 'msedge'
    pnpm test:e2e

Alternatively install Playwright Chromium with pnpm exec playwright install chromium
and run pnpm test:e2e. Test servers use ports 5051 (API) and 5175 (UI), which must
be free. Backend environment and a populated PostgreSQL database are required.
Tests read existing data without seeding or deleting records.

## Source structure

| Directory/file | Purpose |
|---|---|
| src/pages | Home, authentication, dashboard/profile and recipe listing |
| src/components | Shared interface components |
| src/lib/api.ts | HTTP client and authentication token refresh |
| src/lib/recipes.ts | Public recipes/categories API client |
| src/lib/recipeFilters.ts | URL parsing and filter validation |
| src/types | API data types |
| src/test | Unit and UI integration tests |
| e2e | Browser tests against the backend and database |
| playwright.config.ts | E2E servers and browser configuration |
