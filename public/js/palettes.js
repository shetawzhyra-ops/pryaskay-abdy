// Shared Palettes for Landing and Dreams
const LANDING_BG_PALETTES = [
  // ================= 1. DARK BACKGROUNDS (15 ڕەنگە تۆخەکان) =================
  {
    id: 'bg-obsidian-night',
    category: 'dark',
    name: 'ئۆبسیدیانی شاهانە',
    hex: '#0b1120',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(56, 189, 248, 0.18) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(99, 102, 241, 0.14) 0%, transparent 45%), radial-gradient(circle at 12% 65%, rgba(14, 165, 233, 0.14) 0%, transparent 55%), linear-gradient(180deg, #0b1120 0%, #070a14 50%, #03050a 100%)',
    grid: 'rgba(56, 189, 248, 0.08)',
    cardBorder: 'rgba(56, 189, 248, 0.22)'
  },
  {
    id: 'bg-midnight-navy',
    category: 'dark',
    name: 'شینی نیوەشەو (Navy)',
    hex: '#07152b',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(37, 99, 235, 0.22) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(2, 132, 199, 0.18) 0%, transparent 45%), radial-gradient(circle at 12% 65%, rgba(30, 64, 175, 0.20) 0%, transparent 55%), linear-gradient(180deg, #091c38 0%, #061326 50%, #030a14 100%)',
    grid: 'rgba(37, 99, 235, 0.09)',
    cardBorder: 'rgba(37, 99, 235, 0.25)'
  },
  {
    id: 'bg-sufi-emerald-dark',
    category: 'dark',
    name: 'زمڕووتی تاریک',
    hex: '#04231b',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(16, 185, 129, 0.22) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(5, 150, 105, 0.18) 0%, transparent 45%), radial-gradient(circle at 12% 65%, rgba(4, 120, 87, 0.20) 0%, transparent 55%), linear-gradient(180deg, #072e23 0%, #041f17 50%, #02120e 100%)',
    grid: 'rgba(16, 185, 129, 0.09)',
    cardBorder: 'rgba(16, 185, 129, 0.25)'
  },
  {
    id: 'bg-crimson-ruby-dark',
    category: 'dark',
    name: 'یاقووتی ئەندەلوسی',
    hex: '#260b16',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(244, 63, 94, 0.22) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(225, 29, 72, 0.16) 0%, transparent 45%), radial-gradient(circle at 12% 65%, rgba(190, 18, 60, 0.18) 0%, transparent 55%), linear-gradient(180deg, #310e1c 0%, #220913 50%, #14050b 100%)',
    grid: 'rgba(244, 63, 94, 0.09)',
    cardBorder: 'rgba(244, 63, 94, 0.25)'
  },
  {
    id: 'bg-royal-violet-dark',
    category: 'dark',
    name: 'مۆری مەخمەڵی تاریک',
    hex: '#1e0c30',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(168, 85, 247, 0.22) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(147, 51, 234, 0.16) 0%, transparent 45%), radial-gradient(circle at 12% 65%, rgba(126, 34, 206, 0.18) 0%, transparent 55%), linear-gradient(180deg, #27103f 0%, #1a0a2a 50%, #0e0517 100%)',
    grid: 'rgba(168, 85, 247, 0.09)',
    cardBorder: 'rgba(168, 85, 247, 0.25)'
  },
  {
    id: 'bg-espresso-mocha-dark',
    category: 'dark',
    name: 'قاوەیی چکلێتی تاریک',
    hex: '#1c1109',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(245, 158, 11, 0.20) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(217, 119, 6, 0.16) 0%, transparent 45%), radial-gradient(circle at 12% 65%, rgba(180, 83, 9, 0.18) 0%, transparent 55%), linear-gradient(180deg, #25170d 0%, #190f07 50%, #0e0804 100%)',
    grid: 'rgba(245, 158, 11, 0.09)',
    cardBorder: 'rgba(245, 158, 11, 0.25)'
  },
  {
    id: 'bg-midnight-indigo-dark',
    category: 'dark',
    name: 'نیلی ئاسمانی تاریک',
    hex: '#0f143a',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(99, 102, 241, 0.22) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(79, 70, 229, 0.18) 0%, transparent 45%), radial-gradient(circle at 12% 65%, rgba(67, 56, 202, 0.20) 0%, transparent 55%), linear-gradient(180deg, #131a4c 0%, #0d1234 50%, #07091e 100%)',
    grid: 'rgba(99, 102, 241, 0.09)',
    cardBorder: 'rgba(99, 102, 241, 0.25)'
  },
  {
    id: 'bg-carbon-graphite-dark',
    category: 'dark',
    name: 'پۆڵایی گرافایت',
    hex: '#131823',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(148, 163, 184, 0.20) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(100, 116, 139, 0.16) 0%, transparent 45%), radial-gradient(circle at 12% 65%, rgba(71, 85, 105, 0.18) 0%, transparent 55%), linear-gradient(180deg, #18202d 0%, #111620 50%, #0a0d13 100%)',
    grid: 'rgba(148, 163, 184, 0.08)',
    cardBorder: 'rgba(148, 163, 184, 0.22)'
  },
  {
    id: 'bg-forest-pine-dark',
    category: 'dark',
    name: 'دارستانی کەڤنار',
    hex: '#0d2218',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(34, 197, 94, 0.20) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(22, 163, 74, 0.16) 0%, transparent 45%), radial-gradient(circle at 12% 65%, rgba(21, 128, 61, 0.18) 0%, transparent 55%), linear-gradient(180deg, #112d20 0%, #0b1c14 50%, #06110c 100%)',
    grid: 'rgba(34, 197, 94, 0.08)',
    cardBorder: 'rgba(34, 197, 94, 0.24)'
  },
  {
    id: 'bg-pure-oled-dark',
    category: 'dark',
    name: 'تاریکی تەواو (OLED)',
    hex: '#030508',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(245, 158, 11, 0.14) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(56, 189, 248, 0.12) 0%, transparent 45%), linear-gradient(180deg, #05080e 0%, #020306 50%, #000000 100%)',
    grid: 'rgba(255, 255, 255, 0.05)',
    cardBorder: 'rgba(245, 158, 11, 0.3)'
  },
  {
    id: 'bg-ocean-teal-dark',
    category: 'dark',
    name: 'کەحلی ئۆقیانووسی تاریک',
    hex: '#062226',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(20, 184, 166, 0.22) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(13, 148, 136, 0.18) 0%, transparent 45%), radial-gradient(circle at 12% 65%, rgba(15, 118, 110, 0.20) 0%, transparent 55%), linear-gradient(180deg, #082d33 0%, #051d21 50%, #031113 100%)',
    grid: 'rgba(20, 184, 166, 0.09)',
    cardBorder: 'rgba(20, 184, 166, 0.25)'
  },
  {
    id: 'bg-imperial-sapphire-dark',
    category: 'dark',
    name: 'یاقووتی شینی ئیمپراتۆری',
    hex: '#091833',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(59, 130, 246, 0.24) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(37, 99, 235, 0.18) 0%, transparent 45%), radial-gradient(circle at 12% 65%, rgba(29, 78, 216, 0.20) 0%, transparent 55%), linear-gradient(180deg, #0c2045 0%, #07142b 50%, #040c1a 100%)',
    grid: 'rgba(59, 130, 246, 0.09)',
    cardBorder: 'rgba(59, 130, 246, 0.25)'
  },
  {
    id: 'bg-charcoal-steel-dark',
    category: 'dark',
    name: 'خەڵووزی فۆلادی',
    hex: '#11151c',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(71, 85, 105, 0.20) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(51, 65, 85, 0.18) 0%, transparent 45%), linear-gradient(180deg, #151a23 0%, #0e1217 50%, #080a0d 100%)',
    grid: 'rgba(148, 163, 184, 0.07)',
    cardBorder: 'rgba(148, 163, 184, 0.20)'
  },
  {
    id: 'bg-dark-copper-night',
    category: 'dark',
    name: 'مسینی مەخمەڵی تاریک',
    hex: '#24120b',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(234, 88, 12, 0.20) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(194, 65, 12, 0.16) 0%, transparent 45%), linear-gradient(180deg, #2e180f 0%, #1f0f09 50%, #120905 100%)',
    grid: 'rgba(234, 88, 12, 0.08)',
    cardBorder: 'rgba(234, 88, 12, 0.24)'
  },
  {
    id: 'bg-deep-forest-moss',
    category: 'dark',
    name: 'قەوزەی سەوزی تۆخ',
    hex: '#0a1d13',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(16, 185, 129, 0.20) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(5, 150, 105, 0.16) 0%, transparent 45%), linear-gradient(180deg, #0e271a 0%, #07170f 50%, #040d08 100%)',
    grid: 'rgba(16, 185, 129, 0.08)',
    cardBorder: 'rgba(16, 185, 129, 0.24)'
  },

  // ================= 2. MEDIUM BACKGROUNDS (15 ڕەنگە مامناوەندەکان) =================
  {
    id: 'bg-med-persian-teal',
    category: 'medium',
    name: 'شینی فیروزەیی مامناوەند',
    hex: '#1e687d',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(6, 182, 212, 0.35) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(14, 165, 233, 0.25) 0%, transparent 45%), linear-gradient(180deg, #25788f 0%, #1a5a6c 50%, #124351 100%)',
    grid: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(6, 182, 212, 0.35)'
  },
  {
    id: 'bg-med-kurdish-sage',
    category: 'medium',
    name: 'سەوزی شاخاوی مامناوەند',
    hex: '#2a5e4b',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(16, 185, 129, 0.35) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(5, 150, 105, 0.25) 0%, transparent 45%), linear-gradient(180deg, #327059 0%, #255543 50%, #193e31 100%)',
    grid: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(16, 185, 129, 0.35)'
  },
  {
    id: 'bg-med-amber-bronze',
    category: 'medium',
    name: 'برۆنزی زێڕینی هاوسەنگ',
    hex: '#78521c',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(245, 158, 11, 0.35) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(217, 119, 6, 0.25) 0%, transparent 45%), linear-gradient(180deg, #8d6122 0%, #6d4a19 50%, #523712 100%)',
    grid: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(245, 158, 11, 0.35)'
  },
  {
    id: 'bg-med-royal-amethyst',
    category: 'medium',
    name: 'وەنەوشەیی شاهانەی مامناوەند',
    hex: '#4d2b78',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(168, 85, 247, 0.35) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(147, 51, 234, 0.25) 0%, transparent 45%), linear-gradient(180deg, #5b348d 0%, #432468 50%, #30194c 100%)',
    grid: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(168, 85, 247, 0.35)'
  },
  {
    id: 'bg-med-mediterranean-teal',
    category: 'medium',
    name: 'کەحلی ناوەڕاست',
    hex: '#165e64',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(20, 184, 166, 0.35) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(13, 148, 136, 0.25) 0%, transparent 45%), linear-gradient(180deg, #1b6f76 0%, #135359 50%, #0d3b3f 100%)',
    grid: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(20, 184, 166, 0.35)'
  },
  {
    id: 'bg-med-terracotta-clay',
    category: 'medium',
    name: 'خاکی ئاڵتوونی مامناوەند',
    hex: '#843d22',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(234, 88, 12, 0.35) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(194, 65, 12, 0.25) 0%, transparent 45%), linear-gradient(180deg, #994828 0%, #76351d 50%, #582614 100%)',
    grid: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(234, 88, 12, 0.35)'
  },
  {
    id: 'bg-med-slate-denim',
    category: 'medium',
    name: 'شینی دەنیزی پۆڵایی',
    hex: '#334862',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(56, 189, 248, 0.32) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(99, 102, 241, 0.22) 0%, transparent 45%), linear-gradient(180deg, #3d5573 0%, #2c3f56 50%, #202e40 100%)',
    grid: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(56, 189, 248, 0.35)'
  },
  {
    id: 'bg-med-emerald-grove',
    category: 'medium',
    name: 'زمڕووتی باخی شاهانە',
    hex: '#1f644e',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(34, 197, 94, 0.35) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(16, 185, 129, 0.25) 0%, transparent 45%), linear-gradient(180deg, #25775d 0%, #1a5844 50%, #124031 100%)',
    grid: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(34, 197, 94, 0.35)'
  },
  {
    id: 'bg-med-dusty-mauve',
    category: 'medium',
    name: 'پەمەیی کۆنی شیک',
    hex: '#6d3158',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(236, 72, 153, 0.35) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(219, 39, 119, 0.25) 0%, transparent 45%), linear-gradient(180deg, #7f3b67 0%, #602b4d 50%, #461f38 100%)',
    grid: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(236, 72, 153, 0.35)'
  },
  {
    id: 'bg-med-rich-walnut',
    category: 'medium',
    name: 'دار گوێزی مامناوەند',
    hex: '#5a3825',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(180, 83, 9, 0.35) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(120, 53, 15, 0.25) 0%, transparent 45%), linear-gradient(180deg, #6b432d 0%, #503120 50%, #3b2316 100%)',
    grid: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(180, 83, 9, 0.35)'
  },
  {
    id: 'bg-med-persian-cobalt',
    category: 'medium',
    name: 'کۆباڵتی ئاسمانی',
    hex: '#1f487e',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(59, 130, 246, 0.35) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(37, 99, 235, 0.25) 0%, transparent 45%), linear-gradient(180deg, #255594 0%, #1a3f6f 50%, #122e53 100%)',
    grid: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(59, 130, 246, 0.35)'
  },
  {
    id: 'bg-med-olive-harvest',
    category: 'medium',
    name: 'زەیتوونی هاوسەنگ',
    hex: '#475e2b',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(132, 204, 22, 0.35) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(101, 163, 13, 0.25) 0%, transparent 45%), linear-gradient(180deg, #536e33 0%, #3e5325 50%, #2c3c1a 100%)',
    grid: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(132, 204, 22, 0.35)'
  },
  {
    id: 'bg-med-rosewood-velvet',
    category: 'medium',
    name: 'گوڵی داری ئەرغەوانی',
    hex: '#78263e',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(244, 63, 94, 0.35) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(225, 29, 72, 0.25) 0%, transparent 45%), linear-gradient(180deg, #8d2e49 0%, #6a2136 50%, #4e1727 100%)',
    grid: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(244, 63, 94, 0.35)'
  },
  {
    id: 'bg-med-warm-ochre',
    category: 'medium',
    name: 'ئۆکرای زێڕینی پاییزە',
    hex: '#8a6520',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(234, 179, 8, 0.35) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(202, 138, 4, 0.25) 0%, transparent 45%), linear-gradient(180deg, #9f7626 0%, #7a581a 50%, #5a4012 100%)',
    grid: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(234, 179, 8, 0.35)'
  },
  {
    id: 'bg-med-steel-indigo',
    category: 'medium',
    name: 'نیلی پۆڵایی مامناوەند',
    hex: '#303b74',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(99, 102, 241, 0.35) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(79, 70, 229, 0.25) 0%, transparent 45%), linear-gradient(180deg, #394689 0%, #293264 50%, #1e254b 100%)',
    grid: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(99, 102, 241, 0.35)'
  },

  // ================= 3. LIGHT BACKGROUNDS (20 ڕەنگە کاڵەکان) =================
  {
    id: 'sufi-sage',
    category: 'light',
    name: 'سەوزی سۆفیانە (Sage)',
    hex: '#86b89c',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(52, 211, 153, 0.28) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(110, 231, 183, 0.20) 0%, transparent 45%), radial-gradient(circle at 12% 65%, rgba(16, 185, 129, 0.22) 0%, transparent 55%), linear-gradient(180deg, #a7d3ba 0%, #8cbe9f 50%, #72a988 100%)',
    grid: 'rgba(16, 185, 129, 0.09)',
    cardBorder: 'rgba(16, 185, 129, 0.26)'
  },
  {
    id: 'pure-white-cream',
    category: 'light',
    name: 'سپێدەی پاک و کاڵ',
    hex: '#f5f2ea',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(245, 158, 11, 0.14) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(56, 189, 248, 0.10) 0%, transparent 45%), linear-gradient(180deg, #faf7f0 0%, #f4eee2 50%, #eee4d4 100%)',
    grid: 'rgba(217, 119, 6, 0.08)',
    cardBorder: 'rgba(217, 119, 6, 0.22)'
  },
  {
    id: 'ivory-silk',
    category: 'light',
    name: 'هەویری عاجی (Ivory)',
    hex: '#e2d4bd',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(217, 119, 6, 0.24) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(245, 158, 11, 0.16) 0%, transparent 45%), linear-gradient(180deg, #eee3ce 0%, #e4d7bf 50%, #d8c7a9 100%)',
    grid: 'rgba(217, 119, 6, 0.09)',
    cardBorder: 'rgba(217, 119, 6, 0.26)'
  },
  {
    id: 'lagoon-blue',
    category: 'light',
    name: 'شینی کەناراو',
    hex: '#95d6db',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(6, 182, 212, 0.26) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(8, 145, 178, 0.18) 0%, transparent 45%), linear-gradient(180deg, #b7e8ed 0%, #9ad7dc 50%, #7ec6cc 100%)',
    grid: 'rgba(6, 182, 212, 0.09)',
    cardBorder: 'rgba(6, 182, 212, 0.26)'
  },
  {
    id: 'glacial-ice',
    category: 'light',
    name: 'شینی سەهۆڵی کاڵ',
    hex: '#aedee8',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(56, 189, 248, 0.25) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(14, 165, 233, 0.18) 0%, transparent 45%), linear-gradient(180deg, #cdecf3 0%, #b2e0ea 50%, #99d2de 100%)',
    grid: 'rgba(56, 189, 248, 0.09)',
    cardBorder: 'rgba(56, 189, 248, 0.26)'
  },
  {
    id: 'sky-blue',
    category: 'light',
    name: 'شینی ئاسمانی کاڵ',
    hex: '#a3d5f3',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(2, 132, 199, 0.26) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(56, 189, 248, 0.18) 0%, transparent 45%), linear-gradient(180deg, #c4e6fa 0%, #a9d7f4 50%, #8ec7ee 100%)',
    grid: 'rgba(2, 132, 199, 0.09)',
    cardBorder: 'rgba(2, 132, 199, 0.26)'
  },
  {
    id: 'ocean-mist',
    category: 'light',
    name: 'شینی ئۆقیانووسی کاڵ',
    hex: '#9bd4e8',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(8, 145, 178, 0.28) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(6, 182, 212, 0.18) 0%, transparent 45%), linear-gradient(180deg, #bfe5f5 0%, #a2d7ea 50%, #84c7de 100%)',
    grid: 'rgba(8, 145, 178, 0.09)',
    cardBorder: 'rgba(8, 145, 178, 0.26)'
  },
  {
    id: 'royal-indigo-light',
    category: 'light',
    name: 'نیلی شاهانەی کاڵ',
    hex: '#b5c5f6',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(79, 70, 229, 0.26) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(99, 102, 241, 0.18) 0%, transparent 45%), linear-gradient(180deg, #d0dcfa 0%, #b8c8f6 50%, #9db3f1 100%)',
    grid: 'rgba(79, 70, 229, 0.09)',
    cardBorder: 'rgba(79, 70, 229, 0.26)'
  },
  {
    id: 'royal-violet-light',
    category: 'light',
    name: 'وەنەوشەی کاڵ',
    hex: '#c2b0eb',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(139, 92, 246, 0.26) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(124, 58, 237, 0.18) 0%, transparent 45%), linear-gradient(180deg, #d8cbfa 0%, #c4b3ec 50%, #b09cdc 100%)',
    grid: 'rgba(139, 92, 246, 0.09)',
    cardBorder: 'rgba(139, 92, 246, 0.26)'
  },
  {
    id: 'lavender-light',
    category: 'light',
    name: 'لاڤێندەری ئارام',
    hex: '#cbb7f5',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(124, 58, 237, 0.26) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(139, 92, 246, 0.18) 0%, transparent 45%), linear-gradient(180deg, #ddd0fa 0%, #cdbaf6 50%, #b9a3f2 100%)',
    grid: 'rgba(124, 58, 237, 0.09)',
    cardBorder: 'rgba(124, 58, 237, 0.26)'
  },
  {
    id: 'soft-plum-light',
    category: 'light',
    name: 'هەڵوژەیی نەرم',
    hex: '#d8b0d4',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(192, 38, 211, 0.25) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(168, 85, 247, 0.18) 0%, transparent 45%), linear-gradient(180deg, #ecc5e8 0%, #d9b1d5 50%, #c49ec0 100%)',
    grid: 'rgba(192, 38, 211, 0.09)',
    cardBorder: 'rgba(192, 38, 211, 0.26)'
  },
  {
    id: 'wild-berry-light',
    category: 'light',
    name: 'شاتووی مەخمەڵی کاڵ',
    hex: '#e2a6b5',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(219, 39, 119, 0.25) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(236, 72, 153, 0.18) 0%, transparent 45%), linear-gradient(180deg, #f3becb 0%, #e4a7b7 50%, #cf8f9f 100%)',
    grid: 'rgba(219, 39, 119, 0.09)',
    cardBorder: 'rgba(219, 39, 119, 0.26)'
  },
  {
    id: 'rose-blush-light',
    category: 'light',
    name: 'گوڵی ڕۆزی کاڵ',
    hex: '#f3adc0',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(225, 29, 72, 0.25) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(244, 63, 94, 0.18) 0%, transparent 45%), linear-gradient(180deg, #fac6d2 0%, #f4b0c1 50%, #ec98ad 100%)',
    grid: 'rgba(225, 29, 72, 0.09)',
    cardBorder: 'rgba(225, 29, 72, 0.26)'
  },
  {
    id: 'spring-lemon-light',
    category: 'light',
    name: 'لیمۆیی بەهاری کاڵ',
    hex: '#e8dc88',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(234, 179, 8, 0.28) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(250, 204, 21, 0.20) 0%, transparent 45%), linear-gradient(180deg, #f6eca6 0%, #eade8b 50%, #d8ca71 100%)',
    grid: 'rgba(202, 138, 4, 0.09)',
    cardBorder: 'rgba(202, 138, 4, 0.26)'
  },
  {
    id: 'golden-amber-light',
    category: 'light',
    name: 'زێڕینی مۆمی کاڵ',
    hex: '#ebce82',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(217, 119, 6, 0.28) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(245, 158, 11, 0.20) 0%, transparent 45%), linear-gradient(180deg, #f6e2ab 0%, #edd087 50%, #e2be60 100%)',
    grid: 'rgba(217, 119, 6, 0.09)',
    cardBorder: 'rgba(217, 119, 6, 0.26)'
  },
  {
    id: 'warm-peach-light',
    category: 'light',
    name: 'قۆخی ناسک',
    hex: '#f5bb95',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(234, 88, 12, 0.25) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(249, 115, 22, 0.18) 0%, transparent 45%), linear-gradient(180deg, #fad3b6 0%, #f7be99 50%, #eea77d 100%)',
    grid: 'rgba(234, 88, 12, 0.09)',
    cardBorder: 'rgba(234, 88, 12, 0.26)'
  },
  {
    id: 'terracotta-sand-light',
    category: 'light',
    name: 'خیز و بیابانی کاڵ',
    hex: '#dfb798',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(194, 65, 12, 0.25) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(180, 83, 9, 0.18) 0%, transparent 45%), linear-gradient(180deg, #f0cfb5 0%, #e1b99a 50%, #cea181 100%)',
    grid: 'rgba(194, 65, 12, 0.09)',
    cardBorder: 'rgba(194, 65, 12, 0.26)'
  },
  {
    id: 'antique-parchment-light',
    category: 'light',
    name: 'کاغەزی سێپیای کەڤنار',
    hex: '#d8ba92',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(180, 83, 9, 0.26) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(146, 64, 14, 0.18) 0%, transparent 45%), linear-gradient(180deg, #ebd3b1 0%, #dabf96 50%, #caa477 100%)',
    grid: 'rgba(180, 83, 9, 0.09)',
    cardBorder: 'rgba(180, 83, 9, 0.26)'
  },
  {
    id: 'slate-mist-light',
    category: 'light',
    name: 'تەمەپۆڵایی کاڵ',
    hex: '#aec0d2',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(71, 85, 105, 0.25) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(100, 116, 139, 0.18) 0%, transparent 45%), linear-gradient(180deg, #c7d5e3 0%, #b2c3d5 50%, #9cb1c7 100%)',
    grid: 'rgba(71, 85, 105, 0.09)',
    cardBorder: 'rgba(71, 85, 105, 0.26)'
  },
  {
    id: 'pearl-silver-light',
    category: 'light',
    name: 'مرواری پۆڵایی کاڵ',
    hex: '#b5c6cf',
    gradient: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(100, 116, 139, 0.25) 0%, transparent 65%), radial-gradient(circle at 85% 18%, rgba(148, 163, 184, 0.18) 0%, transparent 45%), linear-gradient(180deg, #cedde4 0%, #b8c9d2 50%, #a2b4bd 100%)',
    grid: 'rgba(100, 116, 139, 0.09)',
    cardBorder: 'rgba(100, 116, 139, 0.26)'
  }
];

