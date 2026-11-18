with open('public/index.html', encoding='utf-8') as f:
    text = f.read()

for i, line in enumerate(text.splitlines(), 1):
    if 'drawerTheme' in line:
        print(f'{i}: {line.strip()[:100]}')
