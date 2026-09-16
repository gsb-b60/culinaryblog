# Appendices A, B, C

Source: `srs.md` lines 1832-1914.

## Appendix A — HTTP Status Codes

The following table lists all HTTP Status Codes used in the Culinary Blog API, along with their usage context.

| Code | Status | Usage context |
|---|---|---|
| 200 | OK | Successful GET request; PATCH returning the updated resource; successful POST /auth/login. |
| 201 | Created | Successful POST that creates a resource (Recipe, Category, Step, Ingredient, Image). Response body contains the created resource. |
| 204 | No Content | Successful DELETE; successful POST /auth/logout. No response body. |
| 400 | Bad Request | Validation errors (Zod), malformed request body, invalid file MIME type, business rule violation (e.g., publishing a recipe without ingredients). |
| 401 | Unauthorized | Access token missing or invalid; Refresh Token expired / revoked. |
| 403 | Forbidden | Authenticated but not authorized: Author accessing an Admin endpoint; Author attempting to delete another user's recipe. |
| 404 | Not Found | Resource does not exist or has been soft-deleted (IsDeleted=true). |
| 409 | Conflict | Duplicate unique field (registered email, existing category slug); deleting a category that still has recipes. |
| 422 | Unprocessable Entity | Data is syntactically valid but semantically unprocessable (e.g., Version conflict — Optimistic Concurrency). |
| 429 | Too Many Requests | Rate limit exceeded. Response includes the Retry-After header (seconds). |
| 500 | Internal Server Error | Unhandled exception. Returns RFC 7807, fully logged via Pino. No stack trace exposed. |
| 503 | Service Unavailable | Health check failed (DB/Redis down); or server overloaded. |

## Appendix B — Application Error Codes

The system uses Application Error Codes (custom error codes) in the RFC 7807 "type" field so the frontend can handle errors programmatically without depending on the message string (which may change with locale).

| Error code | HTTP Status | Description | Module |
|---|---|---|---|
| AUTH_EMAIL_EXISTS | 409 | Email already registered by another account. | Auth |
| AUTH_INVALID_CREDENTIALS | 401 | Email or password is incorrect. | Auth |
| AUTH_TOKEN_EXPIRED | 401 | Access Token has expired (15 minutes). | Auth |
| AUTH_TOKEN_INVALID | 401 | Access Token is malformed or the signature is invalid. | Auth |
| AUTH_REFRESH_TOKEN_EXPIRED | 401 | Refresh Token has expired (7 days). | Auth |
| AUTH_REFRESH_TOKEN_REVOKED | 401 | Refresh Token has been revoked (reuse detection). | Auth |
| AUTH_GOOGLE_TOKEN_INVALID | 400 | Google ID Token is invalid or expired. | Auth |
| AUTH_ACCOUNT_DISABLED | 403 | Account has been disabled (IsActive=false) by Admin. | Auth |
| RECIPE_NOT_FOUND | 404 | Recipe with the given id/slug does not exist or has been deleted. | Recipe |
| RECIPE_SLUG_EXISTS | 409 | Slug already exists — a numeric suffix is appended automatically (slug-1, slug-2...). | Recipe |
| RECIPE_PUBLISH_INCOMPLETE | 400 | Recipe does not meet publish requirements: must have at least 1 ingredient and 1 step. | Recipe |
| RECIPE_FORBIDDEN | 403 | User is neither the owner nor an Admin. | Recipe |
| RECIPE_CONCURRENCY_CONFLICT | 422 | Version mismatch — the resource was updated by another request. Client must reload. | Recipe |
| CATEGORY_NOT_FOUND | 404 | Category does not exist. | Category |
| CATEGORY_NAME_EXISTS | 409 | Category name already exists. | Category |
| CATEGORY_DELETE_HAS_RECIPES | 409 | Cannot delete a category that still has associated recipes. | Category |
| FILE_SIZE_EXCEEDED | 400 | File upload exceeds the 5 MB limit. | File |
| FILE_MIME_INVALID | 400 | Disallowed file type. Only JPEG, PNG, WebP, AVIF accepted. | File |
| VALIDATION_ERROR | 400 | One or more fields are invalid. See the "errors" object. | Common |
| RATE_LIMIT_EXCEEDED | 429 | Request limit exceeded. See the Retry-After header. | Common |

