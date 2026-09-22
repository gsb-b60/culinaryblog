import sys, re
sys.stdout.reconfigure(encoding='utf-8')
f = open(r'D:\UNI\nam4-hk1\superweb\lethimcook\web-showcase.html', 'r', encoding='utf-8')
c = f.read()
f.close()
ids = re.findall(r'id="([^"]+)"', c)
print('IDs:', len(ids))
m = [i for i in ids if i.startswith('m')]
g = [i for i in ids if i.startswith('g')]
print('Module IDs:', m)
print('Global IDs:', g)
print('Has skeleton:', c.count('skeleton'))
print('Has frame-box:', c.count('frame-box'))
print('Has aria-label:', c.count('aria-label'))
print('Has role=:', c.count('role='))
print('Has for=":', c.count('for="'))
print('Has ld+json:', c.count('ld+json'))
print('Has mobile_bottom_nav:', c.count('mobile_bottom_nav'))
print('Has state-loading:', c.count('state-loading'))
print('Has state-error:', c.count('state-error'))
print('Has state-empty:', c.count('state-empty'))
# Check for duplicate section tags
import re
secs = re.findall(r'<section id="([^"]+)"', c)
print('Section tags:', secs)
print('Section count:', len(secs))
# Check sidebar links
sidebar_links = re.findall(r'href="#(m\d+|g\w+)"', c)
print('Sidebar links:', sidebar_links[:20], '...')
