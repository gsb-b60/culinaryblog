#!/usr/bin/env python3
"""Generate web-showcase.html — Part 6: Global Error States + Closing"""
import os
from gen_utils import *

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web-showcase.html")

h = ""

# ===================== G404: 404 NOT FOUND =====================
h += '<section id="g404" class="mb-16">\n'
h += '<div class="mb-6"><div class="flex items-center gap-3 mb-2"><span class="px-2.5 py-0.5 bg-surface-600 text-white text-xs font-bold rounded">G1</span><h2 class="text-2xl font-bold text-surface-900">404 — Không tìm thấy</h2></div><div class="flex items-center gap-4 text-sm text-surface-500"><span class="px-2 py-0.5 bg-surface-100 text-surface-600 text-xs rounded font-medium">Global Error</span><span class="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded font-medium">HTTP 404</span></div><p class="text-sm text-surface-400 mt-1">Trang hoặc tài nguyên không tồn tại. Xem Desktop 1440px + Mobile 375px. Hiển thị nút quay về trang chủ.</p></div>'
h += '<div class="space-y-10">'

# -- Desktop --
h += frame_open("Desktop", 1440, "404 Page", description="Desktop 1440px — Trang lỗi 404: Icon warning lớn, số '404' khổng lồ màu xám nhạt, 'Không tìm thấy công thức', 'Công thức bạn tìm kiếm không tồn tại đã bị xóa hoặc đường dẫn không chính xác.', 2 nút (Về trang chủ + Xem công thức khác)", frame_id="error-404-1-404-page")
h += '<div class="bg-white min-h-[600px]">\n'
h += nav_bar(logged_in=False)
h += '''<div class="max-w-4xl mx-auto px-8 py-24 text-center">
<div class="w-24 h-24 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-8 text-surface-300">
<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
</div>
<h1 class="text-7xl font-extrabold text-surface-200 mb-4">404</h1>
<h2 class="text-2xl font-bold text-surface-700 mb-3">Trang khong tìm thấy</h2>
<p class="text-surface-400 mb-8 max-w-lg mx-auto">Trang ban dang tim kiem khong ton tai, da bi xoa, hoặc đường dẫn khong chính xác. Vui lòng kiem tra lai URL.</p>
<div class="flex justify-center gap-3">
<a href="#" class="px-6 py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600">Về trang chủ</a>
<a href="#" class="px-6 py-3 border border-surface-300 rounded-lg font-medium hover:bg-surface-50">Xem cong thuc</a>
<a href="#" class="px-6 py-3 border border-surface-300 rounded-lg font-medium hover:bg-surface-50">Đăng nhập</a>
</div></div></div>\n'''
h += frame_close()

# -- Mobile --
h += frame_open("Mobile", 375, "404 Page", description="Responsive Mobile 375px: Trang 404 rút gọn — icon warning, '404', 'Không tìm thấy', 2 nút xếp dọc", frame_id="error-404-2-404-page")
h += '<div class="bg-white min-h-[600px]" style="max-width:375px;position:relative">\n'
h += nav_bar(mobile=True, logged_in=False)
h += '<div class="px-5 py-16 text-center"><h1 class="text-5xl font-extrabold text-surface-200 mb-3">404</h1><h2 class="text-lg font-bold text-surface-700 mb-2">Trang khong tìm thấy</h2><p class="text-sm text-surface-400 mb-6">Duong dan khong chính xác.</p><a href="#" class="inline-block px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium">Về trang chủ</a></div>'
h += mobile_bottom_nav()
h += '</div>\n'
h += frame_close()

h += '</div></section>\n'

# ===================== GNET: NETWORK ERROR =====================
h += '<section id="gnet" class="mb-16">\n'
h += '<div class="mb-6"><div class="flex items-center gap-3 mb-2"><span class="px-2.5 py-0.5 bg-surface-600 text-white text-xs font-bold rounded">G2</span><h2 class="text-2xl font-bold text-surface-900">Mất kết nối mạng</h2></div><div class="flex items-center gap-4 text-sm text-surface-500"><span class="px-2 py-0.5 bg-surface-100 text-surface-600 text-xs rounded font-medium">Global Error</span><span class="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded font-medium">Network Failure</span></div><p class="text-sm text-surface-400 mt-1">Lỗi kết nối mạng — mất internet hoặc server không phản hồi. Xem Desktop 1440px + Mobile 375px. Hiển thị nút tải lại.</p></div>'
h += '<div class="space-y-10">'

