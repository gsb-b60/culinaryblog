# FR-RCP-009 — Quản lý nguyên liệu

Huỳnh Thành — MSSV 2312748 — Backend/Frontend. Issue #25 trong tài liệu phân công tương ứng GitHub [#6](https://github.com/gsb-b60/culinaryblog/issues/6).

Trang `/dashboard/ingredients` dùng DashboardLayout và Zustand session. Danh sách công thức tải qua `GET /api/v1/recipes/manage?page=1&pageSize=12`, hiển thị theo trang, chỉ gồm công thức người dùng có quyền quản lý. Admin có phạm vi rộng hơn Author.

Khi chọn công thức, trang gọi GET ingredients. Thêm dùng POST trả 201, sửa dùng PUT trả 200, xóa dùng DELETE trả 204. Backend xác thực JWT và quyền chủ công thức/Admin, trả 403/404/422 khi không đủ quyền, tài nguyên thiếu hoặc dữ liệu sai. Nguyên liệu xóa mềm được loại khỏi danh sách.

Sau review PR #55, lựa chọn công thức/trang được đồng bộ với URL để F5 giữ đúng vị trí. Khi chuyển trang, trạng thái tải nguyên liệu được xóa để nút tải lại không bị kẹt khi kết nối lỗi. Không còn thay đổi ref bên trong updater của state.

## Kịch bản demo

1. Mở trang bằng tài khoản Author/Admin; chọn công thức ở trang 2.
2. Chọn công thức khác rồi nhấn F5; kiểm tra vẫn giữ đúng công thức và trang.
3. Thêm tên, lượng, đơn vị và ghi chú; xác nhận HTTP 201.
4. Sửa lượng/ghi chú; xác nhận HTTP 200 và tải lại để kiểm tra dữ liệu.
5. Xác nhận xóa; HTTP 204, nguyên liệu không còn hiển thị.
6. Kiểm tra tên rỗng, lượng sai và tài khoản không có quyền.

![Thêm nguyên liệu desktop](./evidence/ingredients-master/desktop-created.png)

![Cập nhật trên mobile](./evidence/ingredients-master/mobile-updated.png)

[Hướng dẫn chạy](./CAI-DAT-VA-CHAY.md) · [Báo cáo tích hợp](./09-tich-hop-nguyen-lieu-master.md) · [Kết quả E2E](./evidence/ingredients-master/result.json).
