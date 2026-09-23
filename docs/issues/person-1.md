# Person 1 (Leader) — Auth + Transactions + Image Storage + Algorithm

**14 issues** covering FR-AUTH (7), FR-FILE (2), and selected FR-RCP / FR-SRCH / FR-JOB issues.

Learning goals: **Auth (OAuth/JWT), Transactions, Image Storage, Algorithm**

---

### Issue #1 — FR-AUTH-001: User Registration

| | |
|---|---|
| Assignee | Person 1 (Lead) |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-auth.md` §FR-AUTH-001 |
| Endpoint | `POST /api/v1/auth/register` |
| Status | ⬜ Open |

**Description:**

Allow anonymous users to create an account with fullName, email, userName, and password. Auto-assign the "Author" role, generate a JWT token pair, persist the refresh token, and push a welcome email job to BullMQ (fire-and-forget).

**Main Flow:**

1. Client sends `POST /api/v1/auth/register` with `{ fullName, email, userName, password }`.
2. Dispatch `RegisterCommand` through the custom command bus.
3. Zod validation: fullName non-empty, email valid format, userName no special chars, password ≥ 8 chars (1 uppercase, 1 digit, 1 special char).
4. Check email does not already exist: `prisma.user.findUnique({ where: { email } })`.
5. Hash password: `bcrypt.hash(password, 12)`.
6. Create user: `prisma.user.create({ data: { fullName, email, userName, passwordHash } })`.
7. Assign "Author" role: `prisma.userRole.create({ data: { userId, roleId: authorRoleId } })`.
8. Sign JWT access token (15 min): `jwt.sign({ sub: user.id, email, roles }, JWT_SECRET, { expiresIn: '15m' })`.
9. Generate refresh token: `crypto.randomBytes(64).toString('hex')`.
10. Persist refresh token: `prisma.refreshToken.create()`.
11. Push welcome email job: `welcomeEmailQueue.add('welcome', { userId, email })`.
12. Return HTTP 201 with `{ accessToken, refreshToken, expiresAt, user }`.

**Alternative / Exception Flows:**

- A1 — Email already exists → HTTP 409 Conflict (RFC 7807).
- A2 — Password too weak / bcrypt fails → HTTP 422 with field errors.
- A3 — Zod validation fails → HTTP 422 with per-field errors.
- A4 — Database unreachable → HTTP 500 (no stack trace exposed).

**Expected Result:**

New account created, "Author" role assigned, refresh token persisted, welcome email pushed to BullMQ. Client receives access + refresh tokens.

**Acceptance Criteria:**

- [ ] Registration with valid data returns 201 with token pair and user object
- [ ] Duplicate email returns 409 with RFC 7807 body
- [ ] Weak password (missing uppercase/digit/special) returns 422 with field errors
- [ ] Password stored as bcrypt hash (never plaintext)
- [ ] "Author" role assigned on registration
- [ ] Refresh token persisted to database
- [ ] Welcome email job enqueued in BullMQ
- [ ] Auto-login after registration (tokens returned immediately)

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M8 — Đăng ký (`#m8`)
**UI notes:** states: populated, loading, validation error
### Issue #2 — FR-AUTH-002: Local Login (Email/Password)

