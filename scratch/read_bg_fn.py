with open('public/js/app.js', encoding='utf-8') as f:
    text = f.read()

idx = text.find('function applyLandingBgPalette')
print(text[idx-50:idx+450])
