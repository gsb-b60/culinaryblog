#!/usr/bin/env python3
"""Generate web-showcase.html — Part 3: M4-M6 (writes directly)"""
import os
from gen_utils import *

OUT = os.path.join(os.path.dirname(__file__), "web-showcase.html")
h = ""

# ===================== M4: CATEGORY LIST =====================
h += section_header("m4", "Danh mục", "/categories", "ISR (revalidate=3600)", "No", "Trang danh mục — Grid các danh mục công thức. Xem Desktop 1440px + Mobile 375px. Trạng thái: Nội dung, Đang tải (skeleton shimmer).")
h += frame_open("Desktop", 1440, "Populated", description="Desktop 1440px — Trang danh mục: Tiêu đề 'Danh mục công thức', lưới 3x2 các danh mục dạng card (Món chính 42, Đồ uống 18, Đồ ăn sáng 25, Tráng miệng 15, Món chay 12, Món kho 20), mỗi card có icon SVG màu + tên danh mục + số công thức + mũi tên phải", frame_id="categories-1-populated")
h += '<div class="bg-white min-h-[600px]">\n'
h += nav_bar(logged_in=False)
h += '<div class="max-w-6xl mx-auto px-8 py-8"><h1 class="text-2xl font-bold text-surface-900 mb-2">Danh mục cong thuc</h1><p class="text-surface-500 text-sm mb-8">Khám phá các danh mục ẩm thực phong phú</p><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">'
for name,cnt,desc,cls in CATS_FULL:
    h += f'<a href="#" class="group p-5 rounded-xl border border-surface-200 hover:border-brand-300 hover:shadow-md transition flex items-start gap-4"><div class="w-14 h-14 {cls} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">{ICO["grid"]}</div><div class="flex-1 min-w-0"><h3 class="font-bold text-surface-900 text-lg mb-1">{name}</h3><p class="text-sm text-surface-500 mb-2 line-clamp-2">{desc}</p><span class="text-xs font-semibold text-brand-600">{cnt} cong thuc &rarr;</span></div></a>'
h += '</div></div></div>\n'
h += frame_close()
h += frame_open("Desktop", 1440, "Loading", "state-loading", description="Trạng thái Loading: Tiêu đề skeleton, lưới 6 card danh mục đều có skeleton shimmer cho icon + tên + số công thức", frame_id="categories-2-loading")
h += '<div class="bg-white min-h-[600px]">\n'
h += nav_bar(logged_in=False)
h += '<div class="max-w-6xl mx-auto px-8 py-8"><div class="skeleton h-8 w-64 mb-2"></div><div class="skeleton h-4 w-96 mb-8"></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">'
for _ in range(6):
    h += '<div class="p-6 rounded-xl border border-surface-200 space-y-3"><div class="skeleton w-14 h-14 rounded-xl"></div><div class="skeleton h-5 w-32"></div><div class="skeleton h-4 w-full"></div><div class="skeleton h-3 w-24"></div></div>'
h += '</div></div></div>\n'
h += frame_close()
h += frame_open("Mobile", 375, "Populated", description="Responsive Mobile 375px: Tiêu đề 'Danh mục', danh sách 6 danh mục dạng hàng ngang có icon tròn màu + tên + số công thức + mũi tên phải, bottom navigation 4 mục", frame_id="categories-3-populated")
h += '<div class="bg-white min-h-[600px]" style="max-width:375px;position:relative">\n'
h += nav_bar(mobile=True, logged_in=False)
h += '<div class="px-5 py-4"><h1 class="text-lg font-bold mb-1">Danh mục</h1><p class="text-xs text-surface-500 mb-4">Khám phá các danh mục ẩm thực</p><div class="space-y-3">'
for name,cnt,desc,cls in CATS_FULL:
    h += f'<a href="#" class="flex items-center gap-4 p-4 rounded-xl border border-surface-200"><div class="w-12 h-12 {cls} rounded-xl flex items-center justify-center flex-shrink-0">{ICO["grid"]}</div><div class="flex-1 min-w-0"><h3 class="font-bold text-sm">{name}</h3><p class="text-xs text-surface-400 truncate">{desc}</p></div><span class="text-xs font-semibold text-brand-600">{cnt}</span></a>'
