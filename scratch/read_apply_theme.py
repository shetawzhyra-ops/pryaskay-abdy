with open('public/js/app.js', encoding='utf-8') as f:
    text = f.read()

idx = text.find('function applyTheme(')
print(text[idx:idx+1500])
