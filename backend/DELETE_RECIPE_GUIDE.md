# FR-RCP-007 — Xóa vĩnh viễn công thức (Issue #24)

## 1. Chức năng và phân biệt với xóa nguyên liệu

DELETE /api/v1/recipes/{id} xóa cả công thức. DELETE /recipes/{id}/ingredients/{ingredientId} chỉ xóa một nguyên liệu.
Đây là hard delete: bản ghi Recipe biến mất khỏi database, không cập nhật isDeleted = true, không có nút hoàn tác.
Author chỉ xóa công thức của mình. Admin xóa được công thức của mọi tác giả. Backend quyết định quyền từ JWT, không nhận isAdmin từ request body.

## 2. Luồng từ giao diện đến database

1. Dashboard → Công thức → /dashboard/recipes. GET /recipes/manageable trả danh sách có phân trang: Author thấy công thức của mình; Admin thấy tất cả; gồm Draft, Published, Archived.
2. Người dùng nhấn Xóa công thức. Hộp thoại hiển thị tên công thức và cảnh báo mất dữ liệu; Hủy không gọi API. Khi đang xóa, khóa nút để tránh gửi nhiều lần.
3. Frontend gửi DELETE /recipes/{id}, header Authorization: Bearer <accessToken>. Client hiện có hỗ trợ refresh token khi hết hạn.
4. authenticateJwt xác thực. Route tạo DeleteRecipeCommand với recipeId, userId và quyền Admin từ JWT, chuyển vào Command Bus.
5. DeleteRecipeCommandHandler mở transaction Serializable, tìm Recipe cùng toàn bộ images và steps. Không tìm thấy → 404. Không phải chủ sở hữu hoặc Admin → 403.
6. Thu thập URL ảnh originalUrl, mediumUrl, thumbnailUrl và ảnh bước nấu imageUrl; lấy cả dữ liệu con đã soft-delete để không bỏ sót file; loại URL trùng.
7. Lưu một FileCleanupTask cho mỗi URL vào database, rồi prisma.recipe.delete. Hai việc nằm cùng transaction: không có trường hợp transaction thất bại nhưng ảnh đã bị xóa.
8. PostgreSQL ON DELETE CASCADE tự xóa RecipeStep, RecipeIngredient, RecipeImage. Nutrition nằm trong hàng Recipe nên bị xóa cùng hàng. User và Category giữ nguyên.
9. Commit transaction rồi invalidation cache recipe* và categor* (danh mục có thể chứa số lượng recipe).
10. API trả 204 No Content, không có JSON. Frontend bỏ công thức khỏi danh sách và tải lại; nếu xóa hết trang cuối, lùi về trang còn dữ liệu.

## 3. Vì sao có bảng FileCleanupTask (outbox)?

Database và Redis/MinIO không chung transaction. Nếu chỉ xóa recipe rồi queue.add, Redis lỗi sẽ làm mất danh sách ảnh sau khi cascade xóa.
FileCleanupTask lưu yêu cầu dọn file bền vững ngay trong transaction xóa. Bảng này cố ý không có foreign key tới Recipe.
Worker relay quét tối đa 100 task mỗi 5 giây, enqueue job tên delete vào queue file-cleanup. Chỉ bỏ task database sau khi Redis xác nhận nhận job.
Job ID là ID task nên gửi lại sau khi ứng dụng crash không tạo job mới trong thời gian BullMQ còn giữ ID.
Nhiều instance relay vẫn có thể gửi cùng task; stable job ID và DeleteObject idempotent giúp việc lặp lại an toàn.
Job hoàn thành được giữ 7 ngày; job thất bại được giữ để vận hành kiểm tra/retry. Task chưa enqueue được giữ qua lần chạy và restart.
204 nghĩa là dữ liệu công thức đã xóa và yêu cầu dọn ảnh đã lưu; không có nghĩa mọi file MinIO đã biến mất ngay.

## 4. Worker MinIO và retry

