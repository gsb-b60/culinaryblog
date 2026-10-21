# Cài đặt và chạy các feat của Huỳnh Thanh

Báo cáo ngày 14/10/2026. Frontend thực tế là **React + Vite**, backend **Express + TypeScript**, database **PostgreSQL/Prisma**, cache/queue **Redis/BullMQ**, storage **MinIO**. Một số mô tả Next.js/cổng trong README gốc đã cũ; hướng dẫn dưới đây đối chiếu mã nguồn.

## 1. Chuẩn bị và lấy đúng mã

Cài Git, Node.js tương thích engines của các dependency (máy demo hiện dùng Node v24.21.0), pnpm theo `packageManager` trong package.json, Docker Desktop nếu chạy hạ tầng bằng container. Kiểm tra `node --version`, `pnpm --version`, `docker compose version`. Vite 8 cần bản Node tương thích; không chỉ dựa vào yêu cầu Node >=20 của backend.

```powershell
git clone https://github.com/gsb-b60/culinaryblog.git
cd culinaryblog
git fetch origin
```

Để chạy từng feat, checkout **commit/nhánh được ghi trong báo cáo riêng** trước khi cài dependency. Có thể dùng clone riêng cho mỗi feat. Không checkout chồng khi có thay đổi chưa lưu.

| Feat | Commit chụp demo | Nhánh local đã xác định |
|---|---|---|
| FR-RCP-005 | `aa0ecc6` | `feat-Issue#22-FR-RCP-005-Publish/Unpulish-Recipe` |
| FR-RCP-006 | `1fa926b` | `feat-Issue#23-FR-RCP-006-Archive-Recipe` |
| FR-RCP-007 | `3b3285e` | `feat-Issue#24-FR-RCP-007-Delete-Recipe` |
| FR-RCP-009 | `c43d091` | `feat-frontend-add/delete/fix-ingredient-management` |
| FR-RCP-010 | `423407a` | `Issue#26-FR-RCP-010-Step-Management(CRUD)` |
| FR-SRCH-002 | `c620451` | `feat-Issue#27-FR-SRCH-002-Filtering-Recipe` |

Sắp xếp và phân trang đối chiếu cùng snapshot `c620451`, không có nhánh triển khai riêng được xác định. Commit có trong clone local tại lúc lập báo cáo; nếu máy khác chưa fetch được commit, lấy đúng nhánh từ người phụ trách, không tự coi master đã chứa feat.

## 2. Hạ tầng

Từ thư mục gốc:

```powershell
docker compose up -d postgres redis minio mailhog
docker compose ps
```

Nếu PostgreSQL/Redis đã có sẵn ở cổng đang cấu hình thì dùng dịch vụ hiện có và cấu hình đúng, tránh khởi chạy trùng cổng. Compose của từng nhánh có thể khác credentials; đối chiếu environment của service với DATABASE_URL.

| Dịch vụ | Địa chỉ mặc định |
|---|---|
| PostgreSQL | localhost:5433 ở nhánh báo cáo hiện tại; kiểm tra mapping từng nhánh |
| Redis | localhost:6379 |
| MinIO API / Console | localhost:9000 / localhost:9001 |
| Mailhog SMTP / UI | localhost:1025 / localhost:8025 |

MinIO cần cho xác minh dọn ảnh thật của feat xóa. Bucket phải tồn tại và quyền upload/delete phải hợp lệ. Các màn hình đọc dữ liệu không chứng minh storage đã hoạt động.

## 3. Backend

```powershell
cd backend
pnpm install
Copy-Item .env.example .env
```

