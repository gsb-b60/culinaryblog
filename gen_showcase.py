#!/usr/bin/env python3
"""Generate web-showcase.html for the Culinary Blog UI Showcase."""
import os, textwrap

OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web-showcase.html")

recipes = [
    ("Phở Bò Hà Nội", "45 phút", "4", "Nguyễn Văn An", "Món Chính", "Dễ", "orange-200", "orange-300", "orange-600"),
    ("Bún Chả Hà Nội", "60 phút", "4", "Trần Minh Bình", "Món Chính", "Trung bình", "amber-200", "amber-300", "amber-600"),
    ("Bánh Mì Thịt Nướng", "30 phút", "2", "Nguyễn Văn An", "Món Ăn Sáng", "Dễ", "red-200", "red-300", "red-600"),
    ("Chè Ba Màu", "40 phút", "6", "Trần Minh Bình", "Món Tráng Miệng", "Dễ", "teal-200", "teal-300", "teal-600"),
    ("Gỏi Cuốn Tôm Thịt", "25 phút", "4", "Nguyễn Văn An", "Món Chính", "Dễ", "lime-200", "lime-300", "lime-600"),
    ("Bánh Xèo Miền Tây", "45 phút", "4", "Trần Minh Bình", "Món Chính", "Trung bình", "yellow-200", "yellow-300", "yellow-600"),
    ("Cơm Chay Đậu Hũ", "30 phút", "2", "Trần Minh Bình", "Món Chay", "Dễ", "green-200", "green-300", "green-600"),
    ("Trà Đào Cam Sả", "15 phút", "4", "Nguyễn Văn An", "Đồ Uống", "Dễ", "rose-200", "rose-300", "rose-600"),
]

categories = [
    ("Món Chính", "42", "Các món ăn chính trong bữa cơm gia đình", "orange-400", "orange-500", "brand"),
    ("Đồ Uống", "18", "Trà, cà phê, sinh tố và đồ uống giải khát", "blue-400", "blue-500", "blue"),
    ("Món Ăn Sáng", "25", "Phở, bún, bánh mì và các món ăn sáng", "yellow-400", "yellow-500", "yellow"),
    ("Món Tráng Miệng", "15", "Chè, bánh ngọt và các món tráng miệng", "pink-400", "pink-500", "pink"),
    ("Món Chay", "12", "Các món ăn chay thanh đạm", "green-400", "green-500", "green"),
    ("Món Kho", "20", "Các món kho đậm đà hương vị", "amber-400", "amber-500", "amber"),
]

def recipe_card(name, time, servings, author, category, difficulty, gf, gt, ic):
    dc = "emerald" if difficulty == "Dễ" else "amber"
    cc = {"Món Chính": "brand", "Đồ Uống": "blue", "Món Ăn Sáng": "yellow", "Món Tráng Miệng": "purple", "Món Chay": "green", "Món Kho": "amber"}.get(category, "brand")
    return f'''<div class="bg-white border border-surface-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"><div class="h-36 bg-gradient-to-br from-{gf} to-{gt} flex items-center justify-center"><svg class="w-10 h-10 text-{ic}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/></svg></div><div class="p-4"><div class="flex items-center gap-2 mb-2"><span class="px-2 py-0.5 bg-{cc}-50 text-{cc}-600 text-[10px] font-semibold rounded">{category}</span><span class="px-2 py-0.5 bg-{dc}-50 text-{dc}-600 text-[10px] font-semibold rounded">{difficulty}</span></div><h3 class="font-bold text-sm text-surface-900 mb-1">{name}</h3><p class="text-xs text-surface-500 mb-3">{category == "Món Chính" and "Món ăn truyền thống Việt Nam" or "Công thức thơm ngon"}</p><div class="flex items-center justify-between text-xs text-surface-400"><span>{time} · {servings} phần</span><span>{author}</span></div></div></div>'''

def recipe_list_card(name, time, servings, difficulty, gf, gt):
    dc = "emerald" if difficulty == "Dễ" else "amber"
    return f'''<div class="flex border border-surface-200 rounded-lg overflow-hidden"><div class="w-24 h-24 bg-gradient-to-br from-{gf} to-{gt} flex-shrink-0"></div><div class="p-3 flex-1"><h3 class="font-bold text-xs">{name}</h3><p class="text-[10px] text-surface-500 mt-1">{time} · {servings} phần · {difficulty}</p></div></div>'''

def skeleton_card():
    return '''<div class="border border-surface-200 rounded-xl overflow-hidden"><div class="skeleton h-36 rounded-none"></div><div class="p-4 space-y-2"><div class="flex gap-2"><div class="skeleton w-16 h-4 rounded"></div><div class="skeleton w-12 h-4 rounded"></div></div><div class="skeleton w-3/4 h-5 rounded"></div><div class="skeleton w-full h-3 rounded"></div><div class="skeleton w-2/3 h-3 rounded"></div></div></div>'''

def frame(wl, wp, bs, content):
    return f'''<div class="frame-box"><div class="browser-chrome"><div class="dot-red"></div><div class="dot-yellow"></div><div class="dot-green"></div><span class="ml-3 text-xs text-surface-400 font-medium">{wl} &mdash; {wp}px</span><span class="ml-auto px-2 py-0.5 bg-surface-200 text-surface-600 text-[10px] font-semibold rounded">{bs}</span></div><div class="overflow-auto" style="max-height:600px;">{content}</div></div>'''

def section_start(sid, num, title, route, rtype, auth):
    return f'''<section id="{sid}" class="mb-16"><div class="mb-6"><div class="flex items-center gap-3 mb-2"><span class="px-2.5 py-0.5 bg-brand-500 text-white text-xs font-bold rounded">{num}</span><h2 class="text-2xl font-bold text-surface-900">{title}</h2></div><div class="flex items-center gap-4 text-sm text-surface-500"><code class="px-1.5 py-0.5 bg-surface-100 rounded text-xs">{route}</code><span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded font-medium">{rtype}</span><span class="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded font-medium">Auth: {auth}</span></div></div><div class="grid grid-cols-1 gap-8">'''

SECTION_END = '''</div></section>'''

# SVG icon paths
ICO_BOOK = '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>'
ICO_SEARCH = '<svg class="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>'
ICO_CLOCK = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
ICO_PIN = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>'
ICO_HEART = '<svg class="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>'
ICO_BACK = '<svg class="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>'
ICO_GOOGLE = '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>'
ICO_WARN = '<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'

def nav(active=""):
    links = [("Trang chủ",""),("Công thức",""),("Danh mục","")]
    parts_lh = []
    for t,_ in links:
        cls = "text-brand-600 font-semibold" if t==active else "hover:text-brand-600"
        parts_lh.append('<a href="#" class="%s">%s</a>' % (cls, t))
    lh = "".join(parts_lh)
    return '<nav class="flex items-center justify-between px-6 py-4 border-b border-surface-100"><div class="flex items-center gap-2"><div class="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">%s</div><span class="font-bold text-surface-900">Culinary Blog</span></div><div class="flex items-center gap-6 text-sm text-surface-600">%s<a href="#" class="px-4 py-1.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600">Đăng nhập</a></div></nav>' % (ICO_BOOK, lh)

def mobile_nav():
    items = [("Trang chủ", "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", True),
             ("Công thức", "M4 6h16M4 10h16M4 14h16M4 18h16", False),
             ("Tìm kiếm", "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", False),
             ("Cá nhân", "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", False)]
    h = ""
    for label, path, active in items:
        c = "text-brand-600" if active else "text-surface-400"
        fm = ' font-medium' if active else ''
        h += '<a href="#" class="flex flex-col items-center gap-0.5 %s"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="%s"/></svg><span class="text-[10px]%s">%s</span></a>' % (c, path, fm, label)
    return '<div class="fixed bottom-0 left-0 right-0 max-w-[375px] mx-auto bg-white border-t border-surface-200 flex justify-around py-2 px-4 z-10">%s</div>' % h

# Build the full HTML
html_parts = []

# HEAD
html_parts.append('''<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Culinary Blog — UI Showcase</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config={theme:{extend:{fontFamily:{sans:["Inter","system-ui","sans-serif"]},colors:{brand:{50:"#fff7ed",100:"#ffedd5",200:"#fed7aa",300:"#fdba74",400:"#fb923c",500:"#f97316",600:"#ea580c",700:"#c2410c"},surface:{50:"#fafaf9",100:"#f5f5f4",200:"#e7e5e3",300:"#d6d3d1",400:"#a8a29e",500:"#78716c",600:"#57534e",700:"#44403c",800:"#292524",900:"#1c1917"}}}}}
</script>
<style>
*{scrollbar-width:thin;scrollbar-color:#a8a29e #f5f5f4}
html{scroll-behavior:smooth}
body{font-family:"Inter",system-ui,sans-serif}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.skeleton{background:linear-gradient(90deg,#e7e5e3 25%,#d6d3d1 50%,#e7e5e3 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:0.375rem}
.frame-box{border:1px solid #d6d3d1;border-radius:0.75rem;overflow:hidden;background:#fff}
.browser-chrome{background:#f5f5f4;padding:8px 12px;display:flex;align-items:center;gap:6px;border-bottom:1px solid #d6d3d1}
.dot-red{width:10px;height:10px;border-radius:50%;background:#ef4444}
.dot-yellow{width:10px;height:10px;border-radius:50%;background:#eab308}
.dot-green{width:10px;height:10px;border-radius:50%;background:#22c55e}
.sidebar-link{transition:all 0.15s}
.sidebar-link:hover{background:#ffedd5;color:#ea580c}
</style>
</head>
<body class="bg-surface-50 text-surface-800">
''')

