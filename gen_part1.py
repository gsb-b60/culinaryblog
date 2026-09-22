#!/usr/bin/env python3
"""Generate web-showcase.html — Part 1: Head, CSS, Header, Sidebar"""
import os

OUT = os.path.join(os.path.dirname(__file__), "web-showcase.html")

HEAD = r'''<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Culinary Blog — UI Showcase</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath d='M14 30C14 30 12 14 20 10C28 6 28 24 28 24' fill='%23f97316' stroke='%23ea580c' stroke-width='1.5'/%3E%3Cpath d='M50 30C50 30 52 14 44 10C36 6 36 24 36 24' fill='%23f97316' stroke='%23ea580c' stroke-width='1.5'/%3E%3Ccircle cx='32' cy='36' r='20' fill='%23f97316' stroke='%23ea580c' stroke-width='1.5'/%3E%3Ccircle cx='24' cy='33' r='4' fill='%231c1917'/%3E%3Ccircle cx='40' cy='33' r='4' fill='%231c1917'/%3E%3Ccircle cx='26' cy='31' r='1.5' fill='white'/%3E%3Ccircle cx='42' cy='31' r='1.5' fill='white'/%3E%3Cpath d='M27 41Q29 44 32 42Q35 44 37 41' stroke='%231c1917' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3Cpath d='M29.5 42L30.5 42L30 43Z' fill='white'/%3E%3Cpath d='M33.5 42L34.5 42L34 43Z' fill='white'/%3E%3C/svg%3E">
<meta name="description" content="Nen tang chia se cong thuc nấu ăn Viet Nam - kho phong phú, giao dien de su dung, ho tro responsive da man hinh.">
<meta property="og:title" content="Culinary Blog — UI Showcase">
<meta property="og:description" content="Demo truc quan 14 man hinh, 5 trang thai, 3 viewport - tao boi Next.js + Tailwind CSS.">
<meta property="og:type" content="website">
<meta property="og:locale" content="vi_VN">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"WebSite","name":"Culinary Blog","url":"https://culinary-blog.example.com","description":"Nen tang chia se cong thuc nấu ăn Viet Nam","inLanguage":"vi","potentialAction":{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":"https://culinary-blog.example.com/search?q={search_term_string}"},"query-input":"required name=search_term_string"}}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config={theme:{extend:{fontFamily:{sans:["Inter","system-ui","sans-serif"]},colors:{brand:{50:"#fff7ed",100:"#ffedd5",200:"#fed7aa",300:"#fdba74",400:"#fb923c",500:"#f97316",600:"#ea580c",700:"#c2410c",800:"#9a3412",900:"#7c2d12"},surface:{50:"#fafaf9",100:"#f5f5f4",200:"#e7e5e3",300:"#d6d3d1",400:"#a8a29e",500:"#78716c",600:"#57534e",700:"#44403c",800:"#292524",900:"#1c1917"}}}}}
</script>
<style>
*{scrollbar-width:thin;scrollbar-color:#a8a29e #f5f5f4}
html{scroll-behavior:smooth}
body{font-family:"Inter",system-ui,sans-serif;margin:0}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.skeleton{background:linear-gradient(90deg,#e7e5e3 25%,#d6d3d1 50%,#e7e5e3 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:0.375rem}
.frame-box{border:1px solid #d6d3d1;border-radius:0.75rem;overflow:hidden;background:#fff;margin-bottom:6rem}
.browser-chrome{background:#f5f5f4;padding:8px 12px;display:flex;align-items:center;gap:6px;border-bottom:1px solid #d6d3d1}
.dot{width:10px;height:10px;border-radius:50%}
.dot-r{background:#ef4444}.dot-y{background:#eab308}.dot-g{background:#22c55e}
.sidebar-link{transition:all 0.15s}
.sidebar-link:hover{background:#ffedd5;color:#ea580c}
.sidebar-link.active{background:#fff7ed;color:#ea580c;font-weight:600}
.frame-label{display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:#f5f5f4;border-bottom:1px solid #e7e5e3;font-size:11px;color:#78716c}
.frame-label .state-badge{padding:2px 8px;border-radius:4px;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.5px}
.state-populated{background:#dcfce7;color:#166534}
.state-loading{background:#fef9c3;color:#854d0e}
.state-error{background:#fee2e2;color:#991b1b}
.state-empty{background:#e0e7ff;color:#3730a3}
.state-edge{background:#fce7f3;color:#9d174d}
/* Touch-friendly minimum sizes */
button,a{min-height:44px;display:inline-flex;align-items:center}
/* Phone mockup — Pixel 3 style */
.phone-frame{width:375px;margin:0 auto 6rem;position:relative;border:5px solid #1c1917;border-radius:36px;background:linear-gradient(145deg,#292524,#1c1917);box-shadow:0 25px 60px -12px rgba(0,0,0,0.35),0 0 0 1px rgba(255,255,255,0.05) inset,0 1px 0 rgba(255,255,255,0.08) inset}
.phone-frame::before{content:"";position:absolute;top:10px;left:50%;transform:translateX(-50%);width:12px;height:12px;background:radial-gradient(circle,#292524 40%,#44403c 100%);border:1.5px solid #57534e;border-radius:50%;z-index:20}
.phone-frame::after{content:"";position:absolute;top:14px;left:50%;transform:translateX(-50%);width:5px;height:5px;background:radial-gradient(circle,#78716c,#57534e);border-radius:50%;z-index:21;box-shadow:0 0 2px rgba(0,0,0,0.5)}
.phone-screen{border-radius:31px;overflow-y:auto;overflow-x:hidden;background:#fff;position:relative;box-shadow:0 0 0 1px rgba(0,0,0,0.1) inset;height:700px}
.phone-screen .phone-nav{position:sticky;bottom:0;z-index:10}
.phone-frame .frame-label{display:none}
.phone-frame .phone-badge{display:inline-block;margin-top:12px;padding:6px 20px;border-radius:9999px;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
/* Tablet mockup — iPad Pro M4 style */
.tablet-frame{width:768px;margin:0 auto 6rem;position:relative;border:5px solid #1c1917;border-radius:20px;background:linear-gradient(145deg,#292524,#1c1917);box-shadow:0 30px 70px -15px rgba(0,0,0,0.35),0 0 0 1px rgba(255,255,255,0.05) inset,0 1px 0 rgba(255,255,255,0.08) inset}
.tablet-frame::before{content:"";position:absolute;top:12px;left:50%;transform:translateX(-50%);width:8px;height:8px;background:radial-gradient(circle,#292524 40%,#44403c 100%);border:1.5px solid #57534e;border-radius:50%;z-index:20}
.tablet-frame::after{content:"";position:absolute;bottom:12px;left:50%;transform:translateX(-50%);width:36px;height:3px;background:linear-gradient(90deg,#44403c,#57534e,#44403c);border-radius:2px;z-index:20}
.tablet-screen{border-radius:15px;overflow-y:auto;overflow-x:hidden;background:#fff;position:relative;box-shadow:0 0 0 1px rgba(0,0,0,0.1) inset;height:700px}
.tablet-frame .frame-label{display:none}
.tablet-frame .phone-badge{display:inline-block;margin-top:12px;padding:6px 20px;border-radius:9999px;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
input,select,textarea{min-height:44px}
/* Focus visible for keyboard nav */
:focus-visible{outline:2px solid #f97316;outline-offset:2px;border-radius:4px}
</style>
</head>
<body class="bg-surface-50 text-surface-800">
'''