const LANDING_CARD_PALETTES = [
  {
    "id": "card-obsidian",
    "category": "dark",
    "name": "ڕەشی شاهانە (Obsidian)",
    "hex": "#0b1120",
    "bg": "linear-gradient(160deg, rgba(15, 23, 42, 0.96) 0%, rgba(9, 14, 28, 0.98) 100%)",
    "border": "rgba(56, 189, 248, 0.3)",
    "titleColor": "#ffffff",
    "textColor": "#cbd5e1",
    "accentColor": "#38bdf8",
    "iconBg": "rgba(56, 189, 248, 0.2)",
    "tagBg": "rgba(56, 189, 248, 0.16)",
    "tagText": "#7dd3fc",
    "shadow": "0 18px 45px -10px rgba(0, 0, 0, 0.85)"
  },
  {
    "id": "card-midnight-navy",
    "category": "dark",
    "name": "شینی نیوەشەو (Navy)",
    "hex": "#081327",
    "bg": "linear-gradient(160deg, rgba(8, 19, 39, 0.96) 0%, rgba(5, 12, 26, 0.98) 100%)",
    "border": "rgba(56, 189, 248, 0.3)",
    "titleColor": "#ffffff",
    "textColor": "#cbd5e1",
    "accentColor": "#38bdf8",
    "iconBg": "rgba(56, 189, 248, 0.2)",
    "tagBg": "rgba(56, 189, 248, 0.16)",
    "tagText": "#7dd3fc",
    "shadow": "0 18px 45px -10px rgba(8, 19, 39, 0.8)"
  },
  {
    "id": "card-sufi-emerald",
    "category": "dark",
    "name": "سەوزی سۆفیانە (Emerald)",
    "hex": "#06281e",
    "bg": "linear-gradient(160deg, rgba(6, 40, 30, 0.96) 0%, rgba(4, 26, 20, 0.98) 100%)",
    "border": "rgba(16, 185, 129, 0.3)",
    "titleColor": "#ffffff",
    "textColor": "#cbd5e1",
    "accentColor": "#34d399",
    "iconBg": "rgba(16, 185, 129, 0.2)",
    "tagBg": "rgba(16, 185, 129, 0.16)",
    "tagText": "#6ee7b7",
    "shadow": "0 18px 45px -10px rgba(4, 26, 20, 0.8)"
  },
  {
    "id": "card-velvet-purple",
    "category": "dark",
    "name": "پەمەیی مۆری شاهانە",
    "hex": "#241038",
    "bg": "linear-gradient(160deg, rgba(36, 16, 56, 0.96) 0%, rgba(22, 10, 35, 0.98) 100%)",
    "border": "rgba(192, 132, 252, 0.3)",
    "titleColor": "#ffffff",
    "textColor": "#e2e8f0",
    "accentColor": "#c084fc",
    "iconBg": "rgba(192, 132, 252, 0.2)",
    "tagBg": "rgba(192, 132, 252, 0.16)",
    "tagText": "#d8b4fe",
    "shadow": "0 18px 45px -10px rgba(22, 10, 35, 0.8)"
  },
  {
    "id": "card-crimson-ruby",
    "category": "dark",
    "name": "یاقووتی قووڵ (Ruby)",
    "hex": "#2b0c17",
    "bg": "linear-gradient(160deg, rgba(43, 12, 23, 0.96) 0%, rgba(27, 7, 14, 0.98) 100%)",
    "border": "rgba(244, 63, 94, 0.3)",
    "titleColor": "#ffffff",
    "textColor": "#fecdd3",
    "accentColor": "#fb7185",
    "iconBg": "rgba(244, 63, 94, 0.2)",
    "tagBg": "rgba(244, 63, 94, 0.16)",
    "tagText": "#fda4af",
    "shadow": "0 18px 45px -10px rgba(27, 7, 14, 0.8)"
  },
  {
    "id": "card-espresso-wood",
    "category": "dark",
    "name": "قاوەیی چکلێتی (Mocha)",
    "hex": "#24160c",
    "bg": "linear-gradient(160deg, rgba(36, 22, 12, 0.96) 0%, rgba(23, 13, 7, 0.98) 100%)",
    "border": "rgba(217, 119, 6, 0.3)",
    "titleColor": "#ffffff",
    "textColor": "#fed7aa",
    "accentColor": "#f59e0b",
    "iconBg": "rgba(217, 119, 6, 0.2)",
    "tagBg": "rgba(217, 119, 6, 0.16)",
    "tagText": "#fcd34d",
    "shadow": "0 18px 45px -10px rgba(23, 13, 7, 0.8)"
  },
  {
    "id": "card-midnight-indigo",
    "category": "dark",
    "name": "نیلی شەوانە (Indigo)",
    "hex": "#131842",
    "bg": "linear-gradient(160deg, rgba(19, 24, 66, 0.96) 0%, rgba(12, 15, 43, 0.98) 100%)",
    "border": "rgba(129, 140, 248, 0.3)",
    "titleColor": "#ffffff",
    "textColor": "#c7d2fe",
    "accentColor": "#818cf8",
    "iconBg": "rgba(129, 140, 248, 0.2)",
    "tagBg": "rgba(129, 140, 248, 0.16)",
    "tagText": "#a5b4fc",
    "shadow": "0 18px 45px -10px rgba(12, 15, 43, 0.8)"
  },
  {
    "id": "card-carbon-graphite",
    "category": "dark",
    "name": "پۆڵایی گرافایتی (Carbon)",
    "hex": "#161b26",
    "bg": "linear-gradient(160deg, rgba(22, 27, 38, 0.96) 0%, rgba(14, 18, 25, 0.98) 100%)",
    "border": "rgba(148, 163, 184, 0.25)",
    "titleColor": "#ffffff",
    "textColor": "#cbd5e1",
    "accentColor": "#38bdf8",
    "iconBg": "rgba(56, 189, 248, 0.2)",
    "tagBg": "rgba(56, 189, 248, 0.15)",
    "tagText": "#7dd3fc",
    "shadow": "0 18px 45px -10px rgba(14, 18, 25, 0.8)"
  },
  {
    "id": "card-forest-olive",
    "category": "dark",
    "name": "سەوزی زەیتوونی (Olive)",
    "hex": "#162415",
    "bg": "linear-gradient(160deg, rgba(22, 36, 21, 0.96) 0%, rgba(14, 23, 13, 0.98) 100%)",
    "border": "rgba(74, 222, 128, 0.28)",
    "titleColor": "#ffffff",
    "textColor": "#dcfce7",
    "accentColor": "#4ade80",
    "iconBg": "rgba(74, 222, 128, 0.2)",
    "tagBg": "rgba(74, 222, 128, 0.16)",
    "tagText": "#86efac",
    "shadow": "0 18px 45px -10px rgba(14, 23, 13, 0.8)"
  },
  {
    "id": "card-pure-oled",
    "category": "dark",
    "name": "تاریکی ڕەها (OLED Pure)",
    "hex": "#05070a",
    "bg": "linear-gradient(160deg, rgba(5, 7, 10, 0.98) 0%, rgba(2, 3, 5, 0.99) 100%)",
    "border": "rgba(245, 158, 11, 0.35)",
    "titleColor": "#ffffff",
    "textColor": "#e2e8f0",
    "accentColor": "#fbbf24",
    "iconBg": "rgba(245, 158, 11, 0.22)",
    "tagBg": "rgba(245, 158, 11, 0.18)",
    "tagText": "#fcd34d",
    "shadow": "0 20px 50px -10px rgba(0, 0, 0, 0.9)"
  },
  {
    "id": "card-ocean-teal",
    "category": "dark",
    "name": "کەحلی ئۆقیانووسی (Teal)",
    "hex": "#08252a",
    "bg": "linear-gradient(160deg, rgba(8, 37, 42, 0.96) 0%, rgba(5, 23, 27, 0.98) 100%)",
    "border": "rgba(45, 212, 191, 0.3)",
    "titleColor": "#ffffff",
    "textColor": "#ccfbf1",
    "accentColor": "#2dd4bf",
    "iconBg": "rgba(45, 212, 191, 0.2)",
    "tagBg": "rgba(45, 212, 191, 0.16)",
    "tagText": "#5eead4",
    "shadow": "0 18px 45px -10px rgba(5, 23, 27, 0.8)"
  },
  {
    "id": "card-mystic-pine",
    "category": "dark",
    "name": "دارستانی پەنهان (Pine)",
    "hex": "#0d2421",
    "bg": "linear-gradient(160deg, rgba(13, 36, 33, 0.96) 0%, rgba(8, 23, 21, 0.98) 100%)",
    "border": "rgba(52, 211, 153, 0.28)",
    "titleColor": "#ffffff",
    "textColor": "#cbd5e1",
    "accentColor": "#34d399",
    "iconBg": "rgba(52, 211, 153, 0.2)",
    "tagBg": "rgba(52, 211, 153, 0.16)",
    "tagText": "#6ee7b7",
    "shadow": "0 18px 45px -10px rgba(8, 23, 21, 0.8)"
  },
  {
    "id": "card-royal-sapphire",
    "category": "dark",
    "name": "یاقووتی شینی ساماڵ",
    "hex": "#0a1a36",
    "bg": "linear-gradient(160deg, rgba(10, 26, 54, 0.96) 0%, rgba(6, 16, 35, 0.98) 100%)",
    "border": "rgba(96, 165, 250, 0.3)",
    "titleColor": "#ffffff",
    "textColor": "#dbeafe",
    "accentColor": "#60a5fa",
    "iconBg": "rgba(96, 165, 250, 0.2)",
    "tagBg": "rgba(96, 165, 250, 0.16)",
    "tagText": "#93c5fd",
    "shadow": "0 18px 45px -10px rgba(6, 16, 35, 0.8)"
  },
  {
    "id": "card-warm-bronze-dark",
    "category": "dark",
    "name": "برۆنزی تاریکی شاهانە",
    "hex": "#231508",
    "bg": "linear-gradient(160deg, rgba(35, 21, 8, 0.96) 0%, rgba(20, 12, 4, 0.98) 100%)",
    "border": "rgba(245, 158, 11, 0.3)",
    "titleColor": "#ffffff",
    "textColor": "#fef3c7",
    "accentColor": "#f59e0b",
    "iconBg": "rgba(245, 158, 11, 0.2)",
    "tagBg": "rgba(245, 158, 11, 0.16)",
    "tagText": "#fde68a",
    "shadow": "0 18px 45px -10px rgba(20, 12, 4, 0.8)"
  },
  {
    "id": "card-charcoal-platinum",
    "category": "dark",
    "name": "پلاتینیۆمی خەڵووزی",
    "hex": "#14171f",
    "bg": "linear-gradient(160deg, rgba(20, 23, 31, 0.96) 0%, rgba(12, 14, 20, 0.98) 100%)",
    "border": "rgba(203, 213, 225, 0.25)",
    "titleColor": "#ffffff",
    "textColor": "#e2e8f0",
    "accentColor": "#38bdf8",
    "iconBg": "rgba(56, 189, 248, 0.2)",
    "tagBg": "rgba(56, 189, 248, 0.16)",
    "tagText": "#7dd3fc",
    "shadow": "0 18px 45px -10px rgba(12, 14, 20, 0.85)"
  },
  {
    "id": "card-med-turquoise",
    "category": "medium",
    "name": "شینی فیروزەیی مامناوەند",
    "hex": "#165b6e",
    "bg": "linear-gradient(160deg, rgba(22, 91, 110, 0.95) 0%, rgba(15, 68, 83, 0.98) 100%)",
    "border": "rgba(103, 232, 249, 0.4)",
    "titleColor": "#ffffff",
    "textColor": "#ecfeff",
    "accentColor": "#22d3ee",
    "iconBg": "rgba(34, 211, 238, 0.25)",
    "tagBg": "rgba(34, 211, 238, 0.2)",
    "tagText": "#a5f3fc",
    "shadow": "0 16px 40px -8px rgba(15, 68, 83, 0.6)"
  },
  {
    "id": "card-med-emerald",
    "category": "medium",
    "name": "زمڕووتی هاوسەنگ",
    "hex": "#1a5c43",
    "bg": "linear-gradient(160deg, rgba(26, 92, 67, 0.95) 0%, rgba(18, 69, 50, 0.98) 100%)",
    "border": "rgba(110, 231, 183, 0.4)",
    "titleColor": "#ffffff",
    "textColor": "#ecfdf5",
    "accentColor": "#34d399",
    "iconBg": "rgba(52, 211, 153, 0.25)",
    "tagBg": "rgba(52, 211, 153, 0.2)",
    "tagText": "#a7f3d0",
    "shadow": "0 16px 40px -8px rgba(18, 69, 50, 0.6)"
  },
  {
    "id": "card-med-caramel-bronze",
    "category": "medium",
    "name": "کارامێلی برۆنزی هاوسەنگ",
    "hex": "#7c4d1d",
    "bg": "linear-gradient(160deg, rgba(124, 77, 29, 0.95) 0%, rgba(93, 58, 21, 0.98) 100%)",
    "border": "rgba(252, 211, 77, 0.4)",
    "titleColor": "#ffffff",
    "textColor": "#fffbeb",
    "accentColor": "#fbbf24",
    "iconBg": "rgba(251, 191, 36, 0.25)",
    "tagBg": "rgba(251, 191, 36, 0.2)",
    "tagText": "#fde68a",
    "shadow": "0 16px 40px -8px rgba(93, 58, 21, 0.6)"
  },
  {
    "id": "card-med-amethyst",
    "category": "medium",
    "name": "وەنەوشەیی مەخمەڵی مامناوەند",
    "hex": "#53297a",
    "bg": "linear-gradient(160deg, rgba(83, 41, 122, 0.95) 0%, rgba(61, 30, 90, 0.98) 100%)",
    "border": "rgba(216, 180, 254, 0.4)",
    "titleColor": "#ffffff",
    "textColor": "#faf5ff",
    "accentColor": "#c084fc",
    "iconBg": "rgba(192, 132, 252, 0.25)",
    "tagBg": "rgba(192, 132, 252, 0.2)",
    "tagText": "#e9d5ff",
    "shadow": "0 16px 40px -8px rgba(61, 30, 90, 0.6)"
  },
  {
    "id": "card-med-rich-mocha",
    "category": "medium",
    "name": "قاوەیی مۆکای دەوڵەمەند",
    "hex": "#5c3924",
    "bg": "linear-gradient(160deg, rgba(92, 57, 36, 0.95) 0%, rgba(69, 42, 26, 0.98) 100%)",
    "border": "rgba(253, 186, 116, 0.4)",
    "titleColor": "#ffffff",
    "textColor": "#fff7ed",
    "accentColor": "#fb923c",
    "iconBg": "rgba(251, 146, 60, 0.25)",
    "tagBg": "rgba(251, 146, 60, 0.2)",
    "tagText": "#fed7aa",
    "shadow": "0 16px 40px -8px rgba(69, 42, 26, 0.6)"
  },
  {
    "id": "card-med-ocean-blue",
    "category": "medium",
    "name": "شینی ئۆقیانووسی هاوسەنگ",
    "hex": "#1d5282",
    "bg": "linear-gradient(160deg, rgba(29, 82, 130, 0.95) 0%, rgba(20, 60, 96, 0.98) 100%)",
    "border": "rgba(125, 211, 252, 0.4)",
    "titleColor": "#ffffff",
    "textColor": "#f0f9ff",
    "accentColor": "#38bdf8",
    "iconBg": "rgba(56, 189, 248, 0.25)",
    "tagBg": "rgba(56, 189, 248, 0.2)",
    "tagText": "#bae6fd",
    "shadow": "0 16px 40px -8px rgba(20, 60, 96, 0.6)"
  },
  {
    "id": "card-med-forest-sage",
    "category": "medium",
    "name": "سەوزی سەیوان مامناوەند",
    "hex": "#2d624a",
    "bg": "linear-gradient(160deg, rgba(45, 98, 74, 0.95) 0%, rgba(32, 73, 55, 0.98) 100%)",
    "border": "rgba(134, 239, 172, 0.4)",
    "titleColor": "#ffffff",
    "textColor": "#f0fdf4",
    "accentColor": "#4ade80",
    "iconBg": "rgba(74, 222, 128, 0.25)",
    "tagBg": "rgba(74, 222, 128, 0.2)",
    "tagText": "#bbf7d0",
    "shadow": "0 16px 40px -8px rgba(32, 73, 55, 0.6)"
  },
  {
    "id": "card-med-royal-plum",
    "category": "medium",
    "name": "هەڵوژەیی ئەرغەوانی مامناوەند",
    "hex": "#74274c",
    "bg": "linear-gradient(160deg, rgba(116, 39, 76, 0.95) 0%, rgba(87, 28, 56, 0.98) 100%)",
    "border": "rgba(244, 114, 182, 0.4)",
    "titleColor": "#ffffff",
    "textColor": "#fdf2f8",
    "accentColor": "#f472b6",
    "iconBg": "rgba(244, 114, 182, 0.25)",
    "tagBg": "rgba(244, 114, 182, 0.2)",
    "tagText": "#fbcfe8",
    "shadow": "0 16px 40px -8px rgba(87, 28, 56, 0.6)"
  },
  {
    "id": "card-med-denim-steel",
    "category": "medium",
    "name": "شینی دەنیزی پۆڵایی",
    "hex": "#2b3f5c",
    "bg": "linear-gradient(160deg, rgba(43, 63, 92, 0.95) 0%, rgba(31, 46, 68, 0.98) 100%)",
    "border": "rgba(147, 197, 253, 0.4)",
    "titleColor": "#ffffff",
    "textColor": "#eff6ff",
    "accentColor": "#60a5fa",
    "iconBg": "rgba(96, 165, 250, 0.25)",
    "tagBg": "rgba(96, 165, 250, 0.2)",
    "tagText": "#bfdbfe",
    "shadow": "0 16px 40px -8px rgba(31, 46, 68, 0.6)"
  },
  {
    "id": "card-med-autumn-rust",
    "category": "medium",
    "name": "پاییزەی ئاگرین مامناوەند",
    "hex": "#87391c",
    "bg": "linear-gradient(160deg, rgba(135, 57, 28, 0.95) 0%, rgba(102, 42, 20, 0.98) 100%)",
    "border": "rgba(251, 146, 60, 0.4)",
    "titleColor": "#ffffff",
    "textColor": "#fff7ed",
    "accentColor": "#fb923c",
    "iconBg": "rgba(251, 146, 60, 0.25)",
    "tagBg": "rgba(251, 146, 60, 0.2)",
    "tagText": "#fed7aa",
    "shadow": "0 16px 40px -8px rgba(102, 42, 20, 0.6)"
  },
  {
    "id": "card-med-olive-vintage",
    "category": "medium",
    "name": "زەیتوونی کلاسیک مامناوەند",
    "hex": "#475b27",
    "bg": "linear-gradient(160deg, rgba(71, 91, 39, 0.95) 0%, rgba(53, 68, 28, 0.98) 100%)",
    "border": "rgba(190, 242, 100, 0.4)",
    "titleColor": "#ffffff",
    "textColor": "#f7fee7",
    "accentColor": "#a3e635",
    "iconBg": "rgba(163, 230, 53, 0.25)",
    "tagBg": "rgba(163, 230, 53, 0.2)",
    "tagText": "#d9f99d",
    "shadow": "0 16px 40px -8px rgba(53, 68, 28, 0.6)"
  },
  {
    "id": "card-med-ruby-sunset",
    "category": "medium",
    "name": "یاقووتی خۆرئاوابوون",
    "hex": "#7e1d35",
    "bg": "linear-gradient(160deg, rgba(126, 29, 53, 0.95) 0%, rgba(94, 21, 39, 0.98) 100%)",
    "border": "rgba(251, 113, 133, 0.4)",
    "titleColor": "#ffffff",
    "textColor": "#fff1f2",
    "accentColor": "#fb7185",
    "iconBg": "rgba(251, 113, 133, 0.25)",
    "tagBg": "rgba(251, 113, 133, 0.2)",
    "tagText": "#fecdd3",
    "shadow": "0 16px 40px -8px rgba(94, 21, 39, 0.6)"
  },
  {
    "id": "card-med-deep-teal",
    "category": "medium",
    "name": "کەحلی هاوسەنگ",
    "hex": "#145c63",
    "bg": "linear-gradient(160deg, rgba(20, 92, 99, 0.95) 0%, rgba(14, 69, 74, 0.98) 100%)",
    "border": "rgba(94, 234, 212, 0.4)",
    "titleColor": "#ffffff",
    "textColor": "#f0fdfa",
    "accentColor": "#2dd4bf",
    "iconBg": "rgba(45, 212, 191, 0.25)",
    "tagBg": "rgba(45, 212, 191, 0.2)",
    "tagText": "#99f6e4",
    "shadow": "0 16px 40px -8px rgba(14, 69, 74, 0.6)"
  },
  {
    "id": "card-med-amber-gold",
    "category": "medium",
    "name": "زێڕینی باوقار مامناوەند",
    "hex": "#825a17",
    "bg": "linear-gradient(160deg, rgba(130, 90, 23, 0.95) 0%, rgba(97, 67, 16, 0.98) 100%)",
    "border": "rgba(253, 224, 71, 0.4)",
    "titleColor": "#ffffff",
    "textColor": "#fefce8",
    "accentColor": "#facc15",
    "iconBg": "rgba(250, 204, 21, 0.25)",
    "tagBg": "rgba(250, 204, 21, 0.2)",
    "tagText": "#fef08a",
    "shadow": "0 16px 40px -8px rgba(97, 67, 16, 0.6)"
  },
  {
    "id": "card-med-antique-copper",
    "category": "medium",
    "name": "مسینی کەڤنار مامناوەند",
    "hex": "#7c3b28",
    "bg": "linear-gradient(160deg, rgba(124, 59, 40, 0.95) 0%, rgba(93, 44, 29, 0.98) 100%)",
    "border": "rgba(251, 146, 60, 0.4)",
    "titleColor": "#ffffff",
    "textColor": "#fff7ed",
    "accentColor": "#fb923c",
    "iconBg": "rgba(251, 146, 60, 0.25)",
    "tagBg": "rgba(251, 146, 60, 0.2)",
    "tagText": "#fed7aa",
    "shadow": "0 16px 40px -8px rgba(93, 44, 29, 0.6)"
  },
  {
    "id": "card-snow-white",
    "category": "light",
    "name": "بەفری پاک (Snow White)",
    "hex": "#ffffff",
    "bg": "rgba(255, 255, 255, 0.97)",
    "border": "rgba(0, 0, 0, 0.1)",
    "titleColor": "#0f172a",
    "textColor": "#334155",
    "accentColor": "#0284c7",
    "iconBg": "rgba(2, 132, 199, 0.14)",
    "tagBg": "rgba(2, 132, 199, 0.12)",
    "tagText": "#0369a1",
    "shadow": "0 12px 32px -8px rgba(0, 0, 0, 0.08)"
  },
  {
    "id": "card-royal-ivory",
    "category": "light",
    "name": "عاجی شاهانە (Royal Ivory)",
    "hex": "#faf7f0",
    "bg": "rgba(250, 247, 240, 0.97)",
    "border": "rgba(180, 83, 9, 0.16)",
    "titleColor": "#1c1917",
    "textColor": "#44403c",
    "accentColor": "#b45309",
    "iconBg": "rgba(180, 83, 9, 0.14)",
    "tagBg": "rgba(180, 83, 9, 0.12)",
    "tagText": "#92400e",
    "shadow": "0 12px 32px -8px rgba(180, 83, 9, 0.08)"
  },
  {
    "id": "card-rose-mist",
    "category": "light",
    "name": "تەمەگوڵی کاڵ (Rose Mist)",
    "hex": "#fff1f2",
    "bg": "rgba(255, 241, 242, 0.97)",
    "border": "rgba(244, 63, 94, 0.18)",
    "titleColor": "#881337",
    "textColor": "#9f1239",
    "accentColor": "#e11d48",
    "iconBg": "rgba(244, 63, 94, 0.14)",
    "tagBg": "rgba(244, 63, 94, 0.12)",
    "tagText": "#be123c",
    "shadow": "0 12px 32px -8px rgba(244, 63, 94, 0.08)"
  },
  {
    "id": "card-azure-cloud",
    "category": "light",
    "name": "هەوری شینباو (Azure Cloud)",
    "hex": "#f0f9ff",
    "bg": "rgba(240, 249, 255, 0.97)",
    "border": "rgba(14, 165, 233, 0.18)",
    "titleColor": "#0c4a6e",
    "textColor": "#0369a1",
    "accentColor": "#0284c7",
    "iconBg": "rgba(14, 165, 233, 0.14)",
    "tagBg": "rgba(14, 165, 233, 0.12)",
    "tagText": "#0284c7",
    "shadow": "0 12px 32px -8px rgba(14, 165, 233, 0.08)"
  },
  {
    "id": "card-mint-frost",
    "category": "light",
    "name": "نەعنای کاڵ (Mint Frost)",
    "hex": "#f0fdf4",
    "bg": "rgba(240, 253, 244, 0.97)",
    "border": "rgba(16, 185, 129, 0.18)",
    "titleColor": "#064e3b",
    "textColor": "#065f46",
    "accentColor": "#059669",
    "iconBg": "rgba(16, 185, 129, 0.14)",
    "tagBg": "rgba(16, 185, 129, 0.12)",
    "tagText": "#047857",
    "shadow": "0 12px 32px -8px rgba(16, 185, 129, 0.08)"
  },
  {
    "id": "card-warm-sand",
    "category": "light",
    "name": "خیز و بیابان (Warm Sand)",
    "hex": "#e8d8c3",
    "bg": "linear-gradient(165deg, rgba(239, 227, 209, 0.98) 0%, rgba(228, 212, 189, 0.97) 100%)",
    "border": "rgba(156, 120, 78, 0.30)",
    "titleColor": "#361c0c",
    "textColor": "#54371f",
    "descColor": "#54371f",
    "accentColor": "#9a5113",
    "iconBg": "rgba(160, 120, 70, 0.18)",
    "tagBg": "rgba(160, 120, 70, 0.15)",
    "tagText": "#7a3e0b",
    "shadow": "0 16px 38px -10px rgba(50, 35, 20, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.55)"
  },
  {
    "id": "card-lavender-mist",
    "category": "light",
    "name": "لاڤێندەری کاڵ (Lavender)",
    "hex": "#faf5ff",
    "bg": "rgba(250, 245, 255, 0.97)",
    "border": "rgba(168, 85, 247, 0.18)",
    "titleColor": "#581c87",
    "textColor": "#6b21a8",
    "accentColor": "#9333ea",
    "iconBg": "rgba(168, 85, 247, 0.14)",
    "tagBg": "rgba(168, 85, 247, 0.12)",
    "tagText": "#7e22ce",
    "shadow": "0 12px 32px -8px rgba(168, 85, 247, 0.08)"
  },
  {
    "id": "card-golden-candle",
    "category": "light",
    "name": "شامپانی و مۆمی زێڕین",
    "hex": "#fefce8",
    "bg": "rgba(254, 252, 232, 0.97)",
    "border": "rgba(234, 179, 8, 0.22)",
    "titleColor": "#713f12",
    "textColor": "#854d0e",
    "accentColor": "#ca8a04",
    "iconBg": "rgba(234, 179, 8, 0.14)",
    "tagBg": "rgba(234, 179, 8, 0.12)",
    "tagText": "#a16207",
    "shadow": "0 12px 32px -8px rgba(234, 179, 8, 0.08)"
  },
  {
    "id": "card-antique-paper",
    "category": "light",
    "name": "کاغەزی کەڤنار (Parchment)",
    "hex": "#f6f0e4",
    "bg": "rgba(246, 240, 228, 0.97)",
    "border": "rgba(120, 53, 15, 0.18)",
    "titleColor": "#292524",
    "textColor": "#57534e",
    "accentColor": "#b45309",
    "iconBg": "rgba(120, 53, 15, 0.14)",
    "tagBg": "rgba(120, 53, 15, 0.12)",
    "tagText": "#92400e",
    "shadow": "0 12px 32px -8px rgba(120, 53, 15, 0.08)"
  },
  {
    "id": "card-pearl-slate",
    "category": "light",
    "name": "مرواری پۆڵایی کاڵ",
    "hex": "#f8fafc",
    "bg": "rgba(248, 250, 252, 0.97)",
    "border": "rgba(100, 116, 139, 0.18)",
    "titleColor": "#0f172a",
    "textColor": "#334155",
    "accentColor": "#0284c7",
    "iconBg": "rgba(100, 116, 139, 0.14)",
    "tagBg": "rgba(100, 116, 139, 0.12)",
    "tagText": "#475569",
    "shadow": "0 12px 32px -8px rgba(100, 116, 139, 0.08)"
  },
  {
    "id": "card-sage-tea",
    "category": "light",
    "name": "سەوزی زەیتوونی کاڵ",
    "hex": "#f3f6f3",
    "bg": "rgba(243, 246, 243, 0.97)",
    "border": "rgba(74, 120, 74, 0.2)",
    "titleColor": "#1e3a1e",
    "textColor": "#2d4d2d",
    "accentColor": "#16a34a",
    "iconBg": "rgba(74, 120, 74, 0.14)",
    "tagBg": "rgba(74, 120, 74, 0.12)",
    "tagText": "#2d4d2d",
    "shadow": "0 12px 32px -8px rgba(74, 120, 74, 0.08)"
  },
  {
    "id": "card-latte-cream",
    "category": "light",
    "name": "شیر و قاوەی کاڵ (Latte)",
    "hex": "#f4ede4",
    "bg": "rgba(244, 237, 228, 0.97)",
    "border": "rgba(109, 76, 65, 0.18)",
    "titleColor": "#3e2723",
    "textColor": "#5d4037",
    "accentColor": "#8d6e63",
    "iconBg": "rgba(109, 76, 65, 0.14)",
    "tagBg": "rgba(109, 76, 65, 0.12)",
    "tagText": "#6d4c41",
    "shadow": "0 12px 32px -8px rgba(109, 76, 65, 0.08)"
  },
  {
    "id": "card-soft-peach",
    "category": "light",
    "name": "قۆخی ناسک و کاڵ",
    "hex": "#fff7ed",
    "bg": "rgba(255, 247, 237, 0.97)",
    "border": "rgba(249, 115, 22, 0.18)",
    "titleColor": "#7c2d12",
    "textColor": "#9a3412",
    "accentColor": "#ea580c",
    "iconBg": "rgba(249, 115, 22, 0.14)",
    "tagBg": "rgba(249, 115, 22, 0.12)",
    "tagText": "#c2410c",
    "shadow": "0 12px 32px -8px rgba(249, 115, 22, 0.08)"
  },
  {
    "id": "card-cotton-white",
    "category": "light",
    "name": "پەمۆی پاکی بەیانیان",
    "hex": "#f9fafb",
    "bg": "rgba(249, 250, 251, 0.97)",
    "border": "rgba(107, 114, 128, 0.18)",
    "titleColor": "#111827",
    "textColor": "#374151",
    "accentColor": "#4b5563",
    "iconBg": "rgba(107, 114, 128, 0.14)",
    "tagBg": "rgba(107, 114, 128, 0.12)",
    "tagText": "#4b5563",
    "shadow": "0 12px 32px -8px rgba(0, 0, 0, 0.08)"
  },
  {
    "id": "card-morning-sunbeam",
    "category": "light",
    "name": "تیشکی کاڵی بەیانی",
    "hex": "#fefce8",
    "bg": "rgba(254, 252, 232, 0.97)",
    "border": "rgba(202, 138, 4, 0.18)",
    "titleColor": "#713f12",
    "textColor": "#854d0e",
    "accentColor": "#ca8a04",
    "iconBg": "rgba(202, 138, 4, 0.14)",
    "tagBg": "rgba(202, 138, 4, 0.12)",
    "tagText": "#a16207",
    "shadow": "0 12px 32px -8px rgba(202, 138, 4, 0.08)"
  }
];