# -- Desktop --
h += frame_open("Desktop", 1440, "Network Error", description="Desktop 1440px — Lỗi mạng: Icon wifi-off lớn, 'Mất kết nối mạng', 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet và thử lại.', nút 'Tải lại', RFC 7807 JSON {type: NETWORK_ERROR, status: 0}", frame_id="error-network-1-network-error")
h += '<div class="bg-white min-h-[600px]">\n'
h += nav_bar(logged_in=False)
h += '''<div class="max-w-4xl mx-auto px-8 py-24 text-center">
<div class="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 text-red-400">''' + ICO["wifi_off"] + '''</div>
<h2 class="text-2xl font-bold text-surface-700 mb-3">Khong the ket noi</h2>
<p class="text-surface-400 mb-8 max-w-lg mx-auto">May chu khong phan hoi. Vui lòng kiem tra ket noi mang cua ban va thu lai.</p>
<div class="bg-surface-50 rounded-xl p-5 max-w-md mx-auto text-left mb-8">
<h3 class="font-bold text-sm text-surface-700 mb-2">Thông tin ky thuat</h3>
<pre class="text-xs text-surface-500 overflow-x-auto">{"type":"NETWORK_ERROR","title":"Service Unavailable","status":503,"detail":"Unable to connect to the server. Please try again later."}</pre>
</div>
<button onclick="window.location.reload()" class="px-6 py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 flex items-center gap-2 mx-auto">
<span>''' + ICO["refresh"] + '''</span> Thử lại
</button></div></div>\n'''
h += frame_close()

# -- Mobile --
h += frame_open("Mobile", 375, "Network Error", description="Responsive Mobile 375px: Lỗi mạng rút gọn — icon wifi-off, 'Mất kết nối', nút 'Tải lại'", frame_id="error-network-2-network-error")
h += '<div class="bg-white min-h-[600px]" style="max-width:375px;position:relative">\n'
h += nav_bar(mobile=True, logged_in=False)
h += '<div class="px-5 py-16 text-center"><div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 text-red-400">' + ICO["wifi_off"] + '</div><h2 class="text-lg font-bold text-surface-700 mb-2">Mat ket noi</h2><p class="text-sm text-surface-400 mb-5">Kiem tra mang va thu lai.</p><button onclick="window.location.reload()" class="px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium">' + ICO["refresh"] + ' Thử lại</button></div>'
h += mobile_bottom_nav()
h += '</div>\n'
h += frame_close()

h += '</div></section>\n'

# ===================== G429: RATE LIMIT =====================
h += '<section id="g429" class="mb-16">\n'
h += '<div class="mb-6"><div class="flex items-center gap-3 mb-2"><span class="px-2.5 py-0.5 bg-surface-600 text-white text-xs font-bold rounded">G3</span><h2 class="text-2xl font-bold text-surface-900">429 — Giới hạn tốc độ</h2></div><div class="flex items-center gap-4 text-sm text-surface-500"><span class="px-2 py-0.5 bg-surface-100 text-surface-600 text-xs rounded font-medium">Global Error</span><span class="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded font-medium">HTTP 429</span></div><p class="text-sm text-surface-400 mt-1">Quá nhiều yêu cầu — hiển thị RFC 7807, Header Retry-After, thanh tiến trình倒计时. Xem Desktop 1440px + Mobile 375px.</p></div>'
h += '<div class="space-y-10">'

