#!/usr/bin/env python3
"""Generate web-showcase.html — Part 5: M9-M14 (Dashboard)"""
import os
from gen_utils import *

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web-showcase.html")

h = ""

# ===================== M9: DASHBOARD OVERVIEW =====================
h += section_header("m9", "Tổng quan Dashboard", "/dashboard", "CSR", "Required (Author/Admin)", "Trang tổng quan — Sidebar, thống kê (tổng công thức, lượt xem, đánh giá), bảng công thức gần đây. Xem Desktop 1440px. Trạng thái: Nội dung, Đang tải.")

# -- M9 Desktop Populated --
h += frame_open("Desktop", 1440, "Populated", description="Desktop 1440px — Dashboard Tổng quan: Sidebar bên trái (Dashboard, Công thức, Hồ sơ), 4 ô thống kê (Tổng công thức: 42, Lượt xem: 12.5K, Đánh giá: 328, Người theo dõi: 89), bảng 'Công thức gần đây' 5 dòng có tên + trạng thái + danh mục + ngày tạo + thao tác", frame_id="dashboard-1-populated")
h += '<div class="bg-surface-50 min-h-[600px]">\n'
# Dashboard sidebar
h += '''<div class="flex">
<aside class="w-56 bg-surface-800 text-surface-300 min-h-[600px] p-4 flex-shrink-0" role="complementary" aria-label="Dashboard menu">
<div class="flex items-center gap-2 mb-6 px-2"><div class="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white" aria-hidden="true">''' + ICO["chart"] + '''</div><span class="font-bold text-white text-sm">Dashboard</span></div>
<div class="space-y-1">
<a href="#" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium">''' + ICO["chart"] + ''' Tổng quan</a>
<a href="#" class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-700 text-sm">''' + ICO["book"] + ''' Công thức</a>
<a href="#" class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-700 text-sm">''' + ICO["grid"] + ''' Danh mục</a>
<a href="#" class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-700 text-sm">''' + ICO["user"] + ''' Hồ sơ</a>
</div></aside>'''
h += '<div class="flex-1 p-6">'
h += '<div class="flex items-center justify-between mb-6"><h1 class="text-xl font-bold text-surface-900">Xin chao, Nguyễn Văn An!</h1><div class="flex items-center gap-2"><span class="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Author</span></div></div>'
# Stats cards
h += '<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">'
stats = [("Tong cong thuc", "12", ICO["book"], "bg-blue-100 text-blue-600"), ("Da xuat ban", "8", ICO["check"], "bg-green-100 text-green-600"), ("Ban nhap", "4", ICO["edit"], "bg-amber-100 text-amber-600"), ("Luot xem", "1,247", ICO["chart"], "bg-purple-100 text-purple-600")]
for label, val, icon, cls in stats:
    h += f'''<div class="bg-white rounded-xl border border-surface-200 p-5">
<div class="flex items-center justify-between mb-2"><span class="text-sm text-surface-500">{label}</span><div class="w-8 h-8 {cls} rounded-lg flex items-center justify-center">{icon}</div></div>
<div class="text-2xl font-bold text-surface-900">{val}</div></div>'''
h += '</div>'
# Recent recipes table
h += '<div class="bg-white rounded-xl border border-surface-200"><div class="p-5 border-b border-surface-200 flex items-center justify-between"><h2 class="font-bold text-surface-900">Công thức gan day</h2><a href="#" class="text-sm text-brand-600 hover:text-brand-700">Xem tất cả &rarr;</a></div>'
h += '<div class="overflow-x-auto"><table class="w-full text-sm" role="table"><thead class="text-left text-surface-500 bg-surface-50"><tr><th class="px-5 py-3 font-medium">Công thức</th><th class="px-5 py-3 font-medium">Trang thai</th><th class="px-5 py-3 font-medium">Danh mục</th><th class="px-5 py-3 font-medium">Ngay tao</th><th class="px-5 py-3 font-medium">Thao tac</th></tr></thead>'
h += '<tbody class="divide-y divide-surface-100">'
recipes_table = [
    ("Phở Bò Hà Nội", "Da xuat ban", "Món chính", "15/01/2026"),
    ("Bún Chả Hà Nội", "Da xuat ban", "Món chính", "12/01/2026"),
    ("Bánh Mì Thịt Nướng", "Ban nhap", "Đồ ăn sáng", "10/01/2026"),
    ("Chè Ba Màu", "Da xuat ban", "Tráng miệng", "08/01/2026"),
    ("Gỏi Cuốn Tom Thit", "Da luu tru", "Món chính", "05/01/2026"),
]
for name, status, cat, date in recipes_table:
    status_cls = {"Da xuat ban": "bg-green-100 text-green-700", "Ban nhap": "bg-amber-100 text-amber-700", "Da luu tru": "bg-surface-100 text-surface-500"}
    h += f'''<tr class="hover:bg-surface-50"><td class="px-5 py-3 font-medium text-surface-900">{name}</td>
<td class="px-5 py-3"><span class="px-2 py-0.5 {status_cls.get(status,"")} rounded text-xs font-medium">{status}</span></td>
<td class="px-5 py-3 text-surface-500">{cat}</td>
<td class="px-5 py-3 text-surface-400">{date}</td>
<td class="px-5 py-3"><div class="flex gap-2"><button class="text-surface-400 hover:text-brand-600" aria-label="Chỉnh sửa">{ICO["edit"]}</button><button class="text-surface-400 hover:text-red-500" aria-label="Xoa">{ICO["trash"]}</button></div></td></tr>'''
h += '</tbody></table></div></div>'
h += '</div></div></div>\n'
h += frame_close()

# -- M9 Desktop Loading --
h += frame_open("Desktop", 1440, "Loading", "state-loading", description="Trạng thái Loading: Sidebar skeleton, 4 ô thống kê skeleton, bảng công thức gần đây skeleton shimmer cho mỗi dòng", frame_id="dashboard-2-loading")
h += '<div class="bg-surface-50 min-h-[600px]">\n'
h += '<div class="flex"><aside class="w-56 bg-surface-800 min-h-[600px] p-4 flex-shrink-0"><div class="space-y-2 mt-8">'
for _ in range(4):
    h += '<div class="skeleton h-10 w-full bg-surface-600 rounded-lg"></div>'