| | |
|---|---|
| Assignee | Person 1 (Lead) |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-auth.md` §FR-AUTH-002 |
| Endpoint | `POST /api/v1/auth/login` |
| Status | ⬜ Open |

**Description:**

Allow registered users to log in with email and password. Each successful login creates a new JWT access token (15 min) and a new refresh token (7 days). The old refresh token is marked as used (not deleted) to detect token reuse attacks.

**Main Flow:**

1. Client sends `POST /api/v1/auth/login` with `{ email, password }`.
2. Dispatch `LoginCommand` through the command bus.
3. Zod validation: email format, password non-empty.
4. Find user: `prisma.user.findUnique({ where: { email } })`.
5. Verify password: `bcrypt.compare(password, user.passwordHash)`.
6. Check account not locked: `user.isActive === true`.
7. Sign new access token (15 min).
8. Generate new refresh token: `crypto.randomBytes(64).toString('hex')`.
9. Persist new refresh token.
10. Return HTTP 200 with AuthResponseDto.

**Alternative / Exception Flows:**

- A1 — Wrong email or password → HTTP 401 with generic message "Email or password is incorrect" (MUST NOT reveal which is wrong — prevents user enumeration).
- A2 — Account locked (`isActive = false`) → HTTP 403.
- A3 — Too many failed attempts (5 times) → `accessFailedCount` increments; account temporarily locked.

**Expected Result:**

New access token and refresh token created and returned. Refresh token persisted to database.

**Acceptance Criteria:**

- [ ] Valid credentials return 200 with token pair
- [ ] Wrong email OR wrong password both return 401 with identical generic message
- [ ] Locked account returns 403
- [ ] After 5 failed attempts, account is temporarily locked
- [ ] Old refresh token marked as used (not deleted) on new login

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M7 — Đăng nhập (`#m7`)
**UI notes:** states: populated, loading, error
### Issue #3 — FR-AUTH-003: Google OAuth 2.0 Login

| | |
|---|---|
| Assignee | Person 1 (Lead) |
| Priority | S – Should Have |
| Doc reference | `docs/03-fr-auth.md` §FR-AUTH-003 |
| Endpoint | `POST /api/v1/auth/google` |
| Status | ⬜ Open |

**Description:**

Support login via Google account using OAuth 2.0 Authorization Code Flow with PKCE. First-time Google login auto-creates an account from Google profile (email, display name, avatar) and assigns "Author" role. If email already exists from manual registration, link the Google login to the existing account.

**Main Flow:**

1. Frontend redirects to Google Authorization Endpoint with scopes: `openid, email, profile`.
2. User grants permission on Google Consent Screen.
3. Google redirects to callback URL with Authorization Code.
4. Auth.js v5 (Next.js) handles callback, obtains access token, fetches profile.
5. Frontend sends `POST /api/v1/auth/google` with Google ExternalLoginInfo.
6. Handler finds user: `prisma.user.findFirst({ where: { googleId: providerKey } })`.
7. If no account: check email — if not registered, create new user from Google profile, assign "Author" role, persist Google link.
8. If email exists (manual registration): link Google login to existing account.
9. Create access + refresh tokens, persist to database.
10. Return HTTP 200 with AuthResponseDto.

**Alternative / Exception Flows:**

- A1 — Google token invalid or expired → HTTP 401.
- A2 — Google email revokes permission → HTTP 400.
- A3 — Google API unavailable → HTTP 502 Bad Gateway.

**Expected Result:**

User is logged in (or auto-registered) and receives AuthResponseDto.

**Acceptance Criteria:**

- [ ] First Google login creates new account with Author role
- [ ] Existing email from manual registration gets linked to Google (no duplicate)
- [ ] Google profile avatar saved to AvatarUrl
- [ ] Invalid Google token returns 401
- [ ] Missing Google profile info returns 400
- [ ] Google API failure returns 502

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M7 — Đăng nhập (`#m7`) · Google button
**UI notes:** states: redirect flow, error
### Issue #4 — FR-AUTH-004: Refresh Access Token