Worker chuyển URL thành object key, ví dụ:
http://localhost:9000/culinary/recipes/<recipeId>/photo.jpg → recipes/<recipeId>/photo.jpg.

Chỉ xử lý URL cùng endpoint/bucket cấu hình S3 và nằm trong thư mục recipes/<recipeId>/.
Ảnh bên ngoài (ví dụ ảnh demo Unsplash) và ảnh dùng chung ngoài thư mục recipe được bỏ qua để không xóa nhầm.
Ảnh malformed URL sẽ làm job thất bại và được giữ lại để kiểm tra.
MinioFileStorageService gửi S3 DeleteObjectCommand. Xóa object không tồn tại là idempotent; lỗi kết nối/quyền phải throw để BullMQ retry.
attempts = 4 nghĩa là một lần đầu + ba lần thử lại, backoff exponential bắt đầu 2 giây.
Worker tự khởi động cùng backend, relay có chống chạy chồng và đóng connection khi shutdown.

## 5. Mã HTTP

| Mã | Ý nghĩa |
|---|---|
| 204 | Xóa thành công; body rỗng |
| 401 | Chưa đăng nhập/token không hợp lệ |
| 403 | Người dùng khác chủ sở hữu, không phải Admin |
| 404 | Recipe không tồn tại, kể cả yêu cầu xóa lần hai |
| 409 | Xung đột transaction; có thể tải lại và thử lại |
| 500 | Lỗi database hoặc lỗi hệ thống; không giả báo thành công |

## 6. Cài đặt và chạy demo

Cần PostgreSQL, Redis và MinIO cùng cấu hình DATABASE_URL, REDIS_URL, S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY; không đưa secrets vào Git.
Trong backend, dừng server đang chạy trước khi generate trên Windows:
- pnpm exec prisma generate
- pnpm exec prisma migrate deploy
- pnpm dev

Migration 20261006130000_add_file_cleanup_outbox tạo bảng outbox và index; cascade đã có trong migration init.
Nếu database local từng được tạo bằng db push và chưa có lịch sử migration, migrate deploy sẽ yêu cầu baseline. Với local, kiểm tra schema diff rồi dùng pnpm exec prisma db push --skip-generate để chỉ thêm bảng mới. Không dùng reset hay accept-data-loss.
Trong phiên triển khai này, local đã được cập nhật bằng db push sau khi diff xác nhận chỉ thêm file_cleanup_tasks và index.
Trong frontend: pnpm dev → đăng nhập → Dashboard → Công thức.
Dùng công thức thử nghiệm và ảnh MinIO có key đúng recipes/<recipeId>/...; xác nhận xóa.
Kiểm tra Network: DELETE trả 204, GET danh sách không còn công thức.
Trong database kiểm tra Recipe và ba bảng con không còn record; task outbox mất sau khi được enqueue.
Trong MinIO kiểm tra ảnh gốc/medium/thumbnail/step bị xóa sau worker chạy.
Thử bằng tài khoản khác gọi DELETE trực tiếp → 403; ID không có → 404; bỏ token → 401.
Tạm dừng Redis khi xóa: API vẫn xóa/lưu task; bật lại Redis để relay chuyển task sang queue.
Tạm dừng MinIO khi worker chạy: job retry; nếu hết retry, job còn trong failed queue để retry thủ công sau khi sửa lỗi.
Không chạy demo xóa trên dữ liệu cần giữ.

## 7. Kiểm thử tự động và giới hạn

