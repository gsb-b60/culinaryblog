# Chapter 8 — REST API Specification

Source: `srs.md` lines 1752-1831.

This chapter lists all API endpoints of the Culinary Blog system. Base URL: /api/v1. Detailed documentation (request/response schemas) is auto-generated via the Scalar UI at /scalar.

## API Conventions

| Convention | Description |
|---|---|
| HTTP Method + Path | Prefixed /api/v1 |
| auth required | = Bearer JWT Access Token |
| role | = minimum required role (Author ⊂ Admin) |
| Pagination | Query params: ?page=1&pageSize=10&sortBy=createdAt&sortOrder=desc. Response wrapper: `{ "data":[], "meta":{ "page", "pageSize", "total", "totalPages" } }` |
| Error format | RFC 7807 Problem Details: `{ "type":"about:blank", "title":"...", "status":400, "detail":"...", "errors":{"field":["msg"]} }` |

## 8.1. Authentication Module (/auth)

| Method | Endpoint | Description | Auth | Request Body / Params | Response |
|---|---|---|---|---|---|
| POST | /auth/register | Register a new account | None | { email, password, displayName } | 201: { userId, email, displayName } 400: validation errors 409: email already exists |
| POST | /auth/login | Email/password login | None | { email, password } | 200: { accessToken, refreshToken, expiresIn } 401: wrong credentials 429: rate limit exceeded |
| POST | /auth/google | Google OAuth login | None | { idToken } — ID Token from Google Sign-In JS SDK | 200: { accessToken, refreshToken, expiresIn } 400: invalid token |
| POST | /auth/refresh | Refresh access token | None (uses refreshToken) | { refreshToken } | 200: { accessToken, refreshToken, expiresIn } 401: token expired / revoked |
| POST | /auth/logout | Logout, revoke refresh token | Bearer JWT | { refreshToken } | 204: No Content 401: Unauthorized |
| GET | /auth/me | Get current user info | Bearer JWT | — | 200: { id, email, displayName, avatarUrl, bio, roles } 401: Unauthorized |
| PATCH | /auth/me | Update user profile | Bearer JWT | { displayName?, avatarUrl?, bio? } | 200: { id, email, displayName, avatarUrl, bio } 400: validation 401: Unauthorized |

## 8.2. Categories Module (/categories)

| Method | Endpoint | Description | Auth / Role | Request | Response |
|---|---|---|---|---|---|
| GET | /categories | Get all categories | None | — | 200: [{ id, name, slug, description, imageUrl, recipeCount }] |
| GET | /categories/{slug} | Get category detail + recipes | None | ?page=1&pageSize=10&sortBy=... | 200: { category, recipes: PagedResult } 404: Category not found |
| POST | /categories | Create a new category | Bearer + Admin | { name, description?, imageUrl? } | 201: { id, name, slug, description } 400: validation 403: Forbidden 409: name already exists |
| PUT | /categories/{id} | Update a category | Bearer + Admin | { name, description?, imageUrl?, orderIndex? } | 200: category updated 400/403/404 |
| DELETE | /categories/{id} | Delete a category (soft delete) | Bearer + Admin | — | 204: No Content 403: Forbidden 404: Not found 409: category has recipes |

## 8.3. Recipes Module (/recipes)

| Method | Endpoint | Description | Auth / Role | Request |
|---|---|---|---|---|
| GET | /recipes | Recipe list (Published, paginated) | None | ?page&pageSize&sortBy&sortOrder&categoryId&difficulty&minPrepTime&maxPrepTime |
| GET | /recipes/{slug} | Recipe detail by slug (incl. steps, ingredients, images, nutrition) | None (Draft: Author/Admin) | — |
| GET | /recipes/search | Full-text recipe search | None | ?q={keyword}&page&pageSize&categoryId&difficulty |
| POST | /recipes | Create new recipe (Draft status) | Bearer (Author/Admin) | { title, description, categoryId, prepTime, cookTime, servings, difficulty, instructions, nutrition? } |
| PUT | /recipes/{id} | Update basic recipe info | Bearer (Owner/Admin) | { title?, description?, categoryId?, prepTime?, cookTime?, servings?, difficulty?, instructions?, nutrition? } |
| PATCH | /recipes/{id}/publish | Publish recipe (Draft → Published) | Bearer (Owner/Admin) | — |
| PATCH | /recipes/{id}/unpublish | Unpublish recipe (Published → Draft) | Bearer (Owner/Admin) | — |
| PATCH | /recipes/{id}/archive | Archive recipe | Bearer (Owner/Admin) | — |
| DELETE | /recipes/{id} | Delete recipe (soft delete) | Bearer (Owner/Admin) | — |

## 8.4. Recipe Images (/recipes/{id}/images)

| Method | Endpoint | Description | Auth | Request | Response |
|---|---|---|---|---|---|
| POST | /recipes/{id}/images | Upload new recipe image | Bearer (Owner/Admin) | multipart/form-data: file (image), altText?, isPrimary? | 201: { imageId, originalUrl, altText, isPrimary } 400: MIME invalid / size > 5MB 403/404 |
| PATCH | /recipes/{id}/images/{imageId} | Update image metadata (altText, isPrimary, orderIndex) | Bearer (Owner/Admin) | { altText?, isPrimary?, orderIndex? } | 200: image updated 403/404 |
| DELETE | /recipes/{id}/images/{imageId} | Delete image (MinIO file deleted async via BullMQ) | Bearer (Owner/Admin) | — | 204: No Content 403/404 |

## 8.5. Recipe Steps (/recipes/{id}/steps)

| Method | Endpoint | Description | Auth | Request | Response |
|---|---|---|---|---|---|
| POST | /recipes/{id}/steps | Add a new step to a recipe | Bearer (Owner/Admin) | { stepNumber, title, description, timerMinutes?, imageUrl? } | 201: RecipeStepDto 400/403/404 |
| PUT | /recipes/{id}/steps/{stepId} | Update a step | Bearer (Owner/Admin) | { stepNumber?, title?, description?, timerMinutes?, imageUrl? } | 200: RecipeStepDto 400/403/404 |
| DELETE | /recipes/{id}/steps/{stepId} | Delete a step | Bearer (Owner/Admin) | — | 204: No Content 403/404 |

## 8.6. Recipe Ingredients (/recipes/{id}/ingredients)

| Method | Endpoint | Description | Auth | Request | Response |
|---|---|---|---|---|---|
| POST | /recipes/{id}/ingredients | Add an ingredient | Bearer (Owner/Admin) | { name, quantity?, unit?, notes?, orderIndex? } | 201: RecipeIngredientDto 400/403/404 |
| PUT | /recipes/{id}/ingredients/{ingId} | Update an ingredient | Bearer (Owner/Admin) | { name?, quantity?, unit?, notes?, orderIndex? } | 200: RecipeIngredientDto 400/403/404 |
| DELETE | /recipes/{id}/ingredients/{ingId} | Delete an ingredient | Bearer (Owner/Admin) | — | 204: No Content 403/404 |

## 8.7. Health Check Endpoints

| Method | Endpoint | Description | Auth | Response |
|---|---|---|---|---|
| GET | /health | Aggregate health of all dependencies (DB, Redis, MinIO) | None | 200: Healthy \| 503: Unhealthy `{ "status":"Healthy", "entries":{"database":{"status":"Healthy"},...} }` |
| GET | /health/live | Liveness probe — checks the process is alive | None | 200: Healthy (always, unless the process crashed) |
| GET | /health/ready | Readiness probe — checks DB and Redis are ready | None | 200: Healthy (DB + Redis up) 503: Unhealthy (not accepting traffic) |