h += '</div></aside><div class="flex-1 p-6"><div class="skeleton h-7 w-64 mb-6"></div><div class="grid grid-cols-4 gap-4 mb-6">'
for _ in range(4):
    h += '<div class="bg-white rounded-xl border border-surface-200 p-5 space-y-2"><div class="skeleton h-4 w-24"></div><div class="skeleton h-8 w-16"></div></div>'
h += '</div><div class="bg-white rounded-xl border border-surface-200 p-5 space-y-4"><div class="skeleton h-6 w-40"></div>'
for _ in range(5):
    h += '<div class="skeleton h-12 w-full"></div>'
h += '</div></div></div></div>\n'
h += frame_close()

# -- M9 Mobile Populated --
h += frame_open("Mobile", 375, "Populated", description="Responsive Mobile 375px: Dashboard di dong — Tiêu đề 'Xin chao, An!', 4 ô thống kê dạng grid 2 cot, danh sach 'Gan day' 3 cong thuc voi ten + danh muc + trang thai, bottom navigation", frame_id="dashboard-3-populated")
h += '<div class="bg-surface-50 min-h-[600px]" style="max-width:375px;position:relative">\n'
h += '<div class="px-5 py-4"><div class="flex items-center justify-between mb-4"><h1 class="text-lg font-bold">Xin chao, An!</h1><div class="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm">A</div></div>'
h += '<div class="grid grid-cols-2 gap-3 mb-4">'
for label, val, _, cls in stats:
    h += f'<div class="bg-white rounded-xl border border-surface-200 p-3"><div class="text-xs text-surface-500">{label}</div><div class="text-xl font-bold">{val}</div></div>'
h += '</div><h2 class="font-bold text-sm mb-3">Gan day</h2><div class="space-y-3">'
for name, status, cat, _ in recipes_table[:3]:
    status_cls = {"Da xuat ban": "bg-green-100 text-green-700", "Ban nhap": "bg-amber-100 text-amber-700", "Da luu tru": "bg-surface-100 text-surface-500"}
    h += f'<div class="bg-white rounded-xl border border-surface-200 p-3 flex items-center justify-between"><div class="min-w-0"><div class="font-medium text-sm truncate">{name}</div><div class="text-xs text-surface-400">{cat}</div></div><span class="px-2 py-0.5 {status_cls.get(status,"")} rounded text-[10px] font-medium flex-shrink-0 ml-2">{status}</span></div>'
h += '</div></div>'
h += mobile_bottom_nav("recipes")
h += '</div>\n'
h += frame_close()

h += section_close()

# ===================== M10: DASHBOARD RECIPES =====================
h += section_header("m10", "Công thức của bạn", "/dashboard/recipes", "CSR", "Required", "Bảng quản lý công thức — Sidebar, bộ lọc trạng thái, phân trang, thao tác (sửa/xóa/xuất bản). Xem Desktop 1440px + Mobile 375px. Trạng thái: Nội dung, Trống (chưa có công thức).")

h += frame_open("Desktop", 1440, "Populated", description="Desktop 1440px — Quản lý Công thức: Sidebar, tiêu đề 'Công thức của bạn' + nút 'Tạo mới', bộ lọc trạng thái (Tất cả, Bản nháp, Đã xuất bản, Đã lưu trữ), bảng 4 cột (Công thức, Trạng thái, Danh mục, Ngày tạo, Thao tác) với 5 dòng dữ liệu", frame_id="my-recipes-1-populated")
h += '<div class="bg-surface-50 min-h-[600px]">\n'
h += '<div class="flex"><aside class="w-56 bg-surface-800 text-surface-300 min-h-[600px] p-4 flex-shrink-0"><div class="flex items-center gap-2 mb-6 px-2"><div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-white" aria-hidden="true">' + ICO["book"] + '</div><span class="font-bold text-white text-sm">Dashboard</span></div><div class="space-y-1"><a href="#" class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-700 text-sm">' + ICO["chart"] + ' Tổng quan</a><a href="#" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium">' + ICO["book"] + ' Công thức</a><a href="#" class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-700 text-sm">' + ICO["user"] + ' Hồ sơ</a></div></aside>'
h += '<div class="flex-1 p-6"><div class="flex items-center justify-between mb-6"><h1 class="text-xl font-bold text-surface-900">Công thức cua ban</h1><a href="#m11" class="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 flex items-center gap-1">' + ICO["plus"] + ' Tạo mới</a></div>'
# Filter bar
h += '<div class="bg-white rounded-xl border border-surface-200 p-4 mb-6 flex items-center gap-4"><select class="border border-surface-300 rounded-lg px-3 py-2 text-sm" aria-label="Loc theo trang thai"><option>Tất cả trang thai</option><option>Da xuat ban</option><option>Ban nhap</option><option>Da luu tru</option></select><div class="relative flex-1"><input type="search" placeholder="Tìm kiếm cong thuc..." class="w-full pl-10 pr-4 py-2 border border-surface-300 rounded-lg text-sm" aria-label="Tìm kiếm cong thuc"/><div class="absolute left-3 top-2.5 text-surface-400">' + ICO["search"] + '</div></div></div>'
# Table
h += '<div class="bg-white rounded-xl border border-surface-200 overflow-hidden"><table class="w-full text-sm" role="table"><thead class="text-left text-surface-500 bg-surface-50"><tr><th class="px-5 py-3 font-medium">Công thức</th><th class="px-5 py-3 font-medium">Trang thai</th><th class="px-5 py-3 font-medium">Danh mục</th><th class="px-5 py-3 font-medium">Ngay tao</th><th class="px-5 py-3 font-medium">Thao tac</th></tr></thead><tbody class="divide-y divide-surface-100">'
for name, status, cat, date in recipes_table:
    sc = {"Da xuat ban": "bg-green-100 text-green-700", "Ban nhap": "bg-amber-100 text-amber-700", "Da luu tru": "bg-surface-100 text-surface-500"}
    h += f'<tr class="hover:bg-surface-50"><td class="px-5 py-3 font-medium text-surface-900">{name}</td><td class="px-5 py-3"><span class="px-2 py-0.5 {sc.get(status,"")} rounded text-xs font-medium">{status}</span></td><td class="px-5 py-3 text-surface-500">{cat}</td><td class="px-5 py-3 text-surface-400">{date}</td><td class="px-5 py-3"><div class="flex gap-2"><button class="text-surface-400 hover:text-brand-600" aria-label="Chỉnh sửa">' + ICO["edit"] + '</button><button class="text-surface-400 hover:text-red-500" aria-label="Xoa">' + ICO["trash"] + '</button></div></td></tr>'