# HEADER
html_parts.append('''<header class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-surface-200 shadow-sm"><div class="flex items-center justify-between px-6 py-3"><div class="flex items-center gap-3"><div class="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg></div><h1 class="text-lg font-bold text-surface-900">Culinary Blog — UI Showcase</h1></div><div class="flex items-center gap-2"><span class="px-3 py-1 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full">14 Screens</span><span class="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">3 Viewports</span><span class="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">5 States</span></div></div></header>
''')

# SIDEBAR
html_parts.append('''<nav class="fixed top-[53px] left-0 bottom-0 w-[260px] bg-white border-r border-surface-200 overflow-y-auto z-40"><div class="p-4">
<p class="text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-3">Public Pages</p>
<div class="space-y-0.5">
<a href="#m1" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M1 — Home Page</a>
<a href="#m2" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M2 — Recipe List</a>
<a href="#m3" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M3 — Recipe Detail</a>
<a href="#m4" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M4 — Category List</a>
<a href="#m5" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M5 — Category Detail</a>
<a href="#m6" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M6 — Search Results</a>
</div>
<p class="text-[10px] font-bold uppercase tracking-wider text-surface-400 mt-5 mb-3">Authentication</p>
<div class="space-y-0.5">
<a href="#m7" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M7 — Login</a>
<a href="#m8" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M8 — Register</a>
</div>
<p class="text-[10px] font-bold uppercase tracking-wider text-surface-400 mt-5 mb-3">Dashboard</p>
<div class="space-y-0.5">
<a href="#m9" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M9 — Dashboard Overview</a>
<a href="#m10" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M10 — Dashboard Recipes</a>
<a href="#m11" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M11 — New Recipe Wizard</a>
<a href="#m12" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M12 — Edit Recipe</a>
<a href="#m13" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M13 — Admin Categories</a>
<a href="#m14" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M14 — Profile</a>
</div>
<p class="text-[10px] font-bold uppercase tracking-wider text-surface-400 mt-5 mb-3">Global Error States</p>
<div class="space-y-0.5">
<a href="#g404" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">404 — Not Found</a>
<a href="#gnet" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">Network Error</a>
<a href="#g429" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">429 — Rate Limit</a>
</div>
</div></nav>
<main class="ml-[260px] pt-[53px] p-8">
''')

# M1: Home Page
html_parts.append(section_start("m1", "M1", "Home Page", "/", "ISR (revalidate=3600)", "No"))
# Desktop Populated
m1d = '<div class="bg-white">'
m1d += nav()
m1d += '<div class="bg-gradient-to-br from-brand-500 to-brand-600 text-white px-12 py-16"><div class="max-w-3xl"><p class="text-brand-200 text-sm font-medium mb-2">Chào mừng bạn đến với</p><h1 class="text-4xl font-extrabold mb-4">Culinary Blog</h1><p class="text-brand-100 text-lg mb-6">Khám phá hàng trăm công thức nấu ăn Việt Nam truyền thống và hiện đại. Từ phở bò Hà Nội đến bánh xèo miền Tây.</p><div class="flex gap-3"><a href="#" class="px-6 py-3 bg-white text-brand-600 font-semibold rounded-lg hover:bg-brand-50">Khám phá công thức</a><a href="#" class="px-6 py-3 border border-brand-300 text-white font-semibold rounded-lg hover:bg-brand-700">Đăng ký miễn phí</a></div></div></div>'
m1d += '<div class="px-12 py-10"><div class="flex items-center justify-between mb-6"><h2 class="text-xl font-bold text-surface-900">Công thức nổi bật</h2><a href="#" class="text-sm text-brand-600 hover:underline">Xem tất cả →</a></div><div class="grid grid-cols-4 gap-5">'
for r in recipes[:4]:
    m1d += recipe_card(*r)
m1d += '</div></div>'
m1d += '<div class="px-12 py-10 bg-surface-50"><h2 class="text-xl font-bold text-surface-900 mb-6">Danh mục phổ biến</h2><div class="grid grid-cols-6 gap-4">'
for cn, cc, cd, gf, gt, clr in categories:
    m1d += f'<div class="bg-white border border-surface-200 rounded-xl p-4 text-center hover:shadow-md transition-shadow cursor-pointer"><div class="w-12 h-12 bg-{gf} rounded-full flex items-center justify-center mx-auto mb-3">{ICO_BOOK}</div><h3 class="font-semibold text-sm text-surface-800">{cn}</h3><p class="text-xs text-surface-400 mt-1">{cc} công thức</p></div>'
m1d += '</div></div>'
m1d += '<footer class="px-12 py-8 bg-surface-900 text-surface-400 text-sm"><div class="flex justify-between"><div><div class="flex items-center gap-2 mb-3"><div class="w-6 h-6 bg-brand-500 rounded flex items-center justify-center">{ICO_BOOK}</div><span class="font-semibold text-white">Culinary Blog</span></div><p class="text-xs">Nền tảng chia sẻ công thức nấu ăn Việt Nam</p></div><div class="flex gap-12"><div><h4 class="font-semibold text-surface-300 mb-2">Liên kết</h4><ul class="space-y-1 text-xs"><li><a href="#" class="hover:text-white">Trang chủ</a></li><li><a href="#" class="hover:text-white">Công thức</a></li></ul></div><div><h4 class="font-semibold text-surface-300 mb-2">Tài khoản</h4><ul class="space-y-1 text-xs"><li><a href="#" class="hover:text-white">Đăng nhập</a></li><li><a href="#" class="hover:text-white">Đăng ký</a></li></ul></div></div></div></footer></div>'
html_parts.append(frame("Desktop", "1440", "Populated", m1d))

# M1 Loading
m1l = '<div class="bg-white"><nav class="flex items-center justify-between px-6 py-4 border-b border-surface-100"><div class="flex items-center gap-2"><div class="skeleton w-8 h-8 rounded-lg"></div><div class="skeleton w-32 h-5 rounded"></div></div><div class="flex items-center gap-4"><div class="skeleton w-16 h-4 rounded"></div><div class="skeleton w-16 h-4 rounded"></div><div class="skeleton w-56 h-8 rounded-lg"></div><div class="skeleton w-24 h-8 rounded-lg"></div></div></nav>'
m1l += '<div class="px-12 py-16 bg-surface-100"><div class="max-w-3xl space-y-4"><div class="skeleton w-40 h-4 rounded"></div><div class="skeleton w-80 h-10 rounded"></div><div class="skeleton w-full h-5 rounded"></div><div class="skeleton w-3/4 h-5 rounded"></div><div class="flex gap-3 mt-4"><div class="skeleton w-40 h-10 rounded-lg"></div><div class="skeleton w-40 h-10 rounded-lg"></div></div></div></div>'
m1l += '<div class="px-12 py-10"><div class="flex items-center justify-between mb-6"><div class="skeleton w-48 h-6 rounded"></div></div><div class="grid grid-cols-4 gap-5">' + "".join([skeleton_card() for _ in range(4)]) + '</div></div></div>'
html_parts.append(frame("Desktop", "1440", "Loading (Skeleton)", m1l))

# M1 Tablet
m1t = '<div class="bg-white"><nav class="flex items-center justify-between px-4 py-3 border-b border-surface-100"><div class="flex items-center gap-2"><div class="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg></div><span class="font-bold text-sm">Culinary Blog</span></div><div class="flex items-center gap-4 text-sm text-surface-600"><a href="#">Trang chủ</a><a href="#">Công thức</a></div></nav>'
m1t += '<div class="bg-gradient-to-br from-brand-500 to-brand-600 text-white px-8 py-12"><h1 class="text-2xl font-extrabold mb-2">Culinary Blog</h1><p class="text-brand-100 text-sm mb-4">Khám phá hàng trăm công thức nấu ăn Việt Nam</p><a href="#" class="inline-block px-5 py-2 bg-white text-brand-600 text-sm font-semibold rounded-lg">Khám phá</a></div>'
m1t += '<div class="px-8 py-8"><h2 class="text-lg font-bold mb-4">Công thức nổi bật</h2><div class="grid grid-cols-2 gap-4">'
for name, time, sv, au, cat, df, gf, gt, ic in recipes[:4]:
    m1t += f'<div class="border border-surface-200 rounded-xl overflow-hidden"><div class="h-32 bg-gradient-to-br from-{gf} to-{gt}"></div><div class="p-3"><h3 class="font-bold text-sm">{name}</h3><p class="text-xs text-surface-500 mt-1">{time} · {sv} phần</p></div></div>'
