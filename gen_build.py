#!/usr/bin/env python3
"""Master builder: generates web-showcase.html by calling build() from each part"""
import os
import sys

DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(DIR, "web-showcase.html")

# Ensure gen_utils is importable
sys.path.insert(0, DIR)

if os.path.exists(OUT):
    os.remove(OUT)
    print("Deleted old web-showcase.html")

# Part 1: Write head/CSS/header/sidebar (direct file write)
print("\n--- Running gen_part1.py ---")
exec(open(os.path.join(DIR, "gen_part1.py"), encoding="utf-8").read())

# Parts 2-6: Each writes directly to file
parts = ["gen_part2.py", "gen_part3.py", "gen_part4.py", "gen_part5.py", "gen_part6.py"]
for fname in parts:
    print(f"\n--- Running {fname} ---")
    ns = {"__file__": os.path.join(DIR, fname), "__name__": "__main__"}
    exec(open(os.path.join(DIR, fname), encoding="utf-8").read(), ns)
    # If the file has a build() function, call it and write the result
    if "build" in ns:
        html = ns["build"]()
        with open(OUT, "a", encoding="utf-8") as f:
            f.write(html)
        print(f"Appended {len(html):,} chars")

# Verification
size = os.path.getsize(OUT)
with open(OUT, "r", encoding="utf-8") as f:
    content = f.read()

import re
has_doctype = content.startswith("<!DOCTYPE html>")
has_close = "</html>" in content
section_tags = re.findall(r'<section id="([^"]+)"', content)
has_aria = content.count('aria-label')
has_role = content.count('role=')
has_for = content.count('for="')
has_json_ld = content.count('ld+json')
has_skeleton = content.count('skeleton')
has_frame = content.count('frame-box')
has_loading = content.count('state-loading')
has_error = content.count('state-error')
has_empty = content.count('state-empty')

print(f"\n=== VERIFICATION ===")
print(f"File size: {size:,} bytes ({size/1024:.1f} KB)")
print(f"Valid HTML: {has_doctype} / {has_close}")
print(f"Section tags: {len(section_tags)} -> {section_tags}")
print(f"ARIA labels: {has_aria}")
print(f"Role attributes: {has_role}")
print(f"Label for= attributes: {has_for}")
print(f"JSON-LD blocks: {has_json_ld}")
print(f"Skeleton elements: {has_skeleton}")
print(f"Frame boxes: {has_frame}")
print(f"Loading states: {has_loading}")
print(f"Error states: {has_error}")
print(f"Empty states: {has_empty}")
print(f"\nDone! Open web-showcase.html in a browser.")
