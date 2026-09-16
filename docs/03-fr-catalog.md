# Chapter 3 — Module 3.2 (FR-CAT): Category Management

Source: `srs.md` lines 570-771.

## 3.2. Category Management Module (FR-CAT)

This module manages recipe categories. Categories are created and maintained by Admins; Authors and Guests only have read access. Each category has a unique Slug for SEO-friendly URLs. Categories are cached with node-cache (1-hour TTL) because they change infrequently.

### FR-CAT-001: View Category List

| | |
|---|---|
| Requirement code | FR-CAT-001 |
| Requirement name | View All Categories |
| Functional group | Category Management Module (FR-CAT) |
| Actor | All (Guest / Author / Admin) |
| Priority | M – Must Have |

**Description:**

Returns the list of all recipe categories in the system, including the published recipe count within each category. Results are cached with node-cache (60-minute TTL) and sorted by Name ascending.

**Preconditions:**

1. At least one category exists in the database (or returns an empty array).
2. No authentication required.

**Main flow (Happy Path):**

1. Client sends GET /api/v1/categories.
2. GetCategoriesQuery dispatched through the custom command bus.
3. Handler checks node-cache with key "categories:all".
4. Cache hit: return data from cache.
5. Cache miss: query the database — `prisma.category.findMany({ include: { _count: { select: { recipes: { where: { status: 'PUBLISHED' } } }, orderBy: { name: 'asc' } })`.
6. Store in node-cache with 60-minute TTL.
7. Return HTTP 200 OK with CategoryDto[].

**Alternative / Exception flows:**

- A1 – No categories: HTTP 200 OK with empty array [].

| | |
|---|---|
| HTTP Method & Endpoint | GET /api/v1/categories |
| Expected result | Array of CategoryDto[] with fields: `{ id, name, slug, description, recipeCount }`. Result served from cache when available. |
| HTTP Status Codes | 200 OK – success (including empty). |

### FR-CAT-002: View Category Detail and Recipes

| | |
|---|---|
| Requirement code | FR-CAT-002 |
| Requirement name | View Category Detail and Recipe List in the Category |
| Functional group | Category Management Module (FR-CAT) |
| Actor | All (Guest / Author / Admin) |
| Priority | M – Must Have |

**Description:**

Returns detailed information for a specific category (by Slug) along with a paginated list of published recipes in that category. Guests only see Published recipes; Authors additionally see their own Draft recipes within the category.

**Preconditions:**

1. A category with the corresponding slug exists.
2. No authentication required.

**Main flow (Happy Path):**

1. Client sends GET /api/v1/categories/{slug}?page=1&pageSize=12.
2. GetCategoryBySlugQuery dispatched through the custom command bus.
3. Handler finds the category by slug: `prisma.category.findUnique({ where: { slug } })`.
4. Query recipes in the category with Status == Published (+ Draft of currentUser if logged in).
5. Apply pagination (OFFSET-based: skip (page-1)\*pageSize, take pageSize).
6. Map to CategoryDetailDto with pagedResult<RecipeSummaryDto>.
7. Return HTTP 200 OK.

**Alternative / Exception flows:**

- A1 – Slug does not exist: HTTP 404 Not Found with RFC 7807 body.

| | |
|---|---|
| HTTP Method & Endpoint | GET /api/v1/categories/{slug}?page={n}&pageSize={n} |
| Expected result | `{ category: CategoryDto, recipes: { items: RecipeSummaryDto[], totalCount, page, pageSize, totalPages } }` |
| HTTP Status Codes | 200 OK – success. 404 Not Found – slug does not exist. |

### FR-CAT-003: Create New Category [Admin]

| | |
|---|---|
| Requirement code | FR-CAT-003 |
| Requirement name | Create New Recipe Category |
| Functional group | Category Management Module (FR-CAT) |
| Actor | Admin |
| Priority | M – Must Have |

**Description:**

Admin creates a new recipe category. The Slug is auto-generated from the Name (slugify: lowercase, strip diacritics, replace spaces with "-"). If the Slug already exists, the system appends a numeric suffix (e.g., "mon-chinh-2"). After creation, the category cache (node-cache key "categories:all") is invalidated.