# -- Desktop --
h += frame_open("Desktop", 1440, "Rate Limited", description="Desktop 1440px — Giới hạn tốc độ: Icon clock lớn, 'Quá nhiều yêu cầu', 'Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng chờ rồi thử lại.', Header 'Retry-After: 30 giây', thanh tiến trình倒计时, RFC 7807 JSON {type: RATE_LIMITED, status: 429}", frame_id="error-rate-limit-1-rate-limited")
h += '<div class="bg-white min-h-[600px]">\n'
h += nav_bar(logged_in=False)
h += '''<div class="max-w-4xl mx-auto px-8 py-24 text-center">
<div class="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 text-amber-500">''' + ICO["warning"] + '''</div>
<h2 class="text-2xl font-bold text-surface-700 mb-3">Ban da gui qua nhieu yeu cau</h2>
<p class="text-surface-400 mb-8 max-w-lg mx-auto">He thong phat hien qua nhieu yeu cau tu ban. Vui lòng doi mot chut truoc khi thu lai. Retry-After: 30 giay.</p>
<div class="bg-surface-50 rounded-xl p-5 max-w-md mx-auto text-left mb-8">
<h3 class="font-bold text-sm text-surface-700 mb-2">Response Header</h3>
<pre class="text-xs text-surface-500 overflow-x-auto">X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1700000030
Retry-After: 30</pre>
<h3 class="font-bold text-sm text-surface-700 mt-4 mb-2">Response Body (RFC 7807)</h3>
<pre class="text-xs text-surface-500 overflow-x-auto">{"type":"RATE_LIMIT_EXCEEDED","title":"Too Many Requests","status":429,"detail":"Request limit exceeded. Please wait before retrying."}</pre>
</div>
<div class="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-md mx-auto flex items-center gap-3">
<div class="text-amber-500 flex-shrink-0">''' + ICO["clock"] + '''</div>
<div><p class="text-sm font-medium text-amber-800">Vui lòng doi <strong>30 giay</strong></p>
<div class="w-full bg-amber-200 rounded-full h-2 mt-2"><div class="bg-amber-500 h-2 rounded-full" style="width:100%"></div></div></div></div>
</div></div>\n'''
h += frame_close()

# -- Mobile --
h += frame_open("Mobile", 375, "Rate Limited", description="Responsive Mobile 375px: Rate limit rút gọn — icon clock, 'Quá nhiều yêu cầu', thanh tiến trình, nút 'Thử lại sau {thời gian}'", frame_id="error-rate-limit-2-rate-limited")
h += '<div class="bg-white min-h-[600px]" style="max-width:375px;position:relative">\n'
h += nav_bar(mobile=True, logged_in=False)
h += '<div class="px-5 py-16 text-center"><div class="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5 text-amber-500">' + ICO["warning"] + '</div><h2 class="text-lg font-bold text-surface-700 mb-2">Gui qua nhieu yeu cau</h2><p class="text-sm text-surface-400 mb-4">Vui lòng doi 30 giay.</p><div class="w-full bg-amber-200 rounded-full h-2 mb-4"><div class="bg-amber-500 h-2 rounded-full" style="width:100%"></div></div><p class="text-xs text-surface-400">Retry-After: 30s</p></div>'
h += mobile_bottom_nav()
h += '</div>\n'
h += frame_close()

h += '</div></section>\n'

# ===================== G403: FORBIDDEN =====================
h += '<section id="g403" class="mb-16">\n'
h += '<div class="mb-6"><div class="flex items-center gap-3 mb-2"><span class="px-2.5 py-0.5 bg-surface-600 text-white text-xs font-bold rounded">G4</span><h2 class="text-2xl font-bold text-surface-900">403 — Cấm truy cập</h2></div><div class="flex items-center gap-4 text-sm text-surface-500"><span class="px-2 py-0.5 bg-surface-100 text-surface-600 text-xs rounded font-medium">Global Error</span><span class="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded font-medium">HTTP 403</span></div><p class="text-sm text-surface-400 mt-1">Không có quyền truy cập — hiển thị RFC 7807 và gợi ý liên hệ Admin. Xem Desktop 1440px + Mobile 375px.</p></div>'
h += '<div class="space-y-10">'

