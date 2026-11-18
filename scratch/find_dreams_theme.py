with open('public/dreams.html', encoding='utf-8') as f:
    dreams_html = f.read()

for line in dreams_html.splitlines():
    if any(k in line for k in ['palette', 'theme', 'color-bar', 'theme-toggle', 'darkMode', 'dark-mode', 'ڕەنگ', 'تاریک', 'ڕووناک', 'ڕوناک']):
        if len(line.strip()) < 150:
            print(line.strip())
