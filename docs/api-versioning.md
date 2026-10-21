# API Versioning Strategy

Base URL: `/api/v1`. All routes in `backend/src/index.ts` are mounted under
`/api/v1/{auth,recipes,categories}`. Docs are served at `/api-docs.json`
(canonical), `/api-docs` (alias), and Scalar UI at `/scalar`.

## Rules

1. URL versioning is canonical. `Accept: application/vnd.lethimcook.v1+json`
   is accepted but optional.
2. No breaking changes inside `v1`: only additive fields, new optional query
   params, new endpoints.
3. Breaking change => new major `/api/v2` mounted alongside `/api/v1` for at
   least 2 releases. `v1` responses add `Sunset` + `Deprecation` headers before
   removal.
4. Every new route must:
   - live under `/api/v1/...`,
   - be added to `backend/src/presentation/docs/openapi.ts` (`openApiSpec.paths`),
   - be covered by `backend/tests/openapi.test.ts`.
5. Frontend must import the versioned base from `VITE_API_BASE_URL`
   (`http://localhost:5000/api/v1` fallback) and never hardcode `/api/`.