Tests handler: Owner/Admin, 403/404, ảnh trùng/biến thể/ảnh bước, lỗi lưu task, lỗi delete, không ảnh, lọc danh sách theo quyền.
Tests endpoint: route → Command Bus → handler → response; authentication được mock, không thay thế test Passport/JWT thật.
Tests cleanup: quy đổi URL, chặn URL ngoài phạm vi, truyền lỗi S3, giữ task khi enqueue lỗi, xóa task sau ACK.
Tests frontend: API DELETE 204, xác nhận/hủy, khóa khi đang xóa, báo 403 và tải lại danh sách.
Các tests đơn vị mock database/Redis/MinIO; cần demo trên hạ tầng thật để xác nhận cascade và retry thực tế.
Redis cần persistence để giữ job đã nhận qua restart. Sau ba retry, cần kiểm tra failed queue; không tự lặp vô hạn.
Cache service hiện có xử lý best effort: khi Redis/cache lỗi có thể còn cache cũ đến TTL. Endpoint quản lý mới đọc database trực tiếp và không cache.
Ảnh từ worker resize đang chạy đồng thời cần chú ý: worker resize tương lai phải kiểm tra recipe còn tồn tại trước khi ghi file mới.

## 8. Chạy test tích hợp thật

Test delete-recipe-infrastructure.test.ts mặc định skip để không tự ghi dữ liệu khi chạy unit tests.
Trên PowerShell, trong backend:
- $env:RUN_RECIPE_INFRA_TESTS = '1'
- pnpm exec vitest run tests/delete-recipe-infrastructure.test.ts

Lệnh này dùng PostgreSQL và Redis thật; thao tác MinIO được mock. Nó tạo User/Category/Recipe và các bảng con thử, kiểm tra JWT thật, 401/403/404/204, danh sách theo quyền, cascade thật, outbox và job retry thật.
Muốn kiểm tra upload/xóa file trên MinIO thật, thêm $env:RUN_RECIPE_MINIO_TESTS = '1' trước khi chạy.
Test dùng UUID riêng, queue riêng, chỉ dọn fixture của nó trong finally; không đụng recipe sẵn có.
Sau khi chạy: Remove-Item Env:RUN_RECIPE_INFRA_TESTS; Remove-Item Env:RUN_RECIPE_MINIO_TESTS -ErrorAction SilentlyContinue.
MinIO phải đang chạy, bucket cấu hình phải tồn tại và credentials phải có quyền upload/delete. Nếu image Docker của dự án không tải được, cần cung cấp dịch vụ MinIO hoạt động trước khi chạy chế độ này.

## 9. Kết quả kiểm tra trong phiên triển khai

- Backend: toàn bộ 143 unit/endpoint tests pass.
- Frontend: toàn bộ 100 tests pass.
- Build backend/frontend và lint đều pass (backend vẫn có warnings sẵn có).
- Test tích hợp PostgreSQL/Redis thật pass: JWT thật, Owner/403, 401, xóa 204, 404 sau xóa, cascade thật, giữ User/Category, outbox giữ qua lỗi enqueue và BullMQ retry ba lần rồi thành công. Thao tác MinIO trong lần chạy này được mock.
- Chưa xác minh upload/xóa object MinIO thật: dịch vụ cổng 9000 không hoạt động; image Quay trả 401 Unauthorized và Docker Hub từ chối tải.
- Schema local đã thêm file_cleanup_tasks bằng db push sau khi kiểm tra diff. Không reset hoặc xóa dữ liệu sẵn có.
- Test tích hợp mặc định skip; bật RUN_RECIPE_INFRA_TESTS khi muốn tạo và dọn fixture trên hạ tầng local.

## 10. Đoạn trình bày gợi ý

“Em triển khai FR-RCP-007 để tác giả xóa vĩnh viễn công thức của mình, Admin có thể xóa mọi công thức.
Frontend có xác nhận vì thao tác không thể hoàn tác. Backend xác thực JWT, kiểm tra quyền và xóa recipe trong transaction.
Các khóa ngoại cascade tự xóa nguyên liệu, bước nấu, record ảnh. File ảnh thực tế nằm trên MinIO nên cần worker riêng.
Em lưu yêu cầu dọn ảnh cùng transaction để không mất yêu cầu khi Redis lỗi, rồi chuyển sang BullMQ chạy nền.
Worker xóa ảnh bằng object key đúng thư mục recipe và retry tối đa ba lần khi lỗi.
API trả 204 khi database xóa thành công; ảnh được dọn bất đồng bộ. Tests kiểm tra quyền, lỗi và hành vi giao diện.”
