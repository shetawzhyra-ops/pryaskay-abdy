with open('public/index.html', encoding='utf-8') as f:
    html = f.read()

# Let's search for theme, palette, dark mode, light mode, toolbars
import re
print('--- Palette/Theme in index.html ---')
for line in html.splitlines():
    if any(k in line for k in ['palette', 'theme', 'color-bar', 'theme-toggle', 'darkMode', 'dark-mode', 'ڕەنگ', 'تاریک', 'ڕووناک', 'ڕوناک', 'paletteModal', 'paletteBar', 'themeBar']):
        if len(line.strip()) < 150:
            print(line.strip())
