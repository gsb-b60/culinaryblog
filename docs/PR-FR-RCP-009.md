## 1. Thông tin thành viên

| Họ tên | MSSV | Vai trò |
|---|---|---|
| Huỳnh Thành | 2312748 | Backend/Frontend |

---

## 2. FR name

FR-RCP-009 - Add / Update / Delete Recipe Ingredients

---

## 3. Issue name

Issue #25 — FR-RCP-009: Ingredient Management (CRUD)

**Link tài liệu:** [docs/issues/person-3.md](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/docs/issues/person-3.md#issue-25--fr-rcp-009-ingredient-management-crud)

**GitHub issue:** [#6](https://github.com/gsb-b60/culinaryblog/issues/6)

**Closes:** #6

> #25 là số thứ tự tài liệu, tương ứng GitHub #6 theo docs/issues/README.md. Issue #6 đã đóng; liên kết được giữ làm ngữ cảnh yêu cầu gốc.

**PR:** [#55](https://github.com/gsb-b60/culinaryblog/pull/55)

**Nhánh:** `feat-frontend-add/delete/fix-ingredient-management` → `master`.

**Nền tích hợp:** master `1ed7022`, bản bàn giao trước review `dee2dfa`.

**Source đã kiểm thử:** `70fdcb99639d25c30357a0e3e885c178b5813233`.

**Commit minh chứng:** `106e955c2d06463851c452df14ef7a0d2621aea9`, tạo ảnh/JSON sau khi source đã commit và E2E pass. Các commit minh chứng/tài liệu không thay đổi source đã kiểm thử; `result.json` lưu `testedCommit`, thời gian chạy và `testedTrees` để đối chiếu.

---

## 4. Mô tả thay đổi

- Tích hợp xem/thêm/sửa/xóa nguyên liệu vào DashboardLayout và Zustand session của master mới; sử dụng API `/recipes/manage`, phân trang 12 công thức/trang, kiểm tra chủ công thức/Admin và validation đầu vào.
- Sửa theo review: đồng bộ `recipeId`/`page` với URL để F5 giữ đúng công thức, xóa trạng thái tải khi chuyển trang để nút Tải lại không bị kẹt, bỏ cập nhật ref trong state updater. Chọn lại cùng công thức không khóa form. Danh sách chọn có vùng cuộn. Bổ sung chặn kết quả/lỗi của thao tác thêm/sửa/xóa cũ cập nhật sang công thức khác sau Back/Forward; trạng thái tải chỉ áp dụng khi có công thức hợp lệ và request tương ứng.
- E2E dùng Chromium mặc định, cho phép chọn Edge qua `E2E_BROWSER_CHANNEL`; bổ sung hồi quy lựa chọn/phân trang/F5/mất kết nối với HTTP và PostgreSQL thật. Không giả API hoặc kết nối dịch vụ.
- Thêm JSDoc cho 76 hàm/constructor trong các file source thuộc PR. Docstring coverage khác với test coverage. CodeRabbit đã xác nhận 84,51% ≥ 80% trên commit 46b16b1; cần chạy lại trên bản sửa mới.
- Tách báo cáo, ảnh và script của các chức năng khác khỏi PR. Bản đầy đủ được giữ ở nhánh local `docs/huynh-thanh-review-snapshots`, commit `7f49a92`. Trên nhánh đó đã sửa script `fileURLToPath`, `list.data.items`, mốc master lịch sử và bảo toàn file env; chưa chạy lại toàn bộ snapshot lịch sử.
- Giữ Playwright vì bộ E2E của chính FR-RCP-009 sử dụng thư viện này để kiểm tra và chụp response thật. Các sửa Prisma/SMTP/BULLMQ_PREFIX và CI phục vụ trực tiếp bộ kiểm thử dịch vụ thật, giữ ngưỡng coverage dòng code 80%.

**Các file chính:**

- Backend: [RecipeIngredientQueryHandler.ts](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/backend/src/application/handlers/RecipeIngredientQueryHandler.ts), [recipeRoutes.ts](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/backend/src/presentation/routes/recipeRoutes.ts), [container.ts](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/backend/src/presentation/di/container.ts), [openapi.ts](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/backend/src/presentation/docs/openapi.ts), [RecipeRepository.ts](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/backend/src/infrastructure/persistence/repositories/RecipeRepository.ts), [NodemailerEmailService.ts](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/backend/src/infrastructure/email/NodemailerEmailService.ts), các queue/worker.
- Frontend: [IngredientManagementPage.tsx](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/frontend/src/pages/IngredientManagementPage.tsx), [api.ts](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/frontend/src/lib/api.ts), [RecipesPage.tsx](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/frontend/src/pages/RecipesPage.tsx), [DashboardSidebar.tsx](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/frontend/src/components/DashboardSidebar.tsx).
- Tests: [ingredients-master.e2e.ts](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/backend/tests/ingredients-master.e2e.ts), [ingredients-master.integration.test.ts](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/backend/tests/ingredients-master.integration.test.ts), [real-services.integration.test.ts](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/backend/tests/real-services.integration.test.ts), [domain-lifecycle.test.ts](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/backend/tests/domain-lifecycle.test.ts).
- CI/docs: [ci.yml](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/.github/workflows/ci.yml), [TESTING_REAL_SERVICES.md](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/backend/TESTING_REAL_SERVICES.md), [hướng dẫn chạy](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/docs/reports/huynh-thanh/CAI-DAT-VA-CHAY.md), [báo cáo review](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/docs/reports/huynh-thanh/09-tich-hop-nguyen-lieu-master.md#8-xử-lý-review-pr-55).

---

## 5. Phạm vi

- [x] backend
- [x] frontend
- [ ] prisma-DB — không đổi schema/migration trong phần nguyên liệu.
- [x] infra-docker — cấu hình dịch vụ phục vụ kiểm thử tích hợp.
- [x] docs
- [x] CI — bật coverage và dịch vụ thật trên GitHub Actions.

**Layer (backend):**

- [ ] domain — không đổi implementation domain trong phần nguyên liệu.
- [x] application
- [x] infrastructure
- [x] presentation

---

## 6. Cách kiểm thử

1. Chạy PostgreSQL, Redis; toàn bộ backend cần thêm MinIO và MailHog thật. Đối chiếu cổng và image đang dùng theo [hướng dẫn dịch vụ](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/backend/TESTING_REAL_SERVICES.md). Không ghi đè file env đã có.
2. Backend: `pnpm install --frozen-lockfile`, `pnpm prisma:generate`, `pnpm dev`. Chỉ khởi tạo schema trên database phát triển riêng khi cần.
3. Frontend: `pnpm install --frozen-lockfile`, `pnpm dev`; đăng nhập Author/Admin và mở `/dashboard/ingredients`.
4. Chọn công thức ở trang 2, đổi công thức và nhấn F5; kiểm tra giữ đúng công thức/trang. Thử thêm/sửa/xóa, tải lại và kiểm tra dữ liệu đã lưu.
5. Scalar: `http://localhost:3000/scalar`; OpenAPI: `http://localhost:3000/api-docs.json`. API yêu cầu Bearer JWT.

| API | Kết quả mong đợi |
|---|---|
| `GET /api/v1/recipes/manage?page=1&pageSize=12` | 200, danh sách và metadata phân trang |
| `GET /api/v1/recipes/{id}/ingredients` | 200 |
| `POST /api/v1/recipes/{id}/ingredients` | 201 |
| `PUT /api/v1/recipes/{id}/ingredients/{ingredientId}` | 200 |
| `DELETE /api/v1/recipes/{id}/ingredients/{ingredientId}` | 204 |
| Không phải owner/Admin | 403 |
| Tài nguyên không tồn tại | 404 |
| Dữ liệu không hợp lệ | 422 |

**Lệnh kiểm tra:**

- Backend: `pnpm test`, `pnpm lint`, `pnpm build`.
- Frontend: `pnpm test --maxWorkers=2`, `pnpm lint`, `pnpm build`.
- E2E: cài Chromium bằng `pnpm exec playwright install chromium` trong frontend; chạy `pnpm test:e2e:ingredients` trong backend. Nếu dùng Edge đã cài, đặt `$env:E2E_BROWSER_CHANNEL = 'msedge'` trước lệnh chạy.

**Kết quả sau sửa review ngày 21/10/2026:**

- Backend `pnpm test`: 18 files, 202/202 tests passed; lines coverage 89,23%, ngưỡng giữ nguyên 80%.
- Frontend: 17 files, 160/160 tests passed với `pnpm test --maxWorkers=2`; lint và build pass.
- Backend lint: exit 0, 0 errors, 197 warnings; build pass. Chưa phải lint clean hoàn toàn.
- E2E thật: pass — deep link trang 2, đổi công thức/F5, chuyển trang/F5, tải lại sau mất mạng trong lúc tải nguyên liệu, chọn lại cùng công thức, CRUD desktop/mobile, dữ liệu trong PostgreSQL và refresh token. Đã kiểm tra riêng từng POST/PUT/DELETE của B đang chờ, Back về A và tải A xong trước khi handler B tiếp tục: dữ liệu ghi đúng B, không ghi danh sách/thông báo cũ sang A. Thử tải lại nhiều lần khi URL có recipeId nhưng danh sách lỗi cũng pass.

Kiểm thử tích hợp dùng schema/bucket/prefix riêng và dọn tài nguyên sau chạy. Các unit test cũ có mock vẫn giữ nguyên; test tích hợp mới không giả dịch vụ. E2E tạo lỗi bằng CDP hoặc đóng kết nối thật tại Express fixture; trì hoãn handler thật để kiểm tra thứ tự hoàn tất request. Các điểm điều phối chỉ có trong test, không trả response giả và không thay thế PostgreSQL/dịch vụ.

Kết quả trên là kiểm tra local của source 70fdcb9. GitHub CI backend/frontend và 5 pre-merge checks đã pass trên commit cũ 46b16b1; docstring coverage đạt 84,51%. Sau push, cần GitHub chạy lại để xác nhận CI/review trên bản sửa mới.

---

## 7. Screenshot minh chứng thành công (BẮT BUỘC)

### UI desktop và mobile

![Thêm nguyên liệu desktop](https://raw.githubusercontent.com/gsb-b60/culinaryblog/106e955c2d06463851c452df14ef7a0d2621aea9/docs/reports/huynh-thanh/evidence/ingredients-master/desktop-created.png)

![Cập nhật nguyên liệu mobile](https://raw.githubusercontent.com/gsb-b60/culinaryblog/106e955c2d06463851c452df14ef7a0d2621aea9/docs/reports/huynh-thanh/evidence/ingredients-master/mobile-updated.png)

### HTTP response thật

Các ảnh sau do E2E hiển thị method/path/status/body từ response trình duyệt thực nhận. Đây là panel minh chứng trong trình duyệt, không phải ảnh Scalar/DevTools. Không hiển thị Authorization hoặc token.

![POST ingredients — HTTP 201](https://raw.githubusercontent.com/gsb-b60/culinaryblog/106e955c2d06463851c452df14ef7a0d2621aea9/docs/reports/huynh-thanh/evidence/ingredients-master/api-post-201.png)

![PUT ingredients — HTTP 200](https://raw.githubusercontent.com/gsb-b60/culinaryblog/106e955c2d06463851c452df14ef7a0d2621aea9/docs/reports/huynh-thanh/evidence/ingredients-master/api-put-200.png)

![DELETE ingredients — HTTP 204](https://raw.githubusercontent.com/gsb-b60/culinaryblog/106e955c2d06463851c452df14ef7a0d2621aea9/docs/reports/huynh-thanh/evidence/ingredients-master/api-delete-204.png)

[Kết quả E2E và HTTP đã lưu](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/docs/reports/huynh-thanh/evidence/ingredients-master/result.json).

### Kết quả test/lint/build

Ảnh dưới hiển thị trích đoạn log các lệnh thực sự đã chạy và exit code đã xác nhận. Đây là bản render log trong trình duyệt, không phải chụp cửa sổ terminal. Backend còn 197 warnings; không ghi lint clean.

![Backend — 202 tests, coverage 89,23%, lint và build](https://raw.githubusercontent.com/gsb-b60/culinaryblog/106e955c2d06463851c452df14ef7a0d2621aea9/docs/reports/huynh-thanh/evidence/ingredients-master/validation-backend.png)

![Frontend — 160 tests, lint và build](https://raw.githubusercontent.com/gsb-b60/culinaryblog/106e955c2d06463851c452df14ef7a0d2621aea9/docs/reports/huynh-thanh/evidence/ingredients-master/validation-frontend.png)

[Log backend](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/docs/reports/huynh-thanh/evidence/ingredients-master/validation-backend.txt) · [Log frontend](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/docs/reports/huynh-thanh/evidence/ingredients-master/validation-frontend.txt) · [Metadata kiểm tra](https://github.com/gsb-b60/culinaryblog/blob/106e955c2d06463851c452df14ef7a0d2621aea9/docs/reports/huynh-thanh/evidence/ingredients-master/review-validation.json).

Nếu reviewer yêu cầu đúng ảnh cửa sổ terminal/Scalar, chụp thêm các công cụ đó trên máy; ảnh ở đây được ghi nhãn theo đúng nguồn tạo. Các ảnh và liên kết dùng URL đầy đủ ghim tại commit minh chứng 106e955. Cần push các commit mới trước để những URL này truy cập được trên GitHub. Có thể copy toàn bộ file vào mô tả PR và xem ảnh trong tab Preview, không cần tải ảnh riêng.

---

## 8. Checklist

- [x] Sửa lỗi F5 quay về công thức cũ và đồng bộ trang với URL.
- [x] Sửa trạng thái tải bị kẹt khi chuyển trang, tải lại và danh sách công thức lỗi.
- [x] Kết quả thêm/sửa/xóa đang chờ không cập nhật sang công thức khác sau Back/Forward.
- [x] Minh chứng tạo sau commit source, ghi testedCommit/testedTrees và thời gian thực chạy.
- [x] Không còn thay đổi ref trong state updater.
- [x] E2E không bắt buộc Edge; mặc định Chromium, có biến cấu hình.
- [x] Kiểm thử hồi quy với trình duyệt/HTTP/PostgreSQL thật pass.
- [x] Backend test pass — 202 tests, lines coverage 89,23% ≥ 80%.
- [x] Frontend lint/build pass.
- [x] Toàn bộ test frontend trên bản sửa cuối — 160/160 tests passed.
- [x] Backend lint không errors; còn 197 warnings.
- [ ] Backend lint clean hoàn toàn.
- [x] Bổ sung JSDoc cho các hàm trong source thuộc PR.
- [x] CodeRabbit xác nhận docstring coverage 84,51% trên commit cũ 46b16b1.
- [ ] CodeRabbit kiểm tra lại bản sửa mới sau push.
- [x] Tách báo cáo đa chức năng sang nhánh tài liệu riêng và bảo toàn lịch sử.
- [x] Playwright phục vụ trực tiếp E2E nguyên liệu.
- [x] Hướng dẫn không ghi đè env và phân biệt mốc master lịch sử/hiện tại.
- [x] Có ảnh HTTP POST 201, PUT 200, DELETE 204 thật.
- [x] Có ảnh và trích đoạn log kiểm tra cuối đã cập nhật; ghi rõ nguồn render log.
- [x] Đã xác nhận GitHub Actions backend/frontend pass trên commit cũ 46b16b1.
- [ ] Đã xác nhận GitHub Actions pass trên bản sửa mới.
- [ ] Đã kiểm tra toàn bộ commit không chứa secrets và format toàn bộ PR.
