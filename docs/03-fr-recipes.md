# Chapter 3 — Module 3.3 (FR-RCP): Recipe Management

Source: `srs.md` lines 772-1129.

## 3.3. Recipe Management Module (FR-RCP)

The core module of the system. Recipe is the aggregate root containing the child entities RecipeStep, RecipeIngredient, RecipeImage, and RecipeNutrition. All mutations (Create/Update/Delete) go through a transaction to ensure consistency. Concurrency is handled via the updatedAt version field to detect lost updates when two Authors edit the same recipe.

### FR-RCP-001: View Recipe List (Paginated + Filtered + Sorted)

| | |
|---|---|
| Requirement code | FR-RCP-001 |
| Requirement name | View Recipe List with Pagination, Filters and Sorting |
| Functional group | Recipe Management Module (FR-RCP) |
| Actor | All (Guest / Author / Admin) |
| Priority | M – Must Have |

**Description:**

Returns a paginated list of recipes. Guests and other Authors only see Status == Published. Authors additionally see their own Draft/Archived recipes. Admins see all statuses. Supports filtering by CategoryId, DifficultyLevel, and cook time; sorting by createdAt, title, cookTime. Results are cached with apicache (15-minute TTL).

**Preconditions:**

1. No authentication required (public endpoint for Published recipes).
2. Parameters: page >= 1, pageSize in [1, 50].

**Main flow (Happy Path):**

1. Client sends GET /api/v1/recipes?page=1&pageSize=12&categoryId={guid}&difficulty=Easy&maxCookTime=30&sort=-createdAt.
2. GetRecipesQuery dispatched through the custom command bus.
3. Handler builds a Prisma where clause with filters from query params.
4. Apply the Authorization filter: Guest → only Published; Author → Published OR (Draft AND authorId == userId); Admin → all.
5. Apply sorting: sort="-createdAt" → orderBy: { createdAt: 'desc' }; sort="title" → orderBy: { title: 'asc' }.
6. COUNT total before pagination.
7. Apply OFFSET-LIMIT pagination (skip, take).
8. Map to pagedResult<RecipeSummaryDto>.
9. Return HTTP 200 OK.

**Alternative / Exception flows:**

- A1 – Invalid page or pageSize: HTTP 422.
- A2 – categoryId does not exist: HTTP 200 with empty items.

| | |
|---|---|
| HTTP Method & Endpoint | GET /api/v1/recipes?page={n}&pageSize={n}&categoryId={guid}&difficulty={level}&maxCookTime={min}&sort={field} |
| Expected result | pagedResult<RecipeSummaryDto>: `{ items[], totalCount, page, pageSize, totalPages, hasNextPage, hasPreviousPage }`. |
| HTTP Status Codes | 200 OK – success (including empty items). 422 Unprocessable Entity – invalid params. |

### FR-RCP-002: View Recipe Detail

| | |
|---|---|
| Requirement code | FR-RCP-002 |
| Requirement name | View Recipe Detail |
| Functional group | Recipe Management Module (FR-RCP) |
| Actor | All (Guest / Author / Admin) |
| Priority | M – Must Have |

**Description:**

Returns the complete detail of a specific recipe, including: basic info, ingredient list sorted by sortOrder, steps sorted by stepNumber, images, nutritional info, category, and author info. Draft recipes can only be viewed by the owning author or an Admin. The endpoint is cached (60-minute TTL).

**Preconditions:**

1. A recipe with the corresponding slug exists.
2. If the recipe is Draft/Archived: the requester must be the author or an Admin.

**Main flow (Happy Path):**

1. Client sends GET /api/v1/recipes/{slug}.
2. GetRecipeBySlugQuery dispatched through the custom command bus.
3. Handler queries the Recipe with eager loading: `prisma.recipe.findUnique({ where: { slug }, include: { steps: { orderBy: { stepNumber: 'asc' } }, ingredients: { orderBy: { sortOrder: 'asc' } }, images: true, category: true, author: true, nutrition: true } })`.
4. Check for null → 404 Not Found if not found.
5. Check Status: if Draft/Archived → only the author or an Admin may view.
6. Map to RecipeDetailDto (including all nested collections).
7. Return HTTP 200 OK.

