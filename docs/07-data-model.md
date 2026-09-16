# Chapter 7 — Data Model

Source: `srs.md` lines 1624-1751.

This chapter specifies the complete data structure of the Culinary Blog system. All entities inherit from BaseEntity and use the soft-delete pattern (IsDeleted flag). Database: PostgreSQL 16 with Prisma ORM.

## 7.1. BaseEntity (Abstract)

All entities inherit from BaseEntity. No separate table is created — each entity has its own table with the inherited columns (re-declared in each model of schema.prisma).

| Column | Data type | Constraint | Description |
|---|---|---|---|
| Id | uuid (String @db.Uuid) | @id, @default(dbgenerated("gen_random_uuid()")) | UUID v4 primary key — avoids sequential ID guessing. |
| CreatedAt | timestamptz (DateTime) | @default(now()) | Record creation time. Set by Prisma middleware (AuditMiddleware). |
| UpdatedAt | timestamptz (DateTime?) | @updatedAt | Last update time. Set automatically by Prisma. |
| IsDeleted | boolean | @default(false) | Soft-delete flag. Global middleware filter: every query automatically adds `where: { isDeleted: false }`. |
| Version | integer | @default(1) | Optimistic concurrency control — increments on every update. Prisma `where: { version: clientVersion }` to detect lost updates. |

## 7.2. Recipe

The central entity of the system. A Recipe belongs to one Category and one Author. Contains the owned model RecipeNutrition and relation fields.

| Column | Data type | Constraint | Index | Description |
|---|---|---|---|---|
| Id | uuid | PK (BaseEntity) | PK | Primary key. |
| Title | varchar(200) | NOT NULL | IDX_Recipe_Title (GIN trigram — optional) | Recipe title. Not required to be unique (different slugs can share a title). |
| Slug | varchar(220) | NOT NULL, UNIQUE | IDX_Recipe_Slug (UNIQUE B-tree) | URL-friendly identifier. Generated from Title + normalized (lowercase, spaces → -). Never changes after Publish. |
| Description | text | NOT NULL | — | Short description (≤ 2000 chars). Shown in the card preview and SEO meta description. |
| Instructions | text | NOT NULL | — | Overview instructions in markdown (legacy field). Detailed instructions use RecipeSteps. |
| PrepTime | integer | NOT NULL, CHECK > 0 | — | Preparation time (minutes). |
| CookTime | integer | NOT NULL, CHECK >= 0 | — | Cook time (minutes). 0 for "no cook" recipes. |
| Servings | integer | NOT NULL, CHECK > 0 | — | Number of portions. |
| Difficulty | enum | NOT NULL, @default(EASY) | IDX_Recipe_Difficulty | RecipeDifficulty: Easy, Medium, Hard, Expert. |
| Status | enum | NOT NULL, @default(DRAFT) | IDX_Recipe_Status | RecipeStatus: Draft, Published, Archived. |
| CategoryId | uuid | NOT NULL, FK → Categories.Id, @relation(onDelete: Restrict) | IDX_Recipe_CategoryId (B-tree) | Foreign key to Category. Restrict — cannot delete a category that has recipes. |
| AuthorId | uuid | NOT NULL, FK → Users.Id | IDX_Recipe_AuthorId (B-tree) | Foreign key to User (Author). |
| SearchVector | tsvector? | NULL | IDX_Recipe_Search (GIN) | Full-text search vector. Updated by a PostgreSQL TRIGGER when Title/Description changes. Uses the unaccent extension for Vietnamese. |
| PublishedAt | timestamptz? | NULL | IDX_Recipe_PublishedAt | Publish time. Set when Status changes to Published. NULL if not yet published. |
| CreatedAt / UpdatedAt / IsDeleted / Version | — | (BaseEntity) | IDX_Recipe_IsDeleted (partial) | Inherited from BaseEntity — global filter. |

### 7.2.1. RecipeNutrition (Owned Model — columns in the Recipes table)

Owned model — no separate table. The columns are embedded directly in the Recipes table with the "Nutrition_" prefix.

| DB column | Property (Prisma) | Type | Description |
|---|---|---|---|
| Nutrition_Calories | calories | decimal(8,2)? | Energy (kcal / serving). Nullable. |
| Nutrition_Protein | protein | decimal(8,2)? | Protein (gram / serving). Nullable. |
| Nutrition_Carbohydrates | carbohydrates | decimal(8,2)? | Carbohydrates (gram / serving). Nullable. |
| Nutrition_Fat | fat | decimal(8,2)? | Fat (gram / serving). Nullable. |
| Nutrition_Fiber | fiber | decimal(8,2)? | Fiber (gram / serving). Nullable. |
| Nutrition_Sodium | sodium | decimal(8,2)? | Sodium (mg / serving). Nullable. |

## 7.3. RecipeStep

The detailed execution steps of a recipe, ordered by StepNumber.