Chỉ copy khi chưa có .env. Chỉnh cấu hình trên máy; không commit file này:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/lethimcook?schema=public
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=replace-with-a-local-secret-at-least-32-characters
JWT_REFRESH_SECRET=replace-with-another-secret-at-least-32-characters
CORS_ORIGINS=http://localhost:5173
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=lethimcook
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_REGION=us-east-1
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@lethimcook.local
```

postgres/postgres và minioadmin chỉ là giá trị local trong cấu hình đã đối chiếu; thay nếu dịch vụ của bạn khác. JWT secrets bắt buộc từ 32 ký tự. SMTP_USER/SMTP_PASS để trống hoặc bỏ nếu dùng Mailhog không xác thực. Google OAuth không bắt buộc để demo các feat bằng email/mật khẩu; chỉ điền khi đã có client hợp lệ.

Với **database mới dùng riêng cho demo**:

```powershell
pnpm prisma:generate
pnpm exec prisma migrate deploy
pnpm prisma:seed
pnpm dev
```

Nếu branch chưa có migration đầy đủ, đối chiếu schema và dùng `pnpm db:push` trên database demo mới thay cho migrate deploy. Không chạy seed mặc định trên database đang dùng chung: seed có thể thay đổi dữ liệu. Database đã tạo bằng db push cần xử lý baseline/diff trước khi migrate; không dùng reset để chạy báo cáo. Feat xóa cần bảng `file_cleanup_tasks` và client Prisma được sinh theo schema của nhánh.

Trên Windows, dừng tiến trình đang dùng Prisma trước khi generate nếu DLL bị khóa. Không dừng server của người khác đang dùng chung workspace.

## 4. Frontend

Mở terminal khác tại gốc repo:

```powershell
cd frontend
pnpm install
Set-Content -Path .env.local -Encoding utf8 -Value 'VITE_API_BASE_URL=http://localhost:3000/api/v1'
pnpm dev
```

Nếu đã có .env.local, chỉ sửa VITE_API_BASE_URL và giữ các cấu hình khác. Frontend chạy `http://localhost:5173`, strictPort không tự đổi cổng. API client mặc định nhiều nhánh dùng cổng 5000, trong khi backend/.env.example dùng 3000; vì vậy phải cấu hình rõ như trên. Restart Vite sau khi sửa env.

## 5. Dữ liệu và tài khoản demo

Seed tại repo tạo tài khoản Admin `admin@lethimcook.com` / `Admin@123`; chỉ dùng local. Nếu tài khoản đã đổi mật khẩu, dùng tài khoản thật bạn có quyền truy cập. Author chỉ được quản lý công thức của mình; đăng ký user mới không đồng nghĩa có sẵn công thức.

Cần công thức có nguyên liệu/bước nấu để demo CRUD; Draft có ít nhất một bước để publish; nhiều hơn 12 công thức Published để nhìn rõ phân trang. Ảnh báo cáo dùng dữ liệu hiện có, không tự seed lại database.

## 6. Kiểm tra

Tại backend:

```powershell
pnpm exec tsc --noEmit
pnpm build
pnpm lint
pnpm exec vitest run --coverage=false
```

Tại frontend:

```powershell
pnpm build
pnpm lint
pnpm test
```

Backend `pnpm test` bật coverage; test case pass không đồng nghĩa lệnh đạt khi coverage dưới ngưỡng. Lệnh `--coverage=false` chỉ tách việc kiểm tra test case, không chứng nhận coverage. Các báo cáo riêng ghi lệnh test theo feat và giới hạn xác minh.

E2E Playwright chỉ ở nhánh lọc, cần dependency đã cài, Edge hoặc Chromium:

```powershell
cd frontend
$env:E2E_BROWSER_CHANNEL = 'msedge'
pnpm test:e2e
Remove-Item Env:E2E_BROWSER_CHANNEL
```

Cấu hình dùng API 5051 và web 5175, kết nối database từ backend/.env; cần dữ liệu Published. Không nhầm cổng này với cổng chụp báo cáo 5071/5179.

## 7. Cách tái tạo ảnh trong báo cáo

Script `scripts/capture-demo.mjs` export snapshot từ Git vào thư mục tạm, nối node_modules hiện có, chạy API ở 5071 và web ở 5179 rồi chụp Edge headless. Không checkout hoặc sửa source đang làm việc. Cần pnpm dependencies và Edge đã cài, backend/.env hợp lệ, PostgreSQL/Redis và tài khoản demo.

```powershell
node docs/reports/huynh-thanh/scripts/capture-demo.mjs
```

Script đăng nhập để đọc các trang được phân quyền; chỉ mở hộp xác nhận archive/delete, không bấm xác nhận và không gửi thao tác thay đổi công thức. Snapshot và metadata ở `evidence/capture-results.json` ghi phạm vi thực tế. Thư mục tạm được giữ để truy vết, không ghi .env/token vào báo cáo.

## Bản tích hợp trên master mới — 21/10/2026

Hướng dẫn snapshot phía trên được giữ làm lịch sử. Để sử dụng phiên bản đã thích ứng DashboardLayout, Zustand và API /recipes/manage của master `1ed7022`, xem [Tích hợp quản lý nguyên liệu với master mới](./09-tich-hop-nguyen-lieu-master.md). Bản mới nằm trên nhánh local `feat/integrate-ingredients-master`, đã kiểm tra CRUD desktop/mobile với PostgreSQL thật; chưa được merge vào master trên GitHub.