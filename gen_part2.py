#!/usr/bin/env python3
"""Part 2: M1-M3 screens"""
from gen_utils import *

def build():
    h = ""
    # ===================== M1: HOME PAGE =====================
    h += section_header("m1", "Trang chủ", "/", "ISR (revalidate=3600)", "No", "Landing page — Hero banner, danh mục nổi bật, công thức nổi bật. Xem Desktop 1440px + Tablet 768px + Mobile 375px. Trạng thái: Nội dung, Đang tải (skeleton shimmer).")
    # -- M1 Desktop Populated --
    h += frame_open("Desktop", 1440, "Populated", description="Trang chủ đầy đủ: Hero gradient cam với tiêu đề 'Khám phá ẩm thực Việt Nam', lưới 6 danh mục (Món chính, Đồ uống, Đồ ăn sáng, Tráng miệng, Món chay, Món kho), 4 công thức nổi bật dạng card (Phở Bò, Bún Chả, Bánh Mì, Chè Ba Màu), footer 3 cột với liên kết và hỗ trợ", frame_id="home-1-populated")
    h += '<div class="bg-white min-h-[600px]">\n'
    h += nav_bar(logged_in=False)
    h += '<div class="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-8 py-16"><div class="max-w-6xl mx-auto"><h1 class="text-4xl font-extrabold mb-4">Khám phá ẩm thực Viet Nam</h1><p class="text-lg text-brand-100 mb-6 max-w-xl">Tong hop nhung cong thuc nấu ăn ngon, dễ làm tu nhieu nguon goc khac nhau.</p><div class="flex gap-3"><a href="#" class="px-6 py-3 bg-white text-brand-600 font-bold rounded-lg hover:bg-brand-50">Khám phá cong thuc</a><a href="#" class="px-6 py-3 border-2 border-white/30 text-white rounded-lg hover:bg-white/10">Đăng ký</a></div></div></div>'
    h += '<div class="max-w-6xl mx-auto px-8 py-10"><h2 class="text-xl font-bold text-surface-900 mb-6">Danh mục noi bat</h2><div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">'
    cats = [("Món chính","42 cong thuc","bg-orange-100 text-orange-600"),("Đồ uống","18 cong thuc","bg-blue-100 text-blue-600"),("Đồ ăn sáng","25 cong thuc","bg-amber-100 text-amber-600"),("Tráng miệng","15 cong thuc","bg-pink-100 text-pink-600"),("Món chay","12 cong thuc","bg-green-100 text-green-600"),("Món kho","20 cong thuc","bg-red-100 text-red-600")]
    for name,cnt,cls in cats:
        h += f'<a href="#" class="p-4 rounded-xl border border-surface-200 hover:border-brand-300 hover:shadow-sm transition text-center"><div class="w-12 h-12 {cls} rounded-full flex items-center justify-center mx-auto mb-2">{ICO["grid"]}</div><div class="font-semibold text-sm text-surface-800">{name}</div><div class="text-xs text-surface-400">{cnt}</div></a>'
    h += '</div></div>'
    h += '<div class="max-w-6xl mx-auto px-8 pb-10"><h2 class="text-xl font-bold text-surface-900 mb-6">Công thức noi bat</h2><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">'
    recipes_data = [("Phở Bò Hà Nội","Pho bo la mon an truyền thống cua Viet Nam, voi nước dùng chanh thơm ngon, thịt bò mềm mại.","Nguyễn Văn An",285,"De",380,["Món chính","Pho"]),("Bún Chả Hà Nội","Bun cha la mon an duoc yeu thich tai Ha Noi, thịt heo nuong thom.","Trần Minh Bình",45,"Trung binh",420,["Món chính","Bun"]),("Bánh Mì Thịt Nướng","Banh mi Viet voi thit nuong thom lui, rau thom, va tuong ot cay nồng.","Nguyễn Văn An",30,"De",350,["Đồ ăn sáng","Banh mi"]),("Chè Ba Màu","Che ba mau la mon trang mieng noi tieng voi ba lop mau sac: do, vang, xanh.","Trần Minh Bình",60,"Trung binh",280,["Tráng miệng","Che"])]
    for t,d,a,tm,df,cl,tg in recipes_data:
        h += recipe_card(t,d,a,tm,df,cl,tg)
    h += '</div></div>'
    h += '<footer class="bg-surface-800 text-surface-300 px-8 py-8"><div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"><div><div class="flex items-center gap-2 mb-3"><div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center" aria-hidden="true">'+ICO["book"]+'</div><span class="font-bold text-white">Culinary Blog</span></div><p class="text-sm">Khám phá ẩm thực Viet Nam qua nhung cong thuc truyền thống va sang tao.</p></div><div><h3 class="font-bold text-white mb-3">Lien ket</h3><div class="space-y-2 text-sm"><a href="#" class="block hover:text-white">Trang chủ</a><a href="#" class="block hover:text-white">Công thức</a><a href="#" class="block hover:text-white">Danh mục</a></div></div><div><h3 class="font-bold text-white mb-3">Hỗ trợ</h3><div class="space-y-2 text-sm"><a href="#" class="block hover:text-white">Liên hệ</a><a href="#" class="block hover:text-white">Điều khoản</a><a href="#" class="block hover:text-white">Chính sách</a></div></div></div><div class="max-w-6xl mx-auto mt-8 pt-6 border-t border-surface-700 text-center text-xs text-surface-500">&copy; 2026 Culinary Blog. Tất cả quyen duoc bao luu.</div></footer>'
    h += '</div>\n'
    h += frame_close()
    # -- M1 Desktop Loading --
    h += frame_open("Desktop", 1440, "Loading", "state-loading", description="Trạng thái Loading: Toàn bộ nội dung trang chủ được thay thế bằng skeleton shimmer — hero block, 6 ô danh mục, 4 card công thức đều hiển thị dạng xám nhấp nháy cho thấy dữ liệu đang được tải từ server", frame_id="home-2-loading")
    h += '<div class="bg-white min-h-[600px]">\n'
    h += nav_bar(logged_in=False)
    h += '<div class="bg-gradient-to-r from-brand-200 to-brand-300 px-8 py-16"><div class="max-w-6xl mx-auto space-y-4"><div class="skeleton h-10 w-96 bg-white/40"></div><div class="skeleton h-6 w-72 bg-white/40"></div><div class="flex gap-3"><div class="skeleton h-12 w-44 bg-white/40"></div><div class="skeleton h-12 w-32 bg-white/40"></div></div></div></div>'
    h += '<div class="max-w-6xl mx-auto px-8 py-10"><div class="skeleton h-7 w-48 mb-6"></div><div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">'
    for _ in range(6):
        h += '<div class="p-4 rounded-xl border border-surface-200 text-center space-y-2"><div class="skeleton w-12 h-12 rounded-full mx-auto"></div><div class="skeleton h-4 w-20 mx-auto"></div><div class="skeleton h-3 w-16 mx-auto"></div></div>'
    h += '</div></div>'
    h += '<div class="max-w-6xl mx-auto px-8 pb-10"><div class="skeleton h-7 w-48 mb-6"></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">'
    for _ in range(4):
        h += skeleton_card()
    h += '</div></div>'
    h += '</div>\n'
    h += frame_close()
    # -- M1 Mobile Populated --
    h += frame_open("Mobile", 375, "Populated", description="Responsive Mobile 375px: Hero co đầy đủ chiều rộng, lưới danh mục 3 cột nhỏ gọn, công thức dạng card dọc có ảnh bìa + tiêu đề + tác giả + thời gian, bottom navigation 4 mục (Trang chủ, Công thức, Tìm kiếm, Cá nhân)", frame_id="home-3-populated")
    h += '<div class="bg-white min-h-[600px]" style="max-width:375px;position:relative">\n'
    h += nav_bar(mobile=True, logged_in=False)
    h += '<div class="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-5 py-10"><h1 class="text-2xl font-extrabold mb-2">Khám phá ẩm thực Viet Nam</h1><p class="text-sm text-brand-100 mb-4">Tong hop nhung cong thuc nấu ăn ngon.</p><a href="#" class="inline-block px-5 py-2.5 bg-white text-brand-600 font-bold rounded-lg text-sm">Khám phá</a></div>'
    h += '<div class="px-5 py-6"><h2 class="text-lg font-bold mb-4">Danh mục</h2><div class="grid grid-cols-3 gap-3">'
    for name,cnt,cls in cats[:6]:
        h += f'<div class="p-3 rounded-xl border border-surface-200 text-center"><div class="w-8 h-8 {cls} rounded-full flex items-center justify-center mx-auto mb-1 text-xs">{ICO["grid"]}</div><div class="text-xs font-semibold">{name}</div><div class="text-[10px] text-surface-400">{cnt}</div></div>'
    h += '</div></div>'
    h += '<div class="px-5 pb-6"><h2 class="text-lg font-bold mb-4">Công thức noi bat</h2><div class="space-y-4">'
    for t,d,a,tm,df,cl,tg in recipes_data[:2]:
        h += recipe_card(t,d,a,tm,df,cl,tg)
    h += '</div></div>'
    h += mobile_bottom_nav("home")
    h += '</div>\n'
    h += frame_close()
    # -- M1 Tablet Populated --
    h += frame_open("Tablet", 768, "Populated", description="Responsive Tablet 768px: Hero banner co lại, lưới danh mục chuyển sang 2 cột thay vì 3, công thức nổi bật 2 cột, footer vẫn 3 cột nhưng thu gọn", frame_id="home-4-populated")
    h += '<div class="bg-white min-h-[600px]" style="max-width:768px">\n'
    h += nav_bar(logged_in=False)
    h += '<div class="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-12"><h1 class="text-3xl font-extrabold mb-3">Khám phá ẩm thực Viet Nam</h1><p class="text-brand-100 mb-4 max-w-md">Tong hop nhung cong thuc nấu ăn ngon, dễ làm.</p><a href="#" class="inline-block px-5 py-2.5 bg-white text-brand-600 font-bold rounded-lg">Khám phá cong thuc</a></div>'
    h += '<div class="max-w-4xl mx-auto px-6 py-8"><h2 class="text-lg font-bold mb-4">Danh mục</h2><div class="grid grid-cols-3 gap-4">'
    for name,cnt,cls in cats:
        h += f'<div class="p-3 rounded-xl border border-surface-200 text-center"><div class="w-10 h-10 {cls} rounded-full flex items-center justify-center mx-auto mb-1">{ICO["grid"]}</div><div class="text-sm font-semibold">{name}</div><div class="text-xs text-surface-400">{cnt}</div></div>'
    h += '</div></div>'
    h += '<div class="max-w-4xl mx-auto px-6 pb-8"><h2 class="text-lg font-bold mb-4">Công thức noi bat</h2><div class="grid grid-cols-2 gap-5">'
    for t,d,a,tm,df,cl,tg in recipes_data:
        h += recipe_card(t,d,a,tm,df,cl,tg)
    h += '</div></div>'
    h += '</div>\n'
    h += frame_close()
    h += section_close()

    # ===================== M2: RECIPE LIST =====================
    h += section_header("m2", "Danh sách công thức", "/recipes", "SSR (dynamic)", "No", "Trang danh sách — Bộ lọc, sắp xếp, phân trang, tag. Xem Desktop 1440px + Mobile 375px. Trạng thái: Nội dung, Đang tải, Trống.")
    all_recipes = [("Phở Bò Hà Nội","Pho bo la mon an truyền thống cua Viet Nam.","Nguyễn Văn An",285,"De",380,["Pho","Món chính"]),("Bún Chả Hà Nội","Bun cha la mon an duoc yeu thich tai Ha Noi.","Trần Minh Bình",45,"Trung binh",420,["Bun","Nuong"]),("Bánh Mì Thịt Nướng","Banh mi Viet voi thit nuong thom lui.","Nguyễn Văn An",30,"De",350,["Banh mi","Đồ ăn sáng"]),("Chè Ba Màu","Che ba mau la mon trang mieng noi tieng.","Trần Minh Bình",60,"Trung binh",280,["Che","Tráng miệng"]),("Gỏi Cuốn Tom Thit","Goi cuon tuoi ngon voi tom thit va rau thom.","Nguyễn Văn An",40,"De",220,["Goi cuon","Món chay"]),("Bánh Xèo Mien Tay","Banh xeo gion tan voi tom, thit, dau hanh.","Trần Minh Bình",50,"Trung binh",310,["Banh xeo","Đồ ăn sáng"])]
    # M2 Desktop Populated
    h += frame_open("Desktop", 1440, "Populated", description="Desktop 1440px — Trang danh sách công thức: Thanh tìm kiếm trên cùng, bộ lọc bên trái (danh mục, độ khó, thời gian), bảng công thức 4 cột có ảnh bìa + tiêu đề + tác giả + thời gian + độ khó + calories, phân trang ở dưới, sắp xếp theo ngày tạo mới nhất", frame_id="recipes-1-populated")
    h += '<div class="bg-white min-h-[600px]">\n'
    h += nav_bar(logged_in=False)
    h += '<div class="max-w-6xl mx-auto px-8 py-6"><div class="flex items-center justify-between mb-6"><h1 class="text-2xl font-bold text-surface-900">Tất cả cong thuc</h1><span class="text-sm text-surface-400">Tim thay 142 cong thuc</span></div><div class="mb-6"><div class="relative"><input type="search" placeholder="Tim kiem cong thuc, nguyen lieu, tac gia..." class="w-full pl-12 pr-6 py-3 text-base border-2 border-surface-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm" aria-label="Tim kiem cong thuc"><span class="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400">'+ICO["search"]+'</span></div></div><div class="flex flex-col md:flex-row gap-6">'
    h += '<aside class="w-full md:w-64 flex-shrink-0 space-y-6" role="complementary" aria-label="Bộ lọc">'
    h += '<div><label for="filter-cat" class="block text-sm font-semibold text-surface-700 mb-2">Danh mục</label><select id="filter-cat" class="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm"><option>Tất cả danh muc</option><option>Món chính</option><option>Đồ ăn sáng</option><option>Đồ uống</option><option>Tráng miệng</option><option>Món chay</option><option>Món kho</option></select></div>'
    h += '<div><label for="filter-diff" class="block text-sm font-semibold text-surface-700 mb-2">Do kho</label><select id="filter-diff" class="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm"><option>Tất cả</option><option>De</option><option>Trung binh</option><option>Kho</option><option>Chuyen gia</option></select></div>'
    h += '<div><label for="filter-time" class="block text-sm font-semibold text-surface-700 mb-2">Thoi gian nau</label><select id="filter-time" class="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm"><option>Tất cả</option><option>Duoi 30 phut</option><option>Duoi 60 phut</option><option>Duoi 120 phut</option></select></div>'
    h += '<div><label for="filter-sort" class="block text-sm font-semibold text-surface-700 mb-2">Sắp xếp</label><select id="filter-sort" class="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm"><option>Moi nhat</option><option>Cu nhat</option><option>Ten A-Z</option><option>Thoi gian ngan</option></select></div>'
    h += '<button class="w-full px-4 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 text-sm">Ap dung bo loc</button></aside>'
    h += '<div class="flex-1"><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">'
    for t,d,a,tm,df,cl,tg in all_recipes:
        h += recipe_card(t,d,a,tm,df,cl,tg)
    h += '</div><div class="flex items-center justify-center gap-2 mt-8">'
    h += '<button class="px-3 py-2 text-sm border border-surface-300 rounded-lg text-surface-400 cursor-not-allowed" disabled>&laquo;</button>'
    h += '<button class="px-3 py-2 text-sm bg-brand-500 text-white rounded-lg font-bold">1</button>'
    h += '<button class="px-3 py-2 text-sm border border-surface-300 rounded-lg hover:bg-surface-50">2</button>'
    h += '<button class="px-3 py-2 text-sm border border-surface-300 rounded-lg hover:bg-surface-50">3</button>'
    h += '<span class="text-surface-400">...</span>'
    h += '<button class="px-3 py-2 text-sm border border-surface-300 rounded-lg hover:bg-surface-50">12</button>'
    h += '<button class="px-3 py-2 text-sm border border-surface-300 rounded-lg hover:bg-surface-50">&raquo;</button>'
    h += '</div></div></div></div></div>\n'
    h += frame_close()
    # M2 Desktop Loading
    h += frame_open("Desktop", 1440, "Loading", "state-loading", description="Trạng thái Loading: Bộ lọc bên trái hiển thị skeleton, mỗi ô công thức đều có skeleton shimmer cho ảnh + tiêu đề + thông tin, cho thấy dữ liệu đang tải", frame_id="recipes-2-loading")
    h += '<div class="bg-white min-h-[600px]">\n'
    h += nav_bar(logged_in=False)
    h += '<div class="max-w-6xl mx-auto px-8 py-6"><div class="skeleton h-8 w-48 mb-6"></div><div class="flex gap-6"><div class="w-64 space-y-4"><div class="skeleton h-10 w-full"></div><div class="skeleton h-10 w-full"></div><div class="skeleton h-10 w-full"></div></div><div class="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">'
    for _ in range(6):
        h += skeleton_card()
    h += '</div></div></div></div>\n'
    h += frame_close()
    # M2 Desktop Empty
    h += frame_open("Desktop", 1440, "Empty", "state-empty", description="Trạng thái Empty: Khi bộ lọc không khớp kết quả nào — hiển thị icon_book lớn, thông báo 'Chưa có công thức nào', mô tả hướng dẫn, nút 'Tạo công thức mới' để người dùng bắt đầu", frame_id="recipes-3-empty")
    h += '<div class="bg-white min-h-[600px]">\n'
    h += nav_bar(logged_in=False)
    h += '<div class="max-w-6xl mx-auto px-8 py-6"><h1 class="text-2xl font-bold text-surface-900 mb-6">Tất cả cong thuc</h1><div class="flex gap-6"><aside class="w-64 flex-shrink-0 space-y-4" role="complementary"><div class="skeleton h-10 w-full"></div><div class="skeleton h-10 w-full"></div></aside><div class="flex-1 flex flex-col items-center justify-center py-20 text-center"><div class="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-4 text-surface-400">'+ICO["search"]+'</div><h3 class="text-lg font-semibold text-surface-700 mb-2">Không tìm thấy cong thuc</h3><p class="text-sm text-surface-400 max-w-sm">Không có cong thuc nao phù hợp voi bo loc cua ban.</p></div></div></div></div>\n'
    h += frame_close()
    # M2 Mobile Populated
    h += frame_open("Mobile", 375, "Populated", description="Responsive Mobile 375px: Thanh tìm kiếm, bộ lọc chuyển sang dạng dropdown dọc, mỗi công thức hiển thị dạng card có ảnh bìa full-width + tiêu đề + mô tả ngắn + tag + thời gian, bottom navigation", frame_id="recipes-4-populated")
    h += '<div class="bg-white min-h-[600px]" style="max-width:375px;position:relative">\n'
    h += nav_bar(mobile=True, logged_in=False)
    h += '<div class="px-5 py-4"><h1 class="text-lg font-bold mb-3">Tất cả cong thuc</h1><div class="flex gap-2 mb-4"><div class="relative flex-1"><input type="search" placeholder="Tìm kiếm..." class="w-full pl-10 pr-4 py-2.5 border border-surface-300 rounded-lg text-sm" aria-label="Tìm kiếm"/><div class="absolute left-3 top-2.5 text-surface-400">'+ICO["search"]+'</div></div><button class="px-3 py-2.5 border border-surface-300 rounded-lg text-surface-600 hover:bg-surface-50" aria-label="Bo loc">'+ICO["grid"]+'</button></div>'
    for t,d,a,tm,df,cl,tg in all_recipes[:3]:
        h += recipe_card(t,d,a,tm,df,cl,tg)
    h += '<div class="flex justify-center items-center gap-2 mt-4"><button class="px-3 py-2 text-xs border border-surface-300 rounded-lg text-surface-400 cursor-not-allowed" disabled>&laquo;</button><button class="px-3 py-2 text-xs bg-brand-500 text-white rounded-lg font-bold">1</button><button class="px-3 py-2 text-xs border border-surface-300 rounded-lg">2</button><span class="text-surface-400 text-xs px-1">...</span><button class="px-3 py-2 text-xs border border-surface-300 rounded-lg">12</button><button class="px-3 py-2 text-xs border border-surface-300 rounded-lg">&raquo;</button></div></div>'
    h += mobile_bottom_nav("search")
    h += '</div>\n'
    h += frame_close()
    h += section_close()

    # ===================== M3: RECIPE DETAIL =====================
    h += section_header("m3", "Chi tiết công thức", "/recipes/[slug]", "ISR (revalidate=300)", "No", "Trang chi tiết — Breadcrumb, thông tin, nguyên liệu, bước nấu, JSON-LD Schema.org. Xem Desktop 1440px + Mobile 375px. Trạng thái: Nội dung, Đang tải, 404 Không tìm thấy.")
    # M3 Desktop Populated
    h += frame_open("Desktop", 1440, "Populated", description="Desktop 1440px — Trang chi tiết công thức Phở Bò Hà Nội: Breadcrumb (Trang chủ / Công thức / pho-bo-ha-noi), ảnh bìa full-width 300px, tiêu đề lớn + avatar tác giả (Nguyễn Văn An) + thời gian 285 phút + độ khó Dễ + 4 phần, bảng nguyên liệu 2 cột với số lượng chi tiết, 4 bước nấu có đánh số + mô tả, phần dinh dưỡng (380 kcal, 28g protein), JSON-LD Schema.org markup", frame_id="recipe-detail-1-populated")
    h += '<div class="bg-white min-h-[600px]">\n'
    h += nav_bar(logged_in=False)
    h += '<div class="max-w-4xl mx-auto px-8 py-3"><nav aria-label="Breadcrumb" class="text-sm text-surface-400"><ol class="flex items-center gap-2"><li><a href="#" class="hover:text-brand-600">Trang chủ</a></li><li>/</li><li><a href="#" class="hover:text-brand-600">Công thức</a></li><li>/</li><li class="text-surface-700 font-medium">pho-bo-ha-noi</li></ol></nav></div>'
    h += '<article class="max-w-4xl mx-auto px-8 pb-10">'
    h += '<div class="aspect-video bg-gradient-to-br from-brand-200 to-brand-400 rounded-xl mb-6 flex items-center justify-center text-white text-4xl font-extrabold" role="img" aria-label="Hinh anh Phở Bò Hà Nội">Pho Bo</div>'
    h += '<div class="flex items-start justify-between mb-6"><div><h1 class="text-3xl font-extrabold text-surface-900 mb-2">Phở Bò Hà Nội</h1><div class="flex items-center gap-4 text-sm text-surface-500"><div class="flex items-center gap-2"><div class="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm">A</div><span>Nguyễn Văn An</span></div><span class="flex items-center gap-1">'+ICO["clock"]+' '+format_time(285)+'</span><span class="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">De</span><span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">4 phan</span></div></div>'
    h += '<div class="flex gap-2"><button class="px-4 py-2 border border-surface-300 rounded-lg text-sm hover:bg-surface-50 flex items-center gap-1" aria-label="Luu">'+ICO["heart"]+' Luu</button><button class="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm hover:bg-brand-600" aria-label="Chia sẻ">Chia sẻ</button></div></div>'
    h += '<p class="text-surface-600 mb-8">Pho bo Ha Noi la mon an truyền thống cua Viet Nam, noi tieng voi nước dùng chanh thơm ngon, thịt bò mềm mại va bot gion tan.</p>'
    h += '<div class="grid grid-cols-1 md:grid-cols-3 gap-8"><div class="md:col-span-2"><h2 class="text-xl font-bold text-surface-900 mb-4">Nguyen lieu</h2>'
    h += '<table class="w-full text-sm mb-8" role="table"><thead class="text-left text-surface-500 border-b border-surface-200"><tr><th class="pb-2 font-medium">Nguyen lieu</th><th class="pb-2 font-medium">So luong</th><th class="pb-2 font-medium">Ghi chu</th></tr></thead><tbody class="divide-y divide-surface-100"><tr><td class="py-2">500g bo tenderloin</td><td class="py-2">500g</td><td class="py-2 text-surface-400">Cat thin</td></tr><tr><td class="py-2">Banh pho</td><td class="py-2">500g</td><td class="py-2 text-surface-400"></td></tr><tr><td class="py-2">Hanh tay, gung</td><td class="py-2">100g</td><td class="py-2 text-surface-400">Them thom</td></tr><tr><td class="py-2">Nuoc mam, muoi, tieu</td><td class="py-2">Vua</td><td class="py-2 text-surface-400">Dieu chinh huong vi</td></tr><tr><td class="py-2">Rau thơm, mint, thai</td><td class="py-2">Vua</td><td class="py-2 text-surface-400">An kem</td></tr></tbody></table>'
    h += '<h2 class="text-xl font-bold text-surface-900 mb-4">Cac buoc thuc hien</h2><div class="space-y-6">'
    steps = [("1","Chuan bi nước dùng","Bo hap qua nuoc soi de loai bo bat mau, sau do cho vao noi lon voi hanh tay, gung dot. Dun liu ho 3-4 gio de nước dùng trong va thom.","360 phut"),("2","Che thịt bò","Cat bo thanh lop mong. Tron voi nuoc mam, tieu, hanh tay bot de thom.","15 phut"),("3","Luoc banh pho","Luoc banh pho trong nuoc soi 30 giay, sau do vat ra va xep vao bat.","5 phut"),("4","Thanh pham","Xep banh pho, thịt bò, hanh tay, rau thom vao bat. Chan nước dùng nong len.","10 phut")]
    for sn,st,sd,stime in steps:
        h += f'<div class="flex gap-4"><div class="w-10 h-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">{sn}</div><div class="flex-1"><h3 class="font-bold text-surface-900">{st}</h3><p class="text-sm text-surface-600 mt-1">{sd}</p><div class="flex items-center gap-1 text-xs text-surface-400 mt-2">'+ICO["clock"]+f' {stime}</div></div></div>'
    h += '</div></div>'
    h += '<div class="space-y-6"><div class="bg-surface-50 rounded-xl p-5 border border-surface-200"><h3 class="font-bold text-surface-900 mb-3">Thông tin dinh duong</h3><div class="space-y-2 text-sm"><div class="flex justify-between"><span class="text-surface-500">Calories</span><span class="font-semibold">380 kcal</span></div><div class="flex justify-between"><span class="text-surface-500">Protein</span><span class="font-semibold">28g</span></div><div class="flex justify-between"><span class="text-surface-500">Carbs</span><span class="font-semibold">42g</span></div><div class="flex justify-between"><span class="text-surface-500">Chat beo</span><span class="font-semibold">10g</span></div><div class="flex justify-between"><span class="text-surface-500">Chat xo</span><span class="font-semibold">2g</span></div><div class="flex justify-between"><span class="text-surface-500">Natri</span><span class="font-semibold">890mg</span></div></div></div>'
    h += '<div class="bg-surface-50 rounded-xl p-5 border border-surface-200"><h3 class="font-bold text-surface-900 mb-3">Thoi gian</h3><div class="space-y-2 text-sm"><div class="flex justify-between"><span class="text-surface-500">Chuan bi</span><span class="font-semibold">'+format_time(45)+'</span></div><div class="flex justify-between"><span class="text-surface-500">Nau</span><span class="font-semibold">'+format_time(240)+'</span></div><div class="flex justify-between"><span class="text-surface-500">Tong cong</span><span class="font-semibold">'+format_time(285)+'</span></div></div></div>'
    h += '<div class="bg-amber-50 rounded-xl p-5 border border-amber-200"><h3 class="font-bold text-amber-800 mb-2 text-sm">Pho hop voi</h3><div class="flex flex-wrap gap-2 text-xs"><span class="px-2 py-1 bg-white rounded-full border border-amber-200 text-amber-700">Bua sang</span><span class="px-2 py-1 bg-white rounded-full border border-amber-200 text-amber-700">Bua trua</span><span class="px-2 py-1 bg-white rounded-full border border-amber-200 text-amber-700">Mua dong</span></div></div></div></div></article>'
    h += '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Recipe","name":"Phở Bò Hà Nội","description":"Pho bo Ha Noi la mon an truyền thống cua Viet Nam.","image":"https://culinaryblog.com/images/pho-bo.jpg","author":{"@type":"Person","name":"Nguyễn Văn An"},"datePublished":"2025-01-15","prepTime":"PT45M","cookTime":"PT4H","totalTime":"PT4H45M","recipeYield":"4 phan","recipeIngredient":["500g bo tenderloin","500g banh pho","100g hanh tay, gung","Nuoc mam, muoi, tieu","Rau thơm, mint, thai"],"recipeInstructions":[{"@type":"HowToStep","name":"Chuan bi nước dùng","text":"Bo hap qua nuoc soi..."},{"@type":"HowToStep","name":"Che thịt bò","text":"Cat bo thanh lop mong..."},{"@type":"HowToStep","name":"Luoc banh pho","text":"Luoc banh pho trong nuoc soi..."},{"@type":"HowToStep","name":"Thanh pham","text":"Xep banh pho, thịt bò..."}],"nutrition":{"@type":"NutritionInformation","calories":"380 kcal","proteinContent":"28g","carbohydrateContent":"42g","fatContent":"10g","fiberContent":"2g","sodiumContent":"890mg"}}</script>'
    h += '</div>\n'
    h += frame_close()
    # M3 Mobile Populated
    h += frame_open("Mobile", 375, "Populated", description="Responsive Mobile 375px: Breadcrumb rút gọn (Trang chủ / Công thức / Phở Bò), ảnh bìa full-width, tiêu đề + avatar nhỏ + thời gian + độ khó, bảng nguyên liệu dạng cột đơn, các bước nấu dạng danh sách có đánh số", frame_id="recipe-detail-2-populated")
    h += '<div class="bg-white min-h-[600px]" style="max-width:375px;position:relative">\n'
    h += nav_bar(mobile=True, logged_in=False)
    h += '<div class="px-5 py-3 text-xs text-surface-400"><a href="#">Trang chủ</a> / <a href="#">Công thức</a> / <span class="text-surface-700">Pho Bo</span></div>'
    h += '<article class="pb-10"><div class="aspect-video bg-gradient-to-br from-brand-200 to-brand-400 flex items-center justify-center text-white text-2xl font-extrabold">Pho Bo</div><div class="px-5 py-4"><h1 class="text-xl font-extrabold text-surface-900 mb-2">Phở Bò Hà Nội</h1><div class="flex items-center gap-3 text-xs text-surface-500 mb-3"><span class="flex items-center gap-1">'+ICO["clock"]+' '+format_time(285)+'</span><span class="px-2 py-0.5 bg-green-100 text-green-700 rounded">De</span><span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">4 phan</span></div><p class="text-sm text-surface-600 mb-4">Pho bo Ha Noi la mon an truyền thống cua Viet Nam.</p><h2 class="font-bold text-surface-900 mb-2">Nguyen lieu</h2><div class="text-sm space-y-1 mb-4"><div class="flex justify-between py-1 border-b border-surface-100"><span>500g bo tenderloin</span><span class="text-surface-400">Cat thin</span></div><div class="flex justify-between py-1 border-b border-surface-100"><span>Banh pho</span><span class="text-surface-400">500g</span></div></div><h2 class="font-bold text-surface-900 mb-2">Cac buoc</h2><div class="space-y-3">'
    for sn,st,sd,stime in steps:
        h += f'<div class="flex gap-3"><div class="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">{sn}</div><div><h3 class="font-bold text-sm text-surface-900">{st}</h3><p class="text-xs text-surface-600 mt-0.5">{sd[:80]}...</p></div></div>'
    h += '</div></div></article>'
    h += mobile_bottom_nav()
    h += '</div>\n'
    h += frame_close()
    # M3 Desktop 404
    h += frame_open("Desktop", 1440, "404 Not Found", "state-error", description="Trang lỗi 404: Icon warning lớn, số '404' khổng lồ màu xám nhạt, tiêu đề 'Không tìm thấy công thức', mô tả 'Công thức bạn tìm kiếm không tồn tại đã bị xóa hoặc đường dẫn không chính xác', 2 nút (Về trang chủ + Xem công thức khác)", frame_id="recipe-detail-3-404")
    h += '<div class="bg-white min-h-[600px]">\n'
    h += nav_bar(logged_in=False)
    h += '<div class="max-w-4xl mx-auto px-8 py-20 text-center"><div class="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-6 text-surface-400">'+ICO["warning"]+'</div><h1 class="text-6xl font-extrabold text-surface-200 mb-4">404</h1><h2 class="text-xl font-bold text-surface-700 mb-2">Không tìm thấy cong thuc</h2><p class="text-surface-400 mb-6 max-w-md mx-auto">Công thức ban tim kiem khong ton tai da bi xoa hoặc đường dẫn khong chính xác.</p><div class="flex justify-center gap-3"><a href="#" class="px-5 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600">Về trang chủ</a><a href="#" class="px-5 py-2.5 border border-surface-300 rounded-lg font-medium hover:bg-surface-50">Xem cong thuc khac</a></div></div></div>\n'
    h += frame_close()
    h += section_close()
    return h
