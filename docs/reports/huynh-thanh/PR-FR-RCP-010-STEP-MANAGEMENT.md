# FR-RCP-010 — Steps Management (CRUD)

## 1. Thông tin thành viên

| Họ tên | MSSV | Vai trò |
|---|---|---|
| Huỳnh Thành | 2312748 | Backend / Frontend |

## 2. FR name

**FR-RCP-010 — Add / Update / Delete Recipe Steps**

## 3. Issue name

**Issue #26 — FR-RCP-010: Steps Management (CRUD)**

**Link:** [docs/issues/person-3.md — Issue #26](../../issues/person-3.md#issue-26--fr-rcp-010-steps-management-crud)  
**GitHub issue:** [#34](https://github.com/gsb-b60/culinaryblog/issues/34)  
**Closes:** #34

## 4. Mô tả thay đổi

- Hoàn thiện quản lý bước nấu xuyên suốt backend và dashboard frontend: xem danh sách, thêm, sửa nội dung/thứ tự và xóa bước. Hỗ trợ thời gian nấu, URL ảnh minh họa, kiểm tra quyền chủ sở hữu/Admin và tự đánh số lại các bước sau khi sắp xếp hoặc xóa.
- Cập nhật API/OpenAPI và bổ sung kiểm thử unit, giao diện và E2E với PostgreSQL schema cô lập cùng Chromium thật.

**Các file chính thay đổi:**

- Backend: `backend/src/application/commands/recipes/RecipeCommands.ts`, `backend/src/application/handlers/RecipeStepCommandHandlers.ts`, `backend/src/presentation/di/container.ts`, `backend/src/presentation/routes/recipeRoutes.ts`, `backend/src/presentation/docs/openapi.ts`.
- Frontend: `frontend/src/pages/RecipeStepsPage.tsx`, `frontend/src/App.tsx`, `frontend/src/components/DashboardSidebar.tsx`, `frontend/src/components/layout/DashboardLayout.tsx`, `frontend/src/lib/api.ts`, `frontend/src/types/recipe.ts`.
- Kiểm thử: `backend/tests/recipe-step-management.test.ts`, `backend/tests/recipe-steps.e2e.ts`, `frontend/src/test/RecipeStepsPage.test.tsx`.
- Minh chứng: `docs/reports/huynh-thanh/evidence/issue-34-step-management/desktop.png`, `docs/reports/huynh-thanh/evidence/issue-34-step-management/result.json`.

## 5. Phạm vi

- [x] backend
- [x] frontend
- [ ] prisma-DB (không đổi schema / migration / seed)
- [ ] infra-docker
- [x] docs / OpenAPI

**Layer (backend):**

- [ ] domain
- [x] application
- [ ] infrastructure
- [x] presentation

## 6. Cách kiểm thử

Các lệnh sau chạy từ thư mục được ghi chú:

1. Backend unit/API: trong `backend`, chạy `pnpm exec vitest run tests/recipe-step-management.test.ts` — **PASS, 13/13 tests**.
2. Frontend UI: trong `frontend`, chạy `pnpm exec vitest run src/test/RecipeStepsPage.test.tsx` — **PASS, 2/2 tests**.
3. E2E: trong `backend`, chạy `pnpm test:e2e:steps` — **PASS**. Kiểm tra xác thực/phân quyền/validation, CRUD và đổi thứ tự trên Chromium; xác nhận dữ liệu được lưu trong PostgreSQL schema riêng. Schema thử nghiệm được dọn sau khi chạy.
4. Build backend và frontend bằng `pnpm build` — **PASS**.
5. Lint frontend bằng `pnpm lint` — **PASS**. Backend `pnpm lint` — **0 errors**, còn 2 warnings đã có tại `container.ts`.
6. `pnpm test` toàn bộ backend/frontend chưa chạy trong lượt kiểm chứng này; thay vào đó đã chạy các bộ test tập trung ở trên.

## 7. Screenshot minh chứng thành công

Ảnh desktop được chụp bằng Chromium thật ngay sau khi thêm bước đầu tiên thành công. Không chụp mobile theo yêu cầu.

![Dashboard quản lý bước nấu sau khi thêm bước thành công](./evidence/issue-34-step-management/desktop.png)

Kết quả API/E2E và danh sách HTTP status được lưu trong [result.json](./evidence/issue-34-step-management/result.json).

## 8. Checklist

- [x] Backend lint không có lỗi; frontend lint pass (backend còn 2 warnings).
- [x] `pnpm build` backend và frontend pass.
- [x] Test tập trung pass: backend 13/13, frontend 2/2; E2E pass.
- [x] Không đổi `prisma/schema.prisma`; không cần `prisma:generate`.
- [x] Không thêm `.env`, secrets, keys hoặc token.
- [ ] Chưa chạy Prettier cho toàn bộ dự án trong lượt kiểm chứng này.
- [x] Đã rà soát các luồng phân quyền, CRUD, sắp xếp lại bước và kết quả E2E.
- [x] Không thêm `console.log` hoặc mã debug vào thay đổi.
- [x] Cập nhật OpenAPI và bổ sung báo cáo/minh chứng.

## 9. Minh chứng trực quan các chức năng được phân công (Issues #22–#29)

Các ảnh dưới đây là ảnh giao diện hoặc kết quả API được chụp/lưu từ các lượt kiểm thử thực trong những thư mục evidence của dự án. Mỗi mục ghi rõ thao tác được minh họa; các ảnh UI không thay thế kết quả test/API khi một trạng thái cụ thể chỉ được xác nhận bằng kiểm thử.

### Issue #22 — FR-RCP-005: Publish / Unpublish

Ảnh giao diện sau thao tác thật: chuyển công thức về bản nháp và xuất bản lại. Cả hai request PATCH trả HTTP 200 trong harness tích hợp PostgreSQL/Redis/Chromium.

![Unpublish thành công trên dashboard](./evidence/fr-rcp-006-verified/08-unpublish-success.png)

![Publish thành công trên dashboard](./evidence/fr-rcp-006-verified/09-publish-success.png)

### Issue #23 — FR-RCP-006: Archive

Giao diện sau khi lưu trữ: thông báo thành công, badge trạng thái Archived và công thức vẫn được giữ lại cho chủ sở hữu.

![Archive công thức thành công](./evidence/fr-rcp-006-verified/02-archive-success.png)

### Issue #24 — FR-RCP-007: Delete Recipe

Giao diện sau thao tác xóa thật; kết quả HTTP 204 và kiểm tra dữ liệu/cleanup được lưu cùng bộ minh chứng.

![Xóa công thức thành công](./evidence/fr-rcp-007-verified/03-real-delete-success.png)

### Issue #25 — FR-RCP-009: Ingredient CRUD

Giao diện sau khi thêm nguyên liệu và kết quả các thao tác API tạo, cập nhật, xóa.

![Giao diện danh sách nguyên liệu sau khi thêm](./evidence/ingredients-master/desktop-created.png)

![API tạo nguyên liệu — HTTP 201](./evidence/ingredients-master/api-post-201.png)

![API cập nhật nguyên liệu — HTTP 200](./evidence/ingredients-master/api-put-200.png)

![API xóa nguyên liệu — HTTP 204](./evidence/ingredients-master/api-delete-204.png)

### Issue #26 — FR-RCP-010: Recipe Step CRUD

Các ảnh được chụp bằng Chromium thật sau khi thêm bước, đổi thứ tự/cập nhật và xóa bước. E2E xác nhận thứ tự sau cùng được đánh lại liên tục trong PostgreSQL.

![Danh sách bước sau khi thêm bước đầu tiên](./evidence/issue-34-step-management/desktop.png)

![Danh sách bước sau khi cập nhật và đổi thứ tự](./evidence/issue-34-step-management/desktop-reordered.png)

![Danh sách bước sau khi xóa và đánh số lại](./evidence/issue-34-step-management/desktop-after-delete.png)

### Issue #27 — FR-SRCH-002: Filtering

Giao diện lọc theo danh mục, độ khó, thời gian nấu và khẩu phần; ảnh API bên dưới ghi nhận phản hồi HTTP 200 cho bộ lọc hợp lệ.

![Danh sách công thức với bộ lọc](./evidence/fr-srch-002/desktop.png)

![API lọc công thức hợp lệ — HTTP 200](./evidence/fr-srch-002/api-200.png)

### Issue #28 — FR-SRCH-003: Sorting

Giao diện sắp xếp theo tên và thời gian nấu giảm dần, kèm response API cho thứ tự tiêu đề.

![Sắp xếp theo tên A–Z](./evidence/fr-srch-003/desktop-title.png)

![Sắp xếp theo thời gian nấu giảm dần](./evidence/fr-srch-003/desktop-cook-time.png)

![API sắp xếp theo tiêu đề — HTTP 200](./evidence/fr-srch-003/api-title.png)

### Issue #29 — FR-SRCH-004: Pagination

Giao diện danh sách công thức công khai hiển thị trang hiện tại/tổng số trang; bộ ảnh kèm theo có kiểm tra API phân trang và validation.

![Danh sách công thức công khai có phân trang](./evidence/fr-srch-004-pagination/01-public-pagination.png)

![Kết quả kiểm tra API, test, lint và build cho phân trang](./evidence/fr-srch-004-pagination/05-validation.png)
