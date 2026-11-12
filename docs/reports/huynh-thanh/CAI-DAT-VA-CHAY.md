# Cài đặt và kiểm tra FR-RCP-009

Dùng nhánh `feat-frontend-add/delete/fix-ingredient-management`, nền master `1ed7022` ngày 21/10/2026. Không checkout snapshot cũ để kiểm tra bản hiện tại.

## 1. Backend và dịch vụ

Chạy PostgreSQL/Redis local; kiểm thử toàn bộ cần thêm MinIO/MailHog. Đối chiếu cổng với cấu hình thực tế (PostgreSQL trên máy đã kiểm tra là 5433). Docker Compose phải dùng image MinIO tải được; cấu hình CI có image ghim digest đã xác minh.

Trong thư mục backend:

```powershell
pnpm install --frozen-lockfile
if (-not (Test-Path -LiteralPath .env)) { Copy-Item .env.example .env }
pnpm prisma:generate
pnpm dev
```

Nếu đã có .env, giữ nguyên file và chỉ chỉnh các giá trị cần thiết: DATABASE_URL, REDIS_URL, JWT secrets, CORS_ORIGINS và S3/SMTP khi chạy test dịch vụ thật. Chỉ dùng `pnpm db:push` cho database phát triển mới cần khởi tạo. Không reset hoặc seed database đang dùng chung.

## 2. Frontend

Trong thư mục frontend, terminal khác:

```powershell
pnpm install --frozen-lockfile
if (-not (Test-Path -LiteralPath .env.local)) {
  Set-Content -Path .env.local -Encoding utf8 -Value 'VITE_API_BASE_URL=http://localhost:3000/api/v1'
}
pnpm dev
```

Nếu .env.local đã tồn tại, chỉ sửa VITE_API_BASE_URL và giữ các giá trị khác. Không commit các file env. Mở http://localhost:5173/dashboard/ingredients sau khi đăng nhập Author/Admin; Scalar ở http://localhost:3000/scalar.

## 3. Kiểm tra

- Backend: `pnpm test`, `pnpm lint`, `pnpm build`.
- Frontend: `pnpm test --maxWorkers=2`, `pnpm lint`, `pnpm build`.
- E2E nguyên liệu: trong frontend chạy `pnpm exec playwright install chromium`; sau đó trong backend chạy `pnpm test:e2e:ingredients`. Chromium của Playwright là mặc định.
- Nếu đã cài Edge, có thể chọn bằng PowerShell: `$env:E2E_BROWSER_CHANNEL = 'msedge'` trước lệnh E2E. Bỏ biến này để dùng Chromium mặc định.

E2E dùng dữ liệu thử trong schema riêng, tự dọn sau khi chạy và lưu ảnh/kết quả tại evidence/ingredients-master. Kiểm tra chọn công thức, chuyển trang, F5, tải lại sau mất kết nối, CRUD và dữ liệu trong PostgreSQL thật. Mô phỏng mất kết nối bằng cấu hình mạng của trình duyệt, không giả API hay dịch vụ.

[Chi tiết cấu hình dịch vụ và cô lập tài nguyên](../../../backend/TESTING_REAL_SERVICES.md).