| Column | Type | Constraint | Description |
|---|---|---|---|
| Id | uuid | PK (BaseEntity) | UUID primary key. |
| RecipeId | uuid | NOT NULL, FK → Recipes.Id, onDelete: Cascade | Foreign key. Cascade delete: deleting the Recipe deletes all Steps. |
| StepNumber | integer | NOT NULL, CHECK > 0. UNIQUE with RecipeId (composite unique) | Step order (1, 2, 3...). |
| Title | varchar(200) | NOT NULL | Concise step name (e.g., "Prepare ingredients"). |
| Description | text | NOT NULL | Detailed step description. |
| TimerMinutes | integer? | NULL, CHECK >= 0 | Time needed for this step (minutes). NULL if not applicable. |
| ImageUrl | varchar(500)? | NULL | Step illustration URL (on MinIO). Nullable. |

## 7.4. RecipeIngredient

| Column | Type | Constraint | Description |
|---|---|---|---|
| Id | uuid | PK (BaseEntity) | UUID primary key. |
| RecipeId | uuid | NOT NULL, FK → Recipes.Id, onDelete: Cascade | Foreign key with cascade delete. |
| Name | varchar(200) | NOT NULL | Ingredient name (e.g., "Beef tenderloin"). |
| Quantity | decimal(10,3)? | NULL | Quantity (e.g., 500). Nullable for "to taste" ingredients. |
| Unit | varchar(50)? | NULL | Measurement unit (gram, ml, tablespoon, piece...). Nullable. |
| Notes | varchar(500)? | NULL | Optional note (e.g., "sliced thin"). Nullable. |
| OrderIndex | integer | NOT NULL, @default(0) | Display order within the ingredient list. |

## 7.5. RecipeImage

| Column | Type | Constraint | Description |
|---|---|---|---|
| Id | uuid | PK (BaseEntity) | UUID primary key. |
| RecipeId | uuid | NOT NULL, FK → Recipes.Id, onDelete: Cascade | Foreign key with cascade delete. |
| OriginalUrl | varchar(500) | NOT NULL | Original image URL on MinIO (e.g., .../recipes/{recipeId}/{guid}.jpg). |
| MediumUrl | varchar(500)? | NULL | Medium image URL 800×600 (generated by FR-JOB-002). Nullable when the job has not run yet. |
| ThumbnailUrl | varchar(500)? | NULL | Thumbnail URL 300×300 (generated by FR-JOB-002). Nullable. |
| AltText | varchar(200)? | NULL | Alt text for accessibility. Nullable. |
| IsPrimary | boolean | NOT NULL, @default(false) | Primary image (shown first). Only 1 image with IsPrimary=true per Recipe. |
| OrderIndex | integer | NOT NULL, @default(0) | Gallery display order. |

## 7.6. Category

| Column | Type | Constraint | Description |
|---|---|---|---|
| Id | uuid | PK (BaseEntity) | UUID primary key. |
| Name | varchar(100) | NOT NULL, UNIQUE | Category name (e.g., "Appetizers"). |
| Slug | varchar(120) | NOT NULL, UNIQUE, IDX_Category_Slug | URL-friendly name. Generated from Name. |
| Description | text? | NULL | Category description. Nullable. |
| ImageUrl | varchar(500)? | NULL | Category cover image URL. Nullable. |
| OrderIndex | integer | NOT NULL, @default(0) | Display order in navigation. |

## 7.7. User

The "users" table stores user account data, managed manually with Passport.js JWT + bcrypt. UserId uses UUID.

| Column (custom) | Type | Constraint | Description |
|---|---|---|---|
| DisplayName | varchar(100) | NOT NULL | Public display name (not a username). |
| AvatarUrl | varchar(500)? | NULL | Avatar image URL. Nullable. Generated from the Google avatar on OAuth registration. |
| Bio | text? | NULL | Short author bio. Nullable. Shown on the author profile. |
| IsActive | boolean | NOT NULL, @default(true) | Account status. Admin can deactivate a user (ban). |
| CreatedAt | timestamptz | NOT NULL, @default(now()) | Account creation date. |

Authentication columns: Id (uuid), Email (varchar(256), UNIQUE), PasswordHash (varchar(255), bcrypt hash), Role (enum: GUEST/AUTHOR/ADMIN), TwoFactorEnabled (boolean), LockoutEnabled (boolean), AccessFailedCount (integer).

## 7.8. RefreshToken

| Column | Type | Constraint | Description |
|---|---|---|---|
| Id | uuid | PK | UUID primary key. |
| UserId | uuid | NOT NULL, FK → Users.Id, onDelete: Cascade | Token owner. |
| TokenHash | varchar(64) | NOT NULL, UNIQUE, IDX_RefreshToken_Hash | SHA-256 hash of the raw token. Raw token is never stored. |
| ExpiresAt | timestamptz | NOT NULL | Token expiry (7 days from CreatedAt). |
| RevokedAt | timestamptz? | NULL | Revocation time. NULL = still valid. |
| ReplacedByTokenHash | varchar(64)? | NULL | Hash of the replacement token (on rotation). Used to trace the token family. |
| CreatedAt | timestamptz | NOT NULL, @default(now()) | Creation time. |
| CreatedByIp | varchar(45)? | NULL | IP address that created the token. Stored for audit. |