with open('public/js/palettes.js', encoding='utf-8') as f:
    text = f.read()

idx = text.find("id: 'sufi-sage'")
if idx != -1:
    print('--- sufi-sage BG ---')
    print(text[idx-50:idx+600])

print('--- DUO PALETTES ---')
d_idx = text.find("const LANDING_DUO_PALETTES")
if d_idx != -1:
    print(text[d_idx:d_idx+3000])
