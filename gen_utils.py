#!/usr/bin/env python3
"""Shared utilities for web-showcase.html generation. NO file writing here."""
import os

def frame_open(label, width_px, state, state_cls="state-populated", description="", frame_id=""):
    id_tag = f'<code class="text-lg text-surface-600 font-mono font-extrabold">#{frame_id}</code> &mdash; ' if frame_id else ""
    desc_html = f'<div class="mb-3"><h4 class="text-lg font-extrabold text-surface-800">{id_tag}{label} — {width_px}px</h4><p class="text-sm text-surface-500 mt-1 leading-relaxed">{description}</p></div>' if description else ""
    is_phone = width_px == 375
    is_tablet = width_px == 768
    is_device = is_phone or is_tablet
    box_cls = "phone-frame" if is_phone else "tablet-frame" if is_tablet else "frame-box"
    screen_cls = "phone-screen" if is_phone else "tablet-screen" if is_tablet else ""
    id_attr = f' id="{frame_id}"' if frame_id else ""
    badge_color = {"state-populated": "background:#dcfce7;color:#166534", "state-loading": "background:#fef9c3;color:#854d0e", "state-error": "background:#fee2e2;color:#991b1b", "state-empty": "background:#e0e7ff;color:#3730a3"}.get(state_cls, "background:#dcfce7;color:#166534")
    badge_html = f'<div style="text-align:center;margin:16px 0"><span class="phone-badge" style="display:inline-block;padding:5px 16px;border-radius:9999px;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;{badge_color}">{state}</span></div>' if is_device else ""
    id_label = f'<strong class="text-xl text-surface-900">{frame_id}</strong> &mdash; ' if frame_id else ""
    label_html = f'''<div class="frame-label">
<span class="flex items-center gap-2"><span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span><span class="ml-2 font-medium">{id_label}{label} — {width_px}px</span></span>
<span class="state-badge {state_cls}">{state}</span>
</div>''' if not is_device else ""
    return f'''{desc_html}{badge_html}<div{id_attr} class="{box_cls}">
{label_html}
<div class="{screen_cls} overflow-auto" style="max-height:700px;">
'''

def frame_close():
    return '</div></div></div>\n'

def skeleton_block(w="100%", h="16px"):
    return f'<div class="skeleton" style="width:{w};height:{h}"></div>'

def skeleton_card():
    return f'''<div class="bg-white rounded-xl border border-surface-200 overflow-hidden">
<div class="skeleton" style="height:160px;width:100%"></div>
<div class="p-4 space-y-3">
{skeleton_block("70%", "18px")}
{skeleton_block("100%", "14px")}
{skeleton_block("40%", "14px")}
</div></div>'''

def skeleton_rows(n=3):
    rows = ""
    for _ in range(n):
        rows += f'''<div class="flex items-center gap-3 p-3 bg-white rounded-lg border border-surface-200">
<div class="skeleton rounded-full" style="width:48px;height:48px;flex-shrink:0"></div>
<div class="flex-1 space-y-2">{skeleton_block("60%", "14px")}{skeleton_block("40%", "12px")}</div>
</div>'''
    return rows