const LANDING_DUO_PALETTES = [
  {
    "id": "duo-cinema-teal-amber",
    "name": "کەحلی سینەمایی و زێڕین",
    "desc": "تەنسیقی جیهانی هۆڵیوود (Teal & Orange)",
    "bgId": "bg-ocean-teal-dark",
    "cardId": "card-med-amber-gold",
    "bgHex": "#062226",
    "cardHex": "#825a17",
    "bgName": "کەحلی ئۆقیانووسی تاریک",
    "cardName": "زێڕینی باوقار",
    "revBgId": "golden-amber-light",
    "revCardId": "card-ocean-teal",
    "revBgHex": "#825a17",
    "revCardHex": "#062226"
  },
  {
    "id": "duo-royal-navy-gold",
    "name": "شینی شاهانە و ئاڵتوونی",
    "desc": "تەنسیقی دەسەڵاتداری بەریتانی و ئۆکسفۆرد",
    "bgId": "bg-midnight-navy",
    "cardId": "card-med-amber-gold",
    "bgHex": "#07152b",
    "cardHex": "#825a17",
    "bgName": "شینی نیوەشەو (Navy)",
    "cardName": "ئاڵتوونی شاهانە",
    "revBgId": "royal-indigo-light",
    "revCardId": "card-midnight-navy",
    "revBgHex": "#825a17",
    "revCardHex": "#07152b"
  },
  {
    "id": "duo-british-racing-green",
    "name": "سەوزی بەریتانی و کارامێل",
    "desc": "تەنسیقی لۆکسی بێنتلی و ڕۆڵکس",
    "bgId": "bg-forest-pine-dark",
    "cardId": "card-med-caramel-bronze",
    "bgHex": "#0d2218",
    "cardHex": "#7c4d1d",
    "bgName": "سەوزی دارستانی قووڵ",
    "cardName": "کارامێلی برۆنزی",
    "revBgId": "spring-lemon-light",
    "revCardId": "card-mystic-pine",
    "revBgHex": "#7c4d1d",
    "revCardHex": "#0d2218"
  },
  {
    "id": "duo-charcoal-cyan",
    "name": "خەڵووزی فۆلادی و شینی سەیان",
    "desc": "تەنسیقی مۆدێرنی ئەپڵ و تەکنەلۆژیا",
    "bgId": "bg-charcoal-steel-dark",
    "cardId": "card-med-turquoise",
    "bgHex": "#11151c",
    "cardHex": "#165b6e",
    "bgName": "خەڵووزی فۆلادی مۆدێرن",
    "cardName": "شینی فیروزەیی کارەبایی",
    "revBgId": "glacial-ice",
    "revCardId": "card-carbon-graphite",
    "revBgHex": "#165b6e",
    "revCardHex": "#11151c"
  },
  {
    "id": "duo-wine-dusty-rose",
    "name": "یاقووتی شەرابی و گوڵباخی",
    "desc": "تەنسیقی فاشیۆنی فەڕەنسی و شانێل",
    "bgId": "bg-crimson-ruby-dark",
    "cardId": "card-med-ruby-sunset",
    "bgHex": "#260b16",
    "cardHex": "#7e1d35",
    "bgName": "یاقووتی ئەندەلوسی قووڵ",
    "cardName": "یاقووتی خۆرئاوابوون",
    "revBgId": "rose-blush-light",
    "revCardId": "card-crimson-ruby",
    "revBgHex": "#7e1d35",
    "revCardHex": "#260b16"
  },
  {
    "id": "duo-espresso-caramel",
    "name": "قاوەیی چکلێتی و کارامێل",
    "desc": "گەرمی و لوکسی کافێ کلاسیکەکان",
    "bgId": "bg-espresso-mocha-dark",
    "cardId": "card-med-rich-mocha",
    "bgHex": "#1c1109",
    "cardHex": "#5c3924",
    "bgName": "قاوەیی چکلێتی تاریک",
    "cardName": "قاوەیی مۆکای دەوڵەمەند",
    "revBgId": "antique-parchment-light",
    "revCardId": "card-espresso-wood",
    "revBgHex": "#5c3924",
    "revCardHex": "#1c1109"
  },
  {
    "id": "duo-violet-amethyst",
    "name": "مۆری مەخمەڵی و وەنەوشەیی",
    "desc": "شکۆداری و کەشوهەوای ئەفسوناوی",
    "bgId": "bg-royal-violet-dark",
    "cardId": "card-med-amethyst",
    "bgHex": "#1e0c30",
    "cardHex": "#53297a",
    "bgName": "مۆری مەخمەڵی تاریک",
    "cardName": "وەنەوشەیی کریستاڵ",
    "revBgId": "lavender-light",
    "revCardId": "card-velvet-purple",
    "revBgHex": "#53297a",
    "revCardHex": "#1e0c30"
  },
  {
    "id": "duo-deep-forest-sage",
    "name": "دارستانی قووڵ و سەوزی سەیوان",
    "desc": "ئارامی دارستان و سروشتی زیندەوەر",
    "bgId": "bg-deep-forest-moss",
    "cardId": "card-med-forest-sage",
    "bgHex": "#0a1d13",
    "cardHex": "#2d624a",
    "bgName": "قەوزەی دارستانی تۆخ",
    "cardName": "سەوزی سەیوان هاوسەنگ",
    "revBgId": "sufi-sage",
    "revCardId": "card-forest-olive",
    "revBgHex": "#2d624a",
    "revCardHex": "#0a1d13"
  },
  {
    "id": "duo-persian-cobalt-saffron",
    "name": "کۆباڵتی ئیسفەهان و زەعفەرانی",
    "desc": "کاشی شین و نەخشی زێڕینی مێژوویی",
    "bgId": "bg-med-persian-cobalt",
    "cardId": "card-med-amber-gold",
    "bgHex": "#1f487e",
    "cardHex": "#825a17",
    "bgName": "کۆباڵتی ئاسمانی فارسی",
    "cardName": "زەعفەرانی زێڕین",
    "revBgId": "sky-blue",
    "revCardId": "card-med-ocean-blue",
    "revBgHex": "#825a17",
    "revCardHex": "#1f487e"
  },
  {
    "id": "duo-terracotta-emerald",
    "name": "خاکی گڵین و سەوزی تۆسکان",
    "desc": "تەنسیقی زەوی و باخچەکانی ئیتاڵیا",
    "bgId": "bg-med-terracotta-clay",
    "cardId": "card-med-emerald",
    "bgHex": "#843d22",
    "cardHex": "#1a5c43",
    "bgName": "خاکی ئاڵتوونی تێراکۆتا",
    "cardName": "زمڕووتی هاوسەنگ",
    "revBgId": "terracotta-sand-light",
    "revCardId": "card-med-autumn-rust",
    "revBgHex": "#1a5c43",
    "revCardHex": "#843d22"
  },
  {
    "id": "duo-alaqsa-gold-blue",
    "name": "زێڕینی قودس و شینی کاشی",
    "desc": "شکۆی قوبەی زێڕین و شینی ئاسمانی پیرۆز",
    "bgId": "bg-imperial-sapphire-dark",
    "cardId": "card-med-amber-gold",
    "bgHex": "#091833",
    "cardHex": "#825a17",
    "bgName": "شینی ئاسمانی ساماڵ",
    "cardName": "زێڕینی قوبەی قودس",
    "revBgId": "golden-amber-light",
    "revCardId": "card-royal-sapphire",
    "revBgHex": "#825a17",
    "revCardHex": "#091833"
  },
  {
    "id": "duo-nabawi-green-marble",
    "name": "سەوزی نەبەوی و مەڕمەڕی سپی",
    "desc": "قوبەی سەوز و مەڕمەڕی سپی حەرەم",
    "bgId": "bg-sufi-emerald-dark",
    "cardId": "card-snow-white",
    "bgHex": "#04231b",
    "cardHex": "#ffffff",
    "bgName": "سەوزی قوبەی پێغەمبەرایەتی",
    "cardName": "مەڕمەڕی سپی بێگەرد",
    "revBgId": "pure-white-cream",
    "revCardId": "card-sufi-emerald",
    "revBgHex": "#ffffff",
    "revCardHex": "#04231b"
  },
  {
    "id": "duo-nordic-denim-arctic",
    "name": "دەنیزی پۆڵایی و شینی جەمسەری",
    "desc": "تەنسیقی هێمن و مۆدێرنی ئەسکەندەناڤی",
    "bgId": "bg-med-slate-denim",
    "cardId": "card-med-turquoise",
    "bgHex": "#334862",
    "cardHex": "#165b6e",
    "bgName": "شینی دەنیزی پۆڵایی",
    "cardName": "شینی فیروزەیی باکووری",
    "revBgId": "slate-mist-light",
    "revCardId": "card-med-denim-steel",
    "revBgHex": "#165b6e",
    "revCardHex": "#334862"
  },
  {
    "id": "duo-indigo-autumn-sunset",
    "name": "نیلی قووڵ و پاییزەی ئاگرین",
    "desc": "کۆنتراستی توندی نیلی و پرتەقاڵی گەرم",
    "bgId": "bg-midnight-indigo-dark",
    "cardId": "card-med-autumn-rust",
    "bgHex": "#0f143a",
    "cardHex": "#87391c",
    "bgName": "نیلی شەوانەی تاریک",
    "cardName": "پاییزەی ئاگرین و گەرم",
    "revBgId": "royal-indigo-light",
    "revCardId": "card-midnight-indigo",
    "revBgHex": "#87391c",
    "revCardHex": "#0f143a"
  },
  {
    "id": "duo-oled-neon-emerald",
    "name": "ڕەشی OLED و زمڕووتی نیۆن",
    "desc": "تاریکی تەواو لەگەڵ بریقەی زمڕووت",
    "bgId": "bg-pure-oled-dark",
    "cardId": "card-med-emerald",
    "bgHex": "#030508",
    "cardHex": "#1a5c43",
    "bgName": "تاریکی ڕەها (OLED Pure)",
    "cardName": "زمڕووتی درەوشاوە",
    "revBgId": "sufi-sage",
    "revCardId": "card-pure-oled",
    "revBgHex": "#1a5c43",
    "revCardHex": "#030508"
  },
  {
    "id": "duo-olive-vintage-copper",
    "name": "زەیتوونی کلاسیک و مسینی سوور",
    "desc": "تەنسیقی سروشتی زەوی و کانزای کەڤنار",
    "bgId": "bg-med-olive-harvest",
    "cardId": "card-med-antique-copper",
    "bgHex": "#475e2b",
    "cardHex": "#7c3b28",
    "bgName": "زەیتوونی باخی هاوسەنگ",
    "cardName": "مسینی کەڤناری شیک",
    "revBgId": "spring-lemon-light",
    "revCardId": "card-med-olive-vintage",
    "revBgHex": "#7c3b28",
    "revCardHex": "#475e2b"
  },
  {
    "id": "duo-plum-royal-velvet",
    "name": "شاتووی ڕەشباو و هەڵوژەیی",
    "desc": "تەنسیقی قووڵی خانەدانە کۆنەکان",
    "bgId": "bg-royal-violet-dark",
    "cardId": "card-med-royal-plum",
    "bgHex": "#1e0c30",
    "cardHex": "#74274c",
    "bgName": "مۆری مەخمەڵی تاریک",
    "cardName": "هەڵوژەیی ئەرغەوانی",
    "revBgId": "soft-plum-light",
    "revCardId": "card-velvet-purple",
    "revBgHex": "#74274c",
    "revCardHex": "#1e0c30"
  },
  {
    "id": "duo-mediterranean-teal-clay",
    "name": "کەحلی دەریا و گڵی تێراکۆتا",
    "desc": "تەنسیقی کەناراوەکانی دەریای ناوەڕاست",
    "bgId": "bg-med-mediterranean-teal",
    "cardId": "card-med-autumn-rust",
    "bgHex": "#165e64",
    "cardHex": "#87391c",
    "bgName": "کەحلی ناوەڕاست",
    "cardName": "خاکی ئاگرینی پاییزە",
    "revBgId": "ocean-mist",
    "revCardId": "card-med-deep-teal",
    "revBgHex": "#87391c",
    "revCardHex": "#165e64"
  },
  {
    "id": "duo-bauhaus-black-white",
    "name": "ڕەشی ماتی باوهاوس و سپی",
    "desc": "کۆنتراستی کلاسیکی دیزاینی سویسری",
    "bgId": "bg-obsidian-night",
    "cardId": "card-snow-white",
    "bgHex": "#0b1120",
    "cardHex": "#ffffff",
    "bgName": "ڕەشی ماتی ئەبەنووس",
    "cardName": "سپی بەفری تەواو",
    "revBgId": "pure-white-cream",
    "revCardId": "card-obsidian",
    "revBgHex": "#ffffff",
    "revCardHex": "#0b1120"
  },
  {
    "id": "duo-walnut-warm-bronze",
    "name": "داری گوێز و برۆنزی ئاڵتوونی",
    "desc": "تەنسیقی تەختە و چەرمی گرانبەها",
    "bgId": "bg-med-rich-walnut",
    "cardId": "card-med-caramel-bronze",
    "bgHex": "#5a3825",
    "cardHex": "#7c4d1d",
    "bgName": "داری گوێزی دەوڵەمەند",
    "cardName": "کارامێلی برۆنزی",
    "revBgId": "terracotta-sand-light",
    "revCardId": "card-med-rich-mocha",
    "revBgHex": "#7c4d1d",
    "revCardHex": "#5a3825"
  },
  {
    "id": "duo-ocean-abyss-teal",
    "name": "قووڵایی دەریا و فیروزەیی",
    "desc": "تەنسیقی قووڵایی زەریا و شەپۆلەکان",
    "bgId": "bg-ocean-teal-dark",
    "cardId": "card-med-deep-teal",
    "bgHex": "#062226",
    "cardHex": "#145c63",
    "bgName": "کەحلی ئۆقیانووسی تاریک",
    "cardName": "کەحلی هاوسەنگی شەپۆل",
    "revBgId": "lagoon-blue",
    "revCardId": "card-ocean-teal",
    "revBgHex": "#145c63",
    "revCardHex": "#062226"
  },
  {
    "id": "duo-sapphire-ruby-sunset",
    "name": "یاقووتی شین و خۆرئاوابوون",
    "desc": "کۆنتراستی ئاسمانی تاریک و تیشکی سوور",
    "bgId": "bg-imperial-sapphire-dark",
    "cardId": "card-med-ruby-sunset",
    "bgHex": "#091833",
    "cardHex": "#7e1d35",
    "bgName": "شینی ئیمپراتۆری ساماڵ",
    "cardName": "یاقووتی خۆرئاوابوون",
    "revBgId": "sky-blue",
    "revCardId": "card-royal-sapphire",
    "revBgHex": "#7e1d35",
    "revCardHex": "#091833"
  },
  {
    "id": "duo-majorelle-terracotta",
    "name": "شینی ماژۆڕێل و گڵی مەغریبی",
    "desc": "تەنسیقی باخچەی مێژوویی ئیڤ سان لۆران",
    "bgId": "bg-med-steel-indigo",
    "cardId": "card-med-autumn-rust",
    "bgHex": "#303b74",
    "cardHex": "#87391c",
    "bgName": "شینی ماژۆڕێلی نیلی",
    "cardName": "گڵی سووری مەغریبی",
    "revBgId": "royal-indigo-light",
    "revCardId": "card-med-denim-steel",
    "revBgHex": "#87391c",
    "revCardHex": "#303b74"
  },
  {
    "id": "duo-artdeco-amethyst-emerald",
    "name": "وەنەوشەیی شاهانە و زمڕووت",
    "desc": "تەنسیقی ئارت دێکۆی زێڕینگەری کۆن",
    "bgId": "bg-med-royal-amethyst",
    "cardId": "card-med-emerald",
    "bgHex": "#4d2b78",
    "cardHex": "#1a5c43",
    "bgName": "وەنەوشەیی شاهانە",
    "cardName": "زمڕووتی هاوسەنگ",
    "revBgId": "royal-violet-light",
    "revCardId": "card-med-amethyst",
    "revBgHex": "#1a5c43",
    "revCardHex": "#4d2b78"
  },
  {
    "id": "duo-dark-copper-bronze",
    "name": "مسینی تاریک و کارامێلی ئاڵتوونی",
    "desc": "درەوشانەوەی کانزاکان لە تاریکیدا",
    "bgId": "bg-dark-copper-night",
    "cardId": "card-med-caramel-bronze",
    "bgHex": "#24120b",
    "cardHex": "#7c4d1d",
    "bgName": "مسینی مەخمەڵی تاریک",
    "cardName": "کارامێلی برۆنزی هاوسەنگ",
    "revBgId": "terracotta-sand-light",
    "revCardId": "card-warm-bronze-dark",
    "revBgHex": "#7c4d1d",
    "revCardHex": "#24120b"
  },
  {
    "id": "duo-kurdish-highland-sage",
    "name": "سەوزی شاخاوی و دارستانی چڕ",
    "desc": "سەوزایی بەهاری شاخەکانی کوردستان",
    "bgId": "bg-med-kurdish-sage",
    "cardId": "card-mystic-pine",
    "bgHex": "#2a5e4b",
    "cardHex": "#0d2421",
    "bgName": "سەوزی شاخاوی مامناوەند",
    "cardName": "دارستانی پەنهان",
    "revBgId": "sufi-sage",
    "revCardId": "card-med-forest-sage",
    "revBgHex": "#0d2421",
    "revCardHex": "#2a5e4b"
  },
  {
    "id": "duo-graphite-steel-cyan",
    "name": "پۆڵایی گرافایت و فیروزەیی",
    "desc": "تەنسیقی پیشەسازی مۆدێرن و تیژ",
    "bgId": "bg-carbon-graphite-dark",
    "cardId": "card-med-turquoise",
    "bgHex": "#131823",
    "cardHex": "#165b6e",
    "bgName": "پۆڵایی گرافایتی تاریک",
    "cardName": "فیروزەیی هاوسەنگ",
    "revBgId": "slate-mist-light",
    "revCardId": "card-carbon-graphite",
    "revBgHex": "#165b6e",
    "revCardHex": "#131823"
  },
  {
    "id": "duo-grove-peacock-ocean",
    "name": "زمڕووتی باخ و شینی تاوس",
    "desc": "تەنسیقی پەڕی تاوس و بەهەشتی سەوز",
    "bgId": "bg-med-emerald-grove",
    "cardId": "card-med-ocean-blue",
    "bgHex": "#1f644e",
    "cardHex": "#1d5282",
    "bgName": "زمڕووتی باخی شاهانە",
    "cardName": "شینی ئۆقیانووسی هاوسەنگ",
    "revBgId": "sufi-sage",
    "revCardId": "card-med-emerald",
    "revBgHex": "#1d5282",
    "revCardHex": "#1f644e"
  },
  {
    "id": "duo-ochre-espresso",
    "name": "ئۆکرای پاییزە و قاوەیی چکلێت",
    "desc": "گەڵای وەریوی پاییز و کتێبخانە",
    "bgId": "bg-med-warm-ochre",
    "cardId": "card-espresso-wood",
    "bgHex": "#8a6520",
    "cardHex": "#24160c",
    "bgName": "ئۆکرای زێڕینی پاییزە",
    "cardName": "قاوەیی چکلێتی دار",
    "revBgId": "golden-amber-light",
    "revCardId": "card-med-amber-gold",
    "revBgHex": "#24160c",
    "revCardHex": "#8a6520"
  },
  {
    "id": "duo-islamic-emerald-parchment",
    "name": "سەوزی ئیسلامی و کاغەزی کەڤنار",
    "desc": "تەنسیقی کلاسیکی مەکتەبەی ئیسلامی",
    "bgId": "bg-forest-pine-dark",
    "cardId": "card-antique-paper",
    "bgHex": "#0d2218",
    "cardHex": "#f6f0e4",
    "bgName": "دارستانی کەڤنار",
    "cardName": "کاغەزی کەڤناری سێپیا",
    "revBgId": "antique-parchment-light",
    "revCardId": "card-mystic-pine",
    "revBgHex": "#f6f0e4",
    "revCardHex": "#0d2218"
  }
];