m1t += '</div></div></div>'
html_parts.append(frame("Tablet", "768", "Populated", m1t))

# M1 Mobile
m1m = '<div class="bg-white max-w-[375px] mx-auto"><nav class="flex items-center justify-between px-4 py-3 border-b border-surface-100"><span class="font-bold text-sm">Culinary Blog</span>' + ICO_SEARCH + '</nav>'
m1m += '<div class="bg-gradient-to-br from-brand-500 to-brand-600 text-white px-5 py-8"><h1 class="text-xl font-extrabold mb-2">Culinary Blog</h1><p class="text-brand-100 text-xs mb-3">Công thức nấu ăn Việt Nam</p><a href="#" class="inline-block px-4 py-2 bg-white text-brand-600 text-xs font-semibold rounded-lg">Khám phá</a></div>'
m1m += '<div class="px-4 py-6"><h2 class="font-bold text-sm mb-3">Nổi bật</h2><div class="space-y-3">'
for name, time, sv, au, cat, df, gf, gt, ic in recipes[:3]:
    m1m += recipe_list_card(name, time, sv, df, gf, gt)
m1m += '</div></div>' + mobile_nav() + '</div>'
html_parts.append(frame("Mobile", "375", "Populated", m1m))
html_parts.append(SECTION_END)

# M2: Recipe List
html_parts.append(section_start("m2", "M2", "Recipe List", "/recipes", "SSR (dynamic)", "No"))
m2d = '<div class="bg-white min-h-[500px]">' + nav("Công thức")
m2d += '<div class="flex"><div class="w-64 border-r border-surface-100 p-5"><h3 class="font-bold text-sm text-surface-900 mb-4">Bộ lọc</h3><div class="space-y-5">'
m2d += '<div><label class="text-xs font-semibold text-surface-600 block mb-2">Danh mục</label><div class="space-y-1.5">'
for cn in ["Món Chính", "Món Ăn Sáng", "Đồ Uống", "Món Tráng Miệng", "Món Chay", "Món Kho"]:
    chk = "checked" if cn == "Món Ăn Sáng" else ""
    m2d += f'<label class="flex items-center gap-2 text-sm text-surface-700"><input type="checkbox" {chk} class="rounded border-surface-300 text-brand-500"> {cn}</label>'
m2d += '</div></div>'
m2d += '<div><label class="text-xs font-semibold text-surface-600 block mb-2">Độ khó</label><div class="space-y-1.5">'
for d in ["Tất cả", "Dễ", "Trung bình"]:
    chk = "checked" if d == "Dễ" else ""
    m2d += f'<label class="flex items-center gap-2 text-sm"><input type="radio" name="diff" {chk} class="text-brand-500"> {d}</label>'
m2d += '</div></div>'
m2d += '<div><label class="text-xs font-semibold text-surface-600 block mb-2">Thời gian nấu</label><input type="range" min="0" max="120" value="60" class="w-full accent-brand-500"><div class="flex justify-between text-[10px] text-surface-400"><span>0</span><span>60</span><span>120</span></div></div>'
m2d += '<div><label class="text-xs font-semibold text-surface-600 block mb-2">Sắp xếp</label><select class="w-full px-3 py-1.5 text-sm border border-surface-200 rounded-lg"><option>Mới nhất</option><option>Cũ nhất</option><option>Tên A-Z</option></select></div>'
m2d += '<button class="w-full py-2 bg-brand-500 text-white text-sm font-medium rounded-lg">Áp dụng</button></div></div>'
m2d += '<div class="flex-1 p-6"><div class="flex items-center justify-between mb-5"><p class="text-sm text-surface-500">Hiển thị <span class="font-semibold text-surface-900">132</span> công thức</p></div>'
m2d += '<div class="grid grid-cols-3 gap-5">'
for r in recipes:
    m2d += recipe_card(*r)
m2d += '</div>'
m2d += '<div class="flex items-center justify-center gap-2 mt-8"><button class="px-3 py-1.5 text-sm border border-surface-200 rounded-lg text-surface-400">«</button><button class="px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg font-medium">1</button><button class="px-3 py-1.5 text-sm border border-surface-200 rounded-lg text-surface-700">2</button><button class="px-3 py-1.5 text-sm border border-surface-200 rounded-lg text-surface-700">3</button><span class="text-surface-400">...</span><button class="px-3 py-1.5 text-sm border border-surface-200 rounded-lg text-surface-700">12</button><button class="px-3 py-1.5 text-sm border border-surface-200 rounded-lg text-surface-700">»</button></div>'
m2d += '</div></div></div>'
html_parts.append(frame("Desktop", "1440", "Populated", m2d))

# M2 Empty
m2e = '<div class="bg-white min-h-[500px] flex items-center justify-center"><div class="text-center py-16">' + ICO_SEARCH.replace('w-4 h-4', 'w-16 h-16 text-surface-300 mx-auto mb-4') + '<h3 class="text-lg font-bold text-surface-700 mb-2">Không tìm thấy công thức</h3><p class="text-sm text-surface-500 mb-4">Không có công thức nào phù hợp với bộ lọc của bạn.</p><button class="px-5 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg">Xóa bộ lọc</button></div></div>'
html_parts.append(frame("Desktop", "1440", "Empty", m2e))

# M2 Mobile
m2m = '<div class="bg-white max-w-[375px] mx-auto min-h-[400px]"><div class="px-4 py-3 border-b border-surface-100 flex items-center justify-between"><span class="font-bold text-sm">Công thức</span><svg class="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg></div><div class="px-4 py-4 space-y-3">'
for r in recipes[:3]:
    m2m += recipe_list_card(r[0], r[1], r[2], r[4], r[6], r[7])
m2m += '</div></div>'
html_parts.append(frame("Mobile", "375", "Populated", m2m))
html_parts.append(SECTION_END)

# M3: Recipe Detail
html_parts.append(section_start("m3", "M3", "Recipe Detail", "/recipes/[slug]", "ISR (revalidate=300)", "No"))
m3d = '<div class="bg-white">' + nav("Công thức")
m3d += '<div class="px-12 py-3 text-xs text-surface-400"><span>Trang chủ</span> / <span>Công thức</span> / <span class="text-surface-700">Phở Bò Hà Nội</span></div>'
m3d += '<div class="px-12 pb-12"><div class="grid grid-cols-3 gap-8"><div class="col-span-2">'
m3d += '<div class="h-72 bg-gradient-to-br from-orange-200 to-orange-400 rounded-xl mb-6 flex items-center justify-center"><svg class="w-20 h-20 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/></svg></div>'
m3d += '<div class="flex items-center gap-3 mb-4"><span class="px-2.5 py-0.5 bg-brand-50 text-brand-600 text-xs font-semibold rounded">Món Chính</span><span class="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded">Dễ</span><span class="text-xs text-surface-400">Đăng ngày 15/03/2025</span></div>'
m3d += '<h1 class="text-3xl font-extrabold text-surface-900 mb-3">Phở Bò Hà Nội</h1>'
m3d += '<div class="flex items-center gap-4 mb-6 text-sm text-surface-500"><div class="flex items-center gap-2"><div class="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xs">NA</div><span>Nguyễn Văn An</span></div><div class="flex items-center gap-1">' + ICO_CLOCK + ' 45 phút</div><div class="flex items-center gap-1">' + ICO_PIN + ' 4 phần</div></div>'
m3d += '<p class="text-surface-600 text-sm leading-relaxed mb-8">Phở bò Hà Nội là một trong những món ăn truyền thống nổi tiếng nhất của Việt Nam. Nước dùng trong vắt, thơm lừng mùi quế hồi, thịt bò tenderloin mềm mịn, kết hợp với bánh phở tươi và rau sống.</p>'
m3d += '<div class="bg-surface-50 rounded-xl p-6 mb-8"><h2 class="font-bold text-lg text-surface-900 mb-4">Nguyên liệu (4 phần)</h2><div class="grid grid-cols-2 gap-2 text-sm">'
for ing in ["500g thịt bò tenderloin", "400g bánh phở tươi", "2 lít nước dùng bò", "1 củ gừng lớn", "3 nhánh hồi", "2 thanh quế", "1 củ hành tây", "Hành lá, rau thơm, giá đỗ", "Nước mắm, muối, đường", "Tương ớt, chanh tươi"]:
    m3d += f'<div class="flex items-center gap-2 py-1"><input type="checkbox" class="rounded border-surface-300 text-brand-500"><span>{ing}</span></div>'
