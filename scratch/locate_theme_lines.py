with open('public/index.html', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if any(k in line for k in ['گۆڕینی ڕەنگی باگراوند', 'گۆڕینی ڕەنگی بەش و کارتەکان', 'تەنسیقی هەردوو ڕەنگەکە', 'landingThemeToggleText', 'themeToggleIcon', 'drawerThemeBadge', 'مۆدی ڕووکار و ڕەنگەکان']):
        print(f'{i+1}: {line.strip()[:120]}')