HEADER = r'''
<header class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-surface-200 shadow-sm" role="banner">
<div class="flex items-center justify-between px-6 py-3">
<div class="flex items-center gap-3">
<div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center" aria-hidden="true">
<svg class="w-10 h-10" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="white"/><path d="M14 30C14 30 12 14 20 10C28 6 28 24 28 24" fill="#f97316" stroke="#ea580c" stroke-width="1.5" stroke-linejoin="round"/><path d="M50 30C50 30 52 14 44 10C36 6 36 24 36 24" fill="#f97316" stroke="#ea580c" stroke-width="1.5" stroke-linejoin="round"/><path d="M16 29C16 29 15 18 21 14C27 10 27 24 27 24" fill="#fed7aa"/><path d="M48 29C48 29 49 18 43 14C37 10 37 24 37 24" fill="#fed7aa"/><circle cx="32" cy="36" r="20" fill="#f97316" stroke="#ea580c" stroke-width="1.5"/><circle cx="18" cy="40" r="4" fill="#fed7aa" opacity="0.6"/><circle cx="46" cy="40" r="4" fill="#fed7aa" opacity="0.6"/><circle cx="24" cy="33" r="4" fill="#1c1917"/><circle cx="40" cy="33" r="4" fill="#1c1917"/><circle cx="26" cy="31" r="1.5" fill="white"/><circle cx="42" cy="31" r="1.5" fill="white"/><circle cx="23" cy="34" r="0.8" fill="white"/><circle cx="39" cy="34" r="0.8" fill="white"/><ellipse cx="32" cy="39" rx="2" ry="1.5" fill="#ea580c"/><path d="M27 41Q29 44 32 42Q35 44 37 41" stroke="#1c1917" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M29.5 42L30.5 42L30 43Z" fill="white"/><path d="M33.5 42L34.5 42L34 43Z" fill="white"/><line x1="18" y1="37" x2="6" y2="34" stroke="#c2410c" stroke-width="0.8" stroke-linecap="round"/><line x1="18" y1="40" x2="5" y2="40" stroke="#c2410c" stroke-width="0.8" stroke-linecap="round"/><line x1="18" y1="43" x2="6" y2="46" stroke="#c2410c" stroke-width="0.8" stroke-linecap="round"/><line x1="46" y1="37" x2="58" y2="34" stroke="#c2410c" stroke-width="0.8" stroke-linecap="round"/><line x1="46" y1="40" x2="59" y2="40" stroke="#c2410c" stroke-width="0.8" stroke-linecap="round"/><line x1="46" y1="43" x2="58" y2="46" stroke="#c2410c" stroke-width="0.8" stroke-linecap="round"/><ellipse cx="35" cy="44" rx="1.2" ry="1.5" fill="#38bdf8"/></svg>
</div>
<h1 class="text-lg font-bold text-surface-900">Culinary Blog — UI Showcase</h1>
</div>
<div class="flex items-center gap-2">
<span class="px-3 py-1 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full">14 Screens</span>
<span class="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">3 Viewports</span>
<span class="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">5 States</span>
</div>
</div>
</header>
'''