ICO = {
    "book": '<svg class="w-10 h-10" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="white"/><path d="M14 30C14 30 12 14 20 10C28 6 28 24 28 24" fill="#f97316" stroke="#ea580c" stroke-width="1.5" stroke-linejoin="round"/><path d="M50 30C50 30 52 14 44 10C36 6 36 24 36 24" fill="#f97316" stroke="#ea580c" stroke-width="1.5" stroke-linejoin="round"/><path d="M16 29C16 29 15 18 21 14C27 10 27 24 27 24" fill="#fed7aa"/><path d="M48 29C48 29 49 18 43 14C37 10 37 24 37 24" fill="#fed7aa"/><circle cx="32" cy="36" r="20" fill="#f97316" stroke="#ea580c" stroke-width="1.5"/><circle cx="18" cy="40" r="4" fill="#fed7aa" opacity="0.6"/><circle cx="46" cy="40" r="4" fill="#fed7aa" opacity="0.6"/><circle cx="24" cy="33" r="4" fill="#1c1917"/><circle cx="40" cy="33" r="4" fill="#1c1917"/><circle cx="26" cy="31" r="1.5" fill="white"/><circle cx="42" cy="31" r="1.5" fill="white"/><circle cx="23" cy="34" r="0.8" fill="white"/><circle cx="39" cy="34" r="0.8" fill="white"/><ellipse cx="32" cy="39" rx="2" ry="1.5" fill="#ea580c"/><path d="M27 41Q29 44 32 42Q35 44 37 41" stroke="#1c1917" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M29.5 42L30.5 42L30 43Z" fill="white"/><path d="M33.5 42L34.5 42L34 43Z" fill="white"/><line x1="18" y1="37" x2="6" y2="34" stroke="#c2410c" stroke-width="0.8" stroke-linecap="round"/><line x1="18" y1="40" x2="5" y2="40" stroke="#c2410c" stroke-width="0.8" stroke-linecap="round"/><line x1="18" y1="43" x2="6" y2="46" stroke="#c2410c" stroke-width="0.8" stroke-linecap="round"/><line x1="46" y1="37" x2="58" y2="34" stroke="#c2410c" stroke-width="0.8" stroke-linecap="round"/><line x1="46" y1="40" x2="59" y2="40" stroke="#c2410c" stroke-width="0.8" stroke-linecap="round"/><line x1="46" y1="43" x2="58" y2="46" stroke="#c2410c" stroke-width="0.8" stroke-linecap="round"/><ellipse cx="35" cy="44" rx="1.2" ry="1.5" fill="#38bdf8"/></svg>',
    "search": '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>',
    "clock": '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    "user": '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>',
    "heart": '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>',
    "star": '<svg class="w-4 h-4 fill-amber-400 text-amber-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    "fire": '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"/></svg>',
    "grid": '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>',
    "menu": '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>',
    "bell": '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>',
    "chart": '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>',
    "plus": '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>',
    "edit": '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>',
    "trash": '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>',
    "google": '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>',
    "arrow_left": '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>',
    "arrow_right": '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>',
    "check": '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>',
    "x": '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>',
    "warning": '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>',
    "wifi_off": '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 00-.707-.707m-4.243.707a5 5 0 01-.707-.707M8.464 8.464a5 5 0 01.707-.707m4.243.707a5 5 0 00.707.707M12 12h.01"/></svg>',
    "shield": '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
    "refresh": '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>',
}

def nav_bar(logged_in=True, is_admin=False, mobile=False):
    if mobile:
        return f'''<nav class="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-white" style="position:sticky;top:0;z-index:10" role="navigation" aria-label="Main navigation">
<div class="flex items-center gap-2">
<div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center" aria-hidden="true">{ICO["book"]}</div>
<span class="font-bold text-surface-900">Culinary Blog</span>
</div>
<button class="p-2 text-surface-500" aria-label="Mo menu">{ICO["menu"]}</button>
</nav>'''
    user_menu = ""
    if logged_in:
        user_menu = f'''<div class="hidden md:flex items-center gap-3">
<button class="p-2 text-surface-500 hover:text-surface-700 rounded-lg" aria-label="Thông báo">{ICO["bell"]}</button>
<div class="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm" role="img" aria-label="Avatar nguoi dung">A</div>
</div>'''
    else:
        user_menu = f'''<div class="hidden md:flex items-center gap-2">
<a href="#" class="px-4 py-2 text-sm font-medium text-surface-700 hover:text-brand-600">Đăng nhập</a>
<a href="#" class="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600">Đăng ký</a>
</div>'''
    return f'''<nav class="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-white" style="position:sticky;top:0;z-index:10" role="navigation" aria-label="Main navigation">
<div class="flex items-center gap-2">
<div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center" aria-hidden="true">{ICO["book"]}</div>
<span class="font-bold text-surface-900">Culinary Blog</span>
</div>
<div class="hidden md:flex items-center gap-6 text-sm text-surface-600">
<a href="#" class="hover:text-brand-600">Trang chủ</a>
<a href="#" class="hover:text-brand-600">Công thức</a>
<a href="#" class="hover:text-brand-600">Danh mục</a>
</div>
{user_menu}
<button class="md:hidden p-2 text-surface-500" aria-label="Mo menu">{ICO["menu"]}</button>
</nav>'''

def mobile_bottom_nav(active="home"):
    items = [
        ("home", "Trang chủ", '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>'),
        ("recipes", "Công thức", '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>'),
        ("search", "Tìm kiếm", '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>'),
        ("profile", "Cá nhân", '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>'),
    ]
    links = ""
    for key, label, icon in items:
        color = "text-brand-600" if key == active else "text-surface-400"
        weight = "font-medium" if key == active else ""
        links += f'<a href="#" class="flex-1 flex flex-col items-center gap-0.5 {color}"><span>{icon}</span><span class="text-[10px] {weight}">{label}</span></a>'
    return f'''<div class="phone-nav" style="position:sticky;bottom:0;z-index:10;background:white;border-top:1px solid #e7e5e3;display:flex;padding:8px 0">
{links}
</div>'''