m3d += '</div></div>'
m3d += '<h2 class="font-bold text-lg text-surface-900 mb-4">Các bước thực hiện</h2><div class="space-y-6">'
steps = [("Chuẩn bị nước dùng", "Xương bò rửa sạch, blanch rồi ninh 6 tiếng. Thêm gừng nướng, hành tây, hồi và quế.", "360 phút"), ("Chuẩn bị thịt bò", "Thịt bò tenderloin thái lát mỏng theo thớ thịt.", "15 phút"), ("Trần bánh phở", "Bánh phở trần qua nước sôi 30 giây cho mềm.", "2 phút"), ("Trình bày", "Xếp bánh phở vào tô, thêm thịt bò, chan nước dùng nóng hổi. Rắc hành lá, rau thơm.", "")]
for i, (st, sd, tm) in enumerate(steps, 1):
    m3d += f'<div class="flex gap-4"><div class="w-10 h-10 bg-brand-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">{i}</div><div><h3 class="font-semibold text-surface-900 mb-1">{st}</h3><p class="text-sm text-surface-600">{sd}</p>{"<span class='text-xs text-surface-400 mt-1 inline-block'>" + tm + "</span>" if tm else ""}</div></div>'
m3d += '</div></div>'
m3d += '<div><div class="bg-surface-50 rounded-xl p-5 mb-6"><h3 class="font-bold text-sm text-surface-900 mb-3">Thông tin dinh dưỡng</h3><div class="space-y-2 text-sm">'
for label, val in [("Calories", "380 kcal"), ("Protein", "28g"), ("Carbs", "42g"), ("Chất béo", "10g"), ("Chất xơ", "2g"), ("Natri", "890mg")]:
    m3d += f'<div class="flex justify-between"><span class="text-surface-500">{label}</span><span class="font-medium">{val}</span></div>'
m3d += '</div></div>'
m3d += '<div class="bg-surface-50 rounded-xl p-5"><h3 class="font-bold text-sm text-surface-900 mb-3">Công thức liên quan</h3><div class="space-y-3">'
m3d += '<div class="flex gap-3"><div class="w-14 h-14 bg-gradient-to-br from-amber-200 to-amber-300 rounded-lg flex-shrink-0"></div><div><h4 class="text-xs font-bold text-surface-800">Bún Chả Hà Nội</h4><p class="text-[10px] text-surface-400">60 phút</p></div></div>'
m3d += '<div class="flex gap-3"><div class="w-14 h-14 bg-gradient-to-br from-red-200 to-red-300 rounded-lg flex-shrink-0"></div><div><h4 class="text-xs font-bold text-surface-800">Bánh Mì Thịt Nướng</h4><p class="text-[10px] text-surface-400">30 phút</p></div></div>'
m3d += '</div></div></div></div></div></div>'
html_parts.append(frame("Desktop", "1440", "Populated", m3d))

# M3 Mobile
m3m = '<div class="bg-white max-w-[375px] mx-auto"><div class="px-4 py-3 border-b border-surface-100 flex items-center justify-between">' + ICO_BACK + '<span class="font-bold text-sm">Chi tiết công thức</span>' + ICO_HEART + '</div>'
m3m += '<div class="h-48 bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center"><svg class="w-16 h-16 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/></svg></div>'
m3m += '<div class="px-4 py-4"><div class="flex gap-2 mb-3"><span class="px-2 py-0.5 bg-brand-50 text-brand-600 text-[10px] font-semibold rounded">Món Chính</span><span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-semibold rounded">Dễ</span></div>'
m3m += '<h1 class="text-xl font-extrabold text-surface-900 mb-2">Phở Bò Hà Nội</h1>'
m3m += '<div class="flex items-center gap-3 text-xs text-surface-500 mb-4"><span>Nguyễn Văn An</span><span>45 phút</span><span>4 phần</span></div>'
m3m += '<p class="text-sm text-surface-600 leading-relaxed mb-6">Phở bò Hà Nội là món ăn truyền thống nổi tiếng nhất của Việt Nam.</p>'
m3m += '<h2 class="font-bold text-sm mb-3">Nguyên liệu</h2><div class="space-y-1.5 text-xs mb-6">'
for ing in ["500g thịt bò tenderloin", "400g bánh phở tươi", "2 lít nước dùng bò", "1 củ gừng lớn", "3 nhánh hồi"]:
    m3m += f'<div class="flex items-center gap-2"><input type="checkbox" class="rounded border-surface-300 text-brand-500 w-3.5 h-3.5"><span>{ing}</span></div>'
m3m += '</div><h2 class="font-bold text-sm mb-3">Các bước</h2><div class="space-y-4">'
for i, (st, sd, _) in enumerate(steps, 1):
    m3m += f'<div class="flex gap-3"><div class="w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">{i}</div><div><h3 class="font-semibold text-xs">{st}</h3><p class="text-[11px] text-surface-600 mt-1">{sd[:60]}...</p></div></div>'
m3m += '</div></div></div>'
html_parts.append(frame("Mobile", "375", "Populated", m3m))
html_parts.append(SECTION_END)

# M4: Category List
html_parts.append(section_start("m4", "M4", "Category List", "/categories", "ISR (revalidate=3600)", "No"))
m4d = '<div class="bg-white min-h-[400px]">' + nav("Danh mục")
m4d += '<div class="px-12 py-10"><h1 class="text-2xl font-extrabold text-surface-900 mb-2">Danh mục công thức</h1><p class="text-sm text-surface-500 mb-8">Khám phá các món ăn theo từng danh mục</p>'
m4d += '<div class="grid grid-cols-3 gap-6">'
for cn, cc, cd, gf, gt, clr in categories:
    m4d += f'<div class="bg-white border border-surface-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"><div class="h-40 bg-gradient-to-br from-{gf} to-{gt} flex items-center justify-center"><svg class="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg></div><div class="p-5"><h3 class="font-bold text-lg text-surface-900 mb-1">{cn}</h3><p class="text-xs text-surface-500 mb-3">{cd}</p><span class="px-2.5 py-0.5 bg-{clr}-50 text-{clr}-600 text-xs font-semibold rounded-full">{cc} công thức</span></div></div>'
m4d += '</div></div></div>'
html_parts.append(frame("Desktop", "1440", "Populated", m4d))

# M4 Loading
m4l = '<div class="bg-white min-h-[400px] px-12 py-10"><div class="skeleton w-64 h-8 rounded mb-2"></div><div class="skeleton w-80 h-4 rounded mb-8"></div><div class="grid grid-cols-3 gap-6">' + "".join(['<div class="border border-surface-200 rounded-xl overflow-hidden"><div class="skeleton h-40 rounded-none"></div><div class="p-5 space-y-2"><div class="skeleton w-32 h-5 rounded"></div><div class="skeleton w-full h-3 rounded"></div><div class="skeleton w-24 h-4 rounded"></div></div></div>' for _ in range(6)]) + '</div></div>'
html_parts.append(frame("Desktop", "1440", "Loading (Skeleton)", m4l))

# M4 Mobile
m4m = '<div class="bg-white max-w-[375px] mx-auto min-h-[400px]"><div class="px-4 py-3 border-b border-surface-100 flex items-center justify-between"><span class="font-bold text-sm">Danh mục</span>' + ICO_SEARCH + '</div><div class="px-4 py-6 space-y-3">'
for cn, cc, cd, gf, gt, clr in categories:
    m4m += f'<div class="flex items-center gap-4 p-4 border border-surface-200 rounded-xl"><div class="w-14 h-14 bg-gradient-to-br from-{gf} to-{gt} rounded-xl flex items-center justify-center flex-shrink-0"><svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg></div><div><h3 class="font-bold text-sm">{cn}</h3><p class="text-[10px] text-surface-400">{cc} công thức</p></div></div>'
m4m += '</div></div>'
html_parts.append(frame("Mobile", "375", "Populated", m4m))
html_parts.append(SECTION_END)

# M5: Category Detail
html_parts.append(section_start("m5", "M5", "Category Detail", "/categories/[slug]", "ISR (revalidate=600)", "No"))
m5d = '<div class="bg-white min-h-[500px]">' + nav("Danh mục")
m5d += '<div class="px-12 py-3 text-xs text-surface-400"><span>Trang chủ</span> / <span>Danh mục</span> / <span class="text-surface-700">Món Chính</span></div>'
m5d += '<div class="px-12 py-8"><div class="bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl p-8 text-white mb-8"><h1 class="text-3xl font-extrabold mb-2">Món Chính</h1><p class="text-orange-100 mb-4">Các món ăn chính trong bữa cơm gia đình Việt Nam</p><span class="px-3 py-1 bg-white/20 text-white text-sm font-semibold rounded-full">42 công thức</span></div>'
m5d += '<div class="grid grid-cols-4 gap-5">'
for r in recipes[:8]:
    m5d += recipe_card(*r)