h += '</div></div>'
h += mobile_bottom_nav()
h += '</div>\n'
h += frame_close()
h += section_close()

# ===================== M5: CATEGORY DETAIL =====================
h += section_header("m5", "Chi tiết danh mục", "/categories/[slug]", "ISR (revalidate=600)", "No", "Trang danh mục chi tiết — Breadcrumb, tiêu đề danh mục, danh sách công thức. Xem Desktop 1440px + Mobile 375px. Trạng thái: Nội dung, Đang tải, Trống (chưa có công thức).")
h += frame_open("Desktop", 1440, "Populated", description="Desktop 1440px — Chi tiết danh mục Món chính: Breadcrumb (Trang chủ / Danh mục / Món chính), header với icon cam lớn + tên danh mục + '42 công thức', lưới 3 cột 6 công thức thuộc danh mục (Phở Bò, Bún Chả, Bánh Mì, Chè Ba Màu, Gỏi Cuốn, Bánh Xèo)", frame_id="category-detail-1-populated")
h += '<div class="bg-white min-h-[600px]">\n'
h += nav_bar(logged_in=False)
h += '<div class="max-w-6xl mx-auto px-8 py-6"><nav aria-label="Breadcrumb" class="text-sm text-surface-400 mb-4"><ol class="flex items-center gap-2"><li><a href="#" class="hover:text-brand-600">Trang chủ</a></li><li>/</li><li><a href="#" class="hover:text-brand-600">Danh mục</a></li><li>/</li><li class="text-surface-700 font-medium">Món chính</li></ol></nav><div class="flex items-center gap-4 mb-8"><div class="w-16 h-16 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">'+ICO["grid"]+'</div><div><h1 class="text-2xl font-bold text-surface-900">Món chính</h1><p class="text-sm text-surface-500">42 cong thuc &bull; Cac mon an chinh trong bua com Viet Nam</p></div></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">'
for t,d,a,tm,df,cl,tg in ALL_RECIPES[:6]:
    h += recipe_card(t,d,a,tm,df,cl,tg)
h += '</div></div></div>\n'
h += frame_close()
h += frame_open("Desktop", 1440, "Loading", "state-loading", description="Trạng thái Loading: Skeleton cho breadcrumb, skeleton cho header danh mục, skeleton shimmer cho lưới 6 card công thức", frame_id="category-detail-2-loading")
h += '<div class="bg-white min-h-[600px]">\n'
h += nav_bar(logged_in=False)
h += '<div class="max-w-6xl mx-auto px-8 py-6"><div class="skeleton h-4 w-48 mb-4"></div><div class="flex items-center gap-4 mb-8"><div class="skeleton w-16 h-16 rounded-xl"></div><div class="space-y-2"><div class="skeleton h-6 w-32"></div><div class="skeleton h-4 w-64"></div></div></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">'
for _ in range(6):
    h += skeleton_card()