| | |
|---|---|
| Assignee | Person 1 (Lead) |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-auth.md` §FR-AUTH-004 |
| Endpoint | `POST /api/v1/auth/refresh` |
| Status | ⬜ Open |

**Description:**

When the access token expires (15 min), the client uses a valid refresh token to get a new token pair. Token Rotation is mandatory: old refresh token is invalidated (`isRevoked = true`) and a NEW refresh token is issued. This is the defense against Refresh Token Reuse Attacks.

**Main Flow:**

1. Client sends `POST /api/v1/auth/refresh` with `{ refreshToken }`.
2. Dispatch `RefreshTokenCommand` through the command bus.
3. Find refresh token: `prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } })`.
4. Check: token exists, `isRevoked === false`, `expiresAt > new Date()`, user still active.
5. Mark old token: `isRevoked = true`, `replacedByTokenHash = newHash`, `revokedAt = new Date()`.
6. Create new access token for the user.
7. Create new refresh token, persist to database.
8. Return HTTP 200 with new AuthResponseDto.

**Alternative / Exception Flows:**

- A1 — Refresh token not found → HTTP 401.
- A2 — Refresh token expired → HTTP 401 (client must log in again).
- A3 — Refresh token revoked (Reuse Attack detected) → HTTP 401, LOG SECURITY ALERT, may revoke all user's refresh tokens.
- A4 — User deleted or locked after token issued → HTTP 401.

**Expected Result:**

Old refresh token invalidated. New access token (15 min) and new refresh token (7 days) created and returned.

**Acceptance Criteria:**

- [ ] Valid refresh token returns 200 with new token pair
- [ ] Old refresh token is marked `isRevoked = true` after rotation
- [ ] Expired refresh token returns 401
- [ ] Revoked refresh token reuse triggers 401 + security log
- [ ] Reuse attack revokes entire token family for the user
- [ ] SHA-256 hash stored (never raw token)

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M7 / M9 (`#m7`, `#m9`) — session persistence
**UI notes:** no dedicated screen; token refresh keeps UI logged in
### Issue #5 — FR-AUTH-005: Logout / Token Revocation

| | |
|---|---|
| Assignee | Person 1 (Lead) |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-auth.md` §FR-AUTH-005 |
| Endpoint | `POST /api/v1/auth/logout` |
| Status | ⬜ Open |

**Description:**

The user logs out. Since JWT access tokens are stateless (cannot be revoked before expiry), logout revokes the corresponding refresh token in the database. The client deletes the access token from client-side storage.

**Main Flow:**

1. Client sends `POST /api/v1/auth/logout` with `Authorization: Bearer {accessToken}` header and body `{ refreshToken }`.
2. JWT middleware verifies the access token.
3. `LogoutCommandHandler` finds the refresh token in the database.
4. If found and belongs to current user: set `isRevoked = true`, `revokedAt = new Date()`.
5. Persist the change.
6. Return HTTP 204 No Content.

**Alternative / Exception Flows:**

- A1 — Refresh token not found → still return HTTP 204 (idempotent).
- A2 — Access token expired → logout still allowed if refresh token is valid; otherwise HTTP 401.

**Expected Result:**

Refresh token marked `isRevoked = true` in the database.

**Acceptance Criteria:**

- [ ] Logout returns 204 No Content
- [ ] Refresh token marked `isRevoked = true` and `revokedAt` set
- [ ] Logout is idempotent (calling twice still returns 204)
- [ ] Revoked refresh token can no longer be used at `/auth/refresh`
- [ ] Missing access token returns 401

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M9 / M14 (`#m9`, `#m14`) — logout action
**UI notes:** returns UI to guest state
### Issue #6 — FR-AUTH-006: View Profile

| | |
|---|---|
| Assignee | Person 1 (Lead) |
| Priority | S – Should Have |
| Doc reference | `docs/03-fr-auth.md` §FR-AUTH-006 |
| Endpoint | `GET /api/v1/auth/me` |
| Status | ⬜ Open |

**Description:**

Return the profile of the currently logged-in user, based on UserId extracted from JWT claims. Never returns PasswordHash.

**Main Flow:**

1. Client sends `GET /api/v1/auth/me` with `Authorization: Bearer {accessToken}`.
2. JWT middleware authenticates and extracts UserId from `sub` claim.
3. Dispatch `GetCurrentUserQuery` through the command bus.
4. Find user: `prisma.user.findUnique({ where: { id: userId } })`.
5. Map to `UserProfileDto`: `{ id, fullName, email, userName, avatarUrl, roles, createdAt }`.
6. Return HTTP 200 with UserProfileDto.

**Alternative / Exception Flows:**

- A1 — User deleted from database after token issued → HTTP 404.