m5d += '</div><div class="flex items-center justify-center gap-2 mt-8"><button class="px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg font-medium">1</button><button class="px-3 py-1.5 text-sm border border-surface-200 rounded-lg text-surface-700">2</button><button class="px-3 py-1.5 text-sm border border-surface-200 rounded-lg text-surface-700">3</button></div></div></div>'
html_parts.append(frame("Desktop", "1440", "Populated", m5d))

# M5 Mobile
m5m = '<div class="bg-white max-w-[375px] mx-auto min-h-[400px]"><div class="px-4 py-3 border-b border-surface-100 flex items-center gap-3">' + ICO_BACK + '<span class="font-bold text-sm">Món Chính</span></div>'
m5m += '<div class="bg-gradient-to-br from-orange-400 to-orange-500 text-white px-5 py-6"><h1 class="text-xl font-extrabold mb-1">Món Chính</h1><p class="text-orange-100 text-xs">42 công thức</p></div>'
m5m += '<div class="px-4 py-4 space-y-3">'
for r in recipes[:3]:
    m5m += recipe_list_card(r[0], r[1], r[2], r[4], r[6], r[7])
m5m += '</div></div>'
html_parts.append(frame("Mobile", "375", "Populated", m5m))
html_parts.append(SECTION_END)

# M6: Search Results
html_parts.append(section_start("m6", "M6", "Search Results", "/search", "SSR", "No"))
m6d = '<div class="bg-white min-h-[500px]">' + nav()
m6d += '<div class="px-12 py-8"><div class="max-w-3xl mx-auto mb-8"><div class="relative"><input type="text" value="phở bò" class="w-full px-5 py-3 text-lg border-2 border-brand-300 rounded-xl focus:outline-none focus:border-brand-500" placeholder="Tìm kiếm công thức...">' + ICO_SEARCH.replace('w-4 h-4', 'w-6 h-6 text-brand-500 absolute right-4 top-3.5') + '</div></div>'
m6d += '<p class="text-sm text-surface-500 mb-6">Tìm thấy <span class="font-semibold text-surface-900">8</span> kết quả cho "<span class="font-semibold text-surface-900">phở bò</span>"</p>'
m6d += '<div class="space-y-4">'
search_results = [("Phở Bò Hà Nội", "Món Chính", "Dễ", "Nước dùng trong vắt, thơm lừng mùi quế hồi...", "45 phút · 4 phần", "Nguyễn Văn An", "98%", "orange-200", "orange-300"), ("Phở Gà Nam Định", "Món Chính", "Trung bình", "Phở gà truyền thống với nước dùng đậm đà...", "50 phút · 4 phần", "Trần Minh Bình", "85%", "orange-200", "orange-300"), ("Bún Bò Huế", "Món Chính", "Khó", "Bún bò Huế cay nồng, thơm lừng sả ớt...", "90 phút · 6 phần", "Nguyễn Văn An", "72%", "amber-200", "amber-300")]
for name, cat, diff, desc, info, author, pct, gf, gt in search_results:
    dc = "emerald" if diff == "Dễ" else ("amber" if diff == "Trung bình" else "red")
    m6d += f'<div class="flex gap-5 p-5 border border-surface-200 rounded-xl hover:shadow-md transition-shadow"><div class="w-40 h-28 bg-gradient-to-br from-{gf} to-{gt} rounded-lg flex-shrink-0 flex items-center justify-center"><svg class="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/></svg></div><div><div class="flex items-center gap-2 mb-1"><span class="px-2 py-0.5 bg-brand-50 text-brand-600 text-[10px] font-semibold rounded">{cat}</span><span class="px-2 py-0.5 bg-{dc}-50 text-{dc}-600 text-[10px] font-semibold rounded">{diff}</span></div><h3 class="font-bold text-surface-900 mb-1">{name}</h3><p class="text-sm text-surface-500 mb-2">{desc}</p><div class="flex items-center gap-4 text-xs text-surface-400"><span>{info}</span><span>{author}</span><span class="text-emerald-600 font-medium">Phù hợp {pct}</span></div></div></div>'
m6d += '</div><div class="flex items-center justify-center gap-2 mt-8"><button class="px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg font-medium">1</button><button class="px-3 py-1.5 text-sm border border-surface-200 rounded-lg text-surface-700">2</button></div></div></div>'
html_parts.append(frame("Desktop", "1440", "Populated", m6d))

# M6 Mobile
m6m = '<div class="bg-white max-w-[375px] mx-auto min-h-[400px]"><div class="px-4 py-3 border-b border-surface-100"><div class="relative"><input type="text" value="phở bò" class="w-full px-4 py-2 text-sm border border-surface-200 rounded-lg" placeholder="Tìm kiếm...">' + ICO_SEARCH.replace('w-4 h-4', 'w-4 h-4 text-surface-400 absolute right-3 top-2.5') + '</div></div>'
m6m += '<div class="px-4 py-4"><p class="text-xs text-surface-500 mb-4">8 kết quả cho "phở bò"</p><div class="space-y-3">'
for name, cat, diff, desc, info, author, pct, gf, gt in search_results[:3]:
    m6m += recipe_list_card(name, info.split("·")[0].strip(), info.split("·")[1].strip().split()[0], diff, gf, gt)
m6m += '</div></div></div>'
html_parts.append(frame("Mobile", "375", "Populated", m6m))
html_parts.append(SECTION_END)

# M7: Login
html_parts.append(section_start("m7", "M7", "Login", "/auth/login", "CSR", "No (redirect if logged in)"))

def login_form(extra_error="", email_cls="", pass_cls=""):
    f = '<div class="bg-surface-50 min-h-[500px] flex items-center justify-center"><div class="w-full max-w-md"><div class="text-center mb-8"><div class="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mx-auto mb-4"><svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg></div><h1 class="text-2xl font-extrabold text-surface-900">Đăng nhập</h1><p class="text-sm text-surface-500 mt-1">Chào mừng bạn quay trở lại Culinary Blog</p></div>'
    f += '<div class="bg-white rounded-xl border border-surface-200 p-6">'
    if extra_error:
        f += f'<div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">{ICO_WARN}{extra_error}</div>'
    f += '<button class="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-surface-300 rounded-lg text-sm font-medium text-surface-700 hover:bg-surface-50 mb-4">' + ICO_GOOGLE + ' Tiếp tục với Google</button>'
    f += '<div class="relative my-4"><div class="absolute inset-0 flex items-center"><div class="w-full border-t border-surface-200"></div></div><div class="relative flex justify-center text-xs"><span class="bg-white px-3 text-surface-400">hoặc</span></div></div>'
    f += '<form><div class="mb-4"><label class="text-sm font-medium text-surface-700 block mb-1.5">Email</label><input type="email" placeholder="name@example.com" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 ' + email_cls + '"></div>'
    f += '<div class="mb-4"><label class="text-sm font-medium text-surface-700 block mb-1.5">Mật khẩu</label><input type="password" placeholder="••••••••" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 ' + pass_cls + '"></div>'
    if pass_cls:
        f += '<p class="text-red-500 text-xs mt-1">Mật khẩu phải có ít nhất 8 ký tự</p>'
    f += '<div class="flex items-center justify-between mb-6"><label class="flex items-center gap-2 text-sm text-surface-600 cursor-pointer"><input type="checkbox" class="rounded border-surface-300 text-brand-500"> Ghi nhớ đăng nhập</label><a href="#" class="text-sm text-brand-600 hover:underline">Quên mật khẩu?</a></div>'
    f += '<button type="submit" class="w-full py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600">Đăng nhập</button></form>'
    f += '<p class="text-center text-sm text-surface-500 mt-4">Chưa có tài khoản? <a href="#" class="text-brand-600 font-semibold hover:underline">Đăng ký ngay</a></p></div></div></div>'
    return f

html_parts.append(frame("Desktop", "1440", "Populated", login_form()))
html_parts.append(frame("Desktop", "1440", "Error (Validation)", login_form("Email hoặc mật khẩu không chính xác. Vui lòng thử lại.", "border-red-300", "border-red-300")))

# M7 Mobile
m7m = '<div class="bg-surface-50 max-w-[375px] mx-auto min-h-[500px] flex items-center justify-center p-4"><div class="w-full"><div class="text-center mb-6"><div class="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center mx-auto mb-3"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg></div><h1 class="text-xl font-extrabold">Đăng nhập</h1></div>'
m7m += '<div class="bg-white rounded-xl border border-surface-200 p-5"><button class="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-surface-300 rounded-lg text-sm font-medium mb-4">' + ICO_GOOGLE + ' Google</button>'
m7m += '<div class="relative my-4"><div class="absolute inset-0 flex items-center"><div class="w-full border-t border-surface-200"></div></div><div class="relative flex justify-center text-xs"><span class="bg-white px-3 text-surface-400">hoặc</span></div></div>'
m7m += '<form><div class="mb-3"><label class="text-xs font-medium block mb-1">Email</label><input type="email" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg"></div><div class="mb-4"><label class="text-xs font-medium block mb-1">Mật khẩu</label><input type="password" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg"></div><button type="submit" class="w-full py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg">Đăng nhập</button></form>'
m7m += '<p class="text-center text-xs text-surface-500 mt-3">Chưa có tài khoản? <a href="#" class="text-brand-600 font-semibold">Đăng ký</a></p></div></div></div>'
html_parts.append(frame("Mobile", "375", "Populated", m7m))
html_parts.append(SECTION_END)