SIDEBAR = r'''
<nav class="fixed top-[53px] left-0 bottom-0 w-[260px] bg-white border-r border-surface-200 overflow-y-auto z-40" role="navigation" aria-label="Module navigation">
<div class="p-4">
<p class="text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-3">Public Pages</p>
<div class="space-y-0.5">
<a href="#m1" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M1 — Trang chủ</a>
<a href="#m2" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M2 — Danh sách cong thuc</a>
<a href="#m3" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M3 — Chi tiết cong thuc</a>
<a href="#m4" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M4 — Danh mục</a>
<a href="#m5" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M5 — Chi tiết danh muc</a>
<a href="#m6" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M6 — Ket qua tim kiem</a>
</div>
<p class="text-[10px] font-bold uppercase tracking-wider text-surface-400 mt-5 mb-3">Xac thuc</p>
<div class="space-y-0.5">
<a href="#m7" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M7 — Đăng nhập</a>
<a href="#m8" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M8 — Đăng ký</a>
</div>
<p class="text-[10px] font-bold uppercase tracking-wider text-surface-400 mt-5 mb-3">Quản trị</p>
<div class="space-y-0.5">
<a href="#m9" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M9 — Tổng quan</a>
<a href="#m10" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M10 — Công thức cua ban</a>
<a href="#m11" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M11 — Tao cong thuc moi</a>
<a href="#m12" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M12 — Chỉnh sửa cong thuc</a>
<a href="#m13" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M13 — Quản trị danh muc</a>
<a href="#m14" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">M14 — Hồ sơ ca nhan</a>
</div>
<p class="text-[10px] font-bold uppercase tracking-wider text-surface-400 mt-5 mb-3">Lỗi toan cuc</p>
<div class="space-y-0.5">
<a href="#g404" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">404 — Không tìm thấy</a>
<a href="#gnet" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">Mat ket noi</a>
<a href="#g429" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">429 — Gioi han toc do</a>
<a href="#g403" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">403 — Cam truy cap</a>
<a href="#g409" class="sidebar-link block px-3 py-2 text-sm rounded-md text-surface-700">409 — Trung lap du lieu</a>
</div>
</div>
</nav>
'''

MAIN_OPEN = '<main class="ml-[260px] pt-[53px] p-8" role="main">\n'

with open(OUT, "w", encoding="utf-8") as f:
    f.write(HEAD)
    f.write(HEADER)
    f.write(SIDEBAR)
    f.write(MAIN_OPEN)

print(f"Part 1 done. File size: {os.path.getsize(OUT)} bytes")
