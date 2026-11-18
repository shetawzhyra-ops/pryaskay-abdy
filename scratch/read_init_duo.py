with open('public/js/app.js', encoding='utf-8') as f:
    text = f.read()

idx = text.find('applyLandingDuoPalette(savedDuo')
print(text[idx-200:idx+800])
