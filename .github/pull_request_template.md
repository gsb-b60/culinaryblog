## 1. Thông tin thành viên
| Họ tên | MSSV | Vai trò |
|---|---|---|
| Person 1 (điền họ tên và MSSV) | Chưa cung cấp | Backend |

---

## 2. FR name
<!-- Copy từ docs/03-fr-*.md hoặc srs.md, ví dụ: FR-AUTH-001 - User Registration -->
FR-AUTH-004 - Refresh Access Token Using Refresh Token

---

## 3. Issue name
<!-- Copy đúng tiêu đề Issue từ docs/issues/person-1.md, ví dụ: Issue #1 — FR-AUTH-001: User Registration -->
Issue #4 — FR-AUTH-004: Refresh Access Token

**Link:** [docs/issues/person-1.md](../docs/issues/person-1.md)
**Closes:** Chưa có GitHub issue number để xác nhận

---

## 4. Mô tả thay đổi
- Thêm handler `/auth/refresh` thực hiện kiểm tra token, tạo access/refresh token mới và xoay refresh token trong transaction.
- Token reuse bị từ chối, ghi security warning và thu hồi các refresh token còn hoạt động của user; DB chỉ lưu SHA-256 hash.
- File chính: `backend/src/application/commands/auth/RefreshTokenCommandHandler.ts`, `backend/prisma/schema.prisma`, `backend/tests/RefreshTokenCommandHandler.test.ts`.

---

## 5. Phạm vi
- [x] backend
- [ ] frontend
- [x] prisma-DB (schema / migration / seed)
- [ ] infra-docker (docker-compose, nginx, redis, minio)
- [x] docs

**Layer (backend):**
- [x] application
- [ ] infrastructure
- [x] presentation

---

## 6. Cách kiểm thử
1. Trong `backend`, cài dependencies rồi chạy `pnpm prisma:generate` và `pnpm db:push` để áp dụng `is_revoked`.
2. Chạy focused tests: `pnpm exec vitest run tests/RefreshTokenCommandHandler.test.ts` (8 tests).
3. Chạy toàn bộ backend checks: `pnpm test`, `pnpm lint`, `pnpm build`.
4. Khi API và database chạy, gọi `POST /api/v1/auth/refresh` với `{ "refreshToken": "..." }`; kiểm tra token mới, hash mới trong DB và token cũ bị revoke.
5. Đã chạy focused tests (8/8 pass), ESLint trên handler và DI container, Prettier check, `prisma:generate` và `prisma validate`.
6. Toàn bộ test file hiện có đều pass, nhưng `pnpm test` trả non-zero vì coverage toàn repo là 5.39%, thấp hơn ngưỡng cấu hình 80%.
7. `pnpm build` chưa pass do 4 lỗi TypeScript hiện có ở `RecipeQueryHandlers.ts` và `presentation/docs/openapi.ts`; `db:push` và live API test còn chờ database.

---

## 7. Screenshot minh chứng thành công (BẮT BUỘC)
<!-- Dán ảnh vào đây:
- UI hiển thị thành công (200/201)
- Scalar / OpenAPI response
- Terminal `pnpm test` PASS / `pnpm lint` clean
- PR thiếu screenshot → request changes
-->

Chưa có screenshot runtime: cần chạy test/API thành công và đính kèm ảnh trước khi tạo PR chính thức.

---

## 8. Checklist
- [x] ESLint trên các file triển khai Issue #4 pass
- [ ] `pnpm build` / `tsc` pass (blocked by existing unrelated TypeScript errors)
- [x] Focused `vitest` tests pass (8/8)
- [x] All current backend test files pass; global coverage threshold still fails (5.39% vs 80%)
- [x] `pnpm prisma:generate` và `prisma validate` pass
- [ ] `pnpm db:push` đã chạy
- [ ] Không commit file `.env`, secrets, keys, token
- [x] Code đã format Prettier (`pnpm exec prettier --check <changed-files>`)
- [ ] Đã tự review code trước khi tạo PR
- [ ] Không có `console.log` / debug code thừa
- [x] Documentation / comment cập nhật nếu cần