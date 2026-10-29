## 1. Thông tin thành viên

| Họ tên | MSSV | Vai trò |
|---|---|---|
| Nguyễn Huỳnh Thanh | 2312748 | Fullstack (Backend / Frontend) |

---

## 2. FR name

FR-SRCH-002 - Filtering Recipes

Tham chiếu: [docs/03-fr-misc.md §3.4](https://github.com/gsb-b60/culinaryblog/blob/feat-issue%2327-FR-SRCH-002-Filtering-Recipe/docs/03-fr-misc.md#34-search--pagination-module-fr-srch).

---

## 3. Issue name

Issue #27 — FR-SRCH-002: Filtering Recipes

**Link:** [docs/issues/person-3.md — Issue #27](https://github.com/gsb-b60/culinaryblog/blob/feat-issue%2327-FR-SRCH-002-Filtering-Recipe/docs/issues/person-3.md#issue-27--fr-srch-002-filtering-recipes)

Closes #35

Số #27 là thứ tự trong tài liệu phân công; số issue trên GitHub là #35.

---

## 4. Mô tả thay đổi

Hoàn thiện bộ lọc công thức công khai theo danh mục, độ khó, thời gian nấu tối đa và khẩu phần tối thiểu. Các tiêu chí kết hợp bằng AND trước phân trang; `totalCount` phản ánh tổng kết quả đã lọc. Bổ sung giao diện, tài liệu API và E2E để xác minh các acceptance criteria.

- Bổ sung `minServings` từ validator, domain filter đến Prisma `servings.gte`.
- Nhận `Easy/Medium/Hard/Expert` và giữ tương thích `EASY/MEDIUM/HARD/EXPERT`; giá trị không hợp lệ trả 422.
- Kiểm tra `maxCookTime >= 0`, `minServings >= 1`, số nguyên trong phạm vi PostgreSQL Int.
- Thanh bộ lọc tại `/recipes` lưu trạng thái vào URL, giữ bộ lọc khi phân trang/reload/Back/Forward, về trang 1 khi đổi điều kiện và có nút xóa lọc.
- Chỉ trả công thức published, chưa xóa. Dashboard quản lý công thức nằm ngoài phạm vi issue.

Các file chính:

| File | Thay đổi |
|---|---|
| `backend/src/application/validators/recipeValidators.ts` | Validate và chuẩn hóa query |
| `backend/src/domain/repositories/IRecipeRepository.ts` | Bổ sung minServings |
| `backend/src/infrastructure/persistence/repositories/RecipeRepository.ts` | Điều kiện servings ≥ ngưỡng |
| `backend/src/presentation/docs/openapi.ts` | Tham số lọc, AND, count và lỗi 422 |
| `frontend/src/pages/RecipesBrowsePage.tsx` | Bộ lọc công khai, URL state và trạng thái UI |
| `frontend/src/types/recipe.ts` | Kiểu query minServings |
| `backend/tests/recipe-filtering.test.ts` | 23 test validation |
| `backend/tests/recipe-filtering.e2e.ts` | API và browser E2E dùng PostgreSQL thật |
| `backend/tests/support/ingredientIntegration.ts` | Dùng lại fixture schema riêng, mount category routes |
| `backend/package.json` | Lệnh test:e2e:filtering |
| `docs/reports/huynh-thanh/issue-35-filtering-recipes.md` | Phân tích, luồng hoạt động, kiểm thử và giới hạn |

---

## 5. Phạm vi

- [x] backend
- [x] frontend
- [ ] prisma-DB (schema / migration / seed)
- [ ] infra-docker (docker-compose, nginx, redis, minio)
- [x] docs

**Layer (backend):**

- [x] domain
- [x] application
- [x] infrastructure
- [x] presentation

Không đổi Prisma schema/migration/seed. Fixture kiểm thử tạo dữ liệu trong schema riêng và dọn sau khi chạy.

---

## 6. Cách kiểm thử

1. Khởi động PostgreSQL và Redis theo cấu hình local: `docker-compose up -d`. Với môi trường mới, cài dependencies và cấu hình env theo README; không commit env.
2. Backend: trong thư mục `backend`, chạy `pnpm dev`.
3. Frontend: trong thư mục `frontend`, chạy `pnpm dev`; mở `http://localhost:5173/recipes`, không cần đăng nhập. `VITE_API_BASE_URL` phải trỏ đúng API đang chạy.
4. Chọn danh mục, độ khó, nhập tối đa 30 phút và tối thiểu 2 khẩu phần. Kết quả phải thỏa cả bốn điều kiện; thay bộ lọc ở trang 2 phải trở về trang 1. Kiểm tra reload, Back/Forward, xóa lọc và kết quả rỗng.
5. Với backend ở cổng 3000, gọi API bằng PowerShell:
   ```powershell
   curl.exe "http://localhost:3000/api/v1/recipes?difficulty=Easy&maxCookTime=30&minServings=2&page=1&pageSize=12"
   curl.exe -i "http://localhost:3000/api/v1/recipes?difficulty=Invalid"
   ```
   Request đầu trả 200, `cookTime <= 30`, `servings >= 2`, `difficulty=EASY`. Request sau trả 422 Problem Details. Thêm `categoryId={UUID-thực}` để kiểm tra danh mục. Thời gian trên thẻ là prep+cook; bộ lọc chỉ dùng cookTime.
6. Trong `backend`:
   ```powershell
   pnpm exec vitest run tests/recipe-filtering.test.ts
   pnpm run test:e2e:filtering
   pnpm exec vitest run
   pnpm lint
   pnpm build
   ```
7. Trong `frontend`:
   ```powershell
   pnpm exec vitest run
   pnpm lint
   pnpm build
   ```

**Kết quả đã chạy:**

| Kiểm tra | Kết quả |
|---|---|
| Backend validation riêng FR-SRCH-002 | 23/23 passed |
| E2E thật: API + Chromium desktop/mobile | 25 nhóm kiểm tra passed |
| Backend toàn bộ Vitest | 313/313 tests, 25/25 files passed |
| Frontend toàn bộ Vitest | 240/240 tests, 25/25 files passed |
| Backend/frontend build | Passed |
| Backend lint | Exit 0, 0 errors, 196 warnings |
| Frontend lint | Passed |
| git diff --check | Passed |

Các lệnh được chạy thực tế bằng npm/npx; các lệnh pnpm trên gọi cùng scripts/binary. Backend `pnpm test` bật coverage; lần xác minh này dùng `vitest run` và **không đo coverage**, không khẳng định đã đạt coverage threshold. Frontend build có cảnh báo chunk >500 kB, vẫn build thành công.

E2E dùng schema PostgreSQL riêng, HTTP và Chromium thật, không mock API; cần PostgreSQL/Redis local và Chromium Playwright. Port Vite E2E 5187 phải trống.

---

## 7. Screenshot minh chứng thành công (BẮT BUỘC)

Ảnh desktop/mobile lấy từ E2E thật. Các ảnh API và test/lint bên dưới hiển thị nguyên văn dữ liệu HTTP/đầu ra lệnh đã thu được; không phải ảnh giao diện Scalar hoặc cửa sổ terminal hệ điều hành.

**1. Desktop — kết hợp bốn bộ lọc và tổng 14 công thức đã lọc:**

![Bộ lọc công thức trên desktop](https://raw.githubusercontent.com/gsb-b60/culinaryblog/refs/heads/feat-issue%2327-FR-SRCH-002-Filtering-Recipe/docs/reports/huynh-thanh/evidence/fr-srch-002/desktop.png)

**2. Mobile 390px — lọc thời gian nấu 0 phút, không tràn ngang:**

![Bộ lọc công thức trên mobile](https://raw.githubusercontent.com/gsb-b60/culinaryblog/refs/heads/feat-issue%2327-FR-SRCH-002-Filtering-Recipe/docs/reports/huynh-thanh/evidence/fr-srch-002/mobile.png)

**3. API thực tế — HTTP 200, điều kiện lọc và metadata:**

![Response API lọc công thức 200](https://raw.githubusercontent.com/gsb-b60/culinaryblog/refs/heads/feat-issue%2327-FR-SRCH-002-Filtering-Recipe/docs/reports/huynh-thanh/evidence/fr-srch-002/api-200.png)

**4. API thực tế — difficulty không hợp lệ trả 422:**

![Response validation 422](https://raw.githubusercontent.com/gsb-b60/culinaryblog/refs/heads/feat-issue%2327-FR-SRCH-002-Filtering-Recipe/docs/reports/huynh-thanh/evidence/fr-srch-002/api-422.png)

**5. Đầu ra test validation — 23 test PASS:**

![Kết quả test validation](https://raw.githubusercontent.com/gsb-b60/culinaryblog/refs/heads/feat-issue%2327-FR-SRCH-002-Filtering-Recipe/docs/reports/huynh-thanh/evidence/fr-srch-002/tests.png)

**6. Đầu ra lint — exit 0 cả hai phía, backend có cảnh báo:**

![Kết quả lint backend và frontend](https://raw.githubusercontent.com/gsb-b60/culinaryblog/refs/heads/feat-issue%2327-FR-SRCH-002-Filtering-Recipe/docs/reports/huynh-thanh/evidence/fr-srch-002/lint.png)

Bằng chứng máy đọc và log gốc nằm tại `docs/reports/huynh-thanh/evidence/fr-srch-002/`: `result.json`, `validation.json`, `api-200.json`, `api-422.json`, `filter-validation.txt`, `backend-lint.txt`, `frontend-lint.txt`, `snapshot-manifest.json`.

Ảnh mới chỉ hiển thị trên PR sau khi commit/push thư mục bằng chứng lên đúng nhánh. Repo riêng tư có thể cần đính kèm ảnh trực tiếp vào PR nếu trình xem không tải raw image.

---

## 8. Checklist

- [x] Lint pass (backend + frontend; backend còn 196 warnings, không có errors)
- [x] Build / TypeScript pass
- [x] Vitest pass (313 backend + 240 frontend; chạy không coverage)
- [ ] `pnpm test` backend với coverage — chưa chạy trong lần xác minh này
- [ ] `pnpm prisma:generate` nếu đổi schema — không áp dụng, không đổi schema
- [x] Không đưa file `.env`, secrets, keys, token vào thay đổi của issue
- [ ] Code đã format Prettier (`pnpm format`) — chưa chạy format toàn repo
- [x] Đã tự review code và đối chiếu acceptance criteria
- [x] Không có console/debug thừa trong mã ứng dụng được thêm; script test có log kết quả
- [x] Documentation / comment cập nhật

Chưa push, tạo PR hoặc triển khai từ nội dung báo cáo này.
