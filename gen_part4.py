#!/usr/bin/env python3
"""Part 4: M7-M8 Auth screens (writes directly)"""
import os
from gen_utils import *

OUT = os.path.join(os.path.dirname(__file__), "web-showcase.html")
h = ""

# ===================== M7: LOGIN =====================
h += section_header("m7", "Đăng nhập", "/auth/login", "CSR", "No (redirect if logged in)", "Form đăng nhập — Google OAuth + Email/Mật khẩu, RFC 7807 lỗi. Xem Desktop 1440px + Mobile 375px. Trạng thái: Nội dung, Lỗi xác thực (401 AUTH_INVALID_CREDENTIALS).")
# M7 Desktop Populated
h += frame_open("Desktop", 1440, "Populated", description="Desktop 1440px — Trang đăng nhập: Form ở giữa màn hình, icon book cam lớn, tiêu đề 'Đăng nhập', nút 'Tiếp tục với Google' có icon, разделитель 'hoặc', trường Email (đã điền an@example.com) + Mat khau (đã điền), checkbox 'Nhớ đăng nhập', liên kết 'Quên mật khẩu?', nút 'Đăng nhập', 'Chưa có tài khoản? Đăng ký ngay'", frame_id="login-1-populated")
h += '<div class="bg-surface-50 min-h-[600px] flex items-center justify-center p-8">\n'
h += '<div class="w-full max-w-md"><div class="text-center mb-8"><div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">'+ICO["book"]+'</div><h1 class="text-2xl font-bold text-surface-900">Đăng nhập</h1><p class="text-sm text-surface-500 mt-1">Chào mừng bạn trở lại Culinary Blog</p></div>'
h += '<div class="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">'
h += '<button class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-surface-300 rounded-lg text-sm font-medium hover:bg-surface-50 transition mb-4" aria-label="Đăng nhập voi Google"><span class="w-5 h-5">'+ICO["google"]+'</span>Tiep tuc voi Google</button>'
h += '<div class="flex items-center gap-4 my-4"><div class="flex-1 border-t border-surface-200"></div><span class="text-xs text-surface-400">hoặc</span><div class="flex-1 border-t border-surface-200"></div></div>'
h += '<form aria-label="Form dang nhap"><div class="space-y-4">'
h += '<div><label for="login-email" class="block text-sm font-medium text-surface-700 mb-1">Email</label><input type="email" id="login-email" value="an@example.com" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200" required/></div>'
h += '<div><label for="login-pass" class="block text-sm font-medium text-surface-700 mb-1">Mật khẩu</label><input type="password" id="login-pass" value="********" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200" required/></div>'
h += '<div class="flex items-center justify-between"><label class="flex items-center gap-2 text-sm text-surface-600"><input type="checkbox" class="rounded border-surface-300" checked/> Ghi nho dang nhap</label><a href="#" class="text-sm text-brand-600 hover:text-brand-700">Quên mật khẩu?</a></div>'
h += '<div class="flex justify-center mt-6"><button type="submit" class="w-48 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 text-sm inline-flex items-center justify-center">Đăng nhập</button></div></div></form>'
h += '<p class="text-center text-sm text-surface-500 mt-4">Chưa có tài khoản? <a href="#" class="text-brand-600 font-medium hover:text-brand-700">Đăng ký ngay</a></p></div></div></div>\n'
h += frame_close()
# M7 Error
h += frame_open("Desktop", 1440, "Error - Invalid Credentials", "state-error", description="Trạng thái Lỗi 401: Form đăng nhập với thông báo lỗi đỏ trên cùng — 'Đăng nhập thất bại', 'Email hoặc mật khẩu không chính xác', RFC 7807 JSON chi tiết {type: AUTH_INVALID_CREDENTIALS, status: 401}, trường email/mat khau có viền đỏ", frame_id="login-2-error---invalid-credentials")
h += '<div class="bg-surface-50 min-h-[600px] flex items-center justify-center p-8">\n'
h += '<div class="w-full max-w-md"><div class="text-center mb-8"><div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">'+ICO["book"]+'</div><h1 class="text-2xl font-bold text-surface-900">Đăng nhập</h1></div>'
h += '<div class="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">'
h += '<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3" role="alert"><div class="text-red-500 flex-shrink-0 mt-0.5">'+ICO["x"]+'</div><div class="min-w-0 flex-1"><p class="text-sm font-medium text-red-800">Đăng nhập that bai</p><p class="text-xs text-red-600 mt-1">Email hoặc mat khau khong chính xác.</p></div></div>'
h += '<form><div class="space-y-4"><div><label for="login-email-err" class="block text-sm font-medium text-surface-700 mb-1">Email</label><input type="email" id="login-email-err" value="an@example.com" class="w-full px-4 py-2.5 border border-red-300 rounded-lg text-sm bg-red-50"/></div>'
h += '<div><label for="login-pass-err" class="block text-sm font-medium text-surface-700 mb-1">Mật khẩu</label><input type="password" id="login-pass-err" value="wrongpass" class="w-full px-4 py-2.5 border border-red-300 rounded-lg text-sm bg-red-50"/><p class="text-xs text-red-500 mt-1">Mật khẩu không đúng</p></div>'
h += '<div class="flex justify-center mt-6"><button type="submit" class="w-48 py-2.5 bg-brand-500 text-white rounded-lg font-medium text-sm inline-flex items-center justify-center">Đăng nhập</button></div></div></form></div></div></div>\n'
h += frame_close()
# M7 Mobile
h += frame_open("Mobile", 375, "Populated", description="Responsive Mobile 375px: Form đăng nhập rút gọn — icon book nhỏ, tiêu đề 'Đăng nhập', nút Google, trường email + mật khẩu dạng cột đơn, nút 'Đăng nhập', 'Chưa có tài khoản? Đăng ký'", frame_id="login-3-populated")
h += '<div class="bg-surface-50 h-full flex items-center justify-center p-5" style="max-width:375px;position:relative">\n'
h += '<div class="w-full max-w-sm"><div class="text-center mb-6"><div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-3" aria-hidden="true">'+ICO["book"]+'</div><h1 class="text-xl font-bold text-surface-900">Đăng nhập</h1></div>'
h += '<div class="bg-white rounded-xl border border-surface-200 p-5"><button class="w-full flex items-center justify-center gap-2 px-4 py-3 border border-surface-300 rounded-lg text-sm mb-3"><span class="w-5 h-5">'+ICO["google"]+'</span> Google</button>'
h += '<div class="flex items-center gap-3 my-3"><div class="flex-1 border-t border-surface-200"></div><span class="text-xs text-surface-400">hoặc</span><div class="flex-1 border-t border-surface-200"></div></div>'
h += '<form><div class="space-y-3"><div><label for="m-login-email" class="block text-xs font-medium text-surface-700 mb-1">Email</label><input type="email" id="m-login-email" class="w-full px-3 py-2.5 border border-surface-300 rounded-lg text-sm"/></div>'
h += '<div><label for="m-login-pass" class="block text-xs font-medium text-surface-700 mb-1">Mật khẩu</label><input type="password" id="m-login-pass" class="w-full px-3 py-2.5 border border-surface-300 rounded-lg text-sm"/></div>'
h += '<div class="flex justify-center mt-4"><button type="submit" class="w-40 py-2.5 bg-brand-500 text-white rounded-lg font-medium text-sm inline-flex items-center justify-center">Đăng nhập</button></div></div></form>'
h += '<p class="text-center text-xs text-surface-500 mt-3">Chưa có tài khoản? <a href="#" class="text-brand-600 font-medium">Đăng ký</a></p></div></div></div>\n'
h += frame_close()
h += section_close()

