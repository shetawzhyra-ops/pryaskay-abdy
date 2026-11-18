with open('public/js/palettes.js', encoding='utf-8') as f:
    text = f.read()

c_idx = text.find("const LANDING_CARD_PALETTES")
print(text[c_idx:c_idx+4000])