h += '</tbody></table></div></div></div></div>\n'
h += frame_close()

# -- M10 Desktop Empty --
h += frame_open("Desktop", 1440, "Empty", "state-empty", description="Trạng thái Empty: Icon book lớn, 'Chưa có công thức nào', mô tả 'Bạn chưa tạo công thức nào. Bắt đầu chia sẻ công thức đầu tiên!', nút 'Tạo công thức mới'", frame_id="my-recipes-2-empty")
h += '<div class="bg-surface-50 min-h-[600px]">\n'
h += '<div class="flex"><aside class="w-56 bg-surface-800 min-h-[600px] p-4 flex-shrink-0"><div class="space-y-2 mt-8">' + '<div class="skeleton h-10 w-full bg-surface-600 rounded-lg"></div>' * 3 + '</div></aside>'
h += '<div class="flex-1 p-6"><h1 class="text-xl font-bold text-surface-900 mb-6">Công thức cua ban</h1>'
h += '<div class="flex flex-col items-center justify-center py-20 text-center"><div class="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-4 text-surface-400">' + ICO["book"] + '</div><h3 class="text-lg font-semibold text-surface-700 mb-2">Chua co cong thuc nao</h3><p class="text-sm text-surface-400 max-w-sm mb-4">Bat dau tao cong thuc dau tien cua ban de chia se voi cong dong.</p><a href="#m11" class="px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">Tao cong thuc moi</a></div></div></div></div>\n'
h += frame_close()

# -- M10 Mobile Populated --
h += frame_open("Mobile", 375, "Populated", description="Responsive Mobile 375px: Tiêu đề 'Công thức của bạn' + nút 'Tạo mới', danh sách công thức dạng card dọc có ảnh bìa + tiêu đề + trạng thái + danh mục + ngày tạo, bottom navigation", frame_id="my-recipes-3-populated")
h += '<div class="bg-surface-50 min-h-[600px]" style="max-width:375px;position:relative">\n'
h += '<div class="px-5 py-4"><div class="flex items-center justify-between mb-4"><h1 class="text-lg font-bold">Công thức cua ban</h1><a href="#" class="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium">' + ICO["plus"] + ' Moi</a></div>'
for name, status, cat, _ in recipes_table[:4]:
    sc = {"Da xuat ban": "bg-green-100 text-green-700", "Ban nhap": "bg-amber-100 text-amber-700", "Da luu tru": "bg-surface-100 text-surface-500"}
    h += f'<div class="bg-white rounded-xl border border-surface-200 p-3 mb-3 flex items-center justify-between"><div class="min-w-0"><div class="font-medium text-sm truncate">{name}</div><div class="text-xs text-surface-400">{cat}</div></div><div class="flex items-center gap-2"><span class="px-2 py-0.5 {sc.get(status,"")} rounded text-[10px] font-medium">{status}</span><button class="text-surface-400" aria-label="Chỉnh sửa">' + ICO["edit"] + '</button></div></div>'
h += '</div>'
h += mobile_bottom_nav("recipes")
h += '</div>\n'
h += frame_close()

h += section_close()

# ===================== M11: NEW RECIPE WIZARD =====================
h += section_header("m11", "Tạo công thức mới", "/dashboard/recipes/new", "CSR", "Required", "Wizard đa bước — Chọn danh mục, nhập thông tin, upload ảnh, preview. Xem Desktop 1440px + Mobile 375px. Trạng thái: Bước 1, Lỗi xác thực trường, Bước 2 (upload ảnh).")

# -- M11 Desktop Step 1 --
h += frame_open("Desktop", 1440, "Step 1 — Thông tin co ban", "state-populated", description="Desktop 1440px — Wizard Bước 1: Sidebar với 3 bước (1. Danh mục & Cơ bản, 2. Hình ảnh & Video, 3. Xem trước & Đăng bản), bước 1 đang active — chọn danh mục từ dropdown, nhập tiêu đề, mô tả, thời gian nấu (phút), độ khó, số phần ăn", frame_id="new-recipe-1-step-1-—-thông-tin-co-ban")
h += '<div class="bg-surface-50 min-h-[600px]">\n'
h += '<div class="flex"><aside class="w-56 bg-surface-800 text-surface-300 min-h-[600px] p-4 flex-shrink-0"><div class="flex items-center gap-2 mb-6 px-2"><div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-white" aria-hidden="true">' + ICO["book"] + '</div><span class="font-bold text-white text-sm">Dashboard</span></div><div class="space-y-1"><a href="#" class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-700 text-sm">' + ICO["chart"] + ' Tổng quan</a><a href="#" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium">' + ICO["book"] + ' Công thức</a></div></aside>'
h += '<div class="flex-1 p-6"><h1 class="text-xl font-bold text-surface-900 mb-6">Tao cong thuc moi</h1>'
# Step indicators
h += '<div class="flex items-center gap-4 mb-8">'
steps_info = [("1", "Thông tin co ban", True), ("2", "Nguyen lieu", False), ("3", "Cac buoc", False), ("4", "Hinh anh", False)]
for num, label, active in steps_info:
    cls = "bg-brand-500 text-white" if active else "bg-surface-200 text-surface-500"
    h += f'<div class="flex items-center gap-2"><div class="w-8 h-8 {cls} rounded-full flex items-center justify-center text-sm font-bold">{num}</div><span class="text-sm {"font-semibold text-surface-900" if active else "text-surface-400"}">{label}</span></div>'
