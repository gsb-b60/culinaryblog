# Kiểm thử backend với dịch vụ thật

## Kết quả

`pnpm test` đã chạy thành công: **160/160 test**, coverage dòng code **84,69%**, vượt ngưỡng **80%**. Ngưỡng và phạm vi coverage trong `vitest.config.ts` được giữ nguyên.

## Cách chạy và chụp minh chứng

Từ thư mục gốc dự án, bật các dịch vụ local:

```powershell
docker compose up -d postgres redis minio mailhog
cd backend
pnpm test
```

Chụp phần cuối terminal có `Test Files 15 passed`, `Tests 160 passed` và dòng `All files` trong bảng coverage. Số lượng có thể thay đổi nếu sau này dự án bổ sung test.

Báo cáo HTML được tạo tại `backend/coverage/index.html`; có thể mở bằng trình duyệt để xem những dòng chưa được kiểm thử.

Chỉ chạy nhóm mới:

```powershell
pnpm exec vitest run tests/domain-lifecycle.test.ts tests/real-services.integration.test.ts
```

## Các kiểm thử mới

- `tests/domain-lifecycle.test.ts`: entity thật, vòng đời Draft/Published/Archived, phiên bản, soft delete, primary image, khóa tài khoản, email/slug. Không dùng mock.
- `tests/real-services.integration.test.ts`: PostgreSQL, Redis, MinIO, SMTP MailHog và BullMQ thật. Không dùng mock hoặc spy để thay thế dịch vụ.
- HTTP được chạy qua Express router, Command Bus, handler và Passport JWT thật; API nguyên liệu kiểm tra quyền owner/Admin, validation, CRUD và trạng thái dữ liệu sau xóa.
- Đăng ký, đăng nhập, refresh token, phát hiện token bị sử dụng lại và đăng xuất được kiểm tra với dữ liệu PostgreSQL thật.
- Redis kiểm tra JSON, TTL, cache hit, xóa key và invalidation.
- MinIO kiểm tra upload ảnh, metadata, download bằng signed URL và delete object.
- MailHog xác nhận nhận các email welcome, reset và verification qua SMTP; đăng ký còn kiểm tra gửi welcome email qua BullMQ worker.
- Seed tạo 6 user, 20 category và 100 recipe trong schema thử nghiệm để kiểm tra repository, lọc, phân trang và dữ liệu liên quan.

Những unit test cũ có mock vẫn được giữ nguyên. Yêu cầu không mô phỏng được áp dụng cho toàn bộ kiểm thử tích hợp mới.

## Dịch vụ và cấu hình

Test đọc kết nối PostgreSQL, Redis, MinIO và credentials từ `backend/.env`. Không sửa file này. PostgreSQL, Redis và MinIO phải là dịch vụ local; test từ chối URL remote.

- PostgreSQL trong Docker Compose: localhost:5433.
- Redis: localhost:6379.
- MinIO: localhost:9000.
- MailHog SMTP: 127.0.0.1:1025; API: 127.0.0.1:8025.

Riêng tiến trình test sử dụng SMTP MailHog local thay cho SMTP trong `.env`; không gửi email ra người dùng thật. Tài khoản PostgreSQL cần quyền tạo/xóa schema; MinIO cần quyền tạo/xóa bucket. Thiếu dịch vụ hoặc credentials sai làm test fail, không tự skip.

## Cách tách dữ liệu

Mỗi lần chạy có UUID riêng:

- Schema PostgreSQL: `codex_test_<uuid>`; Prisma db push chỉ áp dụng vào schema này.
- Bucket MinIO và prefix BullMQ: `codex-test-<uuid>`.
- Redis cache: key bắt đầu bằng prefix của lần chạy.
- Email: địa chỉ `register-<uuid>@example.invalid` và `mail-<uuid>@example.invalid`.

Sau khi chạy, test dọn schema, bucket/object, key Redis, queue/worker và những email đã nhận diện của chính lần chạy. Không truncate bảng ứng dụng, không flush Redis và không xóa inbox MailHog toàn bộ. Nếu tiến trình bị kill đột ngột trước teardown, có thể còn tài nguyên test mang prefix trên; cần kiểm tra đúng tên trước khi dọn.

## Các lỗi thực tế được sửa

- RecipeRepository.save: dùng `categoryId` cùng `authorId` thay vì trộn `category.connect` với khóa ngoại scalar, vốn bị Prisma từ chối.
- NodemailerEmailService: chỉ cung cấp auth khi có SMTP_USER, giúp gửi được qua MailHog không yêu cầu đăng nhập.
- Thêm cấu hình BULLMQ_PREFIX cho queue và worker để test dùng hàng đợi riêng. Mặc định vẫn là `bull`, giữ hành vi ứng dụng hiện tại.

## Giới hạn

Đây là kiểm thử tích hợp backend với các dịch vụ thật, chưa phải kiểm thử trình duyệt. Worker image resize và sitemap của dự án hiện còn TODO; test xác nhận xử lý job qua Redis thật, không khẳng định việc resize ảnh hay sinh sitemap đã hoàn thiện. Test có dịch vụ thật không đồng nghĩa toàn bộ code backend đã được kiểm thử: coverage hiện đạt 84,69%.
