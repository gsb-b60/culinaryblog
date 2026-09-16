# Chapter 3 — Functional Requirements + Module 3.1 (FR-AUTH)

Source: `srs.md` lines 267-569.

## 3. Functional Requirements Overview

This chapter specifies the 27 Functional Requirements (FR) in detail, grouped into 7 functional modules. Each FR follows a standard template including: requirement code, name, functional group, actor, priority (MoSCoW), description, preconditions, main flow, alternative/exception flow, HTTP endpoint, expected result, and HTTP status code.

MoSCoW priority convention: **M** (Must Have), **S** (Should Have), **C** (Could Have), **W** (Won't Have — out of current scope).

## 3.1. Authentication & User Management Module (FR-AUTH)

This module manages the entire user authentication lifecycle: registration, multi-method login, session maintenance with token rotation, and personal profile management. The backend uses Passport.js (local + Google OAuth strategy) combined with JWT and bcrypt.

### FR-AUTH-001: User Registration

| | |
|---|---|
| Requirement code | FR-AUTH-001 |
| Requirement name | New Account Registration |
| Functional group | Authentication & User Management Module (FR-AUTH) |
| Actor | Guest (Anonymous User) |
| Priority | M – Must Have |

**Description:**

The system allows users without an account to create one by providing basic information. After successful registration, the user is automatically assigned the "Author" role and receives a token set for immediate access (auto-login after registration). The system triggers an asynchronous welcome email job via BullMQ.

**Preconditions:**

1. The user is not logged into the system.
2. The endpoint POST /api/v1/auth/register is available.
3. The PostgreSQL database is connected successfully.

**Main flow (Happy Path):**

1. User (client) sends HTTP POST to /api/v1/auth/register with JSON body: `{ "fullName": "...", "email": "...", "userName": "...", "password": "..." }`.
2. A RegisterCommand is created and dispatched to the custom command bus.
3. Zod validation middleware runs RegisterCommandValidator: fullName must be non-empty, email must be a valid format, userName must not contain special characters, password at least 8 characters (1 uppercase, 1 digit, 1 special character).
4. RegisterCommandHandler checks the email does not already exist in the database: `prisma.user.findUnique({ where: { email } })`.
5. Create the new user: `bcrypt.hash(password, 12)` then `prisma.user.create({ data: { fullName, email, userName, passwordHash } })`.
6. `prisma.userRole.create({ data: { userId: user.id, roleId: authorRoleId } })` — assign the default role.
7. `jwt.sign({ sub: user.id, email, roles }, JWT_SECRET, { expiresIn: '15m' })` — create the JWT access token.
8. `crypto.randomBytes(64).toString('hex')` — generate a random refresh token.
9. Persist the RefreshToken to the database via `prisma.refreshToken.create()`.
10. `welcomeEmailQueue.add('welcome', { userId: user.id, email })` — push a welcome email job to the BullMQ queue (fire-and-forget).
11. Return HTTP 201 Created with AuthResponseDto: `{ accessToken, refreshToken, expiresAt, user: { id, fullName, email, userName, avatarUrl, roles } }`.

**Alternative / Exception flows:**

- A1 – Email already exists: At step 4, if the email is already registered → return HTTP 409 Conflict with an RFC 7807 body.
- A2 – Password not strong enough: At steps 3 or 5, bcrypt hash fails → return HTTP 422 Unprocessable Entity with a detailed error list.
- A3 – Invalid input data: At step 3, Zod validation fails → HTTP 422 with each field error (per RFC 7807).
- A4 – Database not reachable: Prisma throws an error → HTTP 500 Internal Server Error (global error handler logs the error, does not expose the stack trace).

| | |
|---|---|
| HTTP Method & Endpoint | POST /api/v1/auth/register |
| Expected result | New account created, "Author" role assigned, refresh token persisted, welcome email pushed to the BullMQ queue. The client receives an access token and refresh token. |
| HTTP Status Codes | 201 Created – registration succeeded. 409 Conflict – email already exists. 422 Unprocessable Entity – invalid data. 500 Internal Server Error – system error. |

### FR-AUTH-002: Local Login (Email/Password)

| | |
|---|---|
| Requirement code | FR-AUTH-002 |
| Requirement name | Log in with Email and Password |
| Functional group | Authentication & User Management Module (FR-AUTH) |
| Actor | Registered Author or Admin |
| Priority | M – Must Have |

**Description:**

The system allows users with an account to log in with email and password. Each successful login creates a new access token pair (JWT, 15 minutes) and a new refresh token (7 days). Token Rotation: the old refresh token is NOT deleted immediately but is marked as used (to detect token reuse attacks).

**Preconditions:**

1. The user has a valid account in the system.
2. The account is not locked (isActive = true).

**Main flow (Happy Path):**

1. Client sends POST /api/v1/auth/login with body: `{ "email": "...", "password": "..." }`.
2. LoginCommand is dispatched through the custom command bus.
3. Zod validation middleware checks email format and non-empty password.
4. LoginCommandHandler finds the user: `prisma.user.findUnique({ where: { email } })`.
5. Verify the password: `bcrypt.compare(password, user.passwordHash)`.
6. Check the account is not locked: `user.isActive === true`.
7. Create a new access token: `jwt.sign({ sub: user.id, email, roles }, JWT_SECRET, { expiresIn: '15m' })`.
8. Create a new refresh token: `crypto.randomBytes(64).toString('hex')`.
9. Persist the new refresh token to the database.
10. Return HTTP 200 OK with AuthResponseDto.

**Alternative / Exception flows:**

- A1 – Account does not exist or wrong password: HTTP 401 Unauthorized with generic message "Email or password is incorrect" (MUST NOT reveal whether the account exists — prevents User Enumeration Attacks).
- A2 – Account locked (isActive = false): HTTP 403 Forbidden.
- A3 – Too many failed attempts (5 times): accessFailedCount increments; after 5 failed attempts → the account is temporarily locked.

| | |
|---|---|
| HTTP Method & Endpoint | POST /api/v1/auth/login |
| Expected result | New access token and refresh token are created and returned. Refresh token persisted to database. |
| HTTP Status Codes | 200 OK – login succeeded. 401 Unauthorized – wrong email/password. 422 Unprocessable Entity – invalid data. 403 Forbidden – account locked. |

### FR-AUTH-003: Google OAuth 2.0 Login

| | |
|---|---|
| Requirement code | FR-AUTH-003 |
| Requirement name | Login / Register with Google OAuth 2.0 |
| Functional group | Authentication & User Management Module (FR-AUTH) |
| Actor | Guest (first time) / User previously registered via Google |
| Priority | S – Should Have |

**Description:**

The system supports login via Google account using OAuth 2.0 Authorization Code Flow with PKCE. If this is the first Google login, the system automatically creates a new account from the Google profile info (email, display name, avatar URL) and assigns the "Author" role. If the email already exists from a manual registration, the system links the Google login to the existing account.

**Preconditions:**

1. Google OAuth 2.0 credentials (ClientId, ClientSecret) are configured in .env.
2. The redirect URI is registered in the Google Cloud Console.
3. The user has a valid Google account.

**Main flow (Happy Path):**

1. Frontend (Next.js) redirects the user to the Google Authorization Endpoint with scopes: openid, email, profile.
2. The user grants permission on the Google Consent Screen.
3. Google redirects to the callback URL (Next.js) with the Authorization Code.
4. Auth.js v5 (Next.js) handles the callback, obtains the access token from Google, and fetches the profile.
5. Frontend sends POST /api/v1/auth/google with Google ExternalLoginInfo.
6. GoogleLoginCommandHandler finds the user: `prisma.user.findFirst({ where: { googleId: providerKey } })`.
7. If no account exists: check the email — if the email is not yet registered, create a new user from the Google profile, assign the "Author" role → persist the Google link.
8. If the email already exists (manually registered): link the Google login to the existing account.
9. Create access token and refresh token, persist to database.
10. Return HTTP 200 OK with AuthResponseDto.

**Alternative / Exception flows:**

- A1 – Google token invalid or expired: HTTP 401 Unauthorized.
- A2 – Google email revokes permission: HTTP 400 Bad Request.
- A3 – Google API unavailable: HTTP 502 Bad Gateway.

| | |
|---|---|
| HTTP Method & Endpoint | POST /api/v1/auth/google |
| Expected result | User is logged in (or auto-registered) and receives AuthResponseDto. |
| HTTP Status Codes | 200 OK – login/registration succeeded. 401 Unauthorized – invalid Google token. 400 Bad Request – missing Google profile info. |

### FR-AUTH-004: Refresh Access Token

| | |
|---|---|
| Requirement code | FR-AUTH-004 |
| Requirement name | Refresh Access Token Using Refresh Token |
| Functional group | Authentication & User Management Module (FR-AUTH) |
| Actor | Author / Admin — with a valid refresh token |
| Priority | M – Must Have |

**Description:**

When the access token expires (after 15 minutes), the client uses the still-valid refresh token to obtain a new token pair without requiring the user to log in again. Token Rotation is mandatory: on every refresh, the old refresh token is invalidated (isRevoked = true, revokedAt = new Date()) and a NEW refresh token is issued. This is the defense against Refresh Token Reuse Attacks.

**Preconditions:**

1. The client holds a valid refresh token (not expired, not revoked, not replaced).
2. The corresponding user still exists in the database and is not locked.

**Main flow (Happy Path):**

1. Client sends POST /api/v1/auth/refresh with body: `{ "refreshToken": "..." }`.
2. RefreshTokenCommand dispatched through the custom command bus.
3. The handler finds the refresh token in the database: `prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } })`.
4. Check: token exists, isRevoked === false, expiresAt > new Date(), user still active.
5. Mark the old token: `prisma.refreshToken.update({ where: { id }, data: { isRevoked: true, replacedByTokenHash: newHash, revokedAt: new Date() } })`.
6. Create a new access token for the user.
7. Create a new refresh token, persist to database.
8. Return HTTP 200 OK with AuthResponseDto containing the new token pair.

**Alternative / Exception flows:**

- A1 – Refresh token not found in database: HTTP 401 Unauthorized.
- A2 – Refresh token expired: HTTP 401 Unauthorized; the client must log in again.
- A3 – Refresh token revoked (Reuse Attack detected): HTTP 401 Unauthorized. LOG SECURITY ALERT. May trigger revocation of all the user's refresh tokens.
- A4 – User deleted or locked after the token was issued: HTTP 401 Unauthorized.

| | |
|---|---|
| HTTP Method & Endpoint | POST /api/v1/auth/refresh |
| Expected result | Old refresh token invalidated. New access token (15 min) and new refresh token (7 days) created and returned. |
| HTTP Status Codes | 200 OK – refresh succeeded. 401 Unauthorized – token invalid, expired, or revoked. |

### FR-AUTH-005: Logout / Token Revocation

| | |
|---|---|
| Requirement code | FR-AUTH-005 |
| Requirement name | Logout and Revoke Refresh Token |
| Functional group | Authentication & User Management Module (FR-AUTH) |
| Actor | Logged-in Author / Admin |
| Priority | M – Must Have |

**Description:**

The user logs out of the system. Because the JWT access token is stateless (cannot be revoked directly before expiry), the logout action primarily revokes the corresponding refresh token in the database. The client is responsible for deleting the access token from client-side storage (localStorage/cookie).

**Preconditions:**

1. The user is logged in with a valid access token in the Authorization header.
2. The client sends the refresh token to revoke.

**Main flow (Happy Path):**

1. Client sends POST /api/v1/auth/logout with `Authorization: Bearer {accessToken}` header and body: `{ "refreshToken": "..." }`.
2. JWT authentication middleware (passport.authenticate) verifies the access token.
3. LogoutCommandHandler finds the refresh token in the database.
4. If found and it belongs to the current user: mark isRevoked = true, revokedAt = new Date().
5. Persist the change.
6. Return HTTP 204 No Content.

**Alternative / Exception flows:**

- A1 – Refresh token not found: still return HTTP 204 (idempotent).
- A2 – Access token expired: logout is still allowed if the refresh token is valid; otherwise HTTP 401 if no refresh token is provided.

| | |
|---|---|
| HTTP Method & Endpoint | POST /api/v1/auth/logout |
| Expected result | Refresh token marked isRevoked = true in the database. |
| HTTP Status Codes | 204 No Content – logout succeeded (or token did not exist — idempotent). 401 Unauthorized – invalid access token. |

### FR-AUTH-006: View Profile

| | |
|---|---|
| Requirement code | FR-AUTH-006 |
| Requirement name | View Personal Profile |
| Functional group | Authentication & User Management Module (FR-AUTH) |
| Actor | Logged-in Author / Admin |
| Priority | S – Should Have |

**Description:**

Returns the profile information of the currently logged-in user, based on the UserId extracted from the JWT claims. Never returns PasswordHash.

**Preconditions:**

1. The user is logged in with a valid access token.

**Main flow (Happy Path):**

1. Client sends GET /api/v1/auth/me with `Authorization: Bearer {accessToken}`.
2. JWT middleware authenticates and extracts UserId from the `sub` claim.
3. GetCurrentUserQuery dispatched through the custom command bus.
4. Handler finds the user: `prisma.user.findUnique({ where: { id: userId } })`.
5. Map to UserProfileDto: `{ id, fullName, email, userName, avatarUrl, roles, createdAt }`.
6. Return HTTP 200 OK with UserProfileDto.

**Alternative / Exception flows:**

- A1 – User deleted from the database after the token was issued: HTTP 404 Not Found.

| | |
|---|---|
| HTTP Method & Endpoint | GET /api/v1/auth/me |
| Expected result | Returns the user's full profile (excluding sensitive data such as password hash). |
| HTTP Status Codes | 200 OK – succeeded. 401 Unauthorized – not logged in. 404 Not Found – user does not exist. |

### FR-AUTH-007: Update Profile

| | |
|---|---|
| Requirement code | FR-AUTH-007 |
| Requirement name | Update Personal Profile |
| Functional group | Authentication & User Management Module (FR-AUTH) |
| Actor | Logged-in Author / Admin |
| Priority | S – Should Have |

**Description:**

The user can update their FullName and AvatarUrl. Email and UserName cannot be changed through this endpoint. Uses PATCH (partial update) to update only the provided fields.

**Preconditions:**

1. The user is logged in.
2. The new data must be valid (FullName non-empty, AvatarUrl a valid URL if provided).

**Main flow (Happy Path):**

1. Client sends PATCH /api/v1/auth/me with body: `{ "fullName": "...", "avatarUrl": "..." }`.
2. UpdateProfileCommand dispatched through the custom command bus; UserId from JWT claims.
3. Zod validation middleware checks: fullName 2–100 characters, avatarUrl a valid URL (if provided).
4. Handler finds the user and updates FullName and/or AvatarUrl.
5. `prisma.user.update({ where: { id: userId }, data: { fullName, avatarUrl } })`.
6. Return HTTP 200 OK with the updated UserProfileDto.

**Alternative / Exception flows:**

- A1 – Invalid data: HTTP 422 Unprocessable Entity.

| | |
|---|---|
| HTTP Method & Endpoint | PATCH /api/v1/auth/me |
| Expected result | User profile updated in the database. Returns the new profile. |
| HTTP Status Codes | 200 OK – update succeeded. 401 Unauthorized – not logged in. 422 Unprocessable Entity – invalid data. |