def format_time(minutes):
    if minutes >= 60:
        hours = minutes // 60
        mins = minutes % 60
        return f"{hours}h {mins}p" if mins else f"{hours}h"
    return f"{minutes}p"

def recipe_card(title, desc, author, time_min, difficulty, cal, tags=None):
    diff_colors = {"De": "bg-green-100 text-green-700", "Trung binh": "bg-amber-100 text-amber-700", "Kho": "bg-red-100 text-red-700", "Chuyen gia": "bg-purple-100 text-purple-700"}
    diff_cls = diff_colors.get(difficulty, "bg-surface-100 text-surface-600")
    tag_html = ""
    if tags:
        tag_html = '<div class="flex gap-1 mt-2">' + "".join(f'<span class="px-2 py-0.5 bg-surface-100 text-surface-600 text-[10px] rounded">{t}</span>' for t in tags) + '</div>'
    return f'''<article class="bg-white rounded-xl border border-surface-200 overflow-hidden hover:shadow-md transition-shadow mb-4">
<div class="skeleton" style="height:160px;width:100%;background:linear-gradient(135deg,#fed7aa,#fdba74)"></div>
<div class="p-4">
<h3 class="font-bold text-surface-900 text-base">{title}</h3>
<p class="text-sm text-surface-500 mt-1 line-clamp-2">{desc}</p>
<div class="flex items-center gap-3 mt-3 text-xs text-surface-400">
<span class="flex items-center gap-1">{ICO["clock"]} {format_time(time_min)}</span>
<span class="px-2 py-0.5 {diff_cls} rounded">{difficulty}</span>
<span>{cal} kcal</span>
</div>
<div class="flex items-center justify-between mt-3 pt-3 border-t border-surface-100">
<div class="flex items-center gap-2">
<div class="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-[10px] font-bold">{author[0]}</div>
<span class="text-xs text-surface-500">{author}</span>
</div>
<button class="text-surface-400 hover:text-red-500" aria-label="Yeu thich">{ICO["heart"]}</button>
</div>
{tag_html}
</div>
</article>'''

def section_header(mod_id, title, route, rendering, auth_label, description=""):
    desc_html = f'<p class="text-sm text-surface-400 mt-1">{description}</p>' if description else ""
    return f'''<section id="{mod_id}" class="mb-16">
<div class="mb-6">
<div class="flex items-center gap-3 mb-2">
<span class="px-2.5 py-0.5 bg-brand-500 text-white text-xs font-bold rounded">{mod_id.upper()}</span>
<h2 class="text-2xl font-extrabold text-surface-900">{title}</h2>
</div>
<div class="flex items-center gap-4 text-sm text-surface-500 mb-1">
<code class="px-1.5 py-0.5 bg-surface-100 rounded text-xs">{route}</code>
<span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded font-medium">{rendering}</span>
<span class="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded font-medium">Auth: {auth_label}</span>
</div>
{desc_html}
</div>
<div class="space-y-10">
'''

def section_close():
    return '</div></section>\n'

# ===================== SHARED DATA =====================
ALL_RECIPES = [
    ("Phở Bò Hà Nội","Pho bo la mon an truyền thống cua Viet Nam.","Nguyễn Văn An",285,"De",380,["Pho","Món chính"]),
    ("Bún Chả Hà Nội","Bun cha la mon an duoc yeu thich tai Ha Noi.","Trần Minh Bình",45,"Trung binh",420,["Bun","Nuong"]),
    ("Bánh Mì Thịt Nướng","Banh mi Viet voi thit nuong thom lui.","Nguyễn Văn An",30,"De",350,["Banh mi","Đồ ăn sáng"]),
    ("Chè Ba Màu","Che ba mau la mon trang mieng noi tieng.","Trần Minh Bình",60,"Trung binh",280,["Che","Tráng miệng"]),
    ("Gỏi Cuốn Tom Thit","Goi cuon tuoi ngon voi tom thit va rau thom.","Nguyễn Văn An",40,"De",220,["Goi cuon","Món chay"]),
    ("Bánh Xèo Mien Tay","Banh xeo gion tan voi tom, thit, dau hanh.","Trần Minh Bình",50,"Trung binh",310,["Banh xeo","Đồ ăn sáng"]),
]

