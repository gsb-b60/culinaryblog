# PR — Fix đồng bộ URL phân trang công thức

## 1. Thông tin thành viên

| Họ tên | MSSV | Vai trò |
|---|---|---|
| Nguyễn Huỳnh Thanh | 2312748 | Fullstack (Backend / Frontend) |

---

## 2. FR name

**FR-SRCH-004 — Pagination**

Tài liệu tham chiếu: `docs/03-fr-misc.md`, mục FR-SRCH-004.

---

## 3. Issue name

**Issue #29 — FR-SRCH-004: Pagination**

**Link:** `docs/issues/person-3.md#issue-29--fr-srch-004-pagination`  
**Related:** GitHub #37  
**Closes:** N/A — Issue chức năng chính đã hoàn thành; PR này sửa lỗi hồi quy và bổ sung kiểm thử URL phân trang.

---

## 4. Mô tả thay đổi

Sửa lỗi giao diện hiển thị trang 1 nhưng URL vẫn giữ giá trị `page` không hợp lệ, ví dụ `?page=-1`, `?page=0` hoặc `?page=abc`.

- Chuẩn hóa giá trị `page`: mọi giá trị không phải số nguyên dương được thay bằng `page=1` trên URL.
- Khi `page` lớn hơn tổng số trang, URL được chuyển về trang cuối có dữ liệu.
- Giữ nguyên các query parameter khác như sắp xếp, từ khóa và bộ lọc.
- Bổ sung test hồi quy cho các trường hợp page không hợp lệ và page vượt giới hạn.
- Sửa lỗi backend khởi tạo `CategoryRepository` với biến `categoryCache` chưa khai báo, khiến API danh mục và danh sách công thức trả HTTP 500.
- Thay image MinIO không thể pull từ Quay bằng Silo tương thích S3 cho môi trường Docker local.

**Các file chính thay đổi:**

- `frontend/src/pages/RecipesBrowsePage.tsx`
- `frontend/src/test/static-blog.test.tsx`
- `backend/src/presentation/di/container.ts`
- `docker-compose.yml`

---

## 5. Phạm vi

- [x] backend
- [x] frontend
- [ ] prisma-DB (schema / migration / seed)
- [x] infra-docker (docker-compose, nginx, redis, minio)
- [x] docs

**Layer (backend):**

- [ ] domain
- [ ] application
- [ ] infrastructure
- [x] presentation

---

## 6. Cách kiểm thử

1. Khởi động hạ tầng:

   ```powershell
   cd E:\web\culinaryblog
   docker compose up -d
   ```

2. Khởi động backend:

   ```powershell
   cd E:\web\culinaryblog\backend
   pnpm dev
   ```

3. Khởi động frontend:

   ```powershell
   cd E:\web\culinaryblog\frontend
   pnpm dev
   ```

4. Mở các URL sau bằng guest:

   ```text
   http://localhost:5173/recipes?page=-1
   http://localhost:5173/recipes?page=0
   http://localhost:5173/recipes?page=abc
   http://localhost:5173/recipes?page=999
   ```

5. Kết quả mong đợi:

   - `page=-1`, `page=0`, `page=abc` tự đổi thành `?page=1`.
   - `page=999` tự đổi thành trang cuối hiện có.
   - URL và nội dung hiển thị đồng nhất.
   - API danh mục và danh sách công thức trả HTTP 200.

6. Chạy test frontend:

   ```powershell
   cd E:\web\culinaryblog\frontend
   pnpm test -- --run src/test/static-blog.test.tsx
   ```

---

## 7. Kết quả kiểm thử đã xác minh

| Hạng mục | Kết quả |
|---|---|
| `GET /health/live` | HTTP 200 |
| `GET /api/v1/categories?page=1&pageSize=50` | HTTP 200 |
| `GET /api/v1/recipes?page=1&pageSize=12&sort=-createdAt` | HTTP 200 |
| `?page=-1` | URL tự đổi thành `?page=1` |
| `?page=999` | URL tự đổi thành `?page=7`, giao diện hiển thị `Trang 7/7 · 82 công thức` |
| Frontend regression test | 1 file passed, 18 tests passed |
| Backend TypeScript build | Pass (`pnpm build`) |
| Docker Compose | Cấu hình hợp lệ; MinIO/Silo container healthy |

---

## 8. Screenshot minh chứng thành công

> Trước khi tạo PR, dán các ảnh chụp bên dưới vào GitHub để GitHub tự upload và thay `dán_ảnh_...` bằng URL ảnh tạo ra.

### 8.1. URL `page=-1` được chuẩn hóa về `page=1`

![page=-1 tự chuyển về page=1](dán_ảnh_page_1_vào_đây)

**Kết quả cần thấy:** thanh địa chỉ là `http://localhost:5173/recipes?page=1` và danh sách công thức của trang 1 được hiển thị.

### 8.2. URL `page=999` được chuyển về trang cuối

![page=999 tự chuyển về trang cuối](dán_ảnh_trang_cuối_vào_đây)

**Kết quả cần thấy:** thanh địa chỉ là `http://localhost:5173/recipes?page=7` và giao diện hiển thị `Trang 7/7 · 82 công thức`.

### 8.3. Frontend test pass

![18 frontend tests passed](dán_ảnh_test_vào_đây)

**Kết quả cần thấy:** `Test Files 1 passed`, `Tests 18 passed`.

### 8.4. MinIO/Silo hoạt động

![MinIO Silo healthy](dán_ảnh_docker_vào_đây)

**Kết quả cần thấy:** container `lethimcook-minio` có trạng thái `healthy`.

---

## 9. Checklist

- [ ] `pnpm lint` pass (backend + frontend)
- [x] `pnpm build` / `tsc` pass cho backend
- [x] `pnpm test -- --run src/test/static-blog.test.tsx` pass: 18 tests
- [ ] `pnpm prisma:generate` đã chạy nếu đổi `prisma/schema.prisma` (không đổi schema)
- [x] Không commit file `.env`, secrets, keys hoặc token
- [ ] Code đã format Prettier (`pnpm format`)
- [x] Đã tự review code trước khi tạo PR
- [x] Không có `console.log` / debug code thừa
- [x] Documentation / comment đã cập nhật

---

## 10. Commit trong branch

```text
4c74ba3 fix(frontend): normalize invalid recipe page URLs
6c7fbd8 fix(backend): remove undefined category cache dependency
f7cfaf4 fix(infra): use S3-compatible image for local storage
```