h += '</div>'
# Form
h += '<div class="bg-white rounded-xl border border-surface-200 p-6 max-w-2xl"><form aria-label="Tao cong thuc - Buoc 1"><div class="space-y-5">'
h += '<div><label for="rcp-title" class="block text-sm font-medium text-surface-700 mb-1">Ten cong thuc <span class="text-red-500">*</span></label><input type="text" id="rcp-title" placeholder="VD: Phở Bò Hà Nội" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200" required/></div>'
h += '<div><label for="rcp-desc" class="block text-sm font-medium text-surface-700 mb-1">Mo ta <span class="text-red-500">*</span></label><textarea id="rcp-desc" rows="3" placeholder="Mo ta ngan gon ve cong thuc..." class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200" required></textarea></div>'
h += '<div class="grid grid-cols-2 gap-4"><div><label for="rcp-cat" class="block text-sm font-medium text-surface-700 mb-1">Danh mục <span class="text-red-500">*</span></label><select id="rcp-cat" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm" required><option>Chon danh muc</option><option>Món chính</option><option>Đồ ăn sáng</option><option>Đồ uống</option><option>Tráng miệng</option><option>Món chay</option></select></div>'
h += '<div><label for="rcp-diff" class="block text-sm font-medium text-surface-700 mb-1">Do kho <span class="text-red-500">*</span></label><select id="rcp-diff" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm" required><option>De</option><option>Trung binh</option><option>Kho</option><option>Chuyen gia</option></select></div></div>'
h += '<div class="grid grid-cols-3 gap-4"><div><label for="rcp-prep" class="block text-sm font-medium text-surface-700 mb-1">Thoi gian chuan bi (phut) <span class="text-red-500">*</span></label><input type="number" id="rcp-prep" value="30" min="1" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm" required/></div>'
h += '<div><label for="rcp-cook" class="block text-sm font-medium text-surface-700 mb-1">Thoi gian nau (phut) <span class="text-red-500">*</span></label><input type="number" id="rcp-cook" value="60" min="0" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm" required/></div>'
h += '<div><label for="rcp-serv" class="block text-sm font-medium text-surface-700 mb-1">So phan <span class="text-red-500">*</span></label><input type="number" id="rcp-serv" value="4" min="1" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm" required/></div></div>'
h += '<div class="flex justify-end gap-3 pt-4"><button type="button" class="px-5 py-2.5 border border-surface-300 rounded-lg text-sm font-medium hover:bg-surface-50">Huy</button><button type="submit" class="px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 flex items-center gap-1">Tiep theo: Nguyen lieu ' + ICO["arrow_right"] + '</button></div>'
h += '</div></form></div></div></div></div>\n'
h += frame_close()

# -- M11 Desktop Step 2 --
h += frame_open("Desktop", 1440, "Step 2 — Nguyen lieu", "state-populated", description="", frame_id="new-recipe-2-step-2-—-nguyen-lieu")
h += '<div class="bg-surface-50 min-h-[600px]">\n'
h += '<div class="flex"><aside class="w-56 bg-surface-800 min-h-[600px] p-4 flex-shrink-0"></aside>'
h += '<div class="flex-1 p-6"><h1 class="text-xl font-bold text-surface-900 mb-6">Tao cong thuc moi</h1>'
h += '<div class="flex items-center gap-4 mb-8">'
for num, label, done in [("1", "Thông tin co ban", True), ("2", "Nguyen lieu", True), ("3", "Cac buoc", False), ("4", "Hinh anh", False)]:
    cls = "bg-green-500 text-white" if done else ("bg-brand-500 text-white" if label == "Nguyen lieu" else "bg-surface-200 text-surface-500")
    check = ICO["check"] if done and label != "Nguyen lieu" else num
    h += f'<div class="flex items-center gap-2"><div class="w-8 h-8 {cls} rounded-full flex items-center justify-center text-sm font-bold">{check}</div><span class="text-sm {"font-semibold text-surface-900" if label == "Nguyen lieu" else "text-surface-400"}">{label}</span></div>'
h += '</div>'
h += '<div class="bg-white rounded-xl border border-surface-200 p-6 max-w-2xl"><form aria-label="Tao cong thuc - Buoc 2"><div class="space-y-4">'
h += '<div class="flex items-center justify-between"><h2 class="font-bold text-surface-900">Nguyen lieu</h2><button type="button" class="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">' + ICO["plus"] + ' Them nguyen lieu</button></div>'
ingredients = [("500g", "Bo tenderloin", "Cat mong"), ("500g", "Banh pho", ""), ("100g", "Hanh tay, gung", "Dot nho"), ("Vua", "Nuoc mam, muoi, tieu", "Dieu chinh"), ("Vua", "Rau thơm, mint", "An kem")]
for qty, name, notes in ingredients:
    h += f'<div class="flex items-center gap-3 p-3 bg-surface-50 rounded-lg border border-surface-200"><input type="text" value="{qty}" class="w-20 px-2 py-1.5 border border-surface-300 rounded text-sm" aria-label="So luong"/><input type="text" value="{name}" class="flex-1 px-2 py-1.5 border border-surface-300 rounded text-sm" aria-label="Ten nguyen lieu"/><input type="text" value="{notes}" placeholder="Ghi chu" class="w-32 px-2 py-1.5 border border-surface-300 rounded text-sm" aria-label="Ghi chu"/><button type="button" class="text-surface-400 hover:text-red-500" aria-label="Xoa nguyen lieu">' + ICO["trash"] + '</button></div>'
h += '<div class="flex justify-between pt-4"><button type="button" class="px-5 py-2.5 border border-surface-300 rounded-lg text-sm font-medium hover:bg-surface-50 flex items-center gap-1">' + ICO["arrow_left"] + ' Quay lại</button><button type="submit" class="px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 flex items-center gap-1">Tiep theo: Cac buoc ' + ICO["arrow_right"] + '</button></div>'
h += '</div></form></div></div></div></div>\n'
h += frame_close()