**Alternative / Exception flows:**

- A1 – Slug does not exist: HTTP 404 Not Found.
- A2 – Recipe is Draft/Archived and the user is not authorized: HTTP 403 Forbidden.

| | |
|---|---|
| HTTP Method & Endpoint | GET /api/v1/recipes/{slug} |
| Expected result | Full RecipeDetailDto including all nested data. |
| HTTP Status Codes | 200 OK – success. 403 Forbidden – not allowed to view Draft. 404 Not Found – slug does not exist. |

### FR-RCP-003: Create New Recipe [Author/Admin]

| | |
|---|---|
| Requirement code | FR-RCP-003 |
| Requirement name | Create New Recipe |
| Functional group | Recipe Management Module (FR-RCP) |
| Actor | Author / Admin |
| Priority | M – Must Have |

**Description:**

An Author or Admin creates a new recipe. The initial status is always Draft (not public). The Slug is auto-generated from the Title. Steps and Ingredients can be created at the same time (in the same request) or added individually later.

**Preconditions:**

1. The user is logged in with the Author or Admin role.
2. CategoryId references an existing category.

**Main flow (Happy Path):**

1. Author sends POST /api/v1/recipes with body: `{ title, description, categoryId, prepTimeMinutes, cookTimeMinutes, servings, difficulty, instructions?, nutrition?: {...}, steps?: [...], ingredients?: [...] }`.
2. Authentication check (Passport.js JWT middleware).
3. CreateRecipeCommand dispatched.
4. Zod validation: title 5–200 characters, prepTime/cookTime/servings > 0, categoryId a valid UUID.
5. `slugify(title, { lower: true, strict: true })`, check the slug is unique.
6. Create the recipe in a transaction: `prisma.$transaction()` (recipe + steps + ingredients + nutrition).
7. Invalidate cache.
8. Return HTTP 201 Created with RecipeDto.

**Alternative / Exception flows:**

- A1 – Not authorized as Author/Admin: HTTP 401/403.
- A2 – CategoryId does not exist: HTTP 422.
- A3 – Slug already exists (duplicate title): HTTP 409 Conflict.

| | |
|---|---|
| HTTP Method & Endpoint | POST /api/v1/recipes |
| Expected result | New recipe created with Status = Draft, Slug auto-generated. |
| HTTP Status Codes | 201 Created – success. 401/403 – not logged in / not authorized. 409 Conflict – slug exists. 422 Unprocessable Entity – invalid data. |

### FR-RCP-004: Update Recipe [Author-Owner/Admin]

| | |
|---|---|
| Requirement code | FR-RCP-004 |
| Requirement name | Update Recipe Information |
| Functional group | Recipe Management Module (FR-RCP) |
| Actor | Owning Author / Admin |
| Priority | M – Must Have |

**Description:**

Updates a recipe's information. Resource-Based Authorization applies: only the Author who owns the recipe (authorId == currentUserId) or an Admin is allowed. Concurrency control via the updatedAt version field (ETag pattern): the client must send the current version in the If-Match header.

**Preconditions:**

1. Author/Admin is logged in.
2. A recipe with the corresponding ID exists.
3. The client provides a valid version in the If-Match header.

**Main flow (Happy Path):**

1. Author sends PUT /api/v1/recipes/{id} with body.
2. Authentication check.
3. UpdateRecipeCommand dispatched.
4. Fetch the recipe from the database by ID.
5. Resource-based auth check: `recipe.authorId === user.id || user.roles.includes('Admin')`.
6. Version check: compare `recipe.updatedAt` with the `If-Match` header value.
7. Update the recipe fields.
8. `prisma.recipe.update()` — if updatedAt mismatches here → HTTP 409 Conflict.
9. Invalidate cache.
10. Return HTTP 200 OK with the updated RecipeDto.

**Alternative / Exception flows:**

- A1 – Not the owner: HTTP 403 Forbidden.
- A2 – Concurrency conflict (version mismatch): HTTP 409 Conflict.
- A3 – ID does not exist: HTTP 404.

