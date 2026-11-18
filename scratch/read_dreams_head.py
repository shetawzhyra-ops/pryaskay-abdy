with open('public/dreams.html', encoding='utf-8') as f:
    text = f.read()

print('Length:', len(text))
for line in text.splitlines()[:50]:
    print(line[:100])
