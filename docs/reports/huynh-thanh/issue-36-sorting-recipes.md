# Issue #36 - FR-SRCH-003: Sorting Recipes

GitHub: https://github.com/gsb-b60/culinaryblog/issues/36

## Behavior

GET /api/v1/recipes accepts sort={field}. A leading minus means descending; no prefix means ascending. The default is -createdAt. Supported fields: createdAt, title, prepTime, cookTime, publishedAt. Empty, unknown, repeated or structured sort values return HTTP 422 before querying persistence. Legacy field/order remain supported and validated; a valid sort overrides their values.

The same parsing applies to /recipes/search. Filtering and published-only visibility remain in effect. The existing repository orders before applying offset/limit and adds id ascending to break ties consistently across pages.

The public /recipes page offers all supported sort directions. It stores sort in the URL, restores it on navigation/reload, preserves search/filters, and returns to page 1 when sorting changes. Clearing filters preserves sorting. Unknown URL sort values safely use -createdAt in requests and the dropdown.

## Validation

Backend regression tests: tests/recipe-sorting.test.ts covers all field/direction mappings, defaults, legacy compatibility and precedence, invalid HTTP query shapes, published-only query scope, pagination and combined search/filtering.

Real PostgreSQL E2E: tests/recipe-sorting.e2e.ts creates an isolated schema using the existing integration fixture and cleans it up after the run. It checks exact result IDs across two pages for default, newest, oldest, title and longest cooking time; tied values; hidden drafts; search/filter combinations; and invalid sort errors. Execution passed all five ordering cases plus search, invalid input, stable pagination and published-only checks.

Frontend regression tests extend static-blog.test.tsx to verify URL restoration, request sort, reset to page 1, retained filters, clear-filter behavior and safe fallback.

Commands from backend:

~~~powershell
npx vitest run tests/recipe-sorting.test.ts tests/recipe-filtering.test.ts
npx tsx tests/recipe-sorting.e2e.ts
npx vitest run
npm run build
npm run lint
~~~

Commands from frontend:

~~~powershell
npx vitest run
npm run build
npm run lint
~~~

The PostgreSQL test requires the existing local PostgreSQL/Redis integration setup. Frontend component tests use mocked HTTP; this change does not include a real browser check or screenshots. No schema migration is required.

## Executed results

- Backend targeted sorting/filtering: 45/45 passed.
- Backend complete suite: 335/335 tests, 26 files passed (without coverage).
- Frontend complete suite: 242/242 tests, 25 files passed with npx vitest run --maxWorkers=2. An earlier concurrent run had one unrelated dashboard test exceed its 5-second timeout; the complete rerun passed without changing that test or its timeout.
- Backend and frontend builds: passed. Frontend retains the chunk-size warning above 500 kB.
- Backend lint: exit 0, 0 errors, 196 warnings. Frontend lint: passed.
- Real PostgreSQL sorting E2E: passed.
- git diff --check: passed.

Changes are local on feat-issue#28-FR-SRCH-003-Sorting-Recipes; no commit, push, PR creation or GitHub issue state change was performed.
