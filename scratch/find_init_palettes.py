with open('public/js/app.js', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'applyLanding(Bg|Card|Duo)Palette', text)]
for idx in matches:
    start = max(0, idx - 150)
    end = min(len(text), idx + 250)
    print(text[start:end])
    print('-'*50)