**Preconditions:**

1. The user is logged in with the Admin role.
2. The Name does not already exist in the database.

**Main flow (Happy Path):**

1. Admin sends POST /api/v1/categories with `Authorization: Bearer {adminJwt}` and body: `{ "name": "...", "description": "..." }`.
2. Passport.js role middleware checks the Admin role.
3. CreateCategoryCommand dispatched through the custom command bus.
4. Zod validation middleware: name 2–50 characters, no HTML allowed.
5. `slugify(name, { lower: true, strict: true })` generates the slug.
6. Check the slug does not exist. If it collides, append "-2", "-3", ... until unique.
7. `prisma.category.create({ data: { name, slug, description } })`.
8. `categoryCache.del("categories:all")` — invalidate cache.
9. Return HTTP 201 Created with CategoryDto and Location header.

**Alternative / Exception flows:**

- A1 – Missing Admin role: HTTP 403 Forbidden.
- A2 – Invalid data: HTTP 422.

| | |
|---|---|
| HTTP Method & Endpoint | POST /api/v1/categories |
| Expected result | New category created in the database. Category cache deleted. Location header points to /api/v1/categories/{newSlug}. |
| HTTP Status Codes | 201 Created – success. 403 Forbidden – not an Admin. 409 Conflict – name already exists. 422 Unprocessable Entity – invalid data. |

### FR-CAT-004: Update Category [Admin]

| | |
|---|---|
| Requirement code | FR-CAT-004 |
| Requirement name | Update Category Information |
| Functional group | Category Management Module (FR-CAT) |
| Actor | Admin |
| Priority | M – Must Have |

**Description:**

Admin updates the Name and/or Description of a category. The Slug does NOT change when the name changes (to avoid broken links). After an update, the cache is invalidated.

**Preconditions:**

1. Admin is logged in.
2. A category with the corresponding ID exists.

**Main flow (Happy Path):**

1. Admin sends PUT /api/v1/categories/{id} with body: `{ "name": "...", "description": "..." }`.
2. Check the Admin role.
3. UpdateCategoryCommand dispatched through the custom command bus.
4. Find the category by ID, update Name and Description.
5. Persist the change, invalidate cache.
6. Return HTTP 200 OK with the updated CategoryDto.

**Alternative / Exception flows:**

- A1 – ID does not exist: HTTP 404.
- A2 – Missing Admin role: HTTP 403.

| | |
|---|---|
| HTTP Method & Endpoint | PUT /api/v1/categories/{id} |
| Expected result | Category info updated. Cache invalidated. |
| HTTP Status Codes | 200 OK – update succeeded. 403 Forbidden. 404 Not Found. 422 Unprocessable Entity. |

### FR-CAT-005: Delete Category [Admin]

| | |
|---|---|
| Requirement code | FR-CAT-005 |
| Requirement name | Delete Category |
| Functional group | Category Management Module (FR-CAT) |
| Actor | Admin |
| Priority | S – Should Have |

**Description:**

Admin deletes a category. Business rule: MUST NOT delete a category that still contains recipes (whether Published or Draft). Admin must move all recipes to another category before deleting. This is a soft constraint protecting data integrity.

**Preconditions:**

1. Admin is logged in.
2. The category exists and contains no recipes.

**Main flow (Happy Path):**

1. Admin sends DELETE /api/v1/categories/{id}.
2. Check the Admin role.
3. DeleteCategoryCommand dispatched.
4. Count recipes in the category: if > 0 → return HTTP 409 Conflict with a message.
5. `prisma.category.delete({ where: { id } })`, invalidate cache.
6. Return HTTP 204 No Content.

**Alternative / Exception flows:**

- A1 – Category has recipes: HTTP 409 Conflict with the recipe count message.
- A2 – ID does not exist: HTTP 404.

| | |
|---|---|
| HTTP Method & Endpoint | DELETE /api/v1/categories/{id} |
| Expected result | Category deleted from the database. HTTP 204 returned. |
| HTTP Status Codes | 204 No Content – delete succeeded. 403 Forbidden. 404 Not Found. 409 Conflict – category still has recipes. |