**Expected Result:**

Returns the user's full profile excluding sensitive data (password hash).

**Acceptance Criteria:**

- [ ] Returns 200 with user profile when authenticated
- [ ] Response NEVER contains passwordHash field
- [ ] Returns roles array
- [ ] Missing/invalid token returns 401
- [ ] Deleted user returns 404

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M14 — Hồ sơ cá nhân (`#m14`)
**UI notes:** states: populated, loading
### Issue #7 — FR-AUTH-007: Update Profile

| | |
|---|---|
| Assignee | Person 1 (Lead) |
| Priority | S – Should Have |
| Doc reference | `docs/03-fr-auth.md` §FR-AUTH-007 |
| Endpoint | `PATCH /api/v1/auth/me` |
| Status | ⬜ Open |

**Description:**

The user can update FullName and AvatarUrl. Email and UserName cannot be changed. Uses PATCH (partial update) to update only provided fields.

**Main Flow:**

1. Client sends `PATCH /api/v1/auth/me` with `{ fullName, avatarUrl }`.
2. Dispatch `UpdateProfileCommand`; UserId from JWT claims.
3. Zod validation: fullName 2–100 chars, avatarUrl valid URL (if provided).
4. Find user and update FullName and/or AvatarUrl.
5. `prisma.user.update({ where: { id: userId }, data: { fullName, avatarUrl } })`.
6. Return HTTP 200 with updated UserProfileDto.

**Alternative / Exception Flows:**

- A1 — Invalid data → HTTP 422.

**Expected Result:**

User profile updated in the database. Returns the new profile.

**Acceptance Criteria:**

- [ ] PATCH with only `fullName` updates fullName, leaves avatarUrl unchanged
- [ ] PATCH with only `avatarUrl` updates avatarUrl, leaves fullName unchanged
- [ ] Email/userName fields are NOT updatable via this endpoint
- [ ] fullName < 2 chars or > 100 chars returns 422
- [ ] Invalid avatarUrl returns 422

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M14 — Hồ sơ cá nhân (`#m14`)
**UI notes:** edit states: populated, saving, error
### Issue #8 — FR-RCP-003: Create New Recipe ⭐ HARDEST

| | |
|---|---|
| Assignee | Person 1 (Lead) |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-recipes.md` §FR-RCP-003 |
| Endpoint | `POST /api/v1/recipes` |
| Status | ⬜ Open |

**Description:**

An Author or Admin creates a new recipe. Initial status is always Draft (not public). Slug auto-generated from Title. Steps and Ingredients can be created in the same request or added later. All mutations go through a **transaction** for consistency.

**Main Flow:**

1. Author sends `POST /api/v1/recipes` with `{ title, description, categoryId, prepTimeMinutes, cookTimeMinutes, servings, difficulty, instructions?, nutrition?, steps?, ingredients? }`.
2. Authentication check (Passport.js JWT middleware).
3. Dispatch `CreateRecipeCommand`.
4. Zod validation: title 5–200 chars, prepTime/cookTime/servings > 0, categoryId valid UUID.
5. Generate slug: `slugify(title, { lower: true, strict: true })`, check uniqueness.
6. Create recipe in a **transaction**: `prisma.$transaction()` — recipe + steps + ingredients + nutrition.
7. Invalidate cache.
8. Return HTTP 201 with RecipeDto.

**Alternative / Exception Flows:**

- A1 — Not authorized as Author/Admin → HTTP 401/403.
- A2 — CategoryId does not exist → HTTP 422.
- A3 — Slug already exists (duplicate title) → HTTP 409 Conflict.

**Expected Result:**

New recipe created with Status = Draft, Slug auto-generated.

**Acceptance Criteria:**

- [ ] Recipe + steps + ingredients + nutrition created atomically in one `$transaction`
- [ ] If any part fails, entire transaction rolls back (no partial data)
- [ ] Slug auto-generated from title (lowercase, hyphenated, no diacritics)
- [ ] Duplicate slug returns 409
- [ ] Initial status is always DRAFT (never auto-published)
- [ ] Invalid categoryId returns 422
- [ ] Missing authentication returns 401
- [ ] Recipe list cache invalidated after creation
- [ ] Zod validation runs before any DB write

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M11 — Tạo công thức mới (`#m11`)
**UI notes:** states: form, saving, validation error, 409 slug
### Issue #9 — FR-RCP-004: Update Recipe (Optimistic Concurrency)