# -- M11 Desktop Validation Error --
h += frame_open("Desktop", 1440, "Validation Error", "state-error", description="Trạng thái Lỗi xác thực: Wizard bước 1 với thông báo lỗi đỏ — 'Tiêu đề là bắt buộc', 'Mô tả phải có ít nhất 20 ký tự', 'Thời gian nấu phải lớn hơn 0', trường có viền đỏ", frame_id="new-recipe-3-validation-error")
h += '<div class="bg-surface-50 min-h-[600px]">\n'
h += '<div class="flex"><aside class="w-56 bg-surface-800 min-h-[600px] p-4 flex-shrink-0"></aside>'
h += '<div class="flex-1 p-6"><h1 class="text-xl font-bold text-surface-900 mb-6">Tao cong thuc moi</h1>'
h += '<div class="bg-white rounded-xl border border-surface-200 p-6 max-w-2xl">'
h += '<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3" role="alert"><div class="text-red-500">' + ICO["warning"] + '</div><div><p class="text-sm font-medium text-red-800">Co loi xay ra</p><p class="text-xs text-red-600 mt-1">Vui lòng kiem tra lai cac truong duoi day.</p>'
h += '<pre class="mt-2 text-[10px] text-red-500 bg-red-100 p-2 rounded overflow-x-auto">{"type":"VALIDATION_ERROR","title":"Validation Failed","status":422,"errors":{"title":"Title must be 5-200 characters","categoryId":"Category not found"}}</pre></div></div>'
h += '<form><div class="space-y-4"><div><label for="err-title" class="block text-sm font-medium text-surface-700 mb-1">Ten cong thuc</label><input type="text" id="err-title" value="AB" class="w-full px-4 py-2.5 border border-red-300 rounded-lg text-sm bg-red-50"/><p class="text-xs text-red-500 mt-1">Ten cong thuc toi thieu 5 ky tu.</p></div>'
h += '<div><label for="err-cat" class="block text-sm font-medium text-surface-700 mb-1">Danh mục</label><select id="err-cat" class="w-full px-4 py-2.5 border border-red-300 rounded-lg text-sm bg-red-50"><option value="">Chon danh muc</option></select><p class="text-xs text-red-500 mt-1">Vui lòng chon danh muc.</p></div>'
h += '<button type="submit" class="px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium">Tiep theo</button></div></form></div></div></div>\n'
h += frame_close()

# -- M11 Mobile Populated --
h += frame_open("Mobile", 375, "Step 1", "state-populated", description="Responsive Mobile 375px: Wizard bước 1 rút gọn — chọn danh mục, nhập tiêu đề + mô tả + thời gian nấu + độ khó + số phần ăn, nút 'Tiếp theo'", frame_id="new-recipe-4-step-1")
h += '<div class="bg-surface-50 min-h-[600px]" style="max-width:375px;position:relative">\n'
h += '<div class="px-5 py-4"><h1 class="text-lg font-bold mb-4">Tao cong thuc moi</h1>'
h += '<div class="flex items-center gap-2 mb-5 text-xs">'
for num, label, active in [("1", "Co ban", True), ("2", "NL", False), ("3", "Buoc", False), ("4", "Anh", False)]:
    cls = "bg-brand-500 text-white" if active else "bg-surface-200 text-surface-500"
    h += f'<div class="flex items-center gap-1"><div class="w-6 h-6 {cls} rounded-full flex items-center justify-center text-[10px] font-bold">{num}</div><span class="{"font-semibold" if active else "text-surface-400"}">{label}</span></div>'
h += '</div>'
h += '<div class="bg-white rounded-xl border border-surface-200 p-4"><form><div class="space-y-3">'
h += '<div><label for="m-rcp-title" class="block text-xs font-medium text-surface-700 mb-1">Ten cong thuc</label><input type="text" id="m-rcp-title" class="w-full px-3 py-2.5 border border-surface-300 rounded-lg text-sm"/></div>'
h += '<div><label for="m-rcp-desc" class="block text-xs font-medium text-surface-700 mb-1">Mo ta</label><textarea id="m-rcp-desc" rows="2" class="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm"></textarea></div>'
h += '<div class="grid grid-cols-2 gap-3"><div><label for="m-rcp-prep" class="block text-xs font-medium text-surface-700 mb-1">Chuan bi (phut)</label><input type="number" id="m-rcp-prep" value="30" class="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm"/></div>'
h += '<div><label for="m-rcp-cook" class="block text-xs font-medium text-surface-700 mb-1">Nau (phut)</label><input type="number" id="m-rcp-cook" value="60" class="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm"/></div></div>'
h += '<button type="submit" class="w-full py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium mt-2">Tiep theo</button>'
h += '</div></form></div></div>'
h += mobile_bottom_nav("add")
h += '</div>\n'
h += frame_close()

h += section_close()

# ===================== M12: EDIT RECIPE =====================
h += section_header("m12", "Chỉnh sửa công thức", "/dashboard/recipes/[id]/edit", "CSR", "Required (Owner/Admin)", "Form chỉnh sửa — Điền sẵn dữ liệu công thức, xác thực, nút lưu/hủy. Xem Desktop 1440px + Mobile 375px. Trạng thái: Nội dung, 403 Forbidden (không có quyền), Xóa lỗi (đang có đánh giá).")

