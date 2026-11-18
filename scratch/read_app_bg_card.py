with open('public/js/app.js', encoding='utf-8') as f:
    text = f.read()

idx = text.find('function applyLandingBgPalette(')
print(text[idx-50:idx+800])
print('='*50)
idx2 = text.find('function applyLandingCardPalette(')
print(text[idx2-50:idx2+800])
