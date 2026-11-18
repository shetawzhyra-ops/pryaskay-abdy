with open('public/js/app.js', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'function (applyLanding\w+|setLanding\w+|toggleLanding\w+|toggleTheme\w+|initTheme\w+|applyTheme\w+|renderLanding\w+)', text)
print(set(matches))

for line in text.splitlines():
    if any(k in line for k in ['localStorage.getItem(\'landing_bg_palette\')', 'localStorage.getItem(\'landing_card_palette\')', 'localStorage.getItem(\'seereen_theme\')', 'seereen_theme', 'sufi-sage']):
        print(line.strip()[:120])