| | |
|---|---|
| HTTP Method & Endpoint | PUT /api/v1/recipes/{id} |
| Expected result | Recipe updated, cache invalidated, returns the latest RecipeDto. |
| HTTP Status Codes | 200 OK. 403 Forbidden – not the owner. 404 Not Found. 409 Conflict – concurrency or slug duplicate. 422 Unprocessable Entity. |

### FR-RCP-005: Publish/Unpublish Recipe

| | |
|---|---|
| Requirement code | FR-RCP-005 |
| Requirement name | Publish / Unpublish Recipe |
| Functional group | Recipe Management Module (FR-RCP) |
| Actor | Owning Author / Admin |
| Priority | M – Must Have |

**Description:**

Changes the recipe status: Draft → Published or Published → Draft. Business rule: a recipe CANNOT be published without at least 1 execution step.

**Preconditions:**

1. The recipe exists and the user is the owner or an Admin.
2. To publish: the recipe must have at least 1 RecipeStep.

**Main flow (Happy Path):**

1. Author sends PATCH /api/v1/recipes/{id}/publish or PATCH /api/v1/recipes/{id}/unpublish.
2. PublishRecipeCommand dispatched.
3. Resource-based authorization check.
4. If publishing: check steps.length > 0; otherwise return 422.
5. Set Status = Published/Draft, updatedAt = new Date().
6. `prisma.recipe.update()`, invalidate cache.
7. Return HTTP 200 OK with RecipeDto.

**Alternative / Exception flows:**

- A1 – Recipe has no steps: HTTP 422.
- A2 – Recipe already in the desired state: idempotent, HTTP 200 OK.

| | |
|---|---|
| HTTP Method & Endpoint | PATCH /api/v1/recipes/{id}/publish \| PATCH /api/v1/recipes/{id}/unpublish |
| Expected result | Recipe status changed. Cache invalidated. |
| HTTP Status Codes | 200 OK – success. 403 Forbidden. 404 Not Found. 422 Unprocessable Entity – missing steps. |

### FR-RCP-006: Archive Recipe

| | |
|---|---|
| Requirement code | FR-RCP-006 |
| Requirement name | Archive Recipe (Archive / Unarchive) |
| Functional group | Recipe Management Module (FR-RCP) |
| Actor | Owning Author / Admin |
| Priority | S – Should Have |

**Description:**

Moves a Recipe to the Archived status. Archived recipes do not appear in public listings but are not deleted from the database.

**Preconditions:**

1. The recipe exists and the user is authorized.

**Main flow (Happy Path):**

1. Author sends PATCH /api/v1/recipes/{id}/archive.
2. Authorization check.
3. Set Status = Archived.
4. `prisma.recipe.update()`, invalidate cache.
5. HTTP 200 OK.

| | |
|---|---|
| HTTP Method & Endpoint | PATCH /api/v1/recipes/{id}/archive |
| HTTP Status Codes | 200 OK. 403 Forbidden. 404 Not Found. |

### FR-RCP-007: Delete Recipe [Author-Owner/Admin]

| | |
|---|---|
| Requirement code | FR-RCP-007 |
| Requirement name | Permanently Delete Recipe |
| Functional group | Recipe Management Module (FR-RCP) |
| Actor | Owning Author / Admin |
| Priority | M – Must Have |

**Description:**

Permanently deletes a recipe and all related data (cascade delete). Image files on MinIO are deleted asynchronously via a BullMQ fire-and-forget job. This is a hard delete.

**Main flow (Happy Path):**

1. Author/Admin sends DELETE /api/v1/recipes/{id}.
2. Authentication and resource-based authorization check.
3. Fetch the list of image URLs from the recipe.
4. `prisma.recipe.delete({ where: { id } })` — cascade delete Steps, Ingredients, Images.
5. For each imageUrl: `fileCleanupQueue.add('delete', { url })` — delete the image on MinIO asynchronously.
6. Invalidate cache.
7. Return HTTP 204 No Content.

**Alternative / Exception flows:**