# -- M12 Desktop Populated --
h += frame_open("Desktop", 1440, "Populated", description="Desktop 1440px — Chỉnh sửa công thức: Sidebar, tiêu đề 'Chỉnh sửa công thức', form đã điền sẵn (Phở Bò Hà Nội), trường Tiêu đề + Mô tả + Danh mục + Độ khó + Thời gian, danh sách nguyên liệu có thể thêm/xóa, danh sách bước nấu có thể thêm/xóa/sắp xếp lại, ảnh bia hiện tại + nút thay đổi, nút 'Lưu thay đổi' + 'Hủy'", frame_id="edit-recipe-1-populated")
h += '<div class="bg-surface-50 min-h-[600px]">\n'
h += '<div class="flex"><aside class="w-56 bg-surface-800 text-surface-300 min-h-[600px] p-4 flex-shrink-0"><div class="flex items-center gap-2 mb-6 px-2"><div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-white" aria-hidden="true">' + ICO["book"] + '</div><span class="font-bold text-white text-sm">Dashboard</span></div></aside>'
h += '<div class="flex-1 p-6"><div class="flex items-center justify-between mb-6"><div><h1 class="text-xl font-bold text-surface-900">Chỉnh sửa: Phở Bò Hà Nội</h1><p class="text-sm text-surface-400 mt-1">Cap nhat thong tin cong thuc</p></div>'
h += '<div class="flex gap-2"><button class="px-4 py-2 border border-surface-300 rounded-lg text-sm hover:bg-surface-50">Xem truoc</button><button class="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 flex items-center gap-1">' + ICO["check"] + ' Luu thay doi</button></div></div>'
h += '<div class="bg-white rounded-xl border border-surface-200 p-6 max-w-3xl"><form aria-label="Chỉnh sửa cong thuc"><div class="space-y-5">'
h += '<div class="grid grid-cols-2 gap-4"><div><label for="edit-status" class="block text-sm font-medium text-surface-700 mb-1">Trang thai</label><select id="edit-status" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm"><option selected>Da xuat ban</option><option>Ban nhap</option><option>Da luu tru</option></select></div>'
h += '<div><label for="edit-ver" class="block text-sm font-medium text-surface-700 mb-1">Version (ETag)</label><input type="text" id="edit-ver" value="3" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm bg-surface-50" readonly/></div></div>'
h += '<div><label for="edit-title" class="block text-sm font-medium text-surface-700 mb-1">Ten cong thuc</label><input type="text" id="edit-title" value="Phở Bò Hà Nội" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm"/></div>'
h += '<div><label for="edit-desc" class="block text-sm font-medium text-surface-700 mb-1">Mo ta</label><textarea id="edit-desc" rows="3" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm">Pho bo Ha Noi la mon an truyền thống cua Viet Nam.</textarea></div>'
h += '<div class="grid grid-cols-3 gap-4"><div><label for="edit-prep" class="block text-sm font-medium text-surface-700 mb-1">Chuan bi (phut)</label><input type="number" id="edit-prep" value="45" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm"/></div>'
h += '<div><label for="edit-cook" class="block text-sm font-medium text-surface-700 mb-1">Nau (phut)</label><input type="number" id="edit-cook" value="240" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm"/></div>'
h += '<div><label for="edit-serv" class="block text-sm font-medium text-surface-700 mb-1">So phan</label><input type="number" id="edit-serv" value="4" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm"/></div></div>'
h += '<div class="flex justify-between pt-4 border-t border-surface-200"><button type="button" class="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium flex items-center gap-1">' + ICO["trash"] + ' Xoa cong thuc</button><button type="submit" class="px-5 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">' + ICO["check"] + ' Luu thay doi</button></div>'
h += '</div></form></div></div></div></div>\n'
h += frame_close()

# -- M12 Desktop 403 Forbidden --
h += frame_open("Desktop", 1440, "403 Forbidden", "state-error", description="Trạng thái Lỗi 403: Icon shield đỏ lớn, '403', 'Cấm truy cập', 'Bạn không có quyền chỉnh sửa công thức này. Chỉ chủ sở hữu hoặc Admin mới có thể chỉnh sửa.', RFC 7807 JSON, nút 'Về danh sách công thức' + 'Đăng nhập tài khoản khác'", frame_id="edit-recipe-2-403")
h += '<div class="bg-surface-50 min-h-[600px] flex items-center justify-center p-8">\n'
h += '<div class="text-center"><div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">' + ICO["shield"] + '</div><h1 class="text-6xl font-extrabold text-surface-200 mb-4">403</h1><h2 class="text-xl font-bold text-surface-700 mb-2">Cam truy cap</h2><p class="text-surface-400 mb-6 max-w-md mx-auto">Ban khong co quyen chinh sua cong thuc nay. Chi chu so huu hoặc Admin moi co the chinh sua.</p><div class="flex justify-center gap-3"><a href="#m10" class="px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">Ve danh sach cong thuc</a><a href="#" class="px-5 py-2.5 border border-surface-300 rounded-lg text-sm font-medium hover:bg-surface-50">Đăng nhập tai khoan khac</a></div></div></div>\n'
h += frame_close()

# -- M12 Mobile Populated --
h += frame_open("Mobile", 375, "Populated", description="Responsive Mobile 375px: Tiêu đề 'Chỉnh sửa', form đã điền sẵn rút gọn — tiêu đề + mô tả + danh mục + độ khó, nút 'Lưu thay đổi'", frame_id="edit-recipe-3-populated")
h += '<div class="bg-surface-50 min-h-[600px]" style="max-width:375px;position:relative">\n'
h += '<div class="px-5 py-4"><div class="flex items-center justify-between mb-4"><h1 class="text-lg font-bold">Chỉnh sửa</h1><button class="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium">' + ICO["check"] + ' Luu</button></div>'
h += '<div class="bg-white rounded-xl border border-surface-200 p-4"><form><div class="space-y-3">'
h += '<div><label for="m-edit-title" class="block text-xs font-medium text-surface-700 mb-1">Ten</label><input type="text" id="m-edit-title" value="Phở Bò Hà Nội" class="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm"/></div>'
h += '<div><label for="m-edit-desc" class="block text-xs font-medium text-surface-700 mb-1">Mo ta</label><textarea id="m-edit-desc" rows="2" class="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm">Pho bo truyền thống.</textarea></div>'
h += '<div class="grid grid-cols-2 gap-3"><div><label for="m-edit-prep" class="block text-xs font-medium text-surface-700 mb-1">Chuan bi</label><input type="number" id="m-edit-prep" value="45" class="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm"/></div>'
h += '<div><label for="m-edit-cook" class="block text-xs font-medium text-surface-700 mb-1">Nau</label><input type="number" id="m-edit-cook" value="240" class="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm"/></div></div>'
h += '</div></form></div></div>'
h += mobile_bottom_nav("recipes")
h += '</div>\n'
h += frame_close()

h += section_close()

# ===================== M13: ADMIN CATEGORIES =====================
h += section_header("m13", "Quản trị danh mục", "/dashboard/categories", "CSR", "Required (Admin)", "Bảng quản trị — CRUD danh mục, số công thức mỗi danh mục, xác nhận xóa. Xem Desktop 1440px + Mobile 375px. Trạng thái: Nội dung, Lỗi xóa (danh mục đang có công thức), Dialog xác nhận.")