h += '</div></div></div>\n'
h += frame_close()
h += frame_open("Desktop", 1440, "Empty", "state-empty", description="Trạng thái Empty: Khi danh mục chưa có công thức — icon book lớn, thông báo 'Chưa có công thức nào', mô tả 'Danh mục này chưa có công thức nào.', nút 'Xem tất cả danh mục' để quay lại", frame_id="category-detail-3-empty")
h += '<div class="bg-white min-h-[600px]">\n'
h += nav_bar(logged_in=False)
h += '<div class="max-w-6xl mx-auto px-8 py-6"><nav aria-label="Breadcrumb" class="text-sm text-surface-400 mb-4"><ol class="flex items-center gap-2"><li><a href="#">Trang chủ</a></li><li>/</li><li><a href="#">Danh mục</a></li><li>/</li><li class="text-surface-700 font-medium">Món chay</li></ol></nav><div class="flex items-center gap-4 mb-8"><div class="w-16 h-16 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">'+ICO["grid"]+'</div><div><h1 class="text-2xl font-bold text-surface-900">Món chay</h1><p class="text-sm text-surface-500">0 cong thuc</p></div></div><div class="flex flex-col items-center justify-center py-20 text-center"><div class="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-4 text-surface-400">'+ICO["book"]+'</div><h3 class="text-lg font-semibold text-surface-700 mb-2">Chua co cong thuc nao</h3><p class="text-sm text-surface-400 max-w-sm">Danh mục nay chua co cong thuc nao.</p><a href="#" class="mt-4 px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">Xem tất cả danh muc</a></div></div></div>\n'
h += frame_close()
h += frame_open("Mobile", 375, "Populated", description="Responsive Mobile 375px: Breadcrumb rút gọn (Trang chủ / Danh mục / Món chính), header danh mục với icon + tên + số lượng, 3 công thức đầu tiên dạng card dọc có ảnh bìa + tiêu đề + tác giả + thời gian", frame_id="category-detail-4-populated")
h += '<div class="bg-white min-h-[600px]" style="max-width:375px;position:relative">\n'
h += nav_bar(mobile=True, logged_in=False)
h += '<div class="px-5 py-4"><div class="text-xs text-surface-400 mb-3"><a href="#">Trang chủ</a> / <a href="#">Danh mục</a> / <span class="text-surface-700">Món chính</span></div><div class="flex items-center gap-3 mb-4"><div class="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">'+ICO["grid"]+'</div><div><h1 class="font-bold">Món chính</h1><p class="text-xs text-surface-400">42 cong thuc</p></div></div>'
for t,d,a,tm,df,cl,tg in ALL_RECIPES[:3]:
    h += recipe_card(t,d,a,tm,df,cl,tg)
h += '</div>'
h += mobile_bottom_nav()
h += '</div>\n'
h += frame_close()
h += section_close()

# ===================== M6: SEARCH RESULTS =====================
h += section_header("m6", "Kết quả tìm kiếm", "/search", "SSR", "No", "Trang tìm kiếm — Thanh tìm kiếm, kết quả với điểm phù hợp, gợi ý. Xem Desktop 1440px + Mobile 375px. Trạng thái: Nội dung, Đang tải, Không tìm thấy kết quả.")
h += frame_open("Desktop", 1440, "Populated", description="Desktop 1440px — Trang tìm kiếm: Thanh tìm kiếm lớn với từ khóa 'phở bò', thông báo 'Tìm thấy 3 kết quả', 3 kết quả dạng grid card có ảnh + tiêu đề + tác giả + thời gian + độ khó + điểm phù hợp", frame_id="search-1-populated")
h += '<div class="bg-white min-h-[600px]">\n'
h += nav_bar(logged_in=False)
h += '<div class="max-w-6xl mx-auto px-8 py-6"><div class="relative mb-6"><input type="search" value="pho bo" placeholder="Tìm kiếm cong thuc..." class="w-full pl-12 pr-4 py-3 border border-surface-300 rounded-xl text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200" aria-label="Tìm kiếm cong thuc"/><div class="absolute left-4 top-3.5 text-surface-400">'+ICO["search"]+'</div></div>'
h += '<div class="flex flex-wrap gap-3 mb-6"><div><label for="s-cat" class="block text-xs font-semibold text-surface-600 mb-1">Danh mục</label><select id="s-cat" class="border border-surface-300 rounded-lg px-3 py-1.5 text-sm"><option>Tất cả</option><option>Món chính</option><option>Đồ ăn sáng</option><option>Đồ uống</option><option>Tráng miệng</option><option>Món chay</option></select></div>'
h += '<div><label for="s-diff" class="block text-xs font-semibold text-surface-600 mb-1">Độ khó</label><select id="s-diff" class="border border-surface-300 rounded-lg px-3 py-1.5 text-sm"><option>Tất cả</option><option>Dễ</option><option>Trung bình</option><option>Khó</option></select></div>'
h += '<div><label for="s-time" class="block text-xs font-semibold text-surface-600 mb-1">Thời gian</label><select id="s-time" class="border border-surface-300 rounded-lg px-3 py-1.5 text-sm"><option>Tất cả</option><option>Dưới 30 phút</option><option>Dưới 60 phút</option><option>Dưới 120 phút</option></select></div>'
h += '<div><label for="s-sort" class="block text-xs font-semibold text-surface-600 mb-1">Sắp xếp</label><select id="s-sort" class="border border-surface-300 rounded-lg px-3 py-1.5 text-sm"><option>Phù hợp nhất</option><option>Mới nhất</option><option>A-Z</option><option>Thời gian ngắn</option></select></div>'
h += '<div class="flex items-end"><button class="px-4 py-1.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">Áp dụng</button></div></div>'
h += '<p class="text-sm text-surface-500 mb-6">Tim thay <strong class="text-surface-900">3</strong> kết quả cho "<strong class="text-surface-900">pho bo</strong>"</p><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">'
for title,desc,author,tm,df,cl,score in SEARCH_RESULTS:
    h += f'<article class="bg-white rounded-xl border border-surface-200 overflow-hidden hover:shadow-md transition-shadow"><div class="skeleton" style="height:160px;width:100%;background:linear-gradient(135deg,#fed7aa,#fdba74)"></div><div class="p-4"><h3 class="font-bold text-surface-900 text-base mb-1">{title}</h3><p class="text-sm text-surface-500 mb-2 line-clamp-2">{desc}</p><div class="flex items-center gap-3 text-xs text-surface-400 mb-2"><span class="flex items-center gap-1">'+ICO["clock"]+f' {format_time(tm)}</span><span class="px-2 py-0.5 bg-green-100 text-green-700 rounded">{df}</span><span>{cl} kcal</span></div><div class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-[10px] font-bold">{author[0]}</div><span class="text-xs text-surface-500">{author}</span></div><span class="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-[10px] font-semibold">Phu hop {score}</span></div></div></article>'
