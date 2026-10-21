# Báo cáo các feat của Huỳnh Thanh — Culinary Blog

Ngày lập: **14/10/2026**. Phạm vi theo yêu cầu: các feat của **Nguyễn Huỳnh Thanh / HUỲNH THÀNH**; MSSV **2312748** lấy từ docs/PR-FR-SRCH-002.md có sẵn ở workspace. Tên trong bảng phân công repo là Nguyen Huynh Thanh, tác giả commit là Huynh Thanh.

Repo: [https://github.com/gsb-b60/culinaryblog](https://github.com/gsb-b60/culinaryblog).

## Bảng phân công và kết quả theo từng feat

| FR | Tính năng / báo cáo riêng | Người phụ trách | Kết quả |
|---|---|---|---|
| FR-RCP-005 | [Xuất bản và hủy xuất bản công thức](./01-xuat-ban-huy-xuat-ban.md) | Huỳnh Thanh | Hoàn thành triển khai trên nhánh feat; chưa xác nhận tích hợp master |
| FR-RCP-006 | [Lưu trữ công thức](./02-luu-tru-cong-thuc.md) | Huỳnh Thanh | Hoàn thành triển khai trên nhánh feat; có ghi nhận tích hợp PostgreSQL/Redis |
| FR-RCP-007 | [Xóa công thức và dọn file ảnh](./03-xoa-cong-thuc.md) | Huỳnh Thanh | Hoàn thành phần ứng dụng; chưa xác minh xóa object MinIO thật |
| FR-RCP-009 | [Quản lý nguyên liệu](./04-quan-ly-nguyen-lieu.md) / [Tích hợp master mới](./09-tich-hop-nguyen-lieu-master.md) | Huỳnh Thanh | Đã tích hợp trên nhánh local dựa master 1ed7022; E2E thật desktop/mobile passed; chưa merge |
| FR-RCP-010 | [Quản lý bước nấu](./05-quan-ly-buoc-nau.md) | Huỳnh Thanh | Hoàn thành API và giao diện; chưa xác minh cạnh tranh trên PostgreSQL thật |
| FR-SRCH-002 | [Lọc công thức](./06-loc-cong-thuc.md) | Huỳnh Thanh | Hoàn thành triển khai lọc; kết quả kiểm thử cũ cần phân biệt với chạy lại |
| FR-SRCH-003 | [Sắp xếp công thức](./07-sap-xep-cong-thuc.md) | Huỳnh Thanh | Chưa hoàn thành theo đặc tả; đã có cơ chế backend dùng chung |
| FR-SRCH-004 | [Phân trang](./08-phan-trang.md) | Huỳnh Thanh | Đã triển khai trong feat lọc; chưa xác minh đầy đủ tiêu chí độc lập |

Có **6 feat triển khai riêng** được xác định qua commit của Huỳnh Thanh. Phân trang đã được tích hợp trong feat lọc, còn sắp xếp chưa đáp ứng đúng đặc tả. Không tính mỗi commit sửa giao diện/cấu hình là một FR mới và không coi 8 FR đều hoàn tất.

## Phân công nhóm làm ngữ cảnh

Theo README và docs/issues/person-*.md trong repo:

| Thành viên | Vai trò | Phạm vi được phân công |
|---|---|---|
| Nguyễn Đình Hiếu | Trưởng nhóm | AUTH, tạo/sửa công thức, file/ảnh, tìm kiếm toàn văn, thumbnail; issue tài liệu #1–14 |
| Trần Đức Anh | Thành viên | Danh mục và đọc danh sách/chi tiết công thức; #15–21 |
| Nguyễn Huỳnh Thanh | Thành viên | Vòng đời công thức, nguyên liệu, bước nấu, lọc/sắp xếp/phân trang; #22–29 |
| Bích Trân | Thành viên | Jobs và observability; #30–34 |

Báo cáo này chỉ đánh giá phần việc của Huỳnh Thanh; không đánh giá kết quả của các thành viên khác hoặc suy diễn người review.

## Hướng dẫn sử dụng báo cáo

Mỗi báo cáo riêng gồm bảng phân công chi tiết, phần đã làm/chưa hoàn thành, issue/commit/file mã nguồn, hình demo, lệnh chạy và kịch bản trình bày. Dùng [Cài đặt và chạy](./CAI-DAT-VA-CHAY.md) để chuẩn bị môi trường; sau đó mở đúng route của feat.

Ảnh trong [images](./images/) được chụp từ source snapshot bằng Edge/Playwright. [capture-results.json](./evidence/capture-results.json) ghi commit, request HTTP và các lỗi nếu có; [sorting-response.json](./evidence/sorting-response.json) lưu response sắp xếp không chứa token. Ảnh chỉ phản ánh trạng thái thực tế khi chụp, không chứng nhận các thao tác chưa được thực hiện.

## Cơ sở và giới hạn đánh giá

- Lịch sử Git local, các nhánh feat và source của từng commit; không dùng trạng thái Open trong docs làm kết luận duy nhất.
- Master local được đối chiếu tại `349c05c`. Một số feat ở nhánh riêng; chưa xác nhận trạng thái merge/issue mới nhất trên GitHub. Link repo/issue lấy từ remote và bảng mapping trong repo, không phải kết quả tra cứu GitHub live.
- Workspace có thay đổi nhánh trong quá trình đọc; vì vậy báo cáo/ảnh khóa theo commit thay vì dựa vào HEAD đang thay đổi.
- Các số test cũ được ghi nguồn và thời điểm; không trình bày thành kết quả vừa chạy. Tài liệu PR lọc chưa được Git theo dõi là nguồn phụ, cần phân biệt với source đã commit.
- MinIO thật của feat xóa và các kiểm chứng concurrency còn thiếu được ghi rõ từng báo cáo.
- Không sửa PR template, source ứng dụng hoặc docs/PR-FR-SRCH-002.md có sẵn để tạo báo cáo này.

## Danh mục trình bày

1. [FR-RCP-005: Xuất bản và hủy xuất bản công thức](./01-xuat-ban-huy-xuat-ban.md) — mục 7 có kịch bản demo.
2. [FR-RCP-006: Lưu trữ công thức](./02-luu-tru-cong-thuc.md) — mục 7 có kịch bản demo.
3. [FR-RCP-007: Xóa công thức và dọn file ảnh](./03-xoa-cong-thuc.md) — mục 7 có kịch bản demo.
4. [FR-RCP-009: Quản lý nguyên liệu](./04-quan-ly-nguyen-lieu.md) — mục 7 có kịch bản demo.
5. [FR-RCP-010: Quản lý bước nấu](./05-quan-ly-buoc-nau.md) — mục 7 có kịch bản demo.
6. [FR-SRCH-002: Lọc công thức](./06-loc-cong-thuc.md) — mục 7 có kịch bản demo.
7. [FR-SRCH-003: Sắp xếp công thức](./07-sap-xep-cong-thuc.md) — mục 7 có kịch bản demo.
8. [FR-SRCH-004: Phân trang](./08-phan-trang.md) — mục 7 có kịch bản demo.

Các bài này có thể đưa vào phụ lục hoặc in PDF từ Markdown; ảnh dùng đường dẫn tương đối để đi cùng repo.

## Cập nhật kiểm thử ở nhánh báo cáo

Commit `e2d8d30` có thêm kiểm thử domain và dịch vụ thật. [TESTING_REAL_SERVICES.md](../../../backend/TESTING_REAL_SERVICES.md) ghi nhận **160/160 test backend, coverage 84,69%** và CRUD nguyên liệu qua API/JWT/PostgreSQL thật; chưa phải test trình duyệt. Kết quả mới này được bổ sung vào báo cáo nguyên liệu, không áp dụng ngược cho snapshot của các feat khác. Nhánh tại thời điểm ghi nhận kiểm thử cũ: `feat-baocaotientrinhbailam`.

## Cập nhật tích hợp master — 21/10/2026

Đã fetch origin và đối chiếu master mới nhất tại `1ed7022`. Theo phạm vi đã xác nhận, chỉ tích hợp **FR-RCP-009** vào nhánh local `feat/integrate-ingredients-master`, dùng DashboardLayout/Zustand/API /recipes/manage của master mới. Bản tích hợp đã được commit tại fc4de45 và được đưa về nhánh `feat-frontend-add/delete/fix-ingredient-management` để bàn giao; lần cập nhật này chưa push hoặc merge vào master.

[Báo cáo tích hợp và cách chạy mới](./09-tich-hop-nguyen-lieu-master.md) có ảnh desktop/mobile và kết quả Edge + API + PostgreSQL thật, không mô phỏng kết nối. Kết quả mới: frontend 160/160 test, build/lint passed; backend sau bổ sung kiểm thử đạt 202/202 test, pnpm test pass với coverage dòng code 89,23% ≥ 80%. Kết quả kiểm thử/coverage của các snapshot cũ bên trên chỉ thuộc đúng phiên bản lịch sử đó.
### Coverage backend đã đạt yêu cầu

Ngày 21/10/2026 đã bổ sung kiểm thử domain và dịch vụ thật cho bản tích hợp master mới: **18 test files, 202 tests passed, lines coverage 89,23%**, lệnh `pnpm test` exit code 0. Giữ nguyên ngưỡng 80% và phạm vi đo. Xem [báo cáo cập nhật](./09-tich-hop-nguyen-lieu-master.md#6-cập-nhật-coverage-đạt-yêu-cầu--21102026) và [hướng dẫn test dịch vụ thật](../../../backend/TESTING_REAL_SERVICES.md).