# -- M13 Desktop Populated --
h += frame_open("Desktop", 1440, "Populated", description="Desktop 1440px — Quản trị Danh mục: Sidebar (Admin), tiêu đề 'Quản trị Danh mục' + nút 'Tạo mới', bảng 3 cột (Danh mục, Công thức, Thao tác) với 6 dòng dữ liệu, mỗi dòng có tên + số công thức + nút Sửa/Xóa", frame_id="admin-categories-1-populated")
h += '<div class="bg-surface-50 min-h-[600px]">\n'
h += '<div class="flex"><aside class="w-56 bg-surface-800 text-surface-300 min-h-[600px] p-4 flex-shrink-0"><div class="flex items-center gap-2 mb-6 px-2"><div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-white" aria-hidden="true">' + ICO["book"] + '</div><span class="font-bold text-white text-sm">Dashboard</span></div><div class="space-y-1"><a href="#" class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-700 text-sm">' + ICO["chart"] + ' Tổng quan</a><a href="#" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium">' + ICO["grid"] + ' Danh mục</a></div></aside>'
h += '<div class="flex-1 p-6"><div class="flex items-center justify-between mb-6"><h1 class="text-xl font-bold text-surface-900">Quản trị danh muc</h1><button class="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 flex items-center gap-1">' + ICO["plus"] + ' Them danh muc</button></div>'
h += '<div class="bg-white rounded-xl border border-surface-200 overflow-hidden"><table class="w-full text-sm" role="table"><thead class="text-left text-surface-500 bg-surface-50"><tr><th class="px-5 py-3 font-medium">Danh mục</th><th class="px-5 py-3 font-medium">Mo ta</th><th class="px-5 py-3 font-medium">So cong thuc</th><th class="px-5 py-3 font-medium">Thu tu</th><th class="px-5 py-3 font-medium">Thao tac</th></tr></thead><tbody class="divide-y divide-surface-100">'
admin_cats = [("Món chính", "Cac mon an chinh", "42", "1"), ("Đồ uống", "Tra, cafe, sinh to", "18", "2"), ("Đồ ăn sáng", "Banh mi, xoi", "25", "3"), ("Tráng miệng", "Che, banh, kem", "15", "4"), ("Món chay", "Mon an chay", "12", "5"), ("Món kho", "Kho tieu, kho quay", "20", "6")]
for name, desc, cnt, order in admin_cats:
    h += f'<tr class="hover:bg-surface-50"><td class="px-5 py-3 font-medium text-surface-900">{name}</td><td class="px-5 py-3 text-surface-500">{desc}</td><td class="px-5 py-3"><span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{cnt}</span></td><td class="px-5 py-3 text-surface-400">{order}</td><td class="px-5 py-3"><div class="flex gap-2"><button class="text-surface-400 hover:text-brand-600" aria-label="Chỉnh sửa">' + ICO["edit"] + '</button><button class="text-surface-400 hover:text-red-500" aria-label="Xoa">' + ICO["trash"] + '</button></div></td></tr>'
h += '</tbody></table></div></div></div></div>\n'
h += frame_close()

# -- M13 Desktop Delete Error (has recipes) --
h += frame_open("Desktop", 1440, "Delete Error — Has Recipes", "state-error", description="Trạng thái Lỗi xóa: Dialog xác nhận 'Xóa danh mục Tráng miệng?' với cảnh báo đỏ 'Danh mục đang có 15 công thức. Không thể xóa danh mục đang có công thức.', nút 'Hủy' + 'Xóa'", frame_id="admin-categories-2-delete-error-—-has-recipes")
h += '<div class="bg-surface-50 min-h-[600px]">\n'
h += '<div class="flex"><aside class="w-56 bg-surface-800 min-h-[600px] p-4 flex-shrink-0"></aside>'
h += '<div class="flex-1 p-6"><h1 class="text-xl font-bold text-surface-900 mb-6">Quản trị danh muc</h1>'
h += '<div class="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 flex items-start gap-3" role="alert"><div class="text-red-500">' + ICO["warning"] + '</div><div class="flex-1"><p class="text-sm font-medium text-red-800">Khong the xoa danh muc "Món chính"</p><p class="text-xs text-red-600 mt-1">Danh mục nay van con 42 cong thuc. Vui lòng chuyen tat ca cong thuc sang danh muc khac truoc khi xoa.</p><pre class="mt-2 text-[10px] text-red-500 bg-red-100 p-2 rounded overflow-x-auto">{"type":"CATEGORY_DELETE_HAS_RECIPES","title":"Cannot Delete Category","status":409,"detail":"Category still has 42 recipes. Move all recipes before deleting."}</pre></div></div>'
h += '<div class="bg-white rounded-xl border border-surface-200 overflow-hidden"><table class="w-full text-sm"><thead class="text-left text-surface-500 bg-surface-50"><tr><th class="px-5 py-3 font-medium">Danh mục</th><th class="px-5 py-3 font-medium">Công thức</th><th class="px-5 py-3 font-medium">Thao tac</th></tr></thead><tbody class="divide-y divide-surface-100">'
for name, _, cnt, _ in admin_cats[:3]:
    h += f'<tr class="hover:bg-surface-50"><td class="px-5 py-3 font-medium">{name}</td><td class="px-5 py-3"><span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{cnt}</span></td><td class="px-5 py-3"><div class="flex gap-2"><button class="text-surface-400 hover:text-brand-600">' + ICO["edit"] + '</button><button class="text-surface-400 hover:text-red-500">' + ICO["trash"] + '</button></div></td></tr>'
h += '</tbody></table></div></div></div></div>\n'
h += frame_close()

# -- M13 Mobile Populated --
h += frame_open("Mobile", 375, "Populated", description="Responsive Mobile 375px: Tiêu đề 'Quản trị', danh sách danh mục dạng card có tên + số công thức + nút Sửa/Xóa, bottom navigation", frame_id="admin-categories-3-populated")
h += '<div class="bg-surface-50 min-h-[600px]" style="max-width:375px;position:relative">\n'
h += '<div class="px-5 py-4"><div class="flex items-center justify-between mb-4"><h1 class="text-lg font-bold">Danh mục</h1><button class="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium">' + ICO["plus"] + ' Moi</button></div>'
for name, desc, cnt, _ in admin_cats:
    h += f'<div class="bg-white rounded-xl border border-surface-200 p-3 mb-3 flex items-center justify-between"><div class="min-w-0"><div class="font-medium text-sm">{name}</div><div class="text-xs text-surface-400 truncate">{desc}</div></div><div class="flex items-center gap-2"><span class="text-xs text-surface-400">{cnt}</span><button class="text-surface-400" aria-label="Chỉnh sửa">' + ICO["edit"] + '</button><button class="text-surface-400" aria-label="Xoa">' + ICO["trash"] + '</button></div></div>'
