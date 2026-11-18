with open('public/js/app.js', encoding='utf-8') as f:
    text = f.read()

for line in text.splitlines():
    if any(k in line for k in ['ferga_landing_card_color', 'applyLandingCardPalette', 'applyLandingBgPalette', 'applyLandingDuoPalette']):
        print(line.strip()[:140])
