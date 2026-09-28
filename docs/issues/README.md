# Culinary Blog — Issue Tracker

Work split for 4 people (1 leader + 3 teammates). **34 issues** covering all Functional Requirements from the SRS.

Source of truth: [`docs/`](../) (English SRS translation of `srs.md`).

## Team Split

| Person | Name | Role | Focus Areas | Issues | File |
|---|---|---|---|---|---|
| **1** | **Nguyen Dinh Hieu** | **Leader** | Auth + Transactions + Image Storage + Algorithm | #1–#14 | [person-1.md](./person-1.md) |
| **2** | **Tran Duc Anh** | Teammate | Categories + Recipe Read | #15–#21 | [person-2.md](./person-2.md) |
| **3** | **Nguyen Huynh Thanh** | Teammate | Recipe Lifecycle + Search Params | #22–#29 | [person-3.md](./person-3.md) |
| **4** | **Bich Tran** | Teammate | Jobs + Observability | #30–#34 | [person-4.md](./person-4.md) |

## Issue Assignee Table

| Issue | FR | Status | GitHub | Assignee |
|---|---|---|---|---|
| #1 | FR-AUTH-001: User Registration | ✅ Done | [#1](https://github.com/gsb-b60/culinaryblog/issues/1) | Nguyen Dinh Hieu |
| #2 | FR-AUTH-002: Local Login (Email/Password) | ⬜ Open | [#7](https://github.com/gsb-b60/culinaryblog/issues/7) | Nguyen Dinh Hieu |
| #3 | FR-AUTH-003: Google OAuth 2.0 Login | ✅ Done | [#8](https://github.com/gsb-b60/culinaryblog/issues/8) | Nguyen Dinh Hieu |
| #4 | FR-AUTH-004: Refresh Access Token | ⬜ Open | [#9](https://github.com/gsb-b60/culinaryblog/issues/9) | Nguyen Dinh Hieu |
| #5 | FR-AUTH-005: Logout / Token Revocation | ⬜ Open | [#10](https://github.com/gsb-b60/culinaryblog/issues/10) | Nguyen Dinh Hieu |
| #6 | FR-AUTH-006: View Profile | ⬜ Open | [#11](https://github.com/gsb-b60/culinaryblog/issues/11) | Nguyen Dinh Hieu |
| #7 | FR-AUTH-007: Update Profile | ⬜ Open | [#12](https://github.com/gsb-b60/culinaryblog/issues/12) | Nguyen Dinh Hieu |
| #8 | FR-RCP-003: Create New Recipe ⭐ HARDEST | ⬜ Open | [#13](https://github.com/gsb-b60/culinaryblog/issues/13) | Nguyen Dinh Hieu |
| #9 | FR-RCP-004: Update Recipe (Optimistic Concurrency) | ⬜ Open | [#20](https://github.com/gsb-b60/culinaryblog/issues/20) | Nguyen Dinh Hieu |
| #10 | FR-FILE-001: Upload File to MinIO | ⬜ Open | [#21](https://github.com/gsb-b60/culinaryblog/issues/21) | Nguyen Dinh Hieu |
| #11 | FR-FILE-002: Delete File from MinIO | ⬜ Open | [#22](https://github.com/gsb-b60/culinaryblog/issues/22) | Nguyen Dinh Hieu |
| #12 | FR-RCP-008: Recipe Image Management | ⬜ Open | [#23](https://github.com/gsb-b60/culinaryblog/issues/23) | Nguyen Dinh Hieu |
| #13 | FR-SRCH-001: Full-Text Search (Algorithm) | ⬜ Open | [#24](https://github.com/gsb-b60/culinaryblog/issues/24) | Nguyen Dinh Hieu |
| #14 | FR-JOB-002: Thumbnail Generation Job (Algorithm) | ⬜ Open | [#25](https://github.com/gsb-b60/culinaryblog/issues/25) | Nguyen Dinh Hieu |
| #15 | FR-CAT-001: View Category List | ⬜ Open | [#2](https://github.com/gsb-b60/culinaryblog/issues/2) | Tran Duc Anh |
| #16 | FR-CAT-002: View Category Detail and Recipes | ⬜ Open | [#26](https://github.com/gsb-b60/culinaryblog/issues/26) | Tran Duc Anh |
| #17 | FR-CAT-003: Create New Category [Admin] | ⬜ Open | [#27](https://github.com/gsb-b60/culinaryblog/issues/27) | Tran Duc Anh |
| #18 | FR-CAT-004: Update Category [Admin] | ⬜ Open | [#28](https://github.com/gsb-b60/culinaryblog/issues/28) | Tran Duc Anh |
| #19 | FR-CAT-005: Delete Category [Admin] | ⬜ Open | [#29](https://github.com/gsb-b60/culinaryblog/issues/29) | Tran Duc Anh |
| #20 | FR-RCP-001: View Recipe List (Paginated + Filtered + Sorted) | ⬜ Open | [#30](https://github.com/gsb-b60/culinaryblog/issues/30) | Tran Duc Anh |
| #21 | FR-RCP-002: View Recipe Detail | ⬜ Open | [#31](https://github.com/gsb-b60/culinaryblog/issues/31) | Tran Duc Anh |
| #22 | FR-RCP-005: Publish/Unpublish Recipe | ⬜ Open | [#3](https://github.com/gsb-b60/culinaryblog/issues/3) | Nguyen Huynh Thanh |
| #23 | FR-RCP-006: Archive Recipe | ⬜ Open | [#32](https://github.com/gsb-b60/culinaryblog/issues/32) | Nguyen Huynh Thanh |
| #24 | FR-RCP-007: Delete Recipe | ⬜ Open | [#33](https://github.com/gsb-b60/culinaryblog/issues/33) | Nguyen Huynh Thanh |
| #25 | FR-RCP-009: Ingredient Management (CRUD) | ✅ Done | [#6](https://github.com/gsb-b60/culinaryblog/issues/6) | Nguyen Huynh Thanh |
| #26 | FR-RCP-010: Steps Management (CRUD) | ⬜ Open | [#34](https://github.com/gsb-b60/culinaryblog/issues/34) | Nguyen Huynh Thanh |
| #27 | FR-SRCH-002: Filtering Recipes | ⬜ Open | [#35](https://github.com/gsb-b60/culinaryblog/issues/35) | Nguyen Huynh Thanh |
| #28 | FR-SRCH-003: Sorting Recipes | ⬜ Open | [#36](https://github.com/gsb-b60/culinaryblog/issues/36) | Nguyen Huynh Thanh |
| #29 | FR-SRCH-004: Pagination | ⬜ Open | [#37](https://github.com/gsb-b60/culinaryblog/issues/37) | Nguyen Huynh Thanh |
| #30 | FR-JOB-001: Welcome Email Job | ⬜ Open | [#4](https://github.com/gsb-b60/culinaryblog/issues/4) | Bich Tran |
| #31 | FR-JOB-003: Sitemap Generation Job | ⬜ Open | [#38](https://github.com/gsb-b60/culinaryblog/issues/38) | Bich Tran |
| #32 | FR-OBS-001: Health Check Endpoints | ⬜ Open | [#5](https://github.com/gsb-b60/culinaryblog/issues/5) | Bich Tran |
| #33 | FR-OBS-002: Structured Logging | ⬜ Open | [#39](https://github.com/gsb-b60/culinaryblog/issues/39) | Bich Tran |
| #34 | FR-OBS-003: Distributed Tracing & Metrics | ⬜ Open | [#40](https://github.com/gsb-b60/culinaryblog/issues/40) | Bich Tran |

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
