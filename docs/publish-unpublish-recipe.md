# FR-RCP-005 — Publish/Unpublish Recipe

## Mục tiêu và phạm vi

Chuyển công thức giữa DRAFT (bản nháp) và PUBLISHED (đã xuất bản).
Chỉ chủ sở hữu hoặc Admin có quyền thực hiện. Publish yêu cầu ít nhất một
RecipeStep chưa xóa mềm. Unpublish không yêu cầu bước thực hiện.

Triển khai backend theo kiến trúc Express → CommandBus → CommandHandler → Prisma.
Không thay đổi schema, không cần migration. Giao diện quản lý tại /dashboard/recipes kết nối các API backend.

## API

- PATCH /api/v1/recipes/{id}/publish
- PATCH /api/v1/recipes/{id}/unpublish

Header: Authorization: Bearer <access_token>. Không cần request body.
Danh tính và quyền Admin được lấy từ req.user sau khi JWT được xác thực;
authorId/isAdmin trong body không được sử dụng.

Thành công trả HTTP 200 với RecipeDto trực tiếp, gồm thông tin công thức,
status, updatedAt, version, authorName, categoryName, nutrition, steps,
ingredients và images. Ngày giờ được JSON serialize thành chuỗi ISO.
publishedAt không xuất hiện trong JSON khi công thức ở Draft.

Ví dụ gọi:

~~~bash
curl -X PATCH "http://localhost:3000/api/v1/recipes/<recipe-id>/publish" \
  -H "Authorization: Bearer <access-token>"
~~~

Cổng trong ví dụ cần thay bằng cổng backend của bạn.

## Luồng xử lý

1. authenticateJwt xác thực token. Không hợp lệ hoặc thiếu token → 401.
2. Route tạo PublishRecipeCommand hoặc UnpublishRecipeCommand. isAdmin được
   tính từ req.user.roles.includes(UserRole.ADMIN).
3. CommandBus tìm handler đã đăng ký trong DI container.
4. Handler truy vấn công thức với id và isDeleted: false; nạp các quan hệ
   chưa xóa mềm. Steps tăng dần theo stepNumber, ingredients/images theo orderIndex.
   Không tồn tại hoặc đã xóa mềm → 404.
5. Handler so sánh recipe.authorId với command.authorId. Người khác không
   phải Admin → 403. Kiểm tra nằm trong handler nên gọi command ngoài HTTP
   cũng phải qua kiểm tra quyền.
6. ARCHIVED → 422. Đây là giới hạn phạm vi chuyển trạng thái; endpoint này
   không đóng vai trò khôi phục công thức đã lưu trữ.
7. Khi publish, steps.length phải lớn hơn 0. Nếu chỉ có bước đã xóa mềm,
   kết quả vẫn là 422. Không cập nhật DB hoặc xóa cache khi kiểm tra thất bại.
8. Nếu đã ở trạng thái đích, trả 200 với DTO hiện tại, không đổi timestamps/version.
   Publish vẫn kiểm tra bước thực hiện trước khi trả về.
9. Nếu cần chuyển trạng thái, gọi prisma.recipe.update:
   - status = PUBLISHED hoặc DRAFT.
   - updatedAt = new Date().
   - Publish đặt publishedAt cùng thời điểm updatedAt; unpublish đặt NULL.
   - version tăng 1, phù hợp cơ chế version hiện có.
10. Update kiểm tra lại version, trạng thái đã đọc, isDeleted, owner (nếu không
    phải Admin), và ít nhất một bước chưa xóa mềm khi publish. Nếu điều kiện
    không còn khớp, Prisma P2025 được chuyển thành HTTP 409 để client tải lại
    công thức và thử lại. Lỗi DB khác được chuyển thành HTTP 500 chung.
11. Sau khi update thành công, hoặc xử lý yêu cầu lặp, gọi deletePattern
    cho recipes:* và categories:* để loại bỏ cache có thể phụ thuộc trạng thái.
12. Map kết quả DB thành RecipeDto; route trả HTTP 200.

## Trạng thái và lỗi

| Trạng thái hiện tại | Publish | Unpublish |
| --- | --- | --- |
| DRAFT | PUBLISHED nếu có bước; thiếu bước → 422 | 200, giữ nguyên |
| PUBLISHED | 200, giữ nguyên nếu có bước | DRAFT |
| ARCHIVED | 422 | 422 |
| Không tồn tại / xóa mềm | 404 | 404 |

| HTTP | Ý nghĩa |
| --- | --- |
| 200 | Thành công hoặc đã ở trạng thái đích |
| 401 | Chưa xác thực hoặc token không hợp lệ |
| 403 | Không phải chủ sở hữu và không phải Admin |
| 404 | Công thức không tồn tại hoặc đã xóa mềm |
| 422 | Publish thiếu bước, hoặc trạng thái ARCHIVED |
| 409 | Công thức thay đổi trong thời gian xử lý |
| 500 | Lỗi hệ thống/DB |

Ví dụ lỗi thiếu bước, theo GlobalErrorHandler hiện có:

~~~json
{
  "type": "https://tools.ietf.org/html/rfc7807#section-3.1",
  "title": "Validation Error",
  "status": 422,
  "detail": "Validation failed",
  "errors": {
    "steps": ["A recipe must have at least one execution step before publishing"]
  }
}
~~~