CATS_FULL = [
    ("Món chính","42","Cac mon an chinh trong bua com Viet Nam, tu pho, bun cha den com rang.","bg-orange-100 text-orange-600"),
    ("Đồ uống","18","Tra, cafe, sinh to, nuoc giai khat tu nhien.","bg-blue-100 text-blue-600"),
    ("Đồ ăn sáng","25","Banh mi, xoi, banh cuon va cac mon an sang truyền thống.","bg-amber-100 text-amber-600"),
    ("Tráng miệng","15","Che, banh, kem va cac mon ngot ngao.","bg-pink-100 text-pink-600"),
    ("Món chay","12","Cac mon an chay dinh duong va hap dan.","bg-green-100 text-green-600"),
    ("Món kho","20","Món kho, kho tieu, kho quay - huong vi dac trung.","bg-red-100 text-red-600"),
]

CATS_SMALL = [
    ("Món chính","42 cong thuc","bg-orange-100 text-orange-600"),
    ("Đồ uống","18 cong thuc","bg-blue-100 text-blue-600"),
    ("Đồ ăn sáng","25 cong thuc","bg-amber-100 text-amber-600"),
    ("Tráng miệng","15 cong thuc","bg-pink-100 text-pink-600"),
    ("Món chay","12 cong thuc","bg-green-100 text-green-600"),
    ("Món kho","20 cong thuc","bg-red-100 text-red-600"),
]

RECIPES_DATA = [
    ("Phở Bò Hà Nội","Pho bo la mon an truyền thống cua Viet Nam, voi nước dùng chanh thơm ngon, thịt bò mềm mại.","Nguyễn Văn An",285,"De",380,["Món chính","Pho"]),
    ("Bún Chả Hà Nội","Bun cha la mon an duoc yeu thich tai Ha Noi, thịt heo nuong thom.","Trần Minh Bình",45,"Trung binh",420,["Món chính","Bun"]),
    ("Bánh Mì Thịt Nướng","Banh mi Viet voi thit nuong thom lui, rau thom, va tuong ot cay nồng.","Nguyễn Văn An",30,"De",350,["Đồ ăn sáng","Banh mi"]),
    ("Chè Ba Màu","Che ba mau la mon trang mieng noi tieng voi ba lop mau sac: do, vang, xanh.","Trần Minh Bình",60,"Trung binh",280,["Tráng miệng","Che"]),
]

RECIPES_TABLE = [
    ("Phở Bò Hà Nội","Da xuat ban","Món chính","15/01/2026"),
    ("Bún Chả Hà Nội","Da xuat ban","Món chính","12/01/2026"),
    ("Bánh Mì Thịt Nướng","Ban nhap","Đồ ăn sáng","10/01/2026"),
    ("Chè Ba Màu","Da xuat ban","Tráng miệng","08/01/2026"),
    ("Gỏi Cuốn Tom Thit","Da luu tru","Món chính","05/01/2026"),
]

ADMIN_CATS = [
    ("Món chính","Cac mon an chinh","42","1"),
    ("Đồ uống","Tra, cafe, sinh to","18","2"),
    ("Đồ ăn sáng","Banh mi, xoi","25","3"),
    ("Tráng miệng","Che, banh, kem","15","4"),
    ("Món chay","Mon an chay","12","5"),
    ("Món kho","Kho tieu, kho quay","20","6"),
]

SEARCH_RESULTS = [
    ("Phở Bò Hà Nội","Pho bo la mon an truyền thống cua Viet Nam, voi nước dùng chanh thơm ngon, thịt bò mềm mại.","Nguyễn Văn An",285,"De",380,"98%"),
    ("Bun Bo Hue","Bun bo Hue voi huong vi cay nồng, thơm ngon dac trung cua mien Trung.","Trần Minh Bình",60,"Trung binh",450,"85%"),
    ("Bo Kho","Bo kho am ap, thịt bò mem mang huong vi dac trung.","Nguyễn Văn An",90,"Trung binh",520,"72%"),
]

STEPS = [
    ("1","Chuan bi nước dùng","Bo hap qua nuoc soi de loai bo bat mau, sau do cho vao noi lon voi hanh tay, gung dot. Dun liu ho 3-4 gio de nước dùng trong va thom.","360 phut"),
    ("2","Che thịt bò","Cat bo thanh lop mong. Tron voi nuoc mam, tieu, hanh tay bot de thom.","15 phut"),
    ("3","Luoc banh pho","Luoc banh pho trong nuoc soi 30 giay, sau do vat ra va xep vao bat.","5 phut"),
    ("4","Thanh pham","Xep banh pho, thịt bò, hanh tay, rau thom vao bat. Chan nước dùng nong len.","10 phut"),
]

INGREDIENTS = [
    ("500g","Bo tenderloin","Cat mong"),
    ("500g","Banh pho",""),
    ("100g","Hanh tay, gung","Dot nho"),
    ("Vua","Nuoc mam, muoi, tieu","Dieu chinh"),
    ("Vua","Rau thơm, mint","An kem"),
]