h += frame_open("Desktop", 1440, "Forbidden", description="Desktop 1440px — Lỗi quyền truy cập: Icon shield đỏ lớn, '403', 'Cấm truy cập', 'Tài khoản của bạn không có đủ quyền để truy cập trang này. Vui lòng liên hệ Admin nếu bạn cho đây là lỗi.', RFC 7807 JSON {type: RECIPE_FORBIDDEN, status: 403}, nút 'Về trang chủ'", frame_id="error-forbidden-1-forbidden")
h += '<div class="bg-white min-h-[600px]">\n'
h += nav_bar(logged_in=True)
h += '<div class="max-w-4xl mx-auto px-8 py-24 text-center"><div class="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 text-red-400">' + ICO["shield"] + '</div><h2 class="text-2xl font-bold text-surface-700 mb-3">Ban khong co quyen truy cap</h2><p class="text-surface-400 mb-8 max-w-lg mx-auto">Tai khoan cua ban khong co du quyen de truy cap trang nay. Vui lòng lien he Admin neu ban coi day la loi.</p><div class="bg-surface-50 rounded-xl p-5 max-w-md mx-auto text-left mb-8"><pre class="text-xs text-surface-500 overflow-x-auto">{"type":"RECIPE_FORBIDDEN","title":"Forbidden","status":403,"detail":"You are not the owner of this recipe."}</pre></div><a href="#" class="px-6 py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600">Về trang chủ</a></div></div>\n'
h += frame_close()

h += frame_open("Mobile", 375, "Forbidden", description="Responsive Mobile 375px: Lỗi 403 rút gọn — icon shield đỏ, 'Cấm truy cập', RFC 7807 JSON, nút 'Về trang chủ'", frame_id="error-forbidden-2-forbidden")
h += '<div class="bg-white min-h-[600px]" style="max-width:375px;position:relative">\n'
h += nav_bar(mobile=True, logged_in=True)
h += '<div class="px-5 py-16 text-center"><div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 text-red-400">' + ICO["shield"] + '</div><h2 class="text-lg font-bold text-surface-700 mb-2">Cam truy cap</h2><p class="text-sm text-surface-400 mb-4">Ban khong co quyen.</p><a href="#" class="px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium">Về trang chủ</a></div>'
h += mobile_bottom_nav()
h += '</div>\n'
h += frame_close()

h += '</div></section>\n'

# ===================== G409: CONFLICT =====================
h += '<section id="g409" class="mb-16">\n'
h += '<div class="mb-6"><div class="flex items-center gap-3 mb-2"><span class="px-2.5 py-0.5 bg-surface-600 text-white text-xs font-bold rounded">G5</span><h2 class="text-2xl font-bold text-surface-900">409 — Trùng lặp dữ liệu</h2></div><div class="flex items-center gap-4 text-sm text-surface-500"><span class="px-2 py-0.5 bg-surface-100 text-surface-600 text-xs rounded font-medium">Global Error</span><span class="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded font-medium">HTTP 409</span></div><p class="text-sm text-surface-400 mt-1">Xung đột dữ liệu — slug trùng hoặc phiên bản tài nguyên. Xem Desktop 1440px + Mobile 375px. Trạng thái: Slug trùng, Xung đột phiên bản (422).</p></div>'
h += '<div class="space-y-10">'

h += frame_open("Desktop", 1440, "Conflict — Slug Duplicate", description="Desktop 1440px — Trùng lặp Slug: Thông báo vàng 'Trùng lặp dữ liệu', 'Công thức đã tồn tại. Slug tự động thêm hậu tố.', ví dụ 'pho-bo-ha-noi-2', nút 'Thử lại'", frame_id="error-conflict-1-conflict-—-slug-dup")
h += '<div class="bg-surface-50 min-h-[600px] flex items-center justify-center p-8">\n'
h += '<div class="w-full max-w-md"><div class="bg-white rounded-xl border border-surface-200 p-6 shadow-sm"><div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-start gap-3" role="alert"><div class="text-amber-500">' + ICO["warning"] + '</div><div><p class="text-sm font-medium text-amber-800">Trung lap ten cong thuc</p><p class="text-xs text-amber-600 mt-1">Mot cong thuc voi ten tuong tu da ton tai. Slug se tu dong duoc them hau to (pho-bo-1, pho-bo-2...).</p><pre class="mt-2 text-[10px] text-amber-600 bg-amber-100 p-2 rounded overflow-x-auto">{"type":"RECIPE_SLUG_EXISTS","title":"Slug Already Exists","status":409,"detail":"A recipe with this title already exists. Slug has been auto-generated with a suffix."}</pre></div></div><button class="w-full py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">Hieu roi, thu lai</button></div></div></div>\n'
h += frame_close()

