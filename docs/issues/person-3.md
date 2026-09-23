# Person 3 — Recipe Lifecycle + Search Params

**8 issues** covering recipe state changes, sub-entity CRUD, and search query params.

---

### Issue #22 — FR-RCP-005: Publish/Unpublish Recipe

| | |
|---|---|
| Assignee | Person 3 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-recipes.md` §FR-RCP-005 |
| Endpoints | `PATCH /api/v1/recipes/{id}/publish` · `PATCH /api/v1/recipes/{id}/unpublish` |
| Status | ⬜ Open |

**Description:**

Changes recipe status: Draft → Published or Published → Draft. Business rule: a recipe CANNOT be published without at least 1 execution step.

**Main Flow:**

1. Author sends `PATCH /api/v1/recipes/{id}/publish` or `.../unpublish`.
2. Dispatch `PublishRecipeCommand`.
3. Resource-based authorization check (owner or Admin).
4. If publishing: check `steps.length > 0`; otherwise return 422.
5. Set `Status = Published/Draft`, `updatedAt = new Date()`.
6. `prisma.recipe.update()`, invalidate cache.
7. Return HTTP 200 with RecipeDto.

**Alternative / Exception Flows:**

- A1 — Recipe has no steps → HTTP 422.
- A2 — Recipe already in desired state → idempotent, HTTP 200.

**Expected Result:**

Recipe status changed. Cache invalidated.

**Acceptance Criteria:**

- [ ] Draft with ≥1 step publishes → 200, status = PUBLISHED
- [ ] Published recipe unpublishes → 200, status = DRAFT
- [ ] Draft with 0 steps → 422 `RECIPE_PUBLISH_INCOMPLETE`
- [ ] Already in desired state → 200 (idempotent, no error)
- [ ] Non-owner non-admin → 403
- [ ] Non-existent recipe → 404
- [ ] Cache invalidated after status change
- [ ] `publishedAt` set when status becomes PUBLISHED

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M10 — Công thức của bạn (`#m10`)
**UI notes:** publish/unpublish action + status badge
### Issue #23 — FR-RCP-006: Archive Recipe

| | |
|---|---|
| Assignee | Person 3 |
| Priority | S – Should Have |
| Doc reference | `docs/03-fr-recipes.md` §FR-RCP-006 |
| Endpoint | `PATCH /api/v1/recipes/{id}/archive` |
| Status | ⬜ Open |

**Description:**

Moves a Recipe to Archived status. Archived recipes do not appear in public listings but are not deleted from the database.

**Main Flow:**

1. Author sends `PATCH /api/v1/recipes/{id}/archive`.
2. Authorization check (owner or Admin).
3. Set `Status = Archived`.
4. `prisma.recipe.update()`, invalidate cache.
5. HTTP 200.

**Expected Result:**

Recipe archived. Hidden from public listings, still in DB.

**Acceptance Criteria:**

- [ ] Recipe status set to ARCHIVED → 200
- [ ] Archived recipe does NOT appear in public recipe list
- [ ] Archived recipe does NOT appear in category listings
- [ ] Archived recipe does NOT appear in search results
- [ ] Owner/Admin can still view archived recipe detail
- [ ] Non-owner → 403, non-existent → 404
- [ ] Cache invalidated

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M10 — Công thức của bạn (`#m10`)
**UI notes:** archive action + status badge
### Issue #24 — FR-RCP-007: Delete Recipe