| | |
|---|---|
| Assignee | Person 1 (Lead) |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-recipes.md` §FR-RCP-004 |
| Endpoint | `PUT /api/v1/recipes/{id}` |
| Status | ⬜ Open |

**Description:**

Updates a recipe's information. Resource-Based Authorization: only the owning Author (`authorId == currentUserId`) or an Admin can update. Concurrency control via `updatedAt` version field (ETag pattern): client must send current version in `If-Match` header.

**Main Flow:**

1. Author sends `PUT /api/v1/recipes/{id}` with body.
2. Authentication check.
3. Dispatch `UpdateRecipeCommand`.
4. Fetch recipe by ID.
5. Resource-based auth check: `recipe.authorId === user.id || user.roles.includes('Admin')`.
6. Version check: compare `recipe.updatedAt` with `If-Match` header value.
7. Update recipe fields.
8. `prisma.recipe.update()` — if updatedAt mismatches → HTTP 409 Conflict.
9. Invalidate cache.
10. Return HTTP 200 with updated RecipeDto.

**Alternative / Exception Flows:**

- A1 — Not the owner → HTTP 403 Forbidden.
- A2 — Concurrency conflict (version mismatch) → HTTP 409 Conflict.
- A3 — ID does not exist → HTTP 404.

**Expected Result:**

Recipe updated, cache invalidated, returns latest RecipeDto.

**Acceptance Criteria:**

- [ ] Owner can update their own recipe → 200
- [ ] Admin can update any recipe → 200
- [ ] Non-owner non-admin gets 403
- [ ] Stale `If-Match` header (concurrent edit) gets 409
- [ ] Missing recipe gets 404
- [ ] Cache invalidated after successful update

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M12 — Chỉnh sửa công thức (`#m12`)
**UI notes:** states: form loaded, saving, 409 conflict
### Issue #10 — FR-FILE-001: Upload File to MinIO

| | |
|---|---|
| Assignee | Person 1 (Lead) |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-misc.md` §3.5 FR-FILE-001 |
| Endpoint | Used internally by `POST /api/v1/recipes/{id}/images` |
| Status | ⬜ Open |

**Description:**

Upload binary files to MinIO S3-compatible storage. Unique filename = `{folder}/{uuid}.{ext}`. Max size 5 MB. Accepted MIME: JPEG, PNG, WebP, AVIF only. Validate MIME via **magic bytes** (not just Content-Type header). Bucket: "culinary-blog", policy: public-read.

**Main Flow:**

1. Receive file via multipart/form-data (multer).
2. Check file size ≤ 5 MB (before reading stream).
3. Validate MIME type by reading magic bytes (file signature).
4. Generate unique filename: `{folder}/{uuid}.{ext}` (never use user-supplied filename — path traversal defense).
5. Upload: `s3Client.send(new PutObjectCommand(...))`.
6. Return public URL string.

**Alternative / Exception Flows:**

- A1 — File > 5 MB → HTTP 400 `FILE_SIZE_EXCEEDED`.
- A2 — Invalid MIME (not JPEG/PNG/WebP/AVIF) → HTTP 400 `FILE_MIME_INVALID`.
- A3 — MinIO unreachable → HTTP 500 (or BullMQ retry).

**Expected Result:**

File stored on MinIO, public URL returned.

**Acceptance Criteria:**

- [ ] Valid JPEG/PNG/WebP/AVIF ≤ 5MB uploads successfully, returns URL
- [ ] File > 5 MB rejected with `FILE_SIZE_EXCEEDED` error
- [ ] Disallowed MIME type rejected with `FILE_MIME_INVALID` error
- [ ] Magic bytes validated (not just Content-Type header)
- [ ] Filename is UUID-based (no path traversal possible)
- [ ] Uploaded file accessible via public URL (bucket public-read)

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M11 / M12 (`#m11`, `#m12`) — image upload area
**UI notes:** states: uploading %, success, 400 invalid file
### Issue #11 — FR-FILE-002: Delete File from MinIO

