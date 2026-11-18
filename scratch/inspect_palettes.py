with open('public/js/palettes.js', encoding='utf-8') as f:
    text = f.read()

for line in text.splitlines():
    s = line.strip()
    if s.startswith('id:') or s.startswith('name:') or s.startswith('const ') or s.startswith('// ====='):
        print(s)
