with open('public/js/palettes.js', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'category":\s*"light"', text)]
for idx in matches[:10]:
    start = max(0, idx - 100)
    end = min(len(text), idx + 600)
    print(text[start:end])
    print('='*50)
