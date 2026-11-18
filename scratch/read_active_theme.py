with open('public/js/palettes.js', encoding='utf-8') as f:
    text = f.read()

idx = text.find('applyActiveSavedTheme')
if idx != -1:
    print(text[idx-50:idx+2500])
else:
    print('Not found')