| | |
|---|---|
| Assignee | Person 1 (Lead) |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-misc.md` §3.5 FR-FILE-002 |
| Endpoint | Invoked via BullMQ job after recipe/image deletion |
| Status | ⬜ Open |

**Description:**

Delete a file from MinIO. Usually invoked from a BullMQ background job (fire-and-forget) after deleting a recipe. If object does not exist, do not throw (idempotent). Connection errors trigger BullMQ retry.

**Main Flow:**

1. Receive file URL from BullMQ job.
2. Parse bucket + key from URL.
3. Send: `s3Client.send(new DeleteObjectCommand(...))`.
4. If object does not exist → no error (idempotent).
5. Log result via Pino.

**Alternative / Exception Flows:**

- A1 — Object does not exist → no error, return success (idempotent).
- A2 — MinIO connection error → BullMQ auto-retries 3 times.

**Expected Result:**

File deleted from MinIO. Idempotent on repeated calls.

**Acceptance Criteria:**

- [ ] Existing file deleted successfully
- [ ] Deleting non-existent file does NOT throw (idempotent)
- [ ] Connection failure triggers BullMQ retry (3 attempts)
- [ ] Deletion logged via Pino

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M12 — Chỉnh sửa công thức (`#m12`) — remove image
**UI notes:** async cleanup after delete
### Issue #12 — FR-RCP-008: Recipe Image Management

| | |
|---|---|
| Assignee | Person 1 (Lead) |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-recipes.md` §FR-RCP-008 |
| Endpoints | `POST /api/v1/recipes/{id}/images` · `PATCH /api/v1/recipes/{id}/images/{imgId}/primary` · `DELETE /api/v1/recipes/{id}/images/{imgId}` |
| Status | ⬜ Open |

**Description:**

Authors manage recipe illustrations. Upload uses multipart/form-data (multer). Images stored on MinIO at `recipes/{recipeId}/{uuid}.{ext}`. Mandatory validation: MIME type (JPEG/PNG/WebP/AVIF) and max size 5 MB. Set one image as primary. Delete image + async MinIO cleanup via BullMQ.

**Main Flow:**

1. `POST /api/v1/recipes/{id}/images` with multipart `file` field.
2. Validate MIME type and size (5 MB max).
3. Validate magic bytes.
4. Upload to MinIO via `PutObjectCommand`.
5. `prisma.recipeImage.create()` — persist URL in database.
6. Return HTTP 201.
7. `PATCH .../images/{imageId}/primary` — set the primary image.
8. `DELETE .../images/{imageId}` — delete DB record + BullMQ job deletes MinIO file.

**Expected Result:**

Images uploaded, primary set, deleted with async MinIO cleanup.

**Acceptance Criteria:**

- [ ] Upload returns 201 with `{ imageId, originalUrl, altText, isPrimary }`
- [ ] MIME + size validation enforced (5 MB, JPEG/PNG/WebP/AVIF)
- [ ] Magic bytes checked
- [ ] Path: `recipes/{recipeId}/{uuid}.{ext}`
- [ ] Set-primary returns 200, only one image has `isPrimary = true`
- [ ] Delete returns 204, MinIO file removed async via BullMQ
- [ ] Ownership check: only owner/Admin can manage images (403 otherwise)

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M11 / M12 (`#m11`, `#m12`) — image gallery, set primary
**UI notes:** states: gallery, primary badge, empty
### Issue #13 — FR-SRCH-001: Full-Text Search (Algorithm)