| | |
|---|---|
| Assignee | Person 3 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-recipes.md` §FR-RCP-007 |
| Endpoint | `DELETE /api/v1/recipes/{id}` |
| Status | ⬜ Open |

**Description:**

Permanently deletes a recipe and all related data (cascade delete). Image files on MinIO deleted asynchronously via BullMQ fire-and-forget job. This is a hard delete.

**Main Flow:**

1. Author/Admin sends `DELETE /api/v1/recipes/{id}`.
2. Authentication + resource-based authorization check.
3. Fetch list of image URLs from the recipe.
4. `prisma.recipe.delete({ where: { id } })` — cascade delete Steps, Ingredients, Images.
5. For each imageUrl: `fileCleanupQueue.add('delete', { url })` — delete MinIO file asynchronously.
6. Invalidate cache.
7. Return HTTP 204 No Content.

**Alternative / Exception Flows:**

- A1 — ID does not exist → HTTP 404.
- A2 — Not the owner → HTTP 403.
- A3 — MinIO file deletion fails → BullMQ auto-retries 3 times.

**Expected Result:**

Recipe and all children deleted. HTTP 204 returned. MinIO files cleaned up async.

**Acceptance Criteria:**

- [ ] Recipe + steps + ingredients + images deleted (cascade)
- [ ] Returns 204 No Content
- [ ] Each image URL enqueued in `fileCleanupQueue` for MinIO deletion
- [ ] Non-owner → 403, non-existent → 404
- [ ] Cache invalidated
- [ ] BullMQ retries MinIO deletion up to 3 times on failure

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M10 — Công thức của bạn (`#m10`)
**UI notes:** delete confirm + global 404 (`#g404`)
### Issue #25 — FR-RCP-009: Ingredient Management (CRUD)

| | |
|---|---|
| Assignee | Person 3 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-recipes.md` §FR-RCP-009 |
| Endpoints | `POST /api/v1/recipes/{id}/ingredients` · `PUT /api/v1/recipes/{id}/ingredients/{ingId}` · `DELETE /api/v1/recipes/{id}/ingredients/{ingId}` |
| Status | ⬜ Open |

**Description:**

Authors manage the ingredient list of a recipe. Each ingredient has: Name, Quantity, Unit, Notes, sortOrder. Supports add (POST), update (PUT), delete (DELETE).

**Main Flow:**

1. `POST /api/v1/recipes/{id}/ingredients` — add ingredient → 201.
2. `PUT /api/v1/recipes/{id}/ingredients/{ingId}` — update → 200.
3. `DELETE /api/v1/recipes/{id}/ingredients/{ingId}` — delete → 204.

**Expected Result:**

Ingredient CRUD operations succeed with correct status codes.

**Acceptance Criteria:**

- [ ] Add ingredient → 201 with RecipeIngredientDto
- [ ] Update ingredient → 200 with updated RecipeIngredientDto
- [ ] Delete ingredient → 204 No Content
- [ ] Ownership check: only owner/Admin (403 otherwise)
- [ ] Non-existent recipe → 404
- [ ] Non-existent ingredient → 404
- [ ] Validation: name required, quantity numeric if provided (422)
- [ ] `orderIndex` controls display order

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M11 / M12 (`#m11`, `#m12`) — ingredients form
**UI notes:** add/update/remove rows
### Issue #26 — FR-RCP-010: Steps Management (CRUD)

| | |
|---|---|
| Assignee | Person 3 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-recipes.md` §FR-RCP-010 |
| Endpoints | `POST /api/v1/recipes/{id}/steps` · `PUT /api/v1/recipes/{id}/steps/{stepId}` · `DELETE /api/v1/recipes/{id}/steps/{stepId}` |
| Status | ⬜ Open |

**Description:**

Authors manage execution steps. Each step has: stepNumber (auto-increment), title, description, timerMinutes, imageUrl. When a step is deleted, the system automatically renumbers the remaining steps.

**Main Flow:**

1. `POST /api/v1/recipes/{id}/steps` — new step (`stepNumber = max + 1`) → 201.
2. `PUT /api/v1/recipes/{id}/steps/{stepId}` — update → 200.
3. `DELETE /api/v1/recipes/{id}/steps/{stepId}` — delete + **renumber** → 204.

**Expected Result:**

Step CRUD succeeds. Auto-renumbering after delete.

**Acceptance Criteria:**

- [ ] Add step → 201, stepNumber = current max + 1
- [ ] Update step → 200
- [ ] Delete step → 204
- [ ] **After delete, remaining steps renumbered sequentially (1, 2, 3...)**
- [ ] Ownership check: only owner/Admin (403 otherwise)
- [ ] Non-existent recipe/step → 404
- [ ] Validation: title and description required (422)
- [ ] `timerMinutes` ≥ 0 if provided

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M11 / M12 (`#m11`, `#m12`) — steps form
**UI notes:** add/update/remove + renumber
### Issue #27 — FR-SRCH-002: Filtering Recipes

