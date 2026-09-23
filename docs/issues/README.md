# Culinary Blog — Issue Tracker

Work split for 4 people (1 leader + 3 teammates). **34 issues** covering all Functional Requirements from the SRS.

Source of truth: [`docs/`](../) (English SRS translation of `srs.md`).

## Team Split

| Person | Role | Focus Areas | Issues | File |
|---|---|---|---|---|
| **1** | **Leader** | Auth + Transactions + Image Storage + Algorithm | #1–#14 | [person-1.md](./person-1.md) |
| **2** | Teammate | Categories + Recipe Read | #15–#21 | [person-2.md](./person-2.md) |
| **3** | Teammate | Recipe Lifecycle + Search Params | #22–#29 | [person-3.md](./person-3.md) |
| **4** | Teammate | Jobs + Observability | #30–#34 | [person-4.md](./person-4.md) |

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