## Cache và giới hạn kiểm chứng

Repository hiện có RedisCacheService nhưng các recipe/category queries chưa
khai báo getCacheKey/getCacheTtl. Hai namespace recipes:* và categories:* được
dùng cho invalidation của chức năng này; khi bổ sung cache đọc, cần dùng cùng
namespace. Không có cache đọc đang hoạt động cho các queries này để kiểm chứng
end-to-end.

RedisCacheService hiện bỏ qua thao tác khi chưa kết nối và bắt lỗi Redis.
Vì vậy DB vẫn là nguồn dữ liệu chính; lỗi Redis không rollback cập nhật DB,
và cache cũ có thể tồn tại đến khi hết TTL nếu invalidation thất bại.
Không thay đổi chính sách cache toàn dự án trong chức năng này.

Điều kiện bước ở update giảm khoảng trống giữa đọc và ghi. Nó không cấm thao
tác xóa bước sau khi publish; nếu muốn luôn đảm bảo công thức Published có bước,
cần áp dụng quy tắc bổ sung trong chức năng xóa bước.

Kiểm thử backend dùng Prisma/cache mock và stub xác thực Passport, chạy thật route,
auth middleware, CommandBus, handler và GlobalErrorHandler. Không kết nối DB
hay Redis thật; chưa kiểm chứng SQL/concurrency trên PostgreSQL thực tế.

## Các file chính

- backend/src/application/commands/recipes/RecipeCommands.ts: command trả RecipeDto và nhận quyền Admin từ server.
- backend/src/application/handlers/RecipeStatusCommandHandlers.ts: nghiệp vụ, quyền, cập nhật, cache, DTO.
- backend/src/application/dtos/RecipeDto.ts: kiểu RecipeDto có updatedAt/version.
- backend/src/presentation/routes/recipeRoutes.ts: nhận request và trả DTO.
- backend/src/presentation/di/container.ts: đăng ký hai handlers.
- backend/tests/recipe-status.test.ts: kiểm thử thành công, lỗi, quyền và idempotency.

Lệnh kiểm tra: npx vitest run tests/recipe-status.test.ts; npx tsc --noEmit.

## Sử dụng trực tiếp trên giao diện

1. Chạy backend: cd backend, rồi npm run dev. Dùng cổng backend hiển thị trong terminal.
2. Chạy frontend trong terminal khác: cd frontend, rồi npm run dev (http://localhost:5173).
3. Đăng nhập bằng tài khoản tác giả đã có công thức hoặc Admin.
4. Chọn Công thức trong Dashboard/Hồ sơ, hoặc mở /dashboard/recipes.
5. Bấm Xuất bản cho Draft đã có bước thực hiện. Sau khi API thành công,
   trạng thái đổi sang Đã xuất bản và nút đổi thành Chuyển về bản nháp.
6. Bấm Chuyển về bản nháp để unpublish. Tải lại trang vẫn lấy trạng thái từ DB.

API_BASE dùng VITE_API_BASE_URL nếu đã cấu hình, mặc định
http://localhost:5000/api/v1. DB phải có dữ liệu công thức. Trang này không tạo
công thức mới; nếu danh sách trống, giao diện hiển thị trạng thái chưa có công thức.

Trang quản lý có loading, danh sách rỗng, phân trang và nút Tải lại.
Nút bị khóa trong khi đang cập nhật để tránh gửi lặp. Draft không có bước
hiển thị hướng dẫn và khóa nút Xuất bản; Archived không hiển thị thao tác.
Lỗi API giữ nguyên trạng thái đang hiển thị và báo lỗi bằng tiếng Việt.
Khi token hết hạn, API client refresh rồi thử lại; refresh thất bại chuyển
về trang đăng nhập. Lỗi nghiệp vụ sau refresh không xóa phiên đăng nhập.

## API danh sách phục vụ giao diện

GET /api/v1/recipes/manage?page=1&pageSize=12, yêu cầu Bearer token.
Route được đặt trước /:slug để không bị xử lý như slug công thức.

Tác giả chỉ nhận công thức có authorId bằng user ID đã xác thực; Admin
nhận công thức của mọi tác giả. Bỏ qua authorId/isAdmin do client truyền.
Chỉ lấy isDeleted: false và loại bỏ các quan hệ đã xóa mềm.

Trả PagedResult<RecipeDto>, gồm items và meta phân trang. page/pageSize
được chuyển từ query string sang số và kiểm tra; pageSize tối đa 50.
UI lấy dữ liệu thật qua API này và cập nhật từng công thức bằng DTO trả về
từ publish/unpublish. Danh sách quản lý riêng tư không dùng shared cache.

Kiểm thử giao diện ở frontend/src/test/RecipesPage.test.tsx chạy qua App,
router, các nút và API client thật với HTTP response giả lập. Backend tests
chạy route, CommandBus và handlers với Prisma mock. Đã kiểm tra tương tác
và hợp đồng giữa hai phía, chưa chạy trình duyệt với PostgreSQL/Redis thật.

Lưu ý cổng: backend mặc định PORT=3000 khi không cấu hình; API client frontend mặc định dùng cổng 5000. VITE_API_BASE_URL phải trùng với địa chỉ API backend (ví dụ http://localhost:3000/api/v1). Sau khi đổi cấu hình Vite, khởi động lại frontend.