h += frame_open("Desktop", 1440, "Conflict — Concurrency (422)", description="Desktop 1440px — Xung đột Phiên bản: Thông báo đỏ 'Trùng lặp dữ liệu', 'Công thức này đã được chỉnh sửa bởi người dùng khác. Vui lòng tải lại trang để lấy dữ liệu mới nhất.', RFC 7807 JSON {type: RECIPE_CONCURRENCY_CONFLICT, status: 422}, 2 nút (Hủy + Tải lại)", frame_id="error-conflict-2-conflict-—-concurrency-(422)")
h += '<div class="bg-surface-50 min-h-[600px] flex items-center justify-center p-8">\n'
h += '<div class="w-full max-w-md"><div class="bg-white rounded-xl border border-surface-200 p-6 shadow-sm"><div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3" role="alert"><div class="text-red-500">' + ICO["x"] + '</div><div><p class="text-sm font-medium text-red-800">Trung lap du lieu</p><p class="text-xs text-red-600 mt-1">Công thức nay da duoc chinh sua boi nguoi dung khac. Vui lòng tai lai trang de lay du lieu moi nhat.</p><pre class="mt-2 text-[10px] text-red-500 bg-red-100 p-2 rounded overflow-x-auto">{"type":"RECIPE_CONCURRENCY_CONFLICT","title":"Version Conflict","status":422,"detail":"The resource was updated by another request. Please reload."}</pre></div></div><div class="flex gap-3"><button class="flex-1 py-2.5 border border-surface-300 rounded-lg text-sm font-medium hover:bg-surface-50">Huy</button><button class="flex-1 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">' + ICO["refresh"] + ' Tải lại</button></div></div></div></div>\n'
h += frame_close()

h += frame_open("Mobile", 375, "Conflict", description="Responsive Mobile 375px: 409 Conflict rút gọn — thông báo vàng 'Trùng lặp', slug tự động thêm hậu tố, nút 'Thử lại'", frame_id="error-conflict-3-conflict")
h += '<div class="bg-white min-h-[600px] flex items-center justify-center p-5" style="max-width:375px;position:relative">\n'
h += '<div class="w-full"><div class="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center"><div class="text-amber-500 mb-3">' + ICO["warning"] + '</div><h3 class="font-bold text-amber-800 mb-1">Trung lap du lieu</h3><p class="text-xs text-amber-600 mb-3">Công thức da ton tai. Slug tu dong them hau to.</p><button class="w-full py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium">Thử lại</button></div></div></div>\n'
h += frame_close()

h += '</div></section>\n'

# ===================== CLOSING =====================
h += '''
<footer class="bg-surface-800 text-surface-300 px-8 py-6 mt-8">
<div class="max-w-6xl mx-auto text-center">
<p class="text-sm">Culinary Blog — UI Showcase &bull; 14 Man hinh &bull; 3 Kich thuoc &bull; 5 Trang thai</p>
<p class="text-xs text-surface-500 mt-2">Duoc tao tu tai lieu SRS — Phiên bản 1.0</p>
</div>
</footer>
<script>
document.addEventListener('click', function(e) {
  var link = e.target.closest('a[href="#"]');
  if (link) e.preventDefault();
});
</script>
</body>
</html>
'''

with open(OUT, "a", encoding="utf-8") as f:
    f.write(h)
print(f"Part 6 done. File size: {os.path.getsize(OUT):,} bytes")