| | |
|---|---|
| Assignee | Person 3 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-misc.md` §3.4 FR-SRCH-002 |
| Endpoint | Query params on `GET /api/v1/recipes` |
| Status | ⬜ Open |

**Description:**

Filter recipes by `categoryId`, `difficulty`, `maxCookTime`, `minServings`. Filters combine with AND logic. Built into FR-RCP-001.

**Main Flow:**

1. Client sends `GET /api/v1/recipes?categoryId={guid}&difficulty=Easy&maxCookTime=30&minServings=2`.
2. Each filter adds a WHERE clause condition.
3. Filters combine with AND.
4. Applied before pagination (COUNT reflects filtered total).

**Expected Result:**

Filtered recipe list. Filters combine with AND.

**Acceptance Criteria:**

- [ ] `categoryId` filter returns only recipes in that category
- [ ] `difficulty` filter accepts Easy/Medium/Hard/Expert
- [ ] `maxCookTime` returns recipes with cookTime ≤ value
- [ ] `minServings` returns recipes with servings ≥ value
- [ ] Multiple filters combine with AND (all must match)
- [ ] totalCount reflects filtered count (not total recipes)
- [ ] Invalid difficulty value → 422

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M2 — filter bar (`#m2`)
**UI notes:** category, difficulty, time filters combined
### Issue #28 — FR-SRCH-003: Sorting Recipes

| | |
|---|---|
| Assignee | Person 3 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-misc.md` §3.4 FR-SRCH-003 |
| Endpoint | Query param on `GET /api/v1/recipes` |
| Status | ⬜ Open |

**Description:**

Sort recipes by field: `sort={field}` (e.g., `sort=-createdAt`). "-" prefix = descending. Default: `-createdAt`.

**Main Flow:**

1. Client sends `GET /api/v1/recipes?sort=-createdAt` or `sort=title`.
2. Parse prefix: `-` = descending, no prefix = ascending.
3. Map to Prisma `orderBy` clause.
4. Default if no sort param: `{ createdAt: 'desc' }`.

**Expected Result:**

Recipes sorted by specified field and direction.

**Acceptance Criteria:**

- [ ] `sort=-createdAt` → newest first (desc)
- [ ] `sort=createdAt` → oldest first (asc)
- [ ] `sort=title` → title A→Z
- [ ] `sort=-cookTime` → longest cook time first
- [ ] No sort param → default `-createdAt` (newest first)
- [ ] Invalid sort field → 422 or ignored (safe fallback)

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M2 — sort dropdown (`#m2`)
**UI notes:** sort options incl. -createdAt default
### Issue #29 — FR-SRCH-004: Pagination

| | |
|---|---|
| Assignee | Person 3 |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-misc.md` §3.4 FR-SRCH-004 |
| Endpoint | Query params on `GET /api/v1/recipes` and other list endpoints |
| Status | ⬜ Open |

**Description:**

Offset-based pagination using `page={n}, pageSize={n}`. Response includes `totalCount`, `totalPages`.

**Main Flow:**

1. Client sends `GET /api/v1/recipes?page=2&pageSize=12`.
2. Calculate `skip = (page - 1) * pageSize`.
3. COUNT total matching records.
4. Query with `skip` and `take: pageSize`.
5. Compute `totalPages = ceil(totalCount / pageSize)`.
6. Return pagedResult wrapper.

**Expected Result:**

Paginated results with metadata: `{ items, totalCount, page, pageSize, totalPages, hasNextPage, hasPreviousPage }`

**Acceptance Criteria:**

- [ ] Page 1 returns first N items
- [ ] Page 2 returns next N items (no overlap with page 1)
- [ ] `totalCount` = total matching records (not page count)
- [ ] `totalPages` = `ceil(totalCount / pageSize)`
- [ ] `hasNextPage` / `hasPreviousPage` correct at boundaries
- [ ] `page < 1` or `pageSize > 50` → 422
- [ ] Last page returns remaining items (not padded)
- [ ] Page beyond range returns empty items array with 200

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M2 — pagination (`#m2`)
**UI notes:** page controls + totals