| | |
|---|---|
| Assignee | Person 1 (Lead) |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-misc.md` §3.4 FR-SRCH-001 |
| Endpoint | `GET /api/v1/recipes/search?q=...&page=1&pageSize=10` |
| Status | ⬜ Open |

**Description:**

Full-text search for recipes using PostgreSQL `tsvector`/`tsquery` with Vietnamese configuration. Results ranked by `ts_rank()`. Supports approximate search with `unaccent` extension (strips Vietnamese diacritics).

**Main Flow:**

1. Client sends `GET /api/v1/recipes/search?q=pho+bo&page=1&pageSize=10`.
2. Dispatch `SearchRecipesQuery`.
3. Build tsquery from search terms: `"pho:* & bo:*"` (prefix matching).
4. Raw query: `prisma.$queryRaw` — `SELECT * FROM "Recipes" WHERE "searchVector" @@ to_tsquery('vietnamese', ${query}) ORDER BY ts_rank(...) DESC`.
5. Only return Status == Published recipes.
6. Apply pagination; return pagedResult with relevanceScore field.

**Alternative / Exception Flows:**

- A1 — Empty query or < 2 chars → HTTP 422.
- A2 — No results → HTTP 200 with `items = []`.

**Expected Result:**

Ranked list of published recipes matching the search query.

**Acceptance Criteria:**

- [ ] Valid query returns 200 with ranked results (ts_rank DESC)
- [ ] Prefix matching works (`pho:` matches "phở bò", "phở gà")
- [ ] Vietnamese diacritics stripped via `unaccent` (searching "pho" finds "phở")
- [ ] Only PUBLISHED recipes returned (no Draft/Archived)
- [ ] Query < 2 chars returns 422
- [ ] No results returns 200 with empty array
- [ ] GIN index used on SearchVector column
- [ ] Pagination params respected (page, pageSize)
- [ ] relevanceScore included in response

---

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M6 — Kết quả tìm kiếm (`#m6`)
**UI notes:** states: populated, empty, loading
### Issue #14 — FR-JOB-002: Thumbnail Generation Job (Algorithm)

| | |
|---|---|
| Assignee | Person 1 (Lead) |
| Priority | M – Must Have |
| Doc reference | `docs/03-fr-misc.md` §3.6 FR-JOB-002 |
| Endpoint | BullMQ worker (triggered after FR-RCP-008 image upload) |
| Status | ⬜ Open |

**Description:**

After a recipe image upload succeeds, generate a thumbnail (300×300px) and medium image (800×600px). Store all 3 versions on MinIO. Retry 3 times. On failure, the original image still displays.

**Main Flow:**

1. Image upload succeeds (FR-RCP-008 / FR-FILE-001).
2. Enqueue BullMQ job: fire-and-forget.
3. Worker downloads original from MinIO.
4. Resize to thumbnail 300×300 (sharp).
5. Resize to medium 800×600 (sharp).
6. Upload both to MinIO.
7. Update `RecipeImage` record: set `thumbnailUrl` and `mediumUrl`.

**Alternative / Exception Flows:**

- A1 — Job fails → auto-retry 3 times.
- A2 — All retries exhausted → original image still displays (graceful degradation).

**Expected Result:**

3 image versions on MinIO (original, medium 800×600, thumbnail 300×300). DB record updated with all URLs.

**Acceptance Criteria:**

- [ ] After upload, BullMQ job enqueued
- [ ] Thumbnail 300×300 generated and stored on MinIO
- [ ] Medium 800×600 generated and stored on MinIO
- [ ] `RecipeImage.thumbnailUrl` and `mediumUrl` updated in DB
- [ ] Job retries up to 3 times on failure
- [ ] On total failure, original image still displays (no broken UI)

---
**UI Showcase:** [web-showcase.html](https://github.com/gsb-b60/lethimcook/blob/feat/set-up-project/web-showcase.html)
**Screen:** M2 / M3 (`#m2`, `#m3`) — card & detail images
**UI notes:** medium/thumbnail variants displayed