- A1 – ID does not exist: HTTP 404.
- A2 – Not the owner: HTTP 403.
- A3 – MinIO file deletion fails (job retry): BullMQ automatically retries 3 times.

| | |
|---|---|
| HTTP Method & Endpoint | DELETE /api/v1/recipes/{id} |
| HTTP Status Codes | 204 No Content – delete succeeded. 403 Forbidden. 404 Not Found. |

### FR-RCP-008: Recipe Image Management (Upload / Set Primary / Delete)

| | |
|---|---|
| Requirement code | FR-RCP-008 |
| Requirement name | Upload Image, Set Primary Image, Delete Recipe Image |
| Functional group | Recipe Management Module (FR-RCP) |
| Actor | Owning Author / Admin |
| Priority | M – Must Have |

**Description:**

Authors manage recipe illustrations. Upload uses multipart/form-data (multer). Images are stored on MinIO at path: recipes/{recipeId}/{uuid}.{ext}. Mandatory validation: MIME type (image/jpeg, image/png, image/webp, image/avif) and max size 5 MB.

**Main flow (Happy Path):**

1. POST /api/v1/recipes/{id}/images with multipart/form-data containing the "file" field.
2. Validate MIME type and size (5 MB max).
3. Validate magic bytes.
4. Upload to MinIO via `s3Client.send(new PutObjectCommand(...))`.
5. `prisma.recipeImage.create()` — persist the URL in the database.
6. HTTP 201 Created.
7. PATCH /api/v1/recipes/{id}/images/{imageId}/primary — set the primary image.
8. DELETE /api/v1/recipes/{id}/images/{imageId} — delete the image + BullMQ job deletes the MinIO file.

| | |
|---|---|
| HTTP Method & Endpoint | POST /api/v1/recipes/{id}/images \| PATCH /api/v1/recipes/{id}/images/{imgId}/primary \| DELETE /api/v1/recipes/{id}/images/{imgId} |
| HTTP Status Codes | Upload: 201. Set Primary: 200. Delete: 204. 400 – invalid file. 403/404. |

### FR-RCP-009: Ingredient Management (CRUD RecipeIngredient)

| | |
|---|---|
| Requirement code | FR-RCP-009 |
| Requirement name | Add / Update / Delete Recipe Ingredients |
| Functional group | Recipe Management Module (FR-RCP) |
| Actor | Owning Author / Admin |
| Priority | M – Must Have |

**Description:**

Authors manage the ingredient list (RecipeIngredient) of a recipe. Each ingredient has: Name, Quantity, Unit, Notes, sortOrder. The endpoint supports adding (POST), updating (PUT), and deleting (DELETE).

**Main flow (Happy Path):**

1. POST /api/v1/recipes/{id}/ingredients — add an ingredient.
2. PUT /api/v1/recipes/{id}/ingredients/{ingId} — update.
3. DELETE /api/v1/recipes/{id}/ingredients/{ingId} — delete.

| | |
|---|---|
| HTTP Method & Endpoint | POST/PUT/DELETE /api/v1/recipes/{id}/ingredients/{ingId?} |
| HTTP Status Codes | 201/200/204 – success. 403/404/422 – corresponding errors. |

### FR-RCP-010: Steps Management (CRUD RecipeStep)

| | |
|---|---|
| Requirement code | FR-RCP-010 |
| Requirement name | Add / Update / Delete Recipe Steps |
| Functional group | Recipe Management Module (FR-RCP) |
| Actor | Owning Author / Admin |
| Priority | M – Must Have |

**Description:**

Authors manage the execution steps (RecipeStep). Each step has: stepNumber (auto-increment), description, timerMinutes, imageUrl. When a step is deleted, the system automatically renumbers the remaining steps.

**Main flow (Happy Path):**

1. POST /api/v1/recipes/{id}/steps — add a new step (stepNumber = max + 1).
2. DELETE /api/v1/recipes/{id}/steps/{stepId} — delete the step + renumber.

| | |
|---|---|
| HTTP Method & Endpoint | POST/PUT/DELETE /api/v1/recipes/{id}/steps/{stepId?} |
| HTTP Status Codes | 201/200/204 – success. 403/404/422 – errors. |