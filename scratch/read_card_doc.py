with open('public/js/palettes.js', encoding='utf-8') as f:
    text = f.read()

idx = text.find('function applyLandingCardPaletteToDoc')
print(text[idx:idx+2500])
