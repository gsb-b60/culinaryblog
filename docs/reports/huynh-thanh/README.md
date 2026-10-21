# FR-RCP-009 — Quản lý nguyên liệu

Người thực hiện: Huỳnh Thành, MSSV 2312748. Nhánh: `feat-frontend-add/delete/fix-ingredient-management`.

Bản tích hợp ngày 21/10/2026 dùng master `1ed7022`. Mốc `349c05c` thuộc báo cáo lịch sử ngày 14/10/2026, không dùng để tái hiện bản hiện tại.

- [Hướng dẫn chạy nguyên liệu](./CAI-DAT-VA-CHAY.md)
- [Mô tả chức năng](./04-quan-ly-nguyen-lieu.md)
- [Kết quả tích hợp và coverage](./09-tich-hop-nguyen-lieu-master.md)
- [Kiểm thử dịch vụ thật](../../../backend/TESTING_REAL_SERVICES.md)
- [Ảnh và kết quả E2E](./evidence/ingredients-master/result.json)

Các báo cáo chức năng khác, ảnh snapshot cũ và script capture-demo được tách sang nhánh local `docs/huynh-thanh-review-snapshots` tại commit `7f49a92` để PR #55 tập trung vào nguyên liệu. Nhánh đó giữ bản sửa đường dẫn có dấu cách, API response envelope và hướng dẫn bảo toàn env. Chưa chạy lại toàn bộ snapshot lịch sử.

Playwright được giữ để chạy kiểm thử hồi quy của chính trang nguyên liệu với trình duyệt, HTTP và PostgreSQL thật; không chặn hay giả response API. Kết quả local không thay thế GitHub Checks.
