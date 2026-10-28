## 1. Thông tin thành viên

| Họ tên | MSSV | Vai trò |
|---|---|---|
| Huỳnh Thành | 2312748 | Backend - Frontend |

---

## 2. FR name

**FR-RCP-007 - Permanently Delete Recipe**

Nguồn: [docs/03-fr-recipes.md](https://github.com/gsb-b60/culinaryblog/blob/50506fe54126713a12009a3f8e440b8e58efde5e/docs/03-fr-recipes.md#fr-rcp-007-delete-recipe-author-owneradmin).

---

## 3. Issue name

**Issue #24 — FR-RCP-007: Delete Recipe**

**Link:** [docs/issues/person-3.md#issue-24--fr-rcp-007-delete-recipe](https://github.com/gsb-b60/culinaryblog/blob/50506fe54126713a12009a3f8e440b8e58efde5e/docs/issues/person-3.md#issue-24--fr-rcp-007-delete-recipe)

**Closes:** #33 — [GitHub issue](https://github.com/gsb-b60/culinaryblog/issues/33)

Branch đã kiểm tra: `feat-issue#24-FR-RCP-007-Delete-Recipe-New`.

Commit được kiểm chứng: `0d9da540a42bbb98050bb8c7694e61636bbd61bf`.

Ngày kiểm chứng: **28/10/2026**, múi giờ America/Los_Angeles.

---

## 4. Mô tả thay đổi

Bổ sung trang xóa vĩnh viễn công thức trong Dashboard, có xác nhận trước khi xóa và thông báo thành công/lỗi. Backend kiểm tra quyền chủ sở hữu/Admin, xóa dữ liệu liên quan trong transaction và lưu tác vụ outbox để dọn ảnh bất đồng bộ qua Redis/BullMQ và MinIO.

Các file chính trong commit:

| File / thư mục | Thay đổi |
|---|---|
| `frontend/src/pages/DeleteRecipesPage.tsx` | Trang riêng để liệt kê, phân trang, xác nhận/hủy và xóa công thức. |
| `frontend/src/components/layout/DashboardLayout.tsx`, `frontend/src/components/DashboardSidebar.tsx`, `frontend/src/App.tsx` | Điều hướng tới `/dashboard/recipes/delete`. |
| `frontend/src/lib/api.ts` | Gọi API xóa công thức. |
| `backend/src/application/handlers/DeleteRecipeCommandHandler.ts` | Kiểm tra quyền, hard delete, tạo cleanup task và invalidation cache. |
| `backend/src/presentation/routes/recipeRoutes.ts`, `backend/src/presentation/di/container.ts` | Endpoint và đăng ký command handler. |
| `backend/prisma/schema.prisma`, migration `20261028104500_add_file_cleanup_outbox` | Bảng outbox `file_cleanup_tasks`. |
| `backend/src/infrastructure/jobs/` | Queue, relay outbox, processor và worker dọn ảnh. |
| `backend/src/infrastructure/file-storage/MinioFileStorageService.ts` | Xử lý URL/key ảnh trong object storage. |
| `backend/tests/delete-recipe*.test.ts`, `backend/tests/file-cleanup.test.ts` | Kiểm thử endpoint, quyền xóa, outbox và xử lý ảnh. |
| `frontend/src/test/DeleteRecipesPage.test.tsx`, `frontend/src/test/RecipesPage.test.tsx` | Kiểm thử tương tác và xử lý lỗi UI. |

Commit chức năng có **25 file thay đổi**. Báo cáo này và ảnh minh chứng được bổ sung sau commit; các file source được kiểm chứng không có thay đổi so với HEAD.

---

## 5. Phạm vi

- [x] backend
- [x] frontend
- [x] prisma-DB (schema / migration)
- [ ] infra-docker (docker-compose, nginx, redis, minio)
- [x] docs

**Layer (backend):**

- [ ] domain
- [x] application
- [x] infrastructure
- [x] presentation

---

## 6. Cách kiểm thử

Môi trường: Windows, Node `v24.21.0`, pnpm `12.9.1`, Chromium headless. PostgreSQL, Redis và MinIO thực tế đang chạy sẵn trong Docker nên không khởi tạo lại hạ tầng.

1. Nếu chưa có hạ tầng: `docker compose up -d`. Kiểm tra cổng kết nối theo cấu hình local; PostgreSQL Docker trên máy kiểm chứng publish cổng **5433**, không phải 5432.
2. Backend: vào `backend`, chạy `pnpm install`, `pnpm prisma:generate`, áp dụng schema/migration lên DB phát triển phù hợp, rồi `pnpm dev`.
3. Frontend: vào `frontend`, chạy `pnpm install`, `pnpm dev`; cấu hình `VITE_API_BASE_URL` trỏ tới backend.
4. Đăng nhập Author, vào Dashboard → Công thức → Xóa công thức, bấm Xóa → Hủy để kiểm tra dữ liệu vẫn còn, rồi Xóa → Xác nhận xóa. Kết quả mong đợi: HTTP **204 No Content**, thông báo **Đã xóa công thức.**, công thức biến mất khỏi danh sách.
5. Trong từng thư mục `backend` và `frontend`, chạy `pnpm test`, `pnpm lint`, `pnpm build`.
6. Để tái hiện đúng ảnh tích hợp, sau khi có log và `checks.json` đi kèm, chạy từ root:

```powershell
node --import ./backend/node_modules/tsx/dist/loader.mjs docs/reports/huynh-thanh/evidence/fr-rcp-007-verified/verify.mts
```

Script sử dụng cấu hình local từ `backend/.env`, schema PostgreSQL tạm riêng và dữ liệu do script tạo; khởi động Express với route/auth/handler thật, Vite tại `127.0.0.1:5187`, Chromium và worker cleanup thật. Script tái sử dụng helper `backend/tests/support/ingredientIntegration.ts`; schema tạm được dọn sau khi chạy. API không bị chặn hoặc thay response bằng mock. Đây là môi trường tích hợp dành cho kiểm thử, chưa phải xác nhận deployment production hay quy trình áp dụng migration production.

**Kết quả đã chạy:**

| Kiểm tra | Backend | Frontend |
|---|---|---|
| `pnpm test` | **PASS — 21 files, 218 tests**, có coverage | **PASS — 18 files, 163 tests** |
| `pnpm lint` | **PASS — 0 errors, 196 warnings** | **PASS — không có lỗi/cảnh báo ESLint** |
| `pnpm build` | **PASS — TypeScript** | **PASS — TypeScript + Vite** |
| Prisma | **Generate PASS; Validate PASS** | Không áp dụng |

Frontend build còn cảnh báo chunk lớn hơn 500 kB. Log PowerShell có thể hiện `NativeCommandError` khi pnpm ghi banner vào stderr; exit code của cả sáu lệnh test/lint/build đều bằng **0**, được lưu trong [checks.json](https://github.com/gsb-b60/culinaryblog/blob/50506fe54126713a12009a3f8e440b8e58efde5e/docs/reports/huynh-thanh/evidence/fr-rcp-007-verified/checks.json).

| Kịch bản tích hợp thật | Kết quả |
|---|---|
| Hủy xác nhận | Công thức vẫn tồn tại trong PostgreSQL. |
| Chưa đăng nhập | DELETE trả **401**. |
| Author khác xóa công thức của owner | DELETE trả **403**, công thức vẫn tồn tại. |
| Owner xác nhận xóa qua UI | DELETE trả **204**, body rỗng; UI hiện thông báo thành công. |
| Cascade dữ liệu | Recipe, step, ingredient, image của fixture đều còn **0 bản ghi**. |
| Outbox | Tạo **4 cleanup tasks** cho ảnh original, medium, thumbnail và ảnh step. |
| Worker cleanup | **4 jobs completed**, outbox được xử lý, cả **4 object MinIO không còn tồn tại** qua HeadObject. |
| Xóa lại ID vừa xóa | DELETE trả **404**. |
| Admin xóa công thức của Author khác | DELETE trả **204**. |

Dữ liệu gốc: [result.json](https://github.com/gsb-b60/culinaryblog/blob/50506fe54126713a12009a3f8e440b8e58efde5e/docs/reports/huynh-thanh/evidence/fr-rcp-007-verified/result.json).

Log đầy đủ: [backend test](https://github.com/gsb-b60/culinaryblog/blob/50506fe54126713a12009a3f8e440b8e58efde5e/docs/reports/huynh-thanh/evidence/fr-rcp-007-verified/backend-test.log), [frontend test](https://github.com/gsb-b60/culinaryblog/blob/50506fe54126713a12009a3f8e440b8e58efde5e/docs/reports/huynh-thanh/evidence/fr-rcp-007-verified/frontend-test.log), [backend lint](https://github.com/gsb-b60/culinaryblog/blob/50506fe54126713a12009a3f8e440b8e58efde5e/docs/reports/huynh-thanh/evidence/fr-rcp-007-verified/backend-lint.log), [frontend lint](https://github.com/gsb-b60/culinaryblog/blob/50506fe54126713a12009a3f8e440b8e58efde5e/docs/reports/huynh-thanh/evidence/fr-rcp-007-verified/frontend-lint.log), [backend build](https://github.com/gsb-b60/culinaryblog/blob/50506fe54126713a12009a3f8e440b8e58efde5e/docs/reports/huynh-thanh/evidence/fr-rcp-007-verified/backend-build.log), [frontend build](https://github.com/gsb-b60/culinaryblog/blob/50506fe54126713a12009a3f8e440b8e58efde5e/docs/reports/huynh-thanh/evidence/fr-rcp-007-verified/frontend-build.log), [Prisma generate](https://github.com/gsb-b60/culinaryblog/blob/50506fe54126713a12009a3f8e440b8e58efde5e/docs/reports/huynh-thanh/evidence/fr-rcp-007-verified/prisma-generate.log), [Prisma validate](https://github.com/gsb-b60/culinaryblog/blob/50506fe54126713a12009a3f8e440b8e58efde5e/docs/reports/huynh-thanh/evidence/fr-rcp-007-verified/prisma-validate.log).

---

## 7. Screenshot minh chứng thành công (BẮT BUỘC)

Ba ảnh đầu là screenshot trực tiếp từ trình duyệt chạy frontend và API thật. Hai ảnh cuối là ảnh chụp trang hiển thị kết quả JSON và log thực tế đã lưu, dùng để đọc bằng chứng; không phải ảnh Scalar hay ảnh cửa sổ terminal.

**Ảnh 1 — Trang xóa công thức, fixture thật của Huỳnh Thành 2312748:**

![Danh sách công thức từ API và PostgreSQL thật](https://raw.githubusercontent.com/gsb-b60/culinaryblog/50506fe54126713a12009a3f8e440b8e58efde5e/docs/reports/huynh-thanh/evidence/fr-rcp-007-verified/01-real-delete-list.png)

**Ảnh 2 — Bấm Xóa, hiển thị xác nhận và nút Hủy:**

![Xác nhận xóa vĩnh viễn công thức](https://raw.githubusercontent.com/gsb-b60/culinaryblog/50506fe54126713a12009a3f8e440b8e58efde5e/docs/reports/huynh-thanh/evidence/fr-rcp-007-verified/02-real-confirmation.png)

**Ảnh 3 — Xóa thành công, thông báo xanh và công thức đã biến mất:**

![UI thông báo Đã xóa công thức sau HTTP 204](https://raw.githubusercontent.com/gsb-b60/culinaryblog/50506fe54126713a12009a3f8e440b8e58efde5e/docs/reports/huynh-thanh/evidence/fr-rcp-007-verified/03-real-delete-success.png)

**Ảnh 4 — Kết quả HTTP 401/403/204/404, cascade DB và 4 job dọn ảnh thật:**

![Kết quả tích hợp API PostgreSQL Redis BullMQ và MinIO](https://raw.githubusercontent.com/gsb-b60/culinaryblog/50506fe54126713a12009a3f8e440b8e58efde5e/docs/reports/huynh-thanh/evidence/fr-rcp-007-verified/04-api-database-cleanup-results.png)

**Ảnh 5 — Output thực tế của test, lint và build; exit code đều bằng 0:**

![Log kiểm thử backend frontend lint và build](https://raw.githubusercontent.com/gsb-b60/culinaryblog/50506fe54126713a12009a3f8e440b8e58efde5e/docs/reports/huynh-thanh/evidence/fr-rcp-007-verified/05-checks-output.png)

---

## 8. Checklist

- [x] `pnpm lint` pass (backend + frontend); backend còn 196 warnings như mục 6.
- [x] `pnpm build` / `tsc` pass.
- [x] `pnpm test` pass — tổng cộng **381 tests**.
- [x] `pnpm prisma:generate` đã chạy vì có thay đổi `prisma/schema.prisma`.
- [x] Không bổ sung file `.env`, secrets, keys, token vào báo cáo/minh chứng.
- [ ] Code đã format Prettier (`pnpm format`) — chưa chạy format toàn bộ source trong lần kiểm chứng này.
- [x] Đã tự review code và đối chiếu kết quả trước khi chuẩn bị nội dung PR.
- [x] Không có `console.log` / debug code thừa được thêm vào source sản phẩm trong commit chức năng; script minh chứng in kết quả để kiểm tra.
- [x] Documentation và ảnh minh chứng đã cập nhật.

Báo cáo và ảnh mới nằm riêng tại `PR-FR-RCP-007-VERIFIED.md` và `evidence/fr-rcp-007-verified/`; bản `PR-FR-RCP-007.md`, file DOCX và ảnh cũ có sẵn được giữ nguyên.
