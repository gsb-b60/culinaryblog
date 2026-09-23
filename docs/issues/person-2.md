# Person 2 — Categories + Recipe Read

**7 issues** covering FR-CAT (5) and recipe read FRs (2).

---

### Issue #15 — FR-CAT-001: View Category List

| | |
|---|---|
| Assignee | Person 2 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-catalog.md` §FR-CAT-001 |
| Endpoint | `GET /api/v1/categories` |
| Status | ⬜ Open |

**Description:**

Return the list of all recipe categories with published recipe count per category. Cached with node-cache (60-minute TTL), sorted by Name ascending. No authentication required.

**Main Flow:**

1. Client sends `GET /api/v1/categories`.
2. Dispatch `GetCategoriesQuery`.
3. Check node-cache with key `"categories:all"`.
4. Cache hit → return cached data.
5. Cache miss → query DB: `prisma.category.findMany({ include: { _count: { select: { recipes: { where: { status: 'PUBLISHED' } } } }, orderBy: { name: 'asc' } })`.
6. Store in node-cache with 60-min TTL.
7. Return HTTP 200 with `CategoryDto[]`.

**Alternative / Exception Flows:**

- A1 — No categories → HTTP 200 with empty array `[]`.

**Expected Result:**

Array of `{ id, name, slug, description, recipeCount }`. Served from cache when available.

**Acceptance Criteria:**

- [ ] Returns 200 with array of categories (even empty array)
- [ ] Each category includes `recipeCount` (PUBLISHED only)
- [ ] Sorted by name ascending
- [ ] Results cached with key `categories:all` (TTL 60 min)
- [ ] Cache hit does not query database
- [ ] No authentication required

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M4 — Danh mục (`#m4`) + M1 home grid (`#m1`)
**UI notes:** states: populated, loading, empty
### Issue #16 — FR-CAT-002: View Category Detail and Recipes

| | |
|---|---|
| Assignee | Person 2 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-catalog.md` §FR-CAT-002 |
| Endpoint | `GET /api/v1/categories/{slug}?page=1&pageSize=12` |
| Status | ⬜ Open |

**Description:**

Return detailed info for a specific category (by Slug) along with a paginated list of published recipes in that category. Guests see Published only; Authors additionally see their own Draft recipes.

**Main Flow:**

1. Client sends `GET /api/v1/categories/{slug}?page=1&pageSize=12`.
2. Dispatch `GetCategoryBySlugQuery`.
3. Find category by slug: `prisma.category.findUnique({ where: { slug } })`.
4. Query recipes in category: Status == Published (+ Draft of currentUser if logged in).
5. Apply OFFSET pagination: `skip (page-1)*pageSize, take pageSize`.
6. Map to `CategoryDetailDto` with `pagedResult<RecipeSummaryDto>`.
7. Return HTTP 200.

**Alternative / Exception Flows:**

- A1 — Slug does not exist → HTTP 404 (RFC 7807).

**Expected Result:**

`{ category: CategoryDto, recipes: { items, totalCount, page, pageSize, totalPages } }`

**Acceptance Criteria:**

- [ ] Valid slug returns 200 with category + paginated recipes
- [ ] Only PUBLISHED recipes shown to guests
- [ ] Logged-in Author additionally sees own DRAFT recipes in category
- [ ] Invalid slug returns 404 with RFC 7807 body
- [ ] Pagination works (page, pageSize, totalCount, totalPages correct)
- [ ] Empty category returns 200 with empty items array

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M5 — Chi tiết danh mục (`#m5`)
**UI notes:** states: populated, loading, 404
### Issue #17 — FR-CAT-003: Create New Category [Admin]

| | |
|---|---|
| Assignee | Person 2 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-catalog.md` §FR-CAT-003 |
| Endpoint | `POST /api/v1/categories` |
| Status | ⬜ Open |

**Description:**

Admin creates a new recipe category. Slug auto-generated from Name (slugify: lowercase, strip diacritics, replace spaces with "-"). If Slug exists, append numeric suffix (e.g., "mon-chinh-2"). After creation, category cache invalidated.

**Main Flow:**

1. Admin sends `POST /api/v1/categories` with `Authorization: Bearer {adminJwt}` and body `{ name, description }`.
2. Passport.js role middleware checks Admin role.
3. Dispatch `CreateCategoryCommand`.
4. Zod validation: name 2–50 chars, no HTML.
5. Generate slug: `slugify(name, { lower: true, strict: true })`.
6. Check slug uniqueness — if collision, append "-2", "-3", ... until unique.
7. `prisma.category.create({ data: { name, slug, description } })`.
8. Invalidate cache: `categoryCache.del("categories:all")`.
9. Return HTTP 201 with CategoryDto + Location header.

**Alternative / Exception Flows:**

- A1 — Missing Admin role → HTTP 403.
- A2 — Invalid data → HTTP 422.

**Expected Result:**

New category created. Category cache deleted. Location header → `/api/v1/categories/{newSlug}`.

**Acceptance Criteria:**

- [ ] Admin can create category → 201 with Location header
- [ ] Slug auto-generated (lowercase, hyphenated, no diacritics)
- [ ] Slug collision appends numeric suffix (-2, -3, ...)
- [ ] Non-admin gets 403
- [ ] name < 2 or > 50 chars returns 422
- [ ] HTML in name rejected (422)
- [ ] Cache key `categories:all` deleted after creation

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M13 — Quản trị danh mục (`#m13`)
**UI notes:** create dialog: empty, saving, 422, 409
### Issue #18 — FR-CAT-004: Update Category [Admin]

| | |
|---|---|
| Assignee | Person 2 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-catalog.md` §FR-CAT-004 |
| Endpoint | `PUT /api/v1/categories/{id}` |
| Status | ⬜ Open |

**Description:**

Admin updates Name and/or Description of a category. Slug does NOT change when name changes (to avoid broken links). Cache invalidated after update.

**Main Flow:**

1. Admin sends `PUT /api/v1/categories/{id}` with `{ name, description }`.
2. Check Admin role.
3. Dispatch `UpdateCategoryCommand`.
4. Find category by ID, update Name and Description.
5. Persist, invalidate cache.
6. Return HTTP 200 with updated CategoryDto.

**Alternative / Exception Flows:**

- A1 — ID does not exist → HTTP 404.
- A2 — Missing Admin role → HTTP 403.

**Expected Result:**

Category info updated. Cache invalidated. Slug unchanged.

**Acceptance Criteria:**

- [ ] Admin can update category → 200
- [ ] Slug does NOT change after name update
- [ ] Non-admin gets 403
- [ ] Non-existent ID returns 404
- [ ] Cache invalidated after update

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M13 — Quản trị danh mục (`#m13`)
**UI notes:** edit dialog: loaded, saving, error
### Issue #19 — FR-CAT-005: Delete Category [Admin]

| | |
|---|---|
| Assignee | Person 2 |
| Priority | S – Should Have |
| Doc reference | `docs/03-fr-catalog.md` §FR-CAT-005 |
| Endpoint | `DELETE /api/v1/categories/{id}` |
| Status | ⬜ Open |

**Description:**

Admin deletes a category. Business rule: MUST NOT delete a category that still contains recipes (Published or Draft). Admin must move all recipes to another category first.

**Main Flow:**

1. Admin sends `DELETE /api/v1/categories/{id}`.
2. Check Admin role.
3. Dispatch `DeleteCategoryCommand`.
4. Count recipes in category: if > 0 → HTTP 409 Conflict with message.
5. `prisma.category.delete({ where: { id } })`, invalidate cache.
6. Return HTTP 204 No Content.

**Alternative / Exception Flows:**

- A1 — Category has recipes → HTTP 409 with recipe count message.
- A2 — ID does not exist → HTTP 404.

**Expected Result:**

Category deleted from database. HTTP 204 returned.

**Acceptance Criteria:**

- [ ] Empty category deleted → 204
- [ ] Category with recipes → 409 with recipe count in message
- [ ] Non-admin gets 403
- [ ] Non-existent ID returns 404
- [ ] Cache invalidated after delete

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M13 — Quản trị danh mục (`#m13`)
**UI notes:** delete confirm + global 409 state (`#g409`)
### Issue #20 — FR-RCP-001: View Recipe List (Paginated + Filtered + Sorted)

| | |
|---|---|
| Assignee | Person 2 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-recipes.md` §FR-RCP-001 |
| Endpoint | `GET /api/v1/recipes?page=1&pageSize=12&categoryId={guid}&difficulty=Easy&maxCookTime=30&sort=-createdAt` |
| Status | ⬜ Open |

**Description:**

Returns a paginated list of recipes. Guests/Authors see Published only; Authors additionally see own Draft/Archived; Admins see all. Supports filtering by CategoryId, DifficultyLevel, cook time; sorting by createdAt, title, cookTime. Cached with apicache (15-min TTL).

**Main Flow:**

1. Client sends `GET /api/v1/recipes?...`.
2. Dispatch `GetRecipesQuery`.
3. Build Prisma where clause with filters from query params.
4. Apply authorization filter:
   - Guest → only Published
   - Author → Published OR (Draft AND authorId == userId)
   - Admin → all
5. Apply sorting: `sort="-createdAt"` → `orderBy: { createdAt: 'desc' }`.
6. COUNT total before pagination.
7. Apply OFFSET-LIMIT pagination (skip, take).
8. Map to `pagedResult<RecipeSummaryDto>`.
9. Return HTTP 200.

**Alternative / Exception Flows:**

- A1 — Invalid page or pageSize → HTTP 422.
- A2 — categoryId does not exist → HTTP 200 with empty items.

**Expected Result:**

`{ items[], totalCount, page, pageSize, totalPages, hasNextPage, hasPreviousPage }`

**Acceptance Criteria:**

- [ ] Returns 200 with paginated recipe list
- [ ] Guests only see PUBLISHED recipes
- [ ] Author sees own DRAFT recipes additionally
- [ ] Admin sees all statuses
- [ ] Filters combine with AND (categoryId + difficulty + maxCookTime)
- [ ] Sort: `-field` = descending, default `-createdAt`
- [ ] Pagination metadata correct (totalCount, totalPages, hasNext, hasPrev)
- [ ] pageSize > 50 or page < 1 returns 422
- [ ] Results cached (15-min TTL)

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M2 — Danh sách công thức (`#m2`)
**UI notes:** states: populated, loading, empty, filtered
### Issue #21 — FR-RCP-002: View Recipe Detail

| | |
|---|---|
| Assignee | Person 2 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-recipes.md` §FR-RCP-002 |
| Endpoint | `GET /api/v1/recipes/{slug}` |
| Status | ⬜ Open |

**Description:**

Returns complete recipe detail: basic info, ingredients sorted by sortOrder, steps sorted by stepNumber, images, nutrition, category, author info. Draft recipes viewable only by owning author or Admin. Cached (60-min TTL).

**Main Flow:**

1. Client sends `GET /api/v1/recipes/{slug}`.
2. Dispatch `GetRecipeBySlugQuery`.
3. Query with eager loading: `prisma.recipe.findUnique({ where: { slug }, include: { steps: orderBy stepNumber, ingredients: orderBy sortOrder, images, category, author, nutrition } })`.
4. Null → 404 Not Found.
5. Check Status: if Draft/Archived → only author or Admin may view.
6. Map to `RecipeDetailDto` (all nested collections).
7. Return HTTP 200.

**Alternative / Exception Flows:**

- A1 — Slug does not exist → HTTP 404.
- A2 — Draft/Archived + not authorized → HTTP 403.

**Expected Result:**

Full RecipeDetailDto including all nested data.

**Acceptance Criteria:**

- [ ] Published recipe returns 200 with full detail (steps, ingredients, images, nutrition, category, author)
- [ ] Steps sorted by stepNumber ascending
- [ ] Ingredients sorted by sortOrder ascending
- [ ] Draft recipe: only owner or Admin gets 200; others get 403
- [ ] Non-existent slug returns 404
- [ ] Result cached (60-min TTL)
- [ ] No N+1 queries (eager loading via Prisma `include`)

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M3 — Chi tiết công thức (`#m3`)
**UI notes:** states: populated, loading, 404, 403 draft