# M8: Register
html_parts.append(section_start("m8", "M8", "Register", "/auth/register", "CSR", "No"))
m8d = '<div class="bg-surface-50 min-h-[500px] flex items-center justify-center"><div class="w-full max-w-md"><div class="text-center mb-8"><div class="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mx-auto mb-4"><svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg></div><h1 class="text-2xl font-extrabold text-surface-900">Tạo tài khoản</h1><p class="text-sm text-surface-500 mt-1">Tham gia cộng đồng Culinary Blog</p></div>'
m8d += '<div class="bg-white rounded-xl border border-surface-200 p-6">'
m8d += '<button class="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-surface-300 rounded-lg text-sm font-medium mb-4">' + ICO_GOOGLE + ' Đăng ký với Google</button>'
m8d += '<div class="relative my-4"><div class="absolute inset-0 flex items-center"><div class="w-full border-t border-surface-200"></div></div><div class="relative flex justify-center text-xs"><span class="bg-white px-3 text-surface-400">hoặc</span></div></div>'
m8d += '<form>'
for lbl, ph in [("Họ và tên", "Nguyễn Văn A"), ("Tên hiển thị", "nguyenvana"), ("Email", "name@example.com"), ("Mật khẩu", "••••••••"), ("Xác nhận mật khẩu", "••••••••")]:
    extra = '<p class="text-xs text-surface-400 mt-1">Ít nhất 8 ký tự, 1 chữ hoa, 1 số, 1 ký tự đặc biệt</p>' if "Mật khẩu" in lbl and "Xác" not in lbl else ""
    m8d += f'<div class="mb-3"><label class="text-sm font-medium text-surface-700 block mb-1.5">{lbl}</label><input type="{"password" if "Mật" in lbl else "text"}" placeholder="{ph}" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:border-brand-400">{extra}</div>'
m8d += '<button type="submit" class="w-full py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600">Tạo tài khoản</button></form>'
m8d += '<p class="text-center text-sm text-surface-500 mt-4">Đã có tài khoản? <a href="#" class="text-brand-600 font-semibold hover:underline">Đăng nhập</a></p></div></div></div>'
html_parts.append(frame("Desktop", "1440", "Populated", m8d))
html_parts.append(SECTION_END)

# M9: Dashboard Overview
html_parts.append(section_start("m9", "M9", "Dashboard Overview", "/dashboard", "CSR", "Required (Author/Admin)"))
m9d = '<div class="bg-surface-50 min-h-[500px] flex">'
m9d += '<div class="w-64 bg-surface-900 text-white p-5"><div class="flex items-center gap-2 mb-8"><div class="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">' + ICO_BOOK + '</div><span class="font-bold text-sm">Dashboard</span></div>'
m9d += '<div class="space-y-1">'
for label, icon_path, active in [("Tổng quan", "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z", True), ("Công thức của tôi", "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", False), ("Công thức mới", "M12 4v16m8-8H4", False), ("Hồ sơ", "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", False)]:
    cls = "bg-brand-500/20 text-brand-400" if active else "text-surface-400 hover:text-white"
    m9d += f'<a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg {cls} text-sm"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="{icon_path}"/></svg> {label}</a>'
m9d += '</div></div>'
m9d += '<div class="flex-1 p-8"><h1 class="text-2xl font-extrabold text-surface-900 mb-6">Xin chào, Nguyễn Văn An!</h1>'
m9d += '<div class="grid grid-cols-4 gap-5 mb-8">'
for label, val, change, chg_cls in [("Tổng công thức", "24", "+3 tuần này", "emerald"), ("Đã xuất bản", "18", "+2 tuần này", "emerald"), ("Bản nháp", "4", "Đang chờ", "amber"), ("Lượt xem", "12.5K", "+1.2K tuần này", "emerald")]:
    m9d += f'<div class="bg-white rounded-xl border border-surface-200 p-5"><p class="text-xs text-surface-500 mb-1">{label}</p><p class="text-2xl font-extrabold text-surface-900">{val}</p><p class="text-xs text-{chg_cls}-600 mt-1">{change}</p></div>'
m9d += '</div>'
m9d += '<div class="bg-white rounded-xl border border-surface-200"><div class="px-5 py-4 border-b border-surface-100 flex items-center justify-between"><h2 class="font-bold text-surface-900">Công thức gần đây</h2><a href="#" class="text-sm text-brand-600 hover:underline">Xem tất cả</a></div>'
m9d += '<table class="w-full text-sm"><thead><tr class="border-b border-surface-100 text-left text-xs text-surface-500"><th class="px-5 py-3 font-medium">Công thức</th><th class="px-5 py-3 font-medium">Danh mục</th><th class="px-5 py-3 font-medium">Trạng thái</th><th class="px-5 py-3 font-medium">Ngày tạo</th><th class="px-5 py-3 font-medium">Thao tác</th></tr></thead><tbody>'
for name, cat, status, status_cls, date in [("Phở Bò Hà Nội", "Món Chính", "Đã xuất bản", "emerald", "15/03/2025"), ("Bún Chả Hà Nội", "Món Chính", "Đã xuất bản", "emerald", "12/03/2025"), ("Bánh Mì Thịt Nướng", "Món Ăn Sáng", "Bản nháp", "amber", "10/03/2025"), ("Cơm Chay Đậu Hũ", "Món Chay", "Đã xuất bản", "emerald", "08/03/2025")]:
    m9d += f'<tr class="border-b border-surface-50"><td class="px-5 py-3 font-medium text-surface-900">{name}</td><td class="px-5 py-3 text-surface-500">{cat}</td><td class="px-5 py-3"><span class="px-2 py-0.5 bg-{status_cls}-50 text-{status_cls}-600 text-xs font-semibold rounded">{status}</span></td><td class="px-5 py-3 text-surface-400">{date}</td><td class="px-5 py-3"><button class="text-brand-600 text-xs hover:underline">Chỉnh sửa</button></td></tr>'
m9d += '</tbody></table></div></div></div>'
html_parts.append(frame("Desktop", "1440", "Populated", m9d))
html_parts.append(SECTION_END)

# M10: Dashboard Recipes
html_parts.append(section_start("m10", "M10", "Dashboard Recipes", "/dashboard/recipes", "CSR", "Required"))
m10d = '<div class="bg-surface-50 min-h-[500px] flex"><div class="w-64 bg-surface-900 text-white p-5"><div class="flex items-center gap-2 mb-8"><div class="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">' + ICO_BOOK + '</div><span class="font-bold text-sm">Dashboard</span></div><div class="space-y-1"><a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg text-surface-400 hover:text-white text-sm">Tổng quan</a><a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg bg-brand-500/20 text-brand-400 text-sm">Công thức của tôi</a></div></div>'
m10d += '<div class="flex-1 p-8"><div class="flex items-center justify-between mb-6"><h1 class="text-2xl font-extrabold text-surface-900">Công thức của tôi</h1><a href="#" class="px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600">+ Công thức mới</a></div>'
m10d += '<div class="bg-white rounded-xl border border-surface-200"><table class="w-full text-sm"><thead><tr class="border-b border-surface-100 text-left text-xs text-surface-500"><th class="px-5 py-3 font-medium">Công thức</th><th class="px-5 py-3 font-medium">Danh mục</th><th class="px-5 py-3 font-medium">Trạng thái</th><th class="px-5 py-3 font-medium">Thao tác</th></tr></thead><tbody>'
for name, cat, status, sc in [("Phở Bò Hà Nội", "Món Chính", "Đã xuất bản", "emerald"), ("Bún Chả Hà Nội", "Món Chính", "Đã xuất bản", "emerald"), ("Bánh Mì Thịt Nướng", "Món Ăn Sáng", "Bản nháp", "amber"), ("Cơm Chay Đậu Hũ", "Món Chay", "Đã xuất bản", "emerald"), ("Trà Đào Cam Sả", "Đồ Uống", "Đã lưu trữ", "surface"), ("Chè Ba Màu", "Món Tráng Miệng", "Đã xuất bản", "emerald")]:
    m10d += f'<tr class="border-b border-surface-50"><td class="px-5 py-3 font-medium text-surface-900">{name}</td><td class="px-5 py-3 text-surface-500">{cat}</td><td class="px-5 py-3"><span class="px-2 py-0.5 bg-{sc}-50 text-{sc}-600 text-xs font-semibold rounded">{status}</span></td><td class="px-5 py-3 flex gap-3"><button class="text-brand-600 text-xs hover:underline">Sửa</button><button class="text-red-500 text-xs hover:underline">Xóa</button></td></tr>'
