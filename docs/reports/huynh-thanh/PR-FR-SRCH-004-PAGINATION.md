## 1. Thông tin thành viên

| Họ tên | MSSV | Vai trò |
|---|---|---|
| Huỳnh Thành | 2312748 | Backend / Frontend |

---

## 2. FR name

**FR-SRCH-004 - Pagination**

Tài liệu: `docs/03-fr-misc.md`, mục 3.4 — Search & Pagination Module.

---

## 3. Issue name

**Issue #29 — FR-SRCH-004: Pagination**

**Link:** [docs/issues/person-3.md#issue-29--fr-srch-004-pagination](https://github.com/gsb-b60/culinaryblog/blob/feat-issue%2329--FR-SRCH-004-Pagination/docs/issues/person-3.md#issue-29--fr-srch-004-pagination)  
**Closes:** #37

---

## 4. Mô tả thay đổi

- Hoàn thiện phân trang dùng chung cho danh sách công thức và danh mục bằng `page`, `pageSize`; trả về `items` cùng `meta` chứa tổng bản ghi, tổng trang và cờ chuyển trang.
- Xử lý trang rỗng, trang cuối, thử lại sau lỗi tải và dữ liệu giảm làm trang hiện tại không còn hợp lệ; giữ đúng công thức khi mở nguyên liệu và xóa trạng thái cũ khi đổi tài khoản/quyền.
- Kết nối trang chủ, danh sách công khai và Tổng quan với API/database thật; bổ sung thống kê và 5 công thức cập nhật gần nhất theo phạm vi tài khoản.

**Các file chính thay đổi:**

- Backend: `paginationValidators.ts`, `recipeValidators.ts`, `categoryValidators.ts`.
- Backend: `RecipeRepository.ts`, `CategoryRepository.ts`, `recipeRoutes.ts`, `categoryRoutes.ts`.
- Backend: `GetRecipeOverviewQuery.ts`, `RecipeOverviewQueryHandler.ts`, `container.ts`, `openapi.ts`.
- Frontend: `RecipesPage.tsx`, `CategoriesPage.tsx`, `IngredientManagementPage.tsx`.
- Frontend: `HomePage.tsx`, `RecipesBrowsePage.tsx`, `DashboardPage.tsx`, `api.ts` và các hook/type liên quan.
- Kiểm thử: `pagination.test.ts`, `recipe-overview.test.ts`, `RecipeContext.regression.test.tsx`, `CategoriesPage.test.tsx`, `DashboardData.test.tsx` và các bài hồi quy liên quan.

**Hợp đồng phản hồi:**

```json
{
  "items": [],
  "meta": {
    "page": 1,
    "pageSize": 12,
    "totalCount": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

## 5. Phạm vi

- [x] backend
- [x] frontend
- [ ] prisma-DB (schema / migration / seed)
- [ ] infra-docker (docker-compose, nginx, redis, minio)
- [x] docs

**Layer (backend):**

- [ ] domain
- [x] application
- [x] infrastructure
- [x] presentation

---

## 6. Cách kiểm thử

1. Khởi động hạ tầng: `docker compose up -d`.
2. Backend: trong thư mục `backend`, chạy `pnpm install`, `pnpm prisma:generate`, `pnpm dev`. Sử dụng database đã có dữ liệu và cấu hình môi trường của dự án.
3. Frontend: trong thư mục `frontend`, chạy `pnpm install`, `pnpm dev`.
4. Kiểm tra Scalar tại http://localhost:3000/scalar hoặc gọi các API:
   - `GET /api/v1/recipes?page=1&pageSize=12` và trang 2: HTTP 200, dữ liệu không trùng nhau trên tập dữ liệu cố định.
   - `GET /api/v1/categories?page=2&pageSize=12`: HTTP 200 và metadata đúng.
   - `page=0` hoặc `pageSize=51`: HTTP 422.
   - Trang cuối trả phần dữ liệu còn lại; trang vượt phạm vi trả HTTP 200 với `items: []`.
   - `GET /api/v1/recipes/manage/overview` cần đăng nhập; Author xem dữ liệu của mình, Admin xem toàn hệ thống.
5. Kiểm tra frontend:
   - Công thức công khai: tìm kiếm, lọc danh mục, chuyển trang và mở chi tiết.
   - Danh sách quản lý: đổi 6/12/24/50 mục mỗi trang; đổi số lượng đưa về trang 1.
   - Mô phỏng lỗi tải trang rồi thử lại: không kẹt trạng thái tải.
   - Dữ liệu bị xóa làm số trang giảm: tự tải trang hợp lệ.
   - Mở Nguyên liệu từ danh sách 24/50 mục hoặc sau lỗi chuyển trang: giữ đúng ID công thức.
   - Đổi tài khoản/quyền: dữ liệu cũ bị xóa, yêu cầu cũ bị hủy; không nhận phản hồi muộn của tài khoản trước.
6. Trong từng thư mục `backend` và `frontend`, chạy `pnpm exec vitest run`.
7. Lint: `pnpm lint` trong cả hai thư mục. Kiểm tra kiểu backend bằng `pnpm exec tsc --noEmit`; build frontend bằng `pnpm build`.

**Kết quả đã xác nhận:**

| Kiểm tra | Kết quả |
|---|---|
| Backend — Vitest | 290/290 bài đạt |
| Frontend — Vitest | 240/240 bài đạt |
| Backend — TypeScript | Đạt |
| Frontend — build | Đạt |
| Frontend — lint | Đạt |
| Backend — lint | 0 lỗi; còn 196 cảnh báo |

Kiểm thử sử dụng `vitest run`; chưa đo coverage trong lượt xác nhận này. Chưa chạy Prettier toàn dự án.

**Đối chiếu dữ liệu thật trên trình duyệt:**

- Công khai: 194 công thức đã xuất bản, 20 danh mục.
- Chef Nguyễn: 40 công thức thuộc tài khoản.
- Admin: 196 công thức, gồm 194 đã xuất bản và 2 đã lưu trữ.

---

## 7. Screenshot minh chứng thành công (BẮT BUỘC)

**Ảnh 1 — Danh sách công khai lấy dữ liệu thật và phân trang 194 công thức:**

![Danh sách công khai và phân trang](https://raw.githubusercontent.com/gsb-b60/culinaryblog/refs/heads/feat-issue%2329--FR-SRCH-004-Pagination/docs/reports/huynh-thanh/evidence/fr-srch-004-pagination/01-public-pagination.png)

**Ảnh 2 — Tổng quan Admin với thống kê toàn hệ thống:**

![Tổng quan Admin](https://raw.githubusercontent.com/gsb-b60/culinaryblog/refs/heads/feat-issue%2329--FR-SRCH-004-Pagination/docs/reports/huynh-thanh/evidence/fr-srch-004-pagination/02-admin-overview.png)

**Ảnh 3 — Tổng quan tác giả với 40 công thức thuộc tài khoản:**

![Tổng quan tác giả](https://raw.githubusercontent.com/gsb-b60/culinaryblog/refs/heads/feat-issue%2329--FR-SRCH-004-Pagination/docs/reports/huynh-thanh/evidence/fr-srch-004-pagination/03-author-overview.png)

**Ảnh 4 — Đối chiếu phản hồi API phân trang, trang cuối, trang vượt phạm vi và validation:**

![Kiểm tra API phân trang](https://raw.githubusercontent.com/gsb-b60/culinaryblog/refs/heads/feat-issue%2329--FR-SRCH-004-Pagination/docs/reports/huynh-thanh/evidence/fr-srch-004-pagination/04-api-verification.png)

**Ảnh 5 — Log kiểm thử, lint và build:**

![Kết quả kiểm thử và kiểm tra mã nguồn](https://raw.githubusercontent.com/gsb-b60/culinaryblog/refs/heads/feat-issue%2329--FR-SRCH-004-Pagination/docs/reports/huynh-thanh/evidence/fr-srch-004-pagination/05-validation.png)

Log gốc và dữ liệu đối chiếu được lưu tại `docs/reports/huynh-thanh/evidence/fr-srch-004-pagination/`.

---

## 8. Checklist

- [x] `pnpm lint` pass (backend + frontend): backend còn cảnh báo, không có lỗi.
- [x] `pnpm build` / `tsc` pass.
- [x] Bộ kiểm thử pass bằng `vitest run`: backend 290, frontend 240.
- [x] Đã xác nhận không đổi `prisma/schema.prisma`; không phát sinh yêu cầu generate/migration do thay đổi này.
- [x] Không thêm `.env`, secrets, keys hoặc token vào bộ thay đổi/bộ minh chứng.
- [ ] Code đã format Prettier toàn dự án (`pnpm format`).
- [x] Đã tự review code trước khi chuẩn bị PR.
- [x] Không thêm `console.log` / debug code thừa vào mã ứng dụng.
- [x] Documentation / comment và minh chứng đã cập nhật.