h += '</div>'
h += mobile_bottom_nav("recipes")
h += '</div>\n'
h += frame_close()

h += section_close()

# ===================== M14: PROFILE =====================
h += section_header("m14", "Hồ sơ cá nhân", "/profile", "CSR", "Required", "Trang hồ sơ — Avatar, thông tin cá nhân, chỉnh sửa tên/email. Xem Desktop 1440px + Mobile 375px. Trạng thái: Nội dung (đã điền sẵn).")

# -- M14 Desktop Populated --
h += frame_open("Desktop", 1440, "Populated", description="Desktop 1440px — Hồ sơ cá nhân: Avatar tròn lớn (chữ A), 'Nguyễn Văn An', email, 'Thành viên từ 01/01/2026', form chỉnh sửa Họ tên hiển thị + Email, nút 'Cập nhật'", frame_id="profile-1-populated")
h += '<div class="bg-surface-50 min-h-[600px]">\n'
h += '<div class="flex"><aside class="w-56 bg-surface-800 text-surface-300 min-h-[600px] p-4 flex-shrink-0"><div class="flex items-center gap-2 mb-6 px-2"><div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-white" aria-hidden="true">' + ICO["book"] + '</div><span class="font-bold text-white text-sm">Dashboard</span></div><div class="space-y-1"><a href="#" class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-700 text-sm">' + ICO["chart"] + ' Tổng quan</a><a href="#" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium">' + ICO["user"] + ' Hồ sơ</a></div></aside>'
h += '<div class="flex-1 p-6"><h1 class="text-xl font-bold text-surface-900 mb-6">Hồ sơ ca nhan</h1>'
h += '<div class="max-w-2xl"><div class="bg-white rounded-xl border border-surface-200 p-6">'
# Avatar
h += '<div class="flex items-center gap-5 mb-6 pb-6 border-b border-surface-200"><div class="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-2xl font-bold" role="img" aria-label="Avatar">A</div><div><p class="font-bold text-surface-900 text-lg">Nguyễn Văn An</p><p class="text-sm text-surface-500">an@example.com</p><p class="text-xs text-surface-400 mt-1">Thanh vien tu 01/01/2026</p></div></div>'
# Form
h += '<form aria-label="Chỉnh sửa ho so"><div class="space-y-5">'
h += '<div><label for="profile-name" class="block text-sm font-medium text-surface-700 mb-1">Họ tên hien thi</label><input type="text" id="profile-name" value="Nguyễn Văn An" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200"/></div>'
h += '<div><label for="profile-email" class="block text-sm font-medium text-surface-700 mb-1">Email</label><input type="email" id="profile-email" value="an@example.com" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm bg-surface-50" readonly/><p class="text-xs text-surface-400 mt-1">Email khong the thay doi</p></div>'
h += '<div><label for="profile-user" class="block text-sm font-medium text-surface-700 mb-1">Tên người dùng</label><input type="text" id="profile-user" value="nguyenvana" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm bg-surface-50" readonly/></div>'
h += '<div><label for="profile-bio" class="block text-sm font-medium text-surface-700 mb-1">Gioi thieu ban than</label><textarea id="profile-bio" rows="3" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm">Toi la tac gia yeu thich ẩm thực Viet Nam. Toi hy vọng mang den nhung cong thuc ngon, dễ làm cho moi nguoi.</textarea></div>'
h += '<div><label for="profile-role" class="block text-sm font-medium text-surface-700 mb-1">Vai tro</label><input type="text" id="profile-role" value="Author" class="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm bg-surface-50" readonly/></div>'
h += '<div class="flex justify-end gap-3 pt-4 border-t border-surface-200"><button type="button" class="px-5 py-2.5 border border-surface-300 rounded-lg text-sm font-medium hover:bg-surface-50">Huy</button><button type="submit" class="px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">' + ICO["check"] + ' Luu thay doi</button></div>'
h += '</div></form></div></div></div></div></div>\n'
h += frame_close()

# -- M14 Mobile Populated --
h += frame_open("Mobile", 375, "Populated", description="Responsive Mobile 375px: Avatar tròn + 'Nguyễn Văn An' + email, form chỉnh sửa rút gọn — Họ tên + Email, nút 'Cập nhật'", frame_id="profile-2-populated")
h += '<div class="bg-surface-50 min-h-[600px]" style="max-width:375px;position:relative">\n'
h += '<div class="px-5 py-4"><div class="flex items-center justify-between mb-4"><h1 class="text-lg font-bold">Hồ sơ</h1><button class="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium">' + ICO["check"] + ' Luu</button></div>'
h += '<div class="flex items-center gap-4 mb-5"><div class="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xl font-bold">A</div><div><p class="font-bold">Nguyễn Văn An</p><p class="text-xs text-surface-500">an@example.com</p></div></div>'
h += '<div class="bg-white rounded-xl border border-surface-200 p-4"><form><div class="space-y-3">'
h += '<div><label for="m-pro-name" class="block text-xs font-medium text-surface-700 mb-1">Họ tên</label><input type="text" id="m-pro-name" value="Nguyễn Văn An" class="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm"/></div>'
h += '<div><label for="m-pro-bio" class="block text-xs font-medium text-surface-700 mb-1">Gioi thieu</label><textarea id="m-pro-bio" rows="2" class="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm">Toi la tac gia yeu thich ẩm thực.</textarea></div>'
h += '<div><label class="block text-xs font-medium text-surface-700 mb-1">Email</label><input type="email" value="an@example.com" class="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm bg-surface-50" readonly/></div>'
h += '</div></form></div></div>'
h += mobile_bottom_nav("profile")
h += '</div>\n'
h += frame_close()

h += section_close()

with open(OUT, "a", encoding="utf-8") as f:
    f.write(h)
print(f"Part 5 done. File size: {os.path.getsize(OUT):,} bytes")