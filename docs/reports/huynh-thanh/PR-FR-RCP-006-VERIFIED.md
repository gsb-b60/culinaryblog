## 1. Thông tin thành viên

| Họ tên | MSSV | Vai trò |
|---|---|---|
| Huỳnh Thành | 2312748 | Backend / Frontend |

---

## 2. FR name

**FR-RCP-006 - Archive Recipe**

Nguồn: [docs/03-fr-recipes.md §FR-RCP-006](https://github.com/gsb-b60/culinaryblog/blob/64f9a249e174bfd3136b97bbd3117033fee75e8f/docs/03-fr-recipes.md#fr-rcp-006-archive-recipe).

Tên requirement trong bảng SRS là “Archive Recipe (Archive / Unarchive)”. PR này triển khai luồng Archive theo issue, chưa bổ sung endpoint Unarchive.

---

## 3. Issue name

**Issue #23 — FR-RCP-006: Archive Recipe**

**Link:** [docs/issues/person-3.md#issue-23--fr-rcp-006-archive-recipe](https://github.com/gsb-b60/culinaryblog/blob/64f9a249e174bfd3136b97bbd3117033fee75e8f/docs/issues/person-3.md#issue-23--fr-rcp-006-archive-recipe)

**Closes:** #32 — [GitHub issue Archive Recipe](https://github.com/gsb-b60/culinaryblog/issues/32)

**#23** là số thứ tự trong tài liệu; **#32** là số issue trên GitHub.

Branch: `feat/issue-32-archive-recipe`.

Source kiểm chứng: working tree dựa trên commit `64f9a249e174bfd3136b97bbd3117033fee75e8f`, có chỉnh format ở `RecipeQueryHandlers.ts` và `RecipeDetailPage.test.tsx`. Hash từng file source được lưu trong `source-manifest.json`.

Ngày kiểm chứng: **28/10/2026**, múi giờ America/Los_Angeles.

---

## 4. Mô tả thay đổi

Hoàn thiện lưu trữ công thức cho chủ sở hữu/Admin: chuyển Draft hoặc Published sang ARCHIVED, giữ nguyên dữ liệu và ẩn khỏi các API danh sách công khai, danh mục và tìm kiếm. Bổ sung thao tác Lưu trữ, badge trạng thái và xem chi tiết có xác thực; sửa lỗi phân trang/lọc thời gian trả 422 với query số hợp lệ.

Các file chính thay đổi:

| File / nhóm file | Nội dung |
|---|---|
| `backend/src/application/commands/recipes/RecipeCommands.ts` | Command Archive nhận quyền Admin và trả DTO công thức. |
| `backend/src/application/handlers/RecipeStatusCommandHandlers.ts` | Kiểm tra owner/Admin, archive idempotent, cập nhật version/timestamp, chống ghi đè đồng thời và invalidation cache. |
| `backend/src/application/handlers/RecipeQueryHandlers.ts` | Nối query đọc; chỉ trả Published ở public list/search/category; owner/Admin được xem chi tiết riêng tư. |
| `backend/src/application/validators/recipeValidators.ts` | Parse số từ URL; từ chối giá trị rỗng, lặp và không hợp lệ. |
| `backend/src/presentation/di/container.ts`, `routes/recipeRoutes.ts`, `routes/categoryRoutes.ts` | Đăng ký handler và nối endpoint với quyền lấy từ phiên đăng nhập. |
| `backend/src/presentation/docs/openapi.ts` | Cập nhật response và mã lỗi Archive. |
| `frontend/src/pages/RecipesPage.tsx` | Nút Lưu trữ, cập nhật badge, khóa thao tác khi đang gửi và link Xem chi tiết. |
| `frontend/src/pages/RecipeDetailPage.tsx` | Đọc API thật với token, phân biệt 403/404/lỗi kết nối, hỗ trợ retry và bỏ phản hồi cũ khi đổi tài khoản/slug. |
| `frontend/src/lib/api.ts`, `hooks/useRecipes.ts`, `types/recipe.ts` | API Archive/Detail, hủy request và khai báo bộ lọc. |
| `backend/tests/recipe-status.test.ts`, `frontend/src/test/RecipeDetailPage.test.tsx`, `RecipesPage.test.tsx`, `static-blog.test.tsx` | Test quyền, chuyển trạng thái, public visibility, query số và luồng UI. |
| `docs/archive-recipe.md`, báo cáo và thư mục evidence | Tài liệu sử dụng, script tái hiện, ảnh và log kiểm chứng. |

**Quy tắc trạng thái:** Draft/Published → Archived; lặp Archive trả 200 và không tăng version; Archived không được Publish/Unpublish (422). Archive giữ lịch sử publishedAt và dữ liệu con. Lỗi đồng thời trả 409, không tồn tại/đã xóa trả 404, sai quyền trả 403, chưa xác thực trả 401.

**Giới hạn:** trang danh sách công khai vẫn dùng dữ liệu mẫu có sẵn. Việc ẩn dữ liệu thật sau Archive được kiểm chứng trên các API public list/search/category. Trang chi tiết đã sử dụng API thật. Create/Update/Steps không nằm trong phạm vi PR này.

---

## 5. Phạm vi

- [x] backend
- [x] frontend
- [ ] prisma-DB (không đổi schema / migration / seed)
- [ ] infra-docker (không đổi docker-compose, nginx, redis, minio)
- [x] docs

**Layer (backend):**

- [ ] domain
- [x] application
- [ ] infrastructure (tái sử dụng repository và Redis service hiện có)
- [x] presentation

---

## 6. Cách kiểm thử

1. Nếu chưa có hạ tầng, chạy `docker compose up -d`. Máy kiểm chứng dùng PostgreSQL Docker publish cổng **5433**, Redis **6379**; điều chỉnh cấu hình local theo môi trường thực tế.
2. Backend: vào `backend`, chạy `pnpm install`, `pnpm prisma:generate`, chuẩn bị DB phát triển nếu cần bằng `pnpm db:push`, rồi `pnpm dev`. PR này không thay đổi schema.
3. Frontend: vào `frontend`, chạy `pnpm install`, cấu hình `VITE_API_BASE_URL` trỏ tới backend rồi `pnpm dev`.
4. Đăng nhập Author → Dashboard → Công thức → Danh sách công thức → Lưu trữ một công thức. Mong đợi HTTP **200**, badge **Đã lưu trữ**, trạng thái vẫn đúng sau tải lại.
5. Bấm **Xem chi tiết**: owner/Admin vẫn xem được nguyên liệu, bước thực hiện. API list/search/category không trả công thức vừa lưu trữ; Author khác nhận 403 khi archive hoặc xem chi tiết riêng tư.
6. Trong từng thư mục `backend` và `frontend`, chạy `pnpm test`, `pnpm lint`, `pnpm build`. Scalar UI nằm tại `/scalar` trên origin backend đang cấu hình; mặc định frontend API client trỏ tới `http://localhost:5000/api/v1`.
7. Tái hiện đúng bộ ảnh này từ root:

```powershell
node docs/reports/huynh-thanh/evidence/fr-rcp-006-verified/checks.mjs
node --import ./backend/node_modules/tsx/dist/loader.mjs docs/reports/huynh-thanh/evidence/fr-rcp-006-verified/verify.mts
```

Script minh chứng sử dụng helper tích hợp có sẵn, tạo **schema PostgreSQL riêng** và dữ liệu thử, chạy route/Passport/JWT/command/query/repository thật, kiểm tra Redis thật, khởi động Vite tại `127.0.0.1:5187` và chụp Chromium headless. API không bị mock. Schema thử và các process do script khởi động được dọn sau khi chạy. Bản ghi ảnh trong DB là URL fixture, không upload file vào MinIO vì Archive không xóa ảnh.

**Kết quả lệnh thực tế** — cả sáu lệnh có exit code **0**:

| Kiểm tra | Backend | Frontend |
|---|---|---|
| `pnpm test` | **264 tests / 22 files PASS**, gồm integration thật; coverage lines **90.63%** | **209 tests / 22 files PASS** |
| `pnpm lint` | **PASS — 0 errors, 196 warnings** | **PASS — không có lỗi/cảnh báo ESLint** |
| `pnpm build` | **PASS — TypeScript** | **PASS — TypeScript + Vite** |

Frontend build còn cảnh báo bundle lớn hơn 500 kB. Backend lint pass theo exit code nhưng **chưa sạch warnings**.

| Kịch bản tích hợp Archive thật | Kết quả |
|---|---|
| UI Archive công thức Published | 200; status ARCHIVED; badge/thông báo thành công |
| Tải lại trang | Vẫn ARCHIVED |
| Lặp Archive | 200; không tăng version |
| Public list / search / category | Đều 200, không còn công thức đã lưu trữ |
| Owner / Admin xem chi tiết | 200 |
| Author khác / guest xem chi tiết riêng tư | 403 |
| Chưa xác thực / Author khác Archive | 401 / 403 |
| Công thức không tồn tại | 404 |
| Admin Archive công thức của Author khác | 200 |
| PostgreSQL sau Archive | Bản ghi còn, isDeleted=false; giữ 3 nguyên liệu, 1 bước và 1 ảnh |
| Redis | Marker cache recipes và categories đã bị invalidated |
| Query số hợp lệ / không hợp lệ | 200 / 422 |

Log gốc: [checks.json](https://github.com/gsb-b60/culinaryblog/blob/feat/issue-32-archive-recipe/docs/reports/huynh-thanh/evidence/fr-rcp-006-verified/checks.json), [backend-test.log](https://github.com/gsb-b60/culinaryblog/blob/feat/issue-32-archive-recipe/docs/reports/huynh-thanh/evidence/fr-rcp-006-verified/backend-test.log), [frontend-test.log](https://github.com/gsb-b60/culinaryblog/blob/feat/issue-32-archive-recipe/docs/reports/huynh-thanh/evidence/fr-rcp-006-verified/frontend-test.log), [backend-lint.log](https://github.com/gsb-b60/culinaryblog/blob/feat/issue-32-archive-recipe/docs/reports/huynh-thanh/evidence/fr-rcp-006-verified/backend-lint.log), [frontend-lint.log](https://github.com/gsb-b60/culinaryblog/blob/feat/issue-32-archive-recipe/docs/reports/huynh-thanh/evidence/fr-rcp-006-verified/frontend-lint.log), [backend-build.log](https://github.com/gsb-b60/culinaryblog/blob/feat/issue-32-archive-recipe/docs/reports/huynh-thanh/evidence/fr-rcp-006-verified/backend-build.log), [frontend-build.log](https://github.com/gsb-b60/culinaryblog/blob/feat/issue-32-archive-recipe/docs/reports/huynh-thanh/evidence/fr-rcp-006-verified/frontend-build.log).

Chi tiết tích hợp: [result.json](https://github.com/gsb-b60/culinaryblog/blob/feat/issue-32-archive-recipe/docs/reports/huynh-thanh/evidence/fr-rcp-006-verified/result.json). Hash source: [source-manifest.json](https://github.com/gsb-b60/culinaryblog/blob/feat/issue-32-archive-recipe/docs/reports/huynh-thanh/evidence/fr-rcp-006-verified/source-manifest.json).

---

## 7. Screenshot minh chứng thành công (BẮT BUỘC)

Ảnh chụp từ UI/API thật và báo cáo tổng hợp log thực thi. Link GitHub sẽ hoạt động sau khi thư mục evidence được commit/push lên branch `feat/issue-32-archive-recipe`; file PNG local đã có sẵn.

**Ảnh 1. Trước khi lưu trữ: công thức Published và nút Lưu trữ.**

![Trước khi lưu trữ](https://github.com/gsb-b60/culinaryblog/blob/feat/issue-32-archive-recipe/docs/reports/huynh-thanh/evidence/fr-rcp-006-verified/01-before-archive.png?raw=true)

**Ảnh 2. Sau thao tác thật: HTTP 200, thông báo thành công và badge Đã lưu trữ.**

![Lưu trữ thành công](https://github.com/gsb-b60/culinaryblog/blob/feat/issue-32-archive-recipe/docs/reports/huynh-thanh/evidence/fr-rcp-006-verified/02-archive-success.png?raw=true)

**Ảnh 3. Owner xem chi tiết công thức đã lưu trữ, giữ nguyên nguyên liệu và bước thực hiện.**

![Owner xem chi tiết](https://github.com/gsb-b60/culinaryblog/blob/feat/issue-32-archive-recipe/docs/reports/huynh-thanh/evidence/fr-rcp-006-verified/03-owner-archived-detail.png?raw=true)

**Ảnh 4. Response JSON thật từ GET chi tiết: ARCHIVED và dữ liệu liên quan.**

![Response API thật](https://github.com/gsb-b60/culinaryblog/blob/feat/issue-32-archive-recipe/docs/reports/huynh-thanh/evidence/fr-rcp-006-verified/04-live-api-response.png?raw=true)

**Ảnh 5. Báo cáo kiểm tra HTTP, PostgreSQL và Redis thật.**

![Kiểm tra tích hợp thật](https://github.com/gsb-b60/culinaryblog/blob/feat/issue-32-archive-recipe/docs/reports/huynh-thanh/evidence/fr-rcp-006-verified/05-http-database-cache-checks.png?raw=true)

**Ảnh 6. Ảnh tổng hợp output test/lint/build đã thực thi; log gốc được đính kèm ở mục 6.**

![Kết quả test lint build](https://github.com/gsb-b60/culinaryblog/blob/feat/issue-32-archive-recipe/docs/reports/huynh-thanh/evidence/fr-rcp-006-verified/06-tests-lint-build.png?raw=true)

---

## 8. Checklist

- [x] `pnpm lint` pass (backend + frontend); backend còn 196 warnings, không có errors.
- [x] `pnpm build` / `tsc` pass.
- [x] `pnpm test` pass, gồm bộ integration backend thật.
- [ ] `pnpm prisma:generate` đã chạy nếu đổi `prisma/schema.prisma` — không áp dụng, schema không đổi.
- [x] Không đưa file `.env`, secrets, keys hoặc giá trị token vào artifact minh chứng.
- [ ] Code đã format toàn bộ bằng `pnpm format` — chưa chạy toàn backend; lượt minh chứng chỉ format `RecipeQueryHandlers.ts` và `RecipeDetailPage.test.tsx` bằng Prettier.
- [x] Đã tự review code và bổ sung test cho hai lỗi được phát hiện.
- [x] Không thêm `console.log` / debug code thừa trong mã ứng dụng; script evidence có in kết quả chạy.
- [x] Documentation / comment đã cập nhật.

Báo cáo và ảnh được chuẩn bị local; chưa tạo/publish PR và chưa push các artifact minh chứng.
