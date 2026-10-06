# FR-RCP-010: Quản lý các bước nấu

Đã bổ sung ba API quản lý bước nấu theo kiến trúc Route → Command Bus → Handler → Prisma của dự án. Không cần migration vì bảng RecipeStep đã có đủ các trường.

## 1. API và dữ liệu

Gửi `Authorization: Bearer <accessToken>` cho tất cả request. Chỉ chủ công thức hoặc Admin được thao tác.

| Method | Endpoint | Thành công |
| --- | --- | --- |
| POST | /api/v1/recipes/{id}/steps | 201, trả về bước mới |
| PUT | /api/v1/recipes/{id}/steps/{stepId} | 200, trả về bước đã cập nhật |
| DELETE | /api/v1/recipes/{id}/steps/{stepId} | 204, không có response body |

Body ví dụ cho POST/PUT:

```json
{
  "title": "Xào rau",
  "description": "Cho rau vào chảo và đảo đều.",
  "timerMinutes": 5,
  "imageUrl": "https://example.com/steps/xao-rau.jpg"
}
```

- `title` và `description` bắt buộc trên cả POST và PUT. Chuỗi được trim; chuỗi rỗng/toàn khoảng trắng bị từ chối. Title tối đa 200 ký tự.
- `timerMinutes` tùy chọn, số nguyên từ 0 đến 2147483647, tương ứng kiểu Int của PostgreSQL. Đây là dữ liệu thời gian; API không tự chạy đồng hồ đếm ngược.
- `imageUrl` tùy chọn, URL hợp lệ, tối đa 500 ký tự. API lưu URL, không upload file ảnh.
- Client không được gửi `stepNumber`: server quản lý trường này. Gửi trường này hoặc trường lạ sẽ nhận 422.
- Trên PUT, nếu bỏ qua timerMinutes/imageUrl thì giữ giá trị cũ.

Response POST/PUT chứa `id`, `stepNumber`, `title`, `description` và các trường tùy chọn có giá trị.

## 2. Luồng xử lý chung

1. Route xác thực JWT; thiếu/sai token trả 401.
2. Zod kiểm tra body POST/PUT; sai dữ liệu trả 422 kèm errors theo từng trường.
3. Route tạo command, truyền recipeId, userId và isAdmin lấy từ người dùng đã xác thực. Client không quyết định được quyền Admin. Command Bus gọi handler đã đăng ký trong container.
4. Handler mở Prisma transaction và khóa dòng công thức bằng SELECT FOR UPDATE. Các thao tác bước cùng công thức phải chờ nhau, giúp tránh hai request thêm cùng lấy một số thứ tự. Khóa được giữ đến khi commit/rollback.
5. Tìm công thức chưa bị xóa: không tồn tại trả 404. Nếu không phải chủ công thức và không phải Admin, trả 403.
6. PUT/DELETE tìm bước theo cả stepId và recipeId, isDeleted=false. Bước của công thức khác hoặc bước đã xóa cũng trả 404.
7. Thực hiện thao tác; tăng version và cập nhật updatedAt của công thức. Những bước được sửa/đánh lại số cũng tăng version.
8. Commit transaction rồi trả HTTP response. Nếu có lỗi, rollback các thay đổi trong transaction.

Body không hợp lệ được phát hiện ở route trước kiểm tra tồn tại/quyền trong handler. Vì vậy request đồng thời sai body và sai ID có thể nhận 422 trước 404.

## 3. Thêm và sửa bước

POST tìm số lớn nhất của các bước hiện tại bằng aggregate _max.stepNumber, sau đó tạo bước với max + 1. Công thức chưa có bước bắt đầu từ 1. Không dùng count + 1: nếu dữ liệu đang có số 1 và 3 thì bước mới phải là 4.

PUT cập nhật nội dung của bước tìm được nhưng giữ nguyên stepNumber. Phải gửi title và description dù chỉ muốn đổi timerMinutes. Việc sắp xếp lại bước bằng PUT nằm ngoài chức năng này.

## 4. Xóa và đánh lại số

DELETE thực hiện trong cùng một transaction:

1. Xác thực quyền và tìm đúng bước của công thức.
2. Xóa vật lý bước khỏi bảng recipe_steps. Cách này giải phóng vị trí đang bị ràng buộc unique(recipeId, stepNumber).
3. Đọc những bước còn lại theo stepNumber tăng dần.
4. Duyệt danh sách, gán stepNumber = index + 1. Chỉ cập nhật những bước có số thay đổi.
5. Cập nhật version/updatedAt công thức, commit và trả 204.

Ví dụ:

| Bước | Trước khi xóa B | Sau khi xóa B |
| --- | --- | --- |
| A | 1 | 1 |
| B | 2 | Đã xóa |
| C | 3 | 2 |
| D | 4 | 3 |

ID của A/C/D giữ nguyên. Thêm E sau đó → E=4. Xóa bước cuối cùng → danh sách rỗng; lần thêm tiếp theo bắt đầu từ 1.

Cập nhật theo thứ tự tăng dần để lấp vào vị trí trống, tránh trùng số với bước chưa được cập nhật. Nếu renumber lỗi, transaction rollback cả thao tác xóa. Những bước thuộc công thức khác không bị sửa.

## 5. File chính

- src/presentation/routes/recipeRoutes.ts: HTTP/JWT, tạo command, response status.
- src/application/validators/recipeValidators.ts: recipeStepSchema.
- src/application/commands/recipes/RecipeCommands.ts: dữ liệu command và kiểu kết quả RecipeStepDto.
- src/application/handlers/RecipeStepCommandHandlers.ts: quyền, transaction, CRUD, renumber.
- src/presentation/di/container.ts: đăng ký ba handler.
- tests/recipe-step-endpoints.test.ts: test HTTP với handler thật và persistence mô phỏng.

## 6. Kiểm thử và giới hạn xác minh

Chạy từ thư mục backend:

```sh
npx vitest run
npx tsc --noEmit
```

Kết quả: 168/168 test backend thành công, gồm 52 test mới cho bước nấu. TypeScript --noEmit thành công. Lint các file thay đổi không có lỗi, còn hai cảnh báo any đã có ở containerMiddleware.

Test mới kiểm tra status, owner/Admin, validation, max+1, xóa đầu/giữa/cuối, xóa bước duy nhất, thêm sau xóa, bước sai công thức và rollback khi renumber lỗi. JWT và persistence được mô phỏng; chưa kiểm thử khóa dòng, rollback và request đồng thời trên PostgreSQL thật.

Phạm vi triển khai là ba API quản lý bước. Route GET chi tiết công thức của dự án vẫn cần query handler riêng để cung cấp danh sách bước cho giao diện; chức năng đó chưa được bổ sung trong thay đổi này.