# ===================== M8: REGISTER =====================
h += section_header("m8", "Đăng ký", "/auth/register", "CSR", "No", "Form đăng ký — Tạo tài khoản mới, xác thực mật khẩu, điều khoản. Xem Desktop 1440px + Mobile 375px. Trạng thái: Nội dung, Lỗi email trùng (409 AUTH_EMAIL_EXISTS), Đang tải.")
# M8 Desktop Populated
h += frame_open("Desktop", 1440, "Populated", description="Desktop 1440px — Trang đăng ký: Icon book cam lớn, tiêu đề 'Đ đăng ký tài khoản', nút Google, trường Họ tên + Email + Tên người dùng + Mật khẩu (gợi ý 'Tối thiểu 8 ký tự') + Nhập lại mật khẩu, checkbox đồng ý điều khoản, nút 'Đăng ký', 'Đã có tài khoản? Đăng nhập'", frame_id="register-1-populated")
h += '<div class="bg-surface-50 min-h-[600px] flex items-center justify-center p-8">\n'
h += '<div class="w-full max-w-md"><div class="text-center mb-8"><div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">'+ICO["book"]+'</div><h1 class="text-2xl font-bold text-surface-900">Đăng ký tai khoan</h1><p class="text-sm text-surface-500 mt-1">Tạo tài khoản de bat dau chia se cong thuc</p></div>'
h += '<div class="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">'
h += '<button class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-surface-300 rounded-lg text-sm font-medium hover:bg-surface-50 transition mb-4"><span class="w-5 h-5">'+ICO["google"]+'</span> Đăng ký voi Google</button>'
h += '<div class="flex items-center gap-4 my-4"><div class="flex-1 border-t border-surface-200"></div><span class="text-xs text-surface-400">hoặc</span><div class="flex-1 border-t border-surface-200"></div></div>'
h += '<form aria-label="Form dang ky"><div class="space-y-4">'
h += '<div><label for="reg-name" class="block text-sm font-medium text-surface-700 mb-1">Họ tên</label><input type="text" id="reg-name" placeholder="Nguyen Van A" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200" required/></div>'
h += '<div><label for="reg-email" class="block text-sm font-medium text-surface-700 mb-1">Email</label><input type="email" id="reg-email" placeholder="email@example.com" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200" required/></div>'
h += '<div><label for="reg-user" class="block text-sm font-medium text-surface-700 mb-1">Tên người dùng</label><input type="text" id="reg-user" placeholder="nguyenvana" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm" required/></div>'
h += '<div><label for="reg-pass" class="block text-sm font-medium text-surface-700 mb-1">Mật khẩu</label><input type="password" id="reg-pass" placeholder="Toi thieu 8 ky tu" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm" required/><p class="text-xs text-surface-400 mt-1">Toi thieu 8 ky tu, 1 chu hoa, 1 so, 1 ky tu dac biet</p></div>'
h += '<div><label for="reg-pass2" class="block text-sm font-medium text-surface-700 mb-1">Nhập lại mật khẩu</label><input type="password" id="reg-pass2" placeholder="Nhập lại mật khẩu" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm" required/></div>'
h += '<label class="flex items-start gap-2 text-sm text-surface-600"><input type="checkbox" class="rounded border-surface-300 mt-0.5" required/><span>Toi dong y voi <a href="#" class="text-brand-600 hover:underline">Điều khoản</a> va <a href="#" class="text-brand-600 hover:underline">Chính sách</a></span></label>'
h += '<div class="flex justify-center mt-6"><button type="submit" class="w-48 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 text-sm inline-flex items-center justify-center">Đăng ký</button></div></div></form>'
h += '<p class="text-center text-sm text-surface-500 mt-4">Đã có tài khoản? <a href="#" class="text-brand-600 font-medium hover:text-brand-700">Đăng nhập</a></p></div></div></div>\n'
h += frame_close()
# M8 Desktop Error (email exists)
h += frame_open("Desktop", 1440, "Error - Email Exists", "state-error", description="Trạng thái Lỗi 409: Form đăng ký với thông báo lỗi đỏ — 'Email đã được sử dụng', 'Email này đã được đăng ký. Vui lòng sử dụng email khác.', RFC 7807 JSON {type: AUTH_EMAIL_EXISTS, status: 409}, trường email có viền đỏ", frame_id="register-2-error---email-exists")
h += '<div class="bg-surface-50 min-h-[600px] flex items-center justify-center p-8">\n'
h += '<div class="w-full max-w-md"><div class="text-center mb-8"><div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">'+ICO["book"]+'</div><h1 class="text-2xl font-bold text-surface-900">Đăng ký tai khoan</h1></div>'
h += '<div class="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">'
h += '<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3" role="alert"><div class="text-red-500">'+ICO["x"]+'</div><div class="min-w-0 flex-1"><p class="text-sm font-medium text-red-800">Email da duoc su dung</p><p class="text-xs text-red-600 mt-1">Email nay da duoc dang ky. Vui lòng su dung email khac.</p></div></div>'
h += '<form><div class="space-y-4"><div><label for="reg-name-err" class="block text-sm font-medium text-surface-700 mb-1">Họ tên</label><input type="text" id="reg-name-err" value="Nguyen Van A" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm"/></div>'
h += '<div><label for="reg-email-err" class="block text-sm font-medium text-surface-700 mb-1">Email</label><input type="email" id="reg-email-err" value="an@example.com" class="w-full px-4 py-2.5 border border-red-300 rounded-lg text-sm bg-red-50"/></div>'
h += '<div class="flex justify-center mt-6"><button type="submit" class="w-48 py-2.5 bg-brand-500 text-white rounded-lg font-medium text-sm inline-flex items-center justify-center">Đăng ký</button></div></div></form></div></div></div>\n'
h += frame_close()
# M8 Loading
h += frame_open("Desktop", 1440, "Loading", "state-loading", description="Trạng thái Loading: Skeleton shimmer cho toàn bộ form đăng ký — skeleton cho tiêu đề, skeleton cho nút Google, skeleton cho các trường nhập liệu, skeleton cho nút đăng ký", frame_id="register-3-loading")
h += '<div class="bg-surface-50 min-h-[600px] flex items-center justify-center p-8">\n'
h += '<div class="w-full max-w-md"><div class="skeleton h-8 w-48 mx-auto mb-2"></div><div class="skeleton h-4 w-64 mx-auto mb-8"></div><div class="bg-white rounded-xl border border-surface-200 p-6 space-y-4"><div class="skeleton h-12 w-full"></div><div class="skeleton h-4 w-20 mx-auto"></div><div class="space-y-3"><div class="skeleton h-10 w-full"></div><div class="skeleton h-10 w-full"></div><div class="skeleton h-10 w-full"></div></div><div class="skeleton h-10 w-full rounded-lg"></div></div></div></div>\n'
h += frame_close()
# M8 Mobile
h += frame_open("Mobile", 375, "Populated", description="Responsive Mobile 375px: Form đăng ký rút gọn — icon nhỏ, tiêu đề 'Đăng ký', nút Google, trường Họ tên + Email + Mật khẩu, nút 'Đăng ký', 'Đã có tài khoản? Đăng nhập'", frame_id="register-4-populated")
h += '<div class="bg-surface-50 h-full flex items-center justify-center p-5" style="max-width:375px;position:relative">\n'
h += '<div class="w-full max-w-sm"><div class="text-center mb-6"><div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-3" aria-hidden="true">'+ICO["book"]+'</div><h1 class="text-xl font-bold text-surface-900">Đăng ký</h1></div>'
h += '<div class="bg-white rounded-xl border border-surface-200 p-5"><button class="w-full flex items-center justify-center gap-2 px-4 py-3 border border-surface-300 rounded-lg text-sm mb-3"><span class="w-5 h-5">'+ICO["google"]+'</span> Google</button>'
h += '<div class="flex items-center gap-3 my-3"><div class="flex-1 border-t border-surface-200"></div><span class="text-xs text-surface-400">hoặc</span><div class="flex-1 border-t border-surface-200"></div></div>'
h += '<form><div class="space-y-3"><div><label for="m-reg-name" class="block text-xs font-medium text-surface-700 mb-1">Họ tên</label><input type="text" id="m-reg-name" class="w-full px-3 py-2.5 border border-surface-300 rounded-lg text-sm"/></div>'
h += '<div><label for="m-reg-email" class="block text-xs font-medium text-surface-700 mb-1">Email</label><input type="email" id="m-reg-email" class="w-full px-3 py-2.5 border border-surface-300 rounded-lg text-sm"/></div>'
h += '<div><label for="m-reg-pass" class="block text-xs font-medium text-surface-700 mb-1">Mật khẩu</label><input type="password" id="m-reg-pass" class="w-full px-3 py-2.5 border border-surface-300 rounded-lg text-sm"/></div>'
h += '<div class="flex justify-center mt-4"><button type="submit" class="w-40 py-2.5 bg-brand-500 text-white rounded-lg font-medium text-sm inline-flex items-center justify-center">Đăng ký</button></div></div></form>'
h += '<p class="text-center text-xs text-surface-500 mt-3">Đã có tài khoản? <a href="#" class="text-brand-600 font-medium">Đăng nhập</a></p></div></div></div>\n'
h += frame_close()
h += section_close()

with open(OUT, "a", encoding="utf-8") as f:
    f.write(h)
print(f"Part 4 done. File size: {os.path.getsize(OUT):,} bytes")