## Appendix C — Glossary

| Term | Abbreviation | Definition |
|---|---|---|
| Access Token | AT | JSON Web Token (JWT) used to authenticate API requests. TTL = 15 minutes. Signed with HS256. |
| Application Error Code | AEC | Custom error code in SCREAMING_SNAKE_CASE format, placed in the "type" field of RFC 7807 Problem Details. |
| Archive | — | Recipe status when hidden from the public listing but not deleted. RecipeStatus.Archived. |
| Author | — | Default user role after registration. Can create/manage their own recipes. |
| Background Job | — | Asynchronous task processed outside the HTTP request cycle, managed by BullMQ. |
| Clean Architecture | CA | Software architecture by Robert C. Martin that separates concerns into layers (Domain, Application, Infrastructure, Presentation). Dependencies point inward only (toward Domain). |
| Command Query Responsibility Segregation | CQRS | Pattern that separates the write model (Commands) and read model (Queries) to optimize each path independently. |
| Content Delivery Network | CDN | Content distribution network for static assets (images, JS, CSS) served from a server geographically close to the user. |
| Command Bus | — | Intermediary layer (mediator pattern) that dispatches Commands/Queries through Handlers with pipeline middleware (logging, validation, caching, cache invalidation). |
| Core Web Vitals | CWV | Google's UX measurement metrics: LCP (page load), CLS (layout stability), INP (interaction responsiveness). |
| CQRS | — | See Command Query Responsibility Segregation. |
| Docker Compose | — | Tool for defining and running multi-container Docker applications via a YAML file. |
| Draft | — | Default status of a Recipe when first created. Only visible to Author/Admin. |
| Full-Text Search | FTS | Natural language search in PostgreSQL via tsvector/tsquery + unaccent extension. |
| HTTP Status Code | — | Standard HTTP response code (RFC 7231) indicating the result of request processing (2xx: success, 4xx: client error, 5xx: server error). |
| Incremental Static Regeneration | ISR | Next.js feature that regenerates static pages on a schedule (revalidate interval) instead of rebuilding the whole site. |
| JSON Web Token | JWT | Open standard (RFC 7519) defining a method for securely transmitting information between parties as a signed JSON object. |
| MinIO | — | Open-source object storage server compatible with the Amazon S3 API. Used for image storage. |
| Non-Functional Requirement | NFR | System quality requirements: performance, security, reliability, maintainability, etc. |
| Nginx | — | High-performance web server used as a reverse proxy, load balancer, and SSL termination point. |
| OpenTelemetry | OTEL | Distributed system observability framework: distributed tracing, metrics, logs. |
| Optimistic Concurrency | — | Technique for handling concurrent writes using a Version field — no DB locks, conflict detected at save time. |
| Published | — | Recipe status when publicly announced. RecipeStatus.Published. |
| Rate Limiting | — | Limiting the number of requests from a single IP within a time window to prevent brute-force/DDoS attacks. |
| Refresh Token | RT | Long-lived token (7 days) used to obtain a new Access Token without requiring the user to log in again. |
| Refresh Token Rotation | — | On every use of the Refresh Token to refresh → the old token is revoked and a new one is issued (more secure). |
| Reuse Detection | — | Mechanism that detects when a revoked Refresh Token is reused → revokes the entire user's token family. |
| Slug | — | URL-friendly string, lowercase-hyphenated, unique, used to identify a Recipe/Category in the URL. |
| Soft Delete | — | Marking IsDeleted=true instead of physically deleting from the database. Data can be recovered. |
| Software Requirements Specification | SRS | Software requirements specification document per IEEE 830 / ISO/IEC/IEEE 29148. |
| TanStack Query | — | React library for managing server state: caching, background refetching, optimistic updates. |
| Transaction (Prisma) | — | Prisma mechanism ($transaction) ensuring multiple operations execute within a single database transaction — equivalent to the Unit of Work pattern. |
| tsvector / tsquery | — | PostgreSQL data types for full-text search. tsvector is the processed index; tsquery is the search expression. |