h += '</div></div></div>\n'
h += frame_close()
h += frame_open("Desktop", 1440, "Loading", "state-loading", description="Trạng thái Loading: Skeleton cho thanh tìm kiếm, skeleton cho thông báo số kết quả, skeleton shimmer cho 3 kết quả dạng grid", frame_id="search-2-loading")
h += '<div class="bg-white min-h-[600px]">\n'
h += nav_bar(logged_in=False)
h += '<div class="max-w-6xl mx-auto px-8 py-6"><div class="skeleton h-12 w-full rounded-xl mb-4"></div><div class="flex gap-3 mb-4"><div class="skeleton h-9 w-32 rounded-lg"></div><div class="skeleton h-9 w-28 rounded-lg"></div><div class="skeleton h-9 w-36 rounded-lg"></div><div class="skeleton h-9 w-32 rounded-lg"></div><div class="skeleton h-9 w-24 rounded-lg"></div></div><div class="skeleton h-4 w-72 mb-6"></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">'
for _ in range(3):
    h += '<div class="rounded-xl border border-surface-200 overflow-hidden space-y-3"><div class="skeleton h-40 w-full"></div><div class="p-4 space-y-2"><div class="skeleton h-5 w-32"></div><div class="skeleton h-4 w-full"></div><div class="flex gap-3"><div class="skeleton h-3 w-16"></div><div class="skeleton h-3 w-12"></div></div></div></div>'
h += '</div></div></div>\n'
h += frame_close()
h += frame_open("Desktop", 1440, "No Results", "state-empty", description="Trạng thái Empty: Thanh tìm kiếm với từ khóa 'bánh trang tron', thông báo 'Tìm thấy 0 kết quả', icon search lớn, 'Không tìm thấy kết quả', gợi ý", frame_id="search-3-empty")
h += '<div class="bg-white min-h-[600px]">\n'
h += nav_bar(logged_in=False)
h += '<div class="max-w-6xl mx-auto px-8 py-6"><div class="relative mb-4"><input type="search" value="banh trang tron" placeholder="Tìm kiếm..." class="w-full pl-12 pr-4 py-3 border border-surface-300 rounded-xl text-sm" aria-label="Tìm kiếm"/><div class="absolute left-4 top-3.5 text-surface-400">'+ICO["search"]+'</div></div>'
h += '<div class="flex flex-wrap gap-3 mb-4"><select class="border border-surface-300 rounded-lg px-3 py-1.5 text-sm"><option>Tất cả danh mục</option></select><select class="border border-surface-300 rounded-lg px-3 py-1.5 text-sm"><option>Tất cả độ khó</option></select><select class="border border-surface-300 rounded-lg px-3 py-1.5 text-sm"><option>Tất cả thời gian</option></select></div>'
h += '<p class="text-sm text-surface-500 mb-6">Tim thay <strong class="text-surface-900">0</strong> kết quả cho "<strong class="text-surface-900">banh trang tron</strong>"</p><div class="flex flex-col items-center justify-center py-16 text-center"><div class="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-4 text-surface-400">'+ICO["search"]+'</div><h3 class="text-lg font-semibold text-surface-700 mb-2">Không tìm thấy ket qua</h3><p class="text-sm text-surface-400 max-w-sm">Thu su dung tu khoa khac hoặc kiem tra lai chinh ta.</p></div></div></div>\n'
h += frame_close()
h += frame_open("Mobile", 375, "Populated", description="Responsive Mobile 375px: Thanh tìm kiếm rút gọn, '3 kết quả cho phở bò', 3 kết quả dạng card có ảnh + tiêu đề + thời gian + điểm phù hợp, bottom navigation", frame_id="search-4-populated")
h += '<div class="bg-white min-h-[600px]" style="max-width:375px;position:relative">\n'
h += nav_bar(mobile=True, logged_in=False)
h += '<div class="px-5 py-4"><div class="relative mb-3"><input type="search" value="pho bo" placeholder="Tìm kiếm..." class="w-full pl-10 pr-4 py-2.5 border border-surface-300 rounded-lg text-sm" aria-label="Tìm kiếm"/><div class="absolute left-3 top-2.5 text-surface-400">'+ICO["search"]+'</div></div>'
h += '<div class="flex gap-2 mb-3 overflow-x-auto"><select class="border border-surface-300 rounded-lg px-2 py-1.5 text-xs flex-shrink-0"><option>Danh mục</option></select><select class="border border-surface-300 rounded-lg px-2 py-1.5 text-xs flex-shrink-0"><option>Độ khó</option></select><select class="border border-surface-300 rounded-lg px-2 py-1.5 text-xs flex-shrink-0"><option>Thời gian</option></select><select class="border border-surface-300 rounded-lg px-2 py-1.5 text-xs flex-shrink-0"><option>Sắp xếp</option></select></div>'
h += '<p class="text-xs text-surface-500 mb-3">3 kết quả cho "pho bo"</p>'
for title,desc,author,tm,df,cl,score in SEARCH_RESULTS[:3]:
    h += f'<article class="bg-white rounded-xl border border-surface-200 overflow-hidden mb-3"><div class="skeleton" style="height:120px;width:100%;background:linear-gradient(135deg,#fed7aa,#fdba74)"></div><div class="p-3"><h3 class="font-bold text-sm mb-1">{title}</h3><p class="text-xs text-surface-500 mb-2 line-clamp-1">{desc}</p><div class="flex items-center justify-between"><div class="flex items-center gap-2 text-[10px] text-surface-400"><span class="flex items-center gap-1">'+ICO["clock"]+f' {format_time(tm)}</span><span class="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">{df}</span></div><span class="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-[10px] font-semibold">Phu hop {score}</span></div></div></article>'
h += '</div>'
h += mobile_bottom_nav("search")
h += '</div>\n'
h += frame_close()
h += section_close()

with open(OUT, "a", encoding="utf-8") as f:
    f.write(h)
print(f"Part 3 done. File size: {os.path.getsize(OUT):,} bytes")
