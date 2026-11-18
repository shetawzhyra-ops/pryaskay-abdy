with open('public/js/palettes.js', encoding='utf-8') as f:
    text = f.read()

idx = text.find('function applyActiveSavedTheme')
print(text[idx-200:idx+600])