m10d += '</tbody></table></div></div></div>'
html_parts.append(frame("Desktop", "1440", "Populated", m10d))
html_parts.append(SECTION_END)

# M11: New Recipe Wizard
html_parts.append(section_start("m11", "M11", "New Recipe Wizard", "/dashboard/recipes/new", "CSR", "Required"))
m11d = '<div class="bg-surface-50 min-h-[500px] flex"><div class="w-64 bg-surface-900 text-white p-5"><div class="flex items-center gap-2 mb-8"><div class="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">' + ICO_BOOK + '</div><span class="font-bold text-sm">Dashboard</span></div></div>'
m11d += '<div class="flex-1 p-8"><h1 class="text-2xl font-extrabold text-surface-900 mb-6">Tạo công thức mới</h1>'
m11d += '<div class="flex items-center gap-4 mb-8"><div class="flex items-center gap-2"><div class="w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div><span class="text-sm font-semibold text-surface-900">Thông tin cơ bản</span></div><div class="w-12 h-0.5 bg-surface-200"></div><div class="flex items-center gap-2"><div class="w-8 h-8 bg-surface-200 text-surface-500 rounded-full flex items-center justify-center text-sm font-bold">2</div><span class="text-sm text-surface-400">Nguyên liệu</span></div><div class="w-12 h-0.5 bg-surface-200"></div><div class="flex items-center gap-2"><div class="w-8 h-8 bg-surface-200 text-surface-500 rounded-full flex items-center justify-center text-sm font-bold">3</div><span class="text-sm text-surface-400">Các bước</span></div><div class="w-12 h-0.5 bg-surface-200"></div><div class="flex items-center gap-2"><div class="w-8 h-8 bg-surface-200 text-surface-500 rounded-full flex items-center justify-center text-sm font-bold">4</div><span class="text-sm text-surface-400">Hình ảnh</span></div></div>'
m11d += '<div class="bg-white rounded-xl border border-surface-200 p-6 max-w-2xl"><form>'
m11d += '<div class="mb-4"><label class="text-sm font-medium text-surface-700 block mb-1.5">Tên công thức *</label><input type="text" placeholder="VD: Phở Bò Hà Nội" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:border-brand-400"></div>'
m11d += '<div class="mb-4"><label class="text-sm font-medium text-surface-700 block mb-1.5">Mô tả *</label><textarea rows="3" placeholder="Mô tả ngắn gọn về công thức..." class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:border-brand-400"></textarea></div>'
m11d += '<div class="grid grid-cols-2 gap-4 mb-4"><div><label class="text-sm font-medium text-surface-700 block mb-1.5">Danh mục *</label><select class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg"><option>Chọn danh mục</option><option>Món Chính</option><option>Đồ Uống</option><option>Món Ăn Sáng</option><option>Món Tráng Miệng</option><option>Món Chay</option><option>Món Kho</option></select></div><div><label class="text-sm font-medium text-surface-700 block mb-1.5">Độ khó *</label><select class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg"><option>Dễ</option><option>Trung bình</option><option>Khó</option><option>Chuyên gia</option></select></div></div>'
m11d += '<div class="grid grid-cols-3 gap-4 mb-4"><div><label class="text-sm font-medium text-surface-700 block mb-1.5">Thời gian chuẩn bị (phút) *</label><input type="number" value="15" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg"></div><div><label class="text-sm font-medium text-surface-700 block mb-1.5">Thời gian nấu (phút) *</label><input type="number" value="30" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg"></div><div><label class="text-sm font-medium text-surface-700 block mb-1.5">Khẩu phần *</label><input type="number" value="4" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg"></div></div>'
m11d += '<div class="flex justify-end gap-3 mt-6"><button type="button" class="px-5 py-2 text-sm font-medium text-surface-700 border border-surface-200 rounded-lg hover:bg-surface-50">Lưu nháp</button><button type="button" class="px-5 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600">Tiếp theo: Nguyên liệu →</button></div>'
m11d += '</form></div></div></div>'
html_parts.append(frame("Desktop", "1440", "Populated", m11d))
html_parts.append(SECTION_END)

# M12: Edit Recipe
html_parts.append(section_start("m12", "M12", "Edit Recipe", "/dashboard/recipes/[id]/edit", "CSR", "Required (Owner/Admin)"))
m12d = '<div class="bg-surface-50 min-h-[500px] flex"><div class="w-64 bg-surface-900 text-white p-5"><div class="flex items-center gap-2 mb-8"><div class="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">' + ICO_BOOK + '</div><span class="font-bold text-sm">Dashboard</span></div></div>'
m12d += '<div class="flex-1 p-8"><div class="flex items-center justify-between mb-6"><div><h1 class="text-2xl font-extrabold text-surface-900">Chỉnh sửa công thức</h1><p class="text-sm text-surface-500 mt-1">Phở Bò Hà Nội — Đã xuất bản</p></div><div class="flex gap-3"><a href="#" class="px-4 py-2 text-sm font-medium text-surface-700 border border-surface-200 rounded-lg hover:bg-surface-50">Xem trước</a><button class="px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600">Lưu thay đổi</button></div></div>'
m12d += '<div class="grid grid-cols-3 gap-6"><div class="col-span-2"><div class="bg-white rounded-xl border border-surface-200 p-6 mb-6"><h2 class="font-bold text-surface-900 mb-4">Thông tin cơ bản</h2>'
m12d += '<div class="mb-4"><label class="text-sm font-medium text-surface-700 block mb-1.5">Tên công thức</label><input type="text" value="Phở Bò Hà Nội" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:border-brand-400"></div>'
m12d += '<div class="mb-4"><label class="text-sm font-medium text-surface-700 block mb-1.5">Mô tả</label><textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:border-brand-400">Phở bò Hà Nội là một trong những món ăn truyền thống nổi tiếng nhất của Việt Nam.</textarea></div>'
m12d += '<div class="grid grid-cols-3 gap-4"><div><label class="text-sm font-medium text-surface-700 block mb-1.5">Thời gian chuẩn bị</label><input type="number" value="15" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg"></div><div><label class="text-sm font-medium text-surface-700 block mb-1.5">Thời gian nấu</label><input type="number" value="30" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg"></div><div><label class="text-sm font-medium text-surface-700 block mb-1.5">Khẩu phần</label><input type="number" value="4" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg"></div></div></div>'
m12d += '<div class="bg-white rounded-xl border border-surface-200 p-6"><div class="flex items-center justify-between mb-4"><h2 class="font-bold text-surface-900">Nguyên liệu</h2><button class="text-brand-600 text-sm font-medium hover:underline">+ Thêm nguyên liệu</button></div>'
m12d += '<div class="space-y-3">'
for ing in ["500g thịt bò tenderloin", "400g bánh phở tươi", "2 lít nước dùng bò"]:
    m12d += f'<div class="flex items-center gap-2"><input type="text" value="{ing}" class="flex-1 px-3 py-2 text-sm border border-surface-200 rounded-lg"><button class="text-red-400 hover:text-red-600"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button></div>'
m12d += '</div></div></div>'
m12d += '<div><div class="bg-white rounded-xl border border-surface-200 p-5 mb-6"><h3 class="font-bold text-sm text-surface-900 mb-3">Trạng thái</h3><span class="px-3 py-1 bg-emerald-50 text-emerald-600 text-sm font-semibold rounded-full">Đã xuất bản</span><div class="mt-3 flex gap-2"><button class="text-xs text-surface-500 hover:text-surface-700">Gỡ xuống</button><button class="text-xs text-surface-500 hover:text-surface-700">Lưu trữ</button></div></div>'
m12d += '<div class="bg-white rounded-xl border border-surface-200 p-5 mb-6"><h3 class="font-bold text-sm text-surface-900 mb-3">Hình ảnh</h3><div class="border-2 border-dashed border-surface-200 rounded-lg p-6 text-center"><svg class="w-10 h-10 text-surface-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg><p class="text-sm text-surface-500">Kéo thả hoặc <span class="text-brand-600 font-medium">chọn tệp</span></p><p class="text-xs text-surface-400 mt-1">PNG, JPG, WebP, AVIF (tối đa 5MB)</p></div></div>'
m12d += '<div class="bg-red-50 rounded-xl border border-red-200 p-5"><h3 class="font-bold text-sm text-red-700 mb-2">Xóa công thức</h3><p class="text-xs text-red-600 mb-3">Hành động này không thể hoàn tác.</p><button class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Xóa công thức</button></div></div></div></div></div>'
html_parts.append(frame("Desktop", "1440", "Populated", m12d))
html_parts.append(SECTION_END)