function applyLandingBgPaletteToDoc(colorId, doc) {
  doc = doc || document;
  var palette = LANDING_BG_PALETTES.find(function(p) { return p.id === colorId; }) || LANDING_BG_PALETTES[0];
  if (!palette) return;
  var styleTag = doc.getElementById('dynamicLandingBgStyle');
  if (!styleTag) {
    styleTag = doc.createElement('style');
    styleTag.id = 'dynamicLandingBgStyle';
    doc.head.appendChild(styleTag);
  }
  var isLight = palette.category === 'light';
  var css = 'html, body, body.in-landing, body.bg-dark, body.light-mode, body.light-theme {' +
    'background-color: ' + palette.hex + ' !important;' +
    'background: ' + palette.hex + ' !important;' +
    'background-image: ' + palette.gradient + ' !important;' +
    'background-attachment: fixed !important;' +
  '}' +
  '.landing-grid-pattern {' +
    'background-image: linear-gradient(to right, ' + palette.grid + ' 1px, transparent 1px), linear-gradient(to bottom, ' + palette.grid + ' 1px, transparent 1px) !important;' +
  '}' +
  '#dreamsHeader, .landing-navbar-premium {' +
    'background: ' + (isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(11, 17, 32, 0.92)') + ' !important;' +
    'backdrop-filter: blur(24px) saturate(180%) !important;' +
    '-webkit-backdrop-filter: blur(24px) saturate(180%) !important;' +
    'border-bottom: 1px solid ' + palette.cardBorder + ' !important;' +
    'box-shadow: 0 8px 30px -8px rgba(0, 0, 0, 0.15) !important;' +
  '}';
  styleTag.innerHTML = css;
}

function applyLandingCardPaletteToDoc(colorId, doc) {
  doc = doc || document;
  var palette = LANDING_CARD_PALETTES.find(function(p) { return p.id === colorId; }) || LANDING_CARD_PALETTES[0];
  if (!palette) return;
  var styleTag = doc.getElementById('dynamicLandingCardStyle');
  if (!styleTag) {
    styleTag = doc.createElement('style');
    styleTag.id = 'dynamicLandingCardStyle';
    doc.head.appendChild(styleTag);
  }
  var css = '.glass-card, .hero-compact-card, .landing-hero-stage, .landing-ann-card, .landing-pillar-card, .fb-post-card, .reaction-bar, .dream-voice-player, .modal-content, #dreamsGatewaySection .glass-card, #dreamsGatewaySection .landing-dreams-banner, #landingFeaturedDualSection button, #landingFeaturedDualSection a, .landing-feature-tab, .classroom-lobby-card, #membersSidebar, #classroomMembersSidebar {' +
    'background: ' + palette.bg + ' !important;' +
    'border: 1px solid ' + palette.border + ' !important;' +
    'box-shadow: ' + palette.shadow + ' !important;' +
    'color: ' + palette.textColor + ' !important;' +
  '}' +
  '.fb-post-card { border-color: ' + palette.border + ' !important; }' +
  '.fb-post-title, .landing-pillar-title, #heroTitle, #dreamsPageTitle, .landing-ann-card h4, #dreamGatewayTitle, #sectionsHeaderTitle, #postsHeaderTitle, .classroom-lobby-card h3, #membersSidebar h3, #drawerUserName { color: ' + palette.titleColor + ' !important; }' +
  '#heroSubtitle, .landing-hero-subtitle, #dreamsPageSubtitle, #dreamGatewayDesc, #sectionsHeaderSubtitle, #postsHeaderSubtitle, .classroom-lobby-card p, #classroomsLobbyView p { color: ' + (palette.descColor || palette.textColor) + ' !important; }' +
  '.landing-navbar-premium, #dreamsHeader, #poemsHeader, #articlesHeader, #mainApp > header { background: rgba(236, 222, 202, 0.95) !important; border-bottom: 1px solid ' + palette.border + ' !important; }' +
  '#btnDialectDropdown.landing-dialect-pill, #btnDialectDropdown, #btnBackToHome { background: rgba(222, 204, 180, 0.95) !important; border-color: rgba(160, 120, 70, 0.38) !important; color: #381e0a !important; }' +
  '.landing-brand-word, .logo-text-animated, .brand-title { color: #361c0c !important; background: transparent !important; background-image: none !important; -webkit-background-clip: unset !important; background-clip: unset !important; -webkit-text-fill-color: #361c0c !important; filter: none !important; text-shadow: none !important; } .brand-title { color: #361c0c !important; background: none !important; -webkit-background-clip: unset !important; -webkit-text-fill-color: #361c0c !important; filter: none !important; }' +
  '#dreamsGatewaySection #dreamGatewayTitle { color: ' + palette.titleColor + ' !important; }' +
  '#dreamsGatewaySection #dreamGatewayDesc { color: ' + (palette.descColor || palette.textColor) + ' !important; }' +
  '#dreamsGatewaySection .landing-dreams-badge { background: rgba(160, 120, 70, 0.15) !important; border: 1px solid rgba(160, 120, 70, 0.3) !important; color: #85430e !important; }' +
  '#dreamsGatewaySection .landing-dreams-orb { background: rgba(160, 120, 70, 0.15) !important; border: 1px solid rgba(160, 120, 70, 0.3) !important; }' +
  '.fb-post-text { color: ' + palette.textColor + ' !important; }' +'#landingFeaturedDualSection h3 { color: ' + palette.titleColor + ' !important; }' +'#landingFeaturedDualSection p { color: ' + (palette.descColor || palette.textColor) + ' !important; }' +'#landingFeaturedDualSection span[class*="rounded-xl"], #landingFeaturedDualSection div[class*="rounded-xl"] { background: rgba(217, 119, 6, 0.15) !important; border: 1px solid rgba(180, 83, 9, 0.35) !important; color: #78350f !important; font-weight: 800 !important; }' +'#mainApp, #classroomsLobbyView, #chatView { background-color: #86b89c !important; }' +'#classroomsLobbyView { background: transparent !important; }' +'#membersListContainer > div { background: rgba(247, 240, 228, 0.95) !important; border: 1px solid rgba(156, 120, 78, 0.22) !important; color: #361c0c !important; }' +'#membersListContainer > div .font-bold, #membersListContainer > div .font-black { color: #361c0c !important; }' +'#classroomsSearchInput, #membersSearchInput { background: #fbf7f0 !important; border: 1px solid rgba(156, 120, 78, 0.35) !important; color: #361c0c !important; }';
  styleTag.innerHTML = css;
}

function applyActiveSavedTheme(doc) {
  doc = doc || document;
  try {
    localStorage.removeItem('ferga_landing_duo_color');
    localStorage.removeItem('ferga_landing_duo_mode');
    localStorage.setItem('ferga_landing_bg_color', 'sufi-sage');
    localStorage.setItem('ferga_landing_card_color', 'card-warm-sand');
    localStorage.setItem('seereen_theme', 'light');
    localStorage.setItem('ferga_light_mode', '1');
  } catch(e) {}
  applyLandingBgPaletteToDoc('sufi-sage', doc);
  applyLandingCardPaletteToDoc('card-warm-sand', doc);
}

if (typeof document !== 'undefined') {
  try { applyActiveSavedTheme(document); } catch (e) {}
}
