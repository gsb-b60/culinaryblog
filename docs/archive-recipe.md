# FR-RCP-006 — Archive Recipe (GitHub #32)

PATCH /api/v1/recipes/{id}/archive requires authentication and recipe ownership or Admin.
Returns HTTP 200 with the updated recipe DTO, status ARCHIVED, version and content.

| Current status | Archive | Publish / Unpublish |
| --- | --- | --- |
| DRAFT | ARCHIVED | Existing lifecycle rules |
| PUBLISHED | ARCHIVED | Existing lifecycle rules |
| ARCHIVED | 200, unchanged version | 422 |

Archive retains ingredients, steps, images and publication history. A successful state change increments version and updates updatedAt. Repeated archive requests invalidate caches without changing version. Concurrent updates return 409. Missing/deleted recipes return 404, other authors receive 403 and unauthenticated requests receive 401.

Recipes and categories cache namespaces are invalidated after persistence. Public recipe list, search and category queries enforce PUBLISHED regardless of supplied status filters. Detail permits private recipes only for owner/Admin. The protected management list continues to show archived recipes.

Dashboard → Công thức → Danh sách công thức provides Lưu trữ for owner/Admin on Draft and Published recipes, including recipes without steps. The status badge changes after success and survives reload. Failures preserve the previous status. Pending requests disable competing actions.

The public recipe list still uses static demonstration data. Recipe detail now uses the live API with the current account credentials and is linked from recipe management, including archived recipes. It clears private content on account changes and distinguishes forbidden/not-found responses from retryable network/server failures. Numeric pagination and time filters are parsed from URL strings with empty, repeated and invalid values rejected.

Validation commands:

- pnpm --dir backend exec vitest run tests/recipe-status.test.ts
- pnpm --dir frontend exec vitest run src/test/RecipesPage.test.tsx
- pnpm --dir backend build
- pnpm --dir frontend build

Endpoint tests run real routes, authentication middleware (credential verification stubbed), command/query bus, handlers and repositories against a mocked Prisma client. They cover public visibility before/after archive, owner/Admin detail, forbidden access, repeated requests and concurrent updates. UI tests run the app and API client against mocked HTTP responses. These are not live PostgreSQL/Redis tests.