# M13: Admin Categories
html_parts.append(section_start("m13", "M13", "Admin Categories", "/dashboard/categories", "CSR", "Required (Admin)"))
m13d = '<div class="bg-surface-50 min-h-[500px] flex"><div class="w-64 bg-surface-900 text-white p-5"><div class="flex items-center gap-2 mb-8"><div class="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">' + ICO_BOOK + '</div><span class="font-bold text-sm">Admin</span></div><div class="space-y-1"><a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg text-surface-400 hover:text-white text-sm">Tổng quan</a><a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg bg-brand-500/20 text-brand-400 text-sm">Danh mục</a><a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg text-surface-400 hover:text-white text-sm">Người dùng</a><a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg text-surface-400 hover:text-white text-sm">Hàng đợi</a></div></div>'
m13d += '<div class="flex-1 p-8"><div class="flex items-center justify-between mb-6"><h1 class="text-2xl font-extrabold text-surface-900">Quản lý danh mục</h1><button class="px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600">+ Danh mục mới</button></div>'
m13d += '<div class="bg-white rounded-xl border border-surface-200"><table class="w-full text-sm"><thead><tr class="border-b border-surface-100 text-left text-xs text-surface-500"><th class="px-5 py-3 font-medium">Tên danh mục</th><th class="px-5 py-3 font-medium">Slug</th><th class="px-5 py-3 font-medium">Số công thức</th><th class="px-5 py-3 font-medium">Thứ tự</th><th class="px-5 py-3 font-medium">Thao tác</th></tr></thead><tbody>'
for cn, slug, cc, oi in [("Món Chính", "mon-chinh", "42", "1"), ("Đồ Uống", "do-uong", "18", "2"), ("Món Ăn Sáng", "mon-an-sang", "25", "3"), ("Món Tráng Miệng", "mon-trang-mieng", "15", "4"), ("Món Chay", "mon-chay", "12", "5"), ("Món Kho", "mon-kho", "20", "6")]:
    m13d += f'<tr class="border-b border-surface-50"><td class="px-5 py-3 font-medium text-surface-900">{cn}</td><td class="px-5 py-3 text-surface-400 font-mono text-xs">{slug}</td><td class="px-5 py-3 text-surface-500">{cc}</td><td class="px-5 py-3 text-surface-500">{oi}</td><td class="px-5 py-3 flex gap-3"><button class="text-brand-600 text-xs hover:underline">Sửa</button><button class="text-red-500 text-xs hover:underline">Xóa</button></td></tr>'
m13d += '</tbody></table></div></div></div>'
html_parts.append(frame("Desktop", "1440", "Populated", m13d))
html_parts.append(SECTION_END)

# M14: Profile
html_parts.append(section_start("m14", "M14", "Profile", "/profile", "CSR", "Required"))
m14d = '<div class="bg-surface-50 min-h-[500px] flex"><div class="w-64 bg-surface-900 text-white p-5"><div class="flex items-center gap-2 mb-8"><div class="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">' + ICO_BOOK + '</div><span class="font-bold text-sm">Dashboard</span></div><div class="space-y-1"><a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg text-surface-400 hover:text-white text-sm">Tổng quan</a><a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg bg-brand-500/20 text-brand-400 text-sm">Hồ sơ</a></div></div>'
m14d += '<div class="flex-1 p-8"><h1 class="text-2xl font-extrabold text-surface-900 mb-6">Hồ sơ cá nhân</h1>'
m14d += '<div class="grid grid-cols-3 gap-6"><div class="col-span-2"><div class="bg-white rounded-xl border border-surface-200 p-6"><h2 class="font-bold text-surface-900 mb-4">Thông tin cá nhân</h2>'
m14d += '<div class="mb-4"><label class="text-sm font-medium text-surface-700 block mb-1.5">Họ và tên</label><input type="text" value="Nguyễn Văn An" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:border-brand-400"></div>'
m14d += '<div class="mb-4"><label class="text-sm font-medium text-surface-700 block mb-1.5">Tên hiển thị</label><input type="text" value="nguyenvanan" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50" disabled><p class="text-xs text-surface-400 mt-1">Không thể thay đổi</p></div>'
m14d += '<div class="mb-4"><label class="text-sm font-medium text-surface-700 block mb-1.5">Email</label><input type="email" value="an@example.com" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50" disabled><p class="text-xs text-surface-400 mt-1">Không thể thay đổi</p></div>'
m14d += '<div class="mb-4"><label class="text-sm font-medium text-surface-700 block mb-1.5">Giới thiệu</label><textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:border-brand-400">Tôi là tác giả yêu thích ẩm thực Việt Nam, chia sẻ các công thức truyền thống và hiện đại.</textarea></div>'
m14d += '<button class="px-5 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600">Lưu thay đổi</button></div></div>'
m14d += '<div><div class="bg-white rounded-xl border border-surface-200 p-5 mb-6"><h3 class="font-bold text-sm text-surface-900 mb-3">Ảnh đại diện</h3><div class="flex flex-col items-center"><div class="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xl mb-3">NA</div><button class="text-sm text-brand-600 font-medium hover:underline">Thay đổi ảnh</button></div></div>'
m14d += '<div class="bg-white rounded-xl border border-surface-200 p-5 mb-6"><h3 class="font-bold text-sm text-surface-900 mb-3">Thống kê</h3><div class="space-y-2 text-sm"><div class="flex justify-between"><span class="text-surface-500">Công thức đã tạo</span><span class="font-medium">24</span></div><div class="flex justify-between"><span class="text-surface-500">Ngày tham gia</span><span class="font-medium">01/01/2025</span></div><div class="flex justify-between"><span class="text-surface-500">Vai trò</span><span class="px-2 py-0.5 bg-brand-50 text-brand-600 text-xs font-semibold rounded">Tác giả</span></div></div></div>'
m14d += '<div class="bg-white rounded-xl border border-surface-200 p-5"><h3 class="font-bold text-sm text-surface-900 mb-3">Bảo mật</h3><button class="w-full px-4 py-2 text-sm font-medium text-surface-700 border border-surface-200 rounded-lg hover:bg-surface-50 mb-2">Đổi mật khẩu</button><button class="w-full px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Vô hiệu hóa tài khoản</button></div></div></div></div></div>'
html_parts.append(frame("Desktop", "1440", "Populated", m14d))
html_parts.append(SECTION_END)

# GLOBAL ERROR STATES
# 404
html_parts.append(section_start("g404", "G1", "404 — Not Found", "/[any]", "CSR/SSR", "No"))
g404 = '<div class="bg-surface-50 min-h-[500px] flex items-center justify-center"><div class="text-center"><p class="text-8xl font-extrabold text-brand-500 mb-4">404</p><h1 class="text-2xl font-bold text-surface-900 mb-2">Không tìm thấy trang</h1><p class="text-surface-500 mb-6">Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.</p><a href="#" class="px-6 py-3 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600">Về trang chủ</a></div></div>'
html_parts.append(frame("Desktop", "1440", "Error (404)", g404))
html_parts.append(SECTION_END)

# Network Error
html_parts.append(section_start("gnet", "G2", "Network Error", "/[any]", "CSR", "No"))
gnet = '<div class="bg-surface-50 min-h-[500px] flex items-center justify-center"><div class="text-center"><svg class="w-16 h-16 text-surface-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 2.121a1.5 1.5 0 112.122 2.121 1.5 1.5 0 01-2.122-2.121zM12 2a10 10 0 100 20 10 10 0 000-20z"/></svg><h1 class="text-2xl font-bold text-surface-900 mb-2">Lỗi kết nối mạng</h1><p class="text-surface-500 mb-6">Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại.</p><button class="px-6 py-3 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600">Thử lại</button></div></div>'
html_parts.append(frame("Desktop", "1440", "Error (Network)", gnet))
html_parts.append(SECTION_END)

# 429 Rate Limit
html_parts.append(section_start("g429", "G3", "429 — Rate Limit", "/[any]", "CSR/SSR", "No"))
g429 = '<div class="bg-surface-50 min-h-[500px] flex items-center justify-center"><div class="text-center"><div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg class="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><h1 class="text-2xl font-bold text-surface-900 mb-2">Quá nhiều yêu cầu</h1><p class="text-surface-500 mb-2">Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn.</p><p class="text-surface-400 text-sm mb-6">Vui lòng chờ <span class="font-semibold text-surface-700">30 giây</span> rồi thử lại.</p><div class="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-lg inline-flex items-center gap-2 mb-6">X-RateLimit-Limit: 100 | Retry-After: 30s</div><br><button class="px-6 py-3 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600">Thử lại</button></div></div>'
html_parts.append(frame("Desktop", "1440", "Error (429)", g429))
html_parts.append(SECTION_END)

# CLOSING
html_parts.append('</main></body></html>')

# Write the final HTML
with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write("".join(html_parts))

print(f"Written {os.path.getsize(OUTPUT)} bytes to {OUTPUT}")
