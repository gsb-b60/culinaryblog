## 1. Thông tin thành viên
| Họ tên | MSSV | Vai trò |
|---|---|---|
| Nguyễn Văn A | 22110xxx | Backend / Frontend / Fullstack |

---

## 2. FR name
<!-- Copy từ docs/03-fr-*.md hoặc srs.md, ví dụ: FR-AUTH-001 - User Registration -->
FR-XXX-XXX - Requirement Name

---

## 3. Issue name
<!-- Copy đúng tiêu đề Issue từ docs/issues/person-1.md, ví dụ: Issue #1 — FR-AUTH-001: User Registration -->
Issue #<n> — FR-XXX-XXX: <Title>

**Link:** docs/issues/person-<n>.md#issue-<n>
**Closes:** #<github-issue-number-nếu-có>

---

## 4. Mô tả thay đổi
- What / Why (1-3 dòng)
- Các file chính thay đổi:

---

## 5. Phạm vi
- [ ] backend
- [ ] frontend
- [ ] prisma-DB (schema / migration / seed)
- [ ] infra-docker (docker-compose, nginx, redis, minio)
- [ ] docs

**Layer (backend):**
- [ ] domain
- [ ] application
- [ ] infrastructure
- [ ] presentation

---

## 6. Cách kiểm thử
1. Khởi động infra: `docker-compose up -d`
2. Backend: `cd backend && pnpm install && pnpm prisma:generate && pnpm db:push && pnpm dev`
3. Frontend: `cd frontend && pnpm install && pnpm dev`
4. Test API: Scalar UI http://localhost:3000/scalar hoặc `curl`
5. Chạy test: `pnpm test` (backend) / `pnpm test` (frontend)
6. Lint: `pnpm lint` (cả 2)

---

## 7. Screenshot minh chứng thành công (BẮT BUỘC)
<!-- Dán ảnh vào đây:
- UI hiển thị thành công (200/201)
- Scalar / OpenAPI response
- Terminal `pnpm test` PASS / `pnpm lint` clean
- PR thiếu screenshot → request changes
-->

![Screenshot 1](url_hoặc_dán_ảnh_trực_tiếp)
![Screenshot 2](url_hoặc_dán_ảnh_trực_tiếp)

---

## 8. Checklist
- [ ] `pnpm lint` pass (backend + frontend)
- [ ] `pnpm build` / `tsc` pass
- [ ] `pnpm test` pass
- [ ] `pnpm prisma:generate` đã chạy nếu đổi `prisma/schema.prisma`
- [ ] Không commit file `.env`, secrets, keys, token
- [ ] Code đã format Prettier (`pnpm format`)
- [ ] Đã tự review code trước khi tạo PR
- [ ] Không có `console.log` / debug code thừa
- [ ] Documentation / comment cập nhật nếu cần