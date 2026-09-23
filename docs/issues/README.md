# Culinary Blog — Issue Tracker

Work split for 4 people (1 leader + 3 teammates). **34 issues** covering all Functional Requirements from the SRS.

Source of truth: [`docs/`](../) (English SRS translation of `srs.md`).

## Team Split

| Person | Name | Role | Focus Areas | Issues | File |
|---|---|---|---|---|---|
| **1** | **Nguyen Dinh Hieu** | **Leader** | Auth + Transactions + Image Storage + Algorithm | #1–#14 | [person-1.md](./person-1.md) |
| **2** | **Bich Tran** | Teammate | Categories + Recipe Read | #15–#21 | [person-2.md](./person-2.md) |
| **3** | **Tran Duc Anh** | Teammate | Recipe Lifecycle + Search Params | #22–#29 | [person-3.md](./person-3.md) |
| **4** | **Nguyen Huynh Thanh** | Teammate | Jobs + Observability | #30–#34 | [person-4.md](./person-4.md) |

## Issue Assignee Table

| Issue | FR | Assignee |
|---|---|---|
| #1 | FR-AUTH-001: User Registration | Nguyen Dinh Hieu |
| #2 | FR-AUTH-002: Local Login | Nguyen Dinh Hieu |
| #3 | FR-AUTH-003: Google OAuth 2.0 Login | Nguyen Dinh Hieu |
| #4 | FR-AUTH-004: Refresh Access Token | Nguyen Dinh Hieu |
| #5 | FR-AUTH-005: Logout / Token Revocation | Nguyen Dinh Hieu |
| #6 | FR-AUTH-006: View Profile | Nguyen Dinh Hieu |
| #7 | FR-AUTH-007: Update Profile | Nguyen Dinh Hieu |
| #8 | FR-RCP-003: Create New Recipe ⭐ | Nguyen Dinh Hieu |
| #9 | FR-RCP-004: Update Recipe | Nguyen Dinh Hieu |
| #10 | FR-FILE-001: Upload File to MinIO | Nguyen Dinh Hieu |
| #11 | FR-FILE-002: Delete File from MinIO | Nguyen Dinh Hieu |
| #12 | FR-RCP-008: Recipe Image Management | Nguyen Dinh Hieu |
| #13 | FR-SRCH-001: Full-Text Search | Nguyen Dinh Hieu |
| #14 | FR-JOB-002: Thumbnail Generation Job | Nguyen Dinh Hieu |
| #15 | FR-CAT-001: View Category List | Bich Tran |
| #16 | FR-CAT-002: View Category Detail and Recipes | Bich Tran |
| #17 | FR-CAT-003: Create New Category [Admin] | Bich Tran |
| #18 | FR-CAT-004: Update Category [Admin] | Bich Tran |
| #19 | FR-CAT-005: Delete Category [Admin] | Bich Tran |
| #20 | FR-RCP-001: View Recipe List | Bich Tran |
| #21 | FR-RCP-002: View Recipe Detail | Bich Tran |
| #22 | FR-RCP-005: Publish/Unpublish Recipe | Tran Duc Anh |
| #23 | FR-RCP-006: Archive Recipe | Tran Duc Anh |
| #24 | FR-RCP-007: Delete Recipe | Tran Duc Anh |
| #25 | FR-RCP-009: Ingredient Management (CRUD) | Tran Duc Anh |
| #26 | FR-RCP-010: Steps Management (CRUD) | Tran Duc Anh |
| #27 | FR-SRCH-002: Filtering Recipes | Tran Duc Anh |
| #28 | FR-SRCH-003: Sorting Recipes | Tran Duc Anh |
| #29 | FR-SRCH-004: Pagination | Tran Duc Anh |
| #30 | FR-JOB-001: Welcome Email Job | Nguyen Huynh Thanh |
| #31 | FR-JOB-003: Sitemap Generation Job | Nguyen Huynh Thanh |
| #32 | FR-OBS-001: Health Check Endpoints | Nguyen Huynh Thanh |
| #33 | FR-OBS-002: Structured Logging | Nguyen Huynh Thanh |
| #34 | FR-OBS-003: Distributed Tracing & Metrics | Nguyen Huynh Thanh |

**Total: 34 issues across 7 FR modules (AUTH, CAT, RCP, SRCH, FILE, JOB, OBS)**

## Issue Status Legend

| Icon | Meaning |
|---|---|
| ⬜ | Open (not started) |
| 🔄 | In progress |
| ✅ | Done |
| ❌ | Blocked |

## How to Use

1. Open your person file (e.g., `person-1.md`).
2. Pick an issue (start with highest priority / M first).
3. Change `Status` from ⬜ to 🔄 when starting.
4. Check off acceptance criteria as you complete them.
5. Change `Status` to ✅ when all criteria are checked.

## Module → Doc Reference Map

| Module | Doc File | Issues |
|---|---|---|
| FR-AUTH (7) | `docs/03-fr-auth.md` | #1–#7 |
| FR-CAT (5) | `docs/03-fr-catalog.md` | #15–#19 |
| FR-RCP (10) | `docs/03-fr-recipes.md` | #8–#9, #12, #20–#26 |
| FR-SRCH (4) | `docs/03-fr-misc.md` §3.4 | #13, #27–#29 |
| FR-FILE (2) | `docs/03-fr-misc.md` §3.5 | #10–#11 |
| FR-JOB (3) | `docs/03-fr-misc.md` §3.6 | #14, #30–#31 |
| FR-OBS (3) | `docs/03-fr-misc.md` §3.7 | #32–#34 |

## Verification

- FR-AUTH: 7 → Issues #1–#7 ✓
- FR-CAT: 5 → Issues #15–#19 ✓
- FR-RCP: 10 → Issues #8, #9, #12, #20, #21, #22, #23, #24, #25, #26 ✓
- FR-SRCH: 4 → Issues #13, #27, #28, #29 ✓
- FR-FILE: 2 → Issues #10, #11 ✓
- FR-JOB: 3 → Issues #14, #30, #31 ✓
- FR-OBS: 3 → Issues #32, #33, #34 ✓
- **Total: 34/34 ✓**
