/**
 * Ferga Academy Platform — Interpreted Dreams Dedicated Page
 * پەڕەی تایبەت بە خەونە لێکدراوەکان
 */

(() => {
  'use strict';

  // --- DIALECT TRANSLATIONS ---
  const DIALECTS = {
    sorani: {
      brand: 'فێرگە',
      backToHome: 'گەڕانەوە بۆ سەرەکی',
      dialectLabel: 'شێوەزار: سۆرانی',
      pageTitle: 'خەونە لێکدراوەکان',
      pageSubtitle: 'لێکدانەوەی نوێترین خەونەکان بە شێوازی زانستی و شەرعی لەلایەن معەبیرەوە.',
      expertBadge: 'تایبەت بە مامۆستایانی فێرگە',
      countSuffix: 'خەونی لێکدراوە',
      loadingText: 'بارکردنی خەونە لێکدراوەکان...',
      emptyText: 'هیچ خەونێکی لێکدراوە لە ئێستادا بەردەست نییە.',
      dreamLabelText: 'دەقی خەونەکە:',
      interpretationLabelText: 'تەئویل و لێکدانەوەی مامۆستا:',
      teacherRole: 'موعەبیر و مامۆستای فێرگە',
      teacherName: 'مامۆستای لێکدانەوە',
      timeYesterday: 'دوێنێ',
      timeToday: 'ئەمڕۆ',
      reactionLike: 'بەدڵمە',
      reactionDua: 'دوعا',
      reactionHeart: 'دڵ',
      btnShareText: 'هاوبەشکردن',
      adminAddBtn: 'بڵاوکردنەوەی خەون',
      linkCopied: 'لینکی پۆستەکە بە سەرکەوتوویی لەبەرگیرایەوە',
      deleteConfirm: 'دڵنیایت لە سڕینەوەی ئەم خەونە لێکدراوەیە؟',
      postPublished: 'خەونی لێکدراوە بە سەرکەوتوویی بڵاوکرایەوە',
      postDeleted: 'پۆستەکە بە سەرکەوتوویی سڕایەوە',
      toastSwitched: 'شێوەزار گۆڕدرا بۆ سۆرانی',
      footerBrand: 'پریاسکەی عەبدی',
      footerRights: 'سەرجەم مافەکان پارێزراون بۆ فێرگە © 2026'
    },
    kurmanji: {
      brand: 'فێرگە',
      backToHome: 'ڤەگەڕیان بۆ سەرەکی',
      dialectLabel: 'زاراڤە: کرمانجی',
      pageTitle: 'خەونێن هاتیە لێکدان',
      pageSubtitle: 'لێکدانا نووترین خەونان ب شێوازەکێ زانستی و شەرعی ژ لایێ معەبیریڤە.',
      expertBadge: 'تایبەت ب مامۆستایێن فێرگە',
      countSuffix: 'خەونێن هاتیە ماناکرن',
      loadingText: 'بارکرنا خەونێن هاتیە ماناکرن...',
      emptyText: 'چ خەونێن هاتیە ماناکرن د نوکەدا نینن.',
      dreamLabelText: 'دەقێ خەونێ:',
      interpretationLabelText: 'شروڤەکرن و مانا مامۆستایی:',
      teacherRole: 'شارەزایێ تەئویلا خەونا',
      teacherName: 'مامۆستایێ لێکدانێ',
      timeYesterday: 'دووهی',
      timeToday: 'ئەڤڕۆ',
      reactionLike: 'حەزژێکرن',
      reactionDua: 'دوعا',
      reactionHeart: 'دل',
      btnShareText: 'پارڤەکرن',
      adminAddBtn: 'بەلاڤکرنا خەونێ',
      linkCopied: 'لینکا پۆستێ ب سەرکەفتیانە هاتە کۆپیکرن',
      deleteConfirm: 'تۆ پشتڕاستی ژ ژێبرنا ڤێ پۆستێ؟',
      postPublished: 'خەونا ماناکری ب سەرکەفتیانە هاتە بەلاڤکرن',
      postDeleted: 'پۆست ب سەرکەفتیانە هاتە ژێبرن',
      toastSwitched: 'زاراڤە هاتە گوهۆڕین بۆ کرمانجی',
      footerBrand: 'پلاتفۆڕما فێرگە',
      footerRights: 'هەمی ماف پاراستینە ژ بۆ فێرگە © 2026'
    },
    hawrami: {
      brand: 'فێرگە',
      backToHome: 'ئەوەگێڵای پەڕەو سەرەکی',
      dialectLabel: 'شێواز: هەورامی',
      pageTitle: 'خەونێ ماناکریێ',
      pageSubtitle: 'ماناکەردەیو تازەتەرین خەونا بە شێوازی زانستی و شەرعی جەلایەن معەبیرەوە.',
      expertBadge: 'تایبەت بە مامۆستایاو فێرگەی',
      countSuffix: 'خەونێ مانا کریێ',
      loadingText: 'بارکەردەیو خەونە ماناکریەکا...',
      emptyText: 'هیچ خەونێوی ماناکریا ئیسە بەردەس نییا.',
      dreamLabelText: 'دەقو خەونەکەی:',
      interpretationLabelText: 'ماناکەردەو مامۆستای:',
      teacherRole: 'مامۆستاو ماناکەردەو خەونا',
      teacherName: 'مامۆستاو ماناکەردەی',
      timeYesterday: 'ڕێزەنێ',
      timeToday: 'ئارۆ',
      reactionLike: 'وەشم مێ',
      reactionDua: 'دوعا',
      reactionHeart: 'دڵ',
      btnShareText: 'بەش کەردەی',
      adminAddBtn: 'وەڵاوکەردەو خەونی',
      linkCopied: 'لینکو پۆستەکەی بە سەرکەوتوویی کۆپی بی',
      deleteConfirm: 'دڵنیای جە سڕیەیۆ ئی پۆستە؟',
      postPublished: 'خەونە ماناکریاکە بە سەرکەوتوویی وەڵاو بیۆ',
      postDeleted: 'پۆستەکە بە سەرکەوتوویی سڕیاوە',
      toastSwitched: 'شێواز فاڕیا پەی هەورامی',
      footerBrand: 'پلاتفۆڕمو فێرگەی',
      footerRights: 'گرڎوو مافەکا پارێزیانێ پەی فێرگەی © 2026'
    }
  };

  // --- STATE ---
  const state = {
    currentUser: null,
    currentDialect: localStorage.getItem('app_dialect') || 'sorani',
    currentTheme: localStorage.getItem('app_theme') || 'dark',
    cachedDreamPosts: [],
    clientId: localStorage.getItem('ferga_client_device_id') || ('client_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36)),
    soundEnabled: localStorage.getItem('app_sound_enabled') !== 'false',
    audioContext: null
  };
  localStorage.setItem('ferga_client_device_id', state.clientId);

  // Restore current user if logged in
  try {
    const storedUser = localStorage.getItem('ferga_user');
    if (storedUser) {
      state.currentUser = JSON.parse(storedUser);
    }
  } catch (e) {
    state.currentUser = null;
  }

  // Double check auth with token if user not loaded or needs verification
  const authToken = localStorage.getItem('ferga_token') || localStorage.getItem('seereen_token');
  if (authToken) {
    fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.user) {
        state.currentUser = data.user;
        try { localStorage.setItem('ferga_user', JSON.stringify(data.user)); } catch (e) {}
        updateDreamPublisherUI();
        renderDreamPosts(); // re-render with admin privileges if needed
      }
    })
    .catch(() => {});
  }

  // --- DOM ELEMENTS ---
  const el = {
    btnBackToHomeText: document.getElementById('btnBackToHomeText'),
    btnThemeToggle: document.getElementById('btnThemeToggle'),
    themeIconSun: document.getElementById('themeIconSun'),
    themeIconMoon: document.getElementById('themeIconMoon'),
    
    // Dialect
    dialectDropdownContainer: document.getElementById('dialectDropdownContainer'),
    btnDialectDropdown: document.getElementById('btnDialectDropdown'),
    dialectDropdownMenu: document.getElementById('dialectDropdownMenu'),
    currentDialectLabel: document.getElementById('currentDialectLabel'),

    // Page Elements
    dreamsPageTitle: document.getElementById('dreamsPageTitle'),
    dreamsPageSubtitle: document.getElementById('dreamsPageSubtitle'),
    dreamsCountBadge: document.getElementById('dreamsCountBadge'),
    dreamsCountText: document.getElementById('dreamsCountText'),
    dreamsExpertBadge: document.getElementById('dreamsExpertBadge'),
    dreamPostsFeed: document.getElementById('dreamPostsFeed'),
    footerBrandText: document.getElementById('footerBrandText'),
    footerRightsText: document.getElementById('footerRightsText'),

    // Admin
    adminDreamActionContainer: document.getElementById('adminDreamActionContainer'),
    btnOpenNewDreamModal: document.getElementById('btnOpenNewDreamModal'),
    modalNewDreamPost: document.getElementById('modalNewDreamPost'),
    btnCloseNewDreamModal: document.getElementById('btnCloseNewDreamModal'),
    btnCancelNewDream: document.getElementById('btnCancelNewDream'),
    formNewDreamPost: document.getElementById('formNewDreamPost'),
    dreamInputTitle: document.getElementById('dreamInputTitle'),
    dreamInputText: document.getElementById('dreamInputText'),
    dreamInputInterpretation: document.getElementById('dreamInputInterpretation'),
    dreamInputImage: document.getElementById('dreamInputImage'),
    toastContainer: document.getElementById('toastContainer'),

    // Edit Modal Elements
    modalEditDreamPost: document.getElementById('modalEditDreamPost'),
    btnCloseEditDreamModal: document.getElementById('btnCloseEditDreamModal'),
    btnCancelEditDream: document.getElementById('btnCancelEditDream'),
    formEditDreamPost: document.getElementById('formEditDreamPost'),
    editDreamPostId: document.getElementById('editDreamPostId'),
    editDreamInputTitle: document.getElementById('editDreamInputTitle'),
    editDreamInputText: document.getElementById('editDreamInputText'),
    editDreamInputInterpretation: document.getElementById('editDreamInputInterpretation'),
    editDreamInputImage: document.getElementById('editDreamInputImage')
  };

  // --- SOUND EFFECTS (Acoustic & Luxurious UI Feedback) ---
  function getAudioContext() {
    if (!state.audioContext) {
      state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (state.audioContext.state === 'suspended') {
      state.audioContext.resume();
    }
    return state.audioContext;
  }

  // Soft luxury haptic click for UI controls (theme toggle, dialect, share)
  function playSubtleClick() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  // Rich, harmonic, and elegant acoustic sound for each reaction type
  function playReactionSound(reactionType = 'like') {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Master output with warm analog-style lowpass filter to prevent digital harshness
      const masterFilter = ctx.createBiquadFilter();
      masterFilter.type = 'lowpass';
      masterFilter.frequency.setValueAtTime(2600, now);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.15, now);

      masterGain.connect(masterFilter);
      masterFilter.connect(ctx.destination);

      if (reactionType === 'heart') {
        // ❤️ Heart: Warm, rich Rhodes / Marimba chord bloom (F4 + C5 + A5)
        const notes = [
          { freq: 349.23, delay: 0, dur: 0.42, vol: 0.14 },
          { freq: 523.25, delay: 0.035, dur: 0.45, vol: 0.10 },
          { freq: 880.00, delay: 0.070, dur: 0.48, vol: 0.08 }
        ];

        notes.forEach(n => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(n.freq, now + n.delay);

          gain.gain.setValueAtTime(0.001, now + n.delay);
          gain.gain.linearRampToValueAtTime(n.vol, now + n.delay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + n.delay + n.dur);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + n.delay);
          osc.stop(now + n.delay + n.dur + 0.02);
        });

      } else if (reactionType === 'dua') {
        // 🤲 Dua: Tranquil, spiritual crystal singing bowl / bell harmonic (D#5 + A#5 + G6)
        const notes = [
          { freq: 622.25, delay: 0, dur: 0.55, vol: 0.12 },
          { freq: 932.33, delay: 0.015, dur: 0.60, vol: 0.09 },
          { freq: 1567.98, delay: 0.030, dur: 0.50, vol: 0.06 }
        ];

        notes.forEach(n => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(n.freq, now + n.delay);

          gain.gain.setValueAtTime(0.001, now + n.delay);
          gain.gain.linearRampToValueAtTime(n.vol, now + n.delay + 0.025);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + n.delay + n.dur);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + n.delay);
          osc.stop(now + n.delay + n.dur + 0.02);
        });

      } else {
        // 👍 Like: Crisp, crystalline Apple-style affirmative chime (E5 + B5 + G#6)
        const notes = [
          { freq: 659.25, delay: 0, dur: 0.35, vol: 0.13 },
          { freq: 987.77, delay: 0.025, dur: 0.38, vol: 0.10 },
          { freq: 1661.22, delay: 0.050, dur: 0.40, vol: 0.07 }
        ];

        notes.forEach(n => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(n.freq, now + n.delay);

          gain.gain.setValueAtTime(0.001, now + n.delay);
          gain.gain.linearRampToValueAtTime(n.vol, now + n.delay + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + n.delay + n.dur);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + n.delay);
          osc.stop(now + n.delay + n.dur + 0.02);
        });
      }
    } catch (e) {}
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = 'info') {
    if (!el.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast-item pointer-events-auto';

    let icon = 'fa-circle-info text-[#b45309]';
    if (type === 'success') icon = 'fa-circle-check text-[#2d6245]';
    if (type === 'error') icon = 'fa-circle-exclamation text-rose-700';

    toast.innerHTML = `
      <i class="fa-solid ${icon} text-sm"></i>
      <span class="text-xs font-bold text-[#361c0c]">${escapeHtml(message)}</span>
    `;

    el.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- THEME MANAGEMENT ---
  function applyTheme() {
    if (typeof applyActiveSavedTheme === 'function') {
      applyActiveSavedTheme();
    }
  }

  // --- DIALECT MANAGEMENT ---
  function applyDialect(dialectKey, showFeedback = false) {
    const d = DIALECTS[dialectKey] || DIALECTS.sorani;
    state.currentDialect = dialectKey;
    localStorage.setItem('app_dialect', dialectKey);

    if (el.currentDialectLabel) {
      el.currentDialectLabel.textContent = d.dialectLabel;
    }
    if (el.btnBackToHomeText) {
      el.btnBackToHomeText.textContent = d.backToHome;
    }
    if (el.dreamsPageTitle) {
      el.dreamsPageTitle.textContent = d.pageTitle;
    }
    if (el.dreamsPageSubtitle) {
      el.dreamsPageSubtitle.textContent = d.pageSubtitle;
    }
    if (el.dreamsExpertBadge) {
      el.dreamsExpertBadge.textContent = d.expertBadge;
    }
    if (el.footerBrandText) {
      el.footerBrandText.textContent = d.footerBrand;
    }
    if (el.footerRightsText) {
      el.footerRightsText.textContent = d.footerRights;
    }

    // Update active dropdown item
    document.querySelectorAll('.dialect-option').forEach(opt => {
      const isSelected = opt.getAttribute('data-dialect') === dialectKey;
      const checkIcon = opt.querySelector('.dialect-check');
      const dot = opt.querySelector('.dialect-dot');

      opt.classList.toggle('active', isSelected);

      if (checkIcon) {
        if (isSelected) checkIcon.classList.remove('hidden');
        else checkIcon.classList.add('hidden');
      }

      if (dot) {
        if (isSelected) dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-600 dialect-dot shadow-sm';
        else dot.className = 'w-2.5 h-2.5 rounded-full bg-transparent dialect-dot';
      }
    });

    // Re-render feed with the dialect translations
    renderDreamPosts();

    if (showFeedback) {
      showToast(d.toastSwitched, 'info');
      playSubtleClick();
    }
  }

  // --- LOAD DREAM POSTS ---
  async function loadDreamPosts() {
    try {
      const res = await fetch(`/api/dreams/posts?clientId=${encodeURIComponent(state.clientId)}`);
      const data = await res.json();
      const postsList = Array.isArray(data) ? data : (Array.isArray(data.posts) ? data.posts : []);
      state.cachedDreamPosts = postsList;
      renderDreamPosts();
    } catch (err) {
      console.error('Failed to load dream posts:', err);
      renderDreamPosts();
    }
  }

  // --- RENDER DREAM POSTS ---
  function renderDreamPosts() {
    if (!el.dreamPostsFeed) return;
    const posts = state.cachedDreamPosts || [];
    const d = DIALECTS[state.currentDialect] || DIALECTS.sorani;

    // Update counter badge
    if (el.dreamsCountText) {
      el.dreamsCountText.textContent = `${posts.length} ${d.countSuffix}`;
    }

    if (posts.length === 0) {
      el.dreamPostsFeed.innerHTML = `
        <div class="glass-card p-10 text-center text-[#54371f] space-y-3">
          <i class="fa-solid fa-moon text-3xl text-[#b45309]/70"></i>
          <p class="text-sm font-medium text-[#361c0c]">${d.emptyText}</p>
        </div>
      `;
      return;
    }

    el.dreamPostsFeed.innerHTML = posts.map(post => {
      const isAdmin = isDreamPublisher(state.currentUser);

      // Author Details
      const authorName = post.author_name || d.teacherName || 'مامۆستای لێکدانەوە';
      const authorBadge = post.author_badge || d.teacherRole || 'موعەبیر و مامۆستای فێرگە';

      // Text Content Layout
      let contentHtml = '';
      if (post.dream_text && post.interpretation && post.dream_text.trim() !== post.interpretation.trim()) {
        contentHtml = `
          <div class="px-4 sm:px-5 pb-3 space-y-3 text-xs sm:text-sm text-[#361c0c]">
            <div class="fb-post-dream-box bg-[#fbf7f0] border border-[#9c784e]/25 border-r-4 border-r-[#5f8f72] p-3.5 rounded-xl space-y-1">
              <div class="flex items-center gap-1.5 text-xs font-bold text-[#2d6245]">
                <i class="fa-solid fa-cloud-moon text-[#3d7a59]"></i>
                <span>${escapeHtml(d.dreamLabelText || 'دەقی خەونەکە:')}</span>
              </div>
              <p class="whitespace-pre-line leading-relaxed text-[#54371f]">${escapeHtml(post.dream_text)}</p>
            </div>
            <div class="fb-post-interpretation-box bg-[#fbf7f0] border border-[#9c784e]/25 border-r-4 border-r-amber-600 p-3.5 rounded-xl space-y-1">
              <div class="flex items-center gap-1.5 text-xs font-bold text-[#b45309]">
                <i class="fa-solid fa-wand-magic-sparkles text-[#b45309]"></i>
                <span>${escapeHtml(d.interpretationLabelText || 'تەئویل و لێکدانەوەی مامۆستا:')}</span>
              </div>
              <p class="whitespace-pre-line leading-relaxed text-[#361c0c]">${escapeHtml(post.interpretation)}</p>
            </div>
          </div>
        `;
      } else {
        const singleText = post.interpretation || post.dream_text || '';
        if (singleText) {
          contentHtml = `
            <div class="px-4 sm:px-5 pb-3 text-xs sm:text-sm text-[#361c0c]">
              <div class="fb-post-text-box bg-[#fbf7f0] border border-[#9c784e]/25 border-r-4 border-r-amber-600 p-3.5 rounded-xl space-y-1">
                <p class="whitespace-pre-line leading-relaxed text-[#361c0c] text-sm">${escapeHtml(singleText)}</p>
              </div>
            </div>
          `;
        }
      }

      // Audio / Voice Note Post
      let audioHtml = '';
      if (post.audio_url) {
        audioHtml = `
          <div class="px-3 sm:px-5 pb-3">
            <div class="dream-voice-player w-full max-w-xl mx-auto" data-audio-src="${escapeHtml(post.audio_url)}">
              <div class="voice-player-inner">
                <button type="button" class="voice-play-btn" aria-label="Play audio" title="لێدان / ڕاگرتن">
                  <i class="fa-solid fa-play text-sm"></i>
                </button>
                <div class="voice-track-col">
                  <div class="voice-waveform-container" title="پەنجە دابگرە یان ڕابکێشە بۆ پێش و دواوە">
                    <!-- Dynamic Waveform Bars -->
                  </div>
                  <div class="voice-bottom-meta">
                    <div class="voice-meta-left flex items-center gap-1.5 shrink-0">
                      <span class="voice-time-label font-mono">0:00</span>
                      <button type="button" class="voice-seek-btn" data-seek="-5" title="٥ چرکە بۆ دواوە ⏪">
                        <i class="fa-solid fa-rotate-left"></i>
                        <span>5s</span>
                      </button>
                      <button type="button" class="voice-seek-btn" data-seek="5" title="٥ چرکە بۆ پێشەوە ⏩">
                        <i class="fa-solid fa-rotate-right"></i>
                        <span>5s</span>
                      </button>
                    </div>
                    <div class="voice-meta-right flex items-center gap-1.5 shrink-0">
                      <span class="voice-tag-badge"><i class="fa-solid fa-microphone-lines"></i> تۆماری دەنگی</span>
                      <button type="button" class="voice-speed-pill" title="خێرایی دەنگ">1.0x</button>
                    </div>
                  </div>
                </div>
              </div>
              <audio preload="metadata" src="${escapeHtml(post.audio_url)}" class="voice-audio-element hidden"></audio>
            </div>
          </div>
        `;
      }

      // Video Post
      let videoHtml = '';
      if (post.video_url) {
        videoHtml = `
          <div class="px-4 sm:px-5 pb-3">
            <div class="relative rounded-2xl overflow-hidden bg-black/90 border border-amber-400/25 shadow-xl">
              <video 
                src="${escapeHtml(post.video_url)}" 
                controls 
                preload="metadata" 
                playsinline 
                class="w-full max-h-[460px] object-contain rounded-2xl"
              ></video>
            </div>
          </div>
        `;
      }

      // Image Post
      let imageHtml = '';
      if (post.image_url) {
        imageHtml = `
          <div class="fb-post-image-container relative overflow-hidden bg-[#efe3d1] border-y border-[#9c784e]/20">
            <img 
              src="${escapeHtml(post.image_url)}" 
              alt="${escapeHtml(post.title)}" 
              loading="lazy"
              class="w-full object-cover max-h-[380px] transition-transform duration-500"
              onerror="this.parentElement.style.display='none'"
            >
          </div>
        `;
      }

      return `
        <article class="fb-post-card" data-post-id="${post.id}">
          <!-- Post Header -->
          <div class="p-4 sm:p-5 pb-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <!-- Teacher Avatar with Gold Ring -->
              <div class="relative w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 shadow-sm shrink-0">
                <div class="w-full h-full rounded-full bg-[#fdf6ec] flex items-center justify-center overflow-hidden">
                  <i class="fa-solid fa-graduation-cap text-[#b45309] text-base"></i>
                </div>
              </div>
              <div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <h4 class="text-sm font-bold text-[#361c0c]">${escapeHtml(authorName)}</h4>
                  <i class="fa-solid fa-circle-check text-[#3d7a59] text-xs" title="هەژماری باوەڕپێکراو"></i>
                </div>
                <div class="flex items-center gap-1 text-[11px] text-[#785336] mt-0.5 font-latin">
                  <span>${escapeHtml(d.timeToday || 'ئەمڕۆ')}</span>
                  <span>•</span>
                  <i class="fa-solid fa-earth-americas text-[10px]"></i>
                </div>
              </div>
            </div>

            <!-- Actions (Admin Edit, Delete & Share) -->
            <div class="flex items-center gap-1.5 sm:gap-2">
              ${isAdmin ? `
                <button type="button" class="btn-edit-dream-post text-[#785336] hover:text-[#b45309] p-1.5 rounded-lg transition-colors cursor-pointer" title="دەستکاریکردنی نوسین یان وێنە" data-post-id="${post.id}">
                  <i class="fa-solid fa-pen-to-square text-xs"></i>
                </button>
                <button type="button" class="btn-delete-dream-post text-[#785336] hover:text-rose-700 p-1.5 rounded-lg transition-colors cursor-pointer" title="سڕینەوەی پۆست" data-post-id="${post.id}">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              ` : ''}
              <button type="button" class="btn-share-dream-header text-[#785336] hover:text-[#361c0c] p-1.5 rounded-lg transition-colors cursor-pointer" title="هاوبەشکردن" data-post-id="${post.id}" data-post-title="${escapeHtml(post.title)}">
                <i class="fa-solid fa-share-nodes text-xs"></i>
              </button>
            </div>
          </div>

          <!-- Post Title -->
          <div class="px-4 sm:px-5 pb-2">
            <h3 class="fb-post-title text-base sm:text-lg font-bold text-[#361c0c] leading-snug">
              ${escapeHtml(post.title)}
            </h3>
          </div>

          <!-- Post Content (Dream Text + Interpretation / Description) -->
          ${contentHtml}

          <!-- Post Audio (Voice Note) -->
          ${audioHtml}

          <!-- Post Video -->
          ${videoHtml}

          <!-- Post Image -->
          ${imageHtml}

          <!-- Clean Pill Actions: Heart, Dua, Like (Icon + Count) & Share -->
          <div class="px-4 sm:px-5 py-3 border-t border-[#9c784e]/25 flex items-center justify-between gap-2 flex-wrap text-xs">
            <div class="flex items-center gap-2 flex-wrap">
              <button 
                type="button" 
                class="dream-react-pill px-3.5 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-700 transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer shadow-sm group ${post.user_reaction === 'heart' ? 'ring-2 ring-rose-400/50 font-black' : 'font-bold'}"
                data-reaction="heart"
                data-post-id="${post.id}"
                title="${escapeHtml(d.reactionHeart || 'دڵ')}"
              >
                <i class="fa-solid fa-heart text-[12px] text-rose-600 group-hover:scale-125 transition-transform"></i>
                <span class="font-latin text-xs">${post.reactions_heart || 0}</span>
              </button>

              <button 
                type="button" 
                class="dream-react-pill px-3.5 py-1.5 rounded-full transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer shadow-sm group ${post.user_reaction === 'dua' ? 'bg-[#d7ebdf] border border-[#4a7c5e]/55 text-[#1e5237] ring-2 ring-[#5f8f72]/40 font-black' : 'bg-[#e8f3ec] hover:bg-[#d7ebdf] border border-[#5f8f72]/35 text-[#2d6245] font-bold'}"
                data-reaction="dua"
                data-post-id="${post.id}"
                title="${escapeHtml(d.reactionDua || 'دوعا')}"
              >
                <span class="text-[13px] leading-none group-hover:scale-125 transition-transform">🤲</span>
                <span class="font-latin text-xs">${post.reactions_dua || 0}</span>
              </button>

              <button 
                type="button" 
                class="dream-react-pill px-3.5 py-1.5 rounded-full transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer shadow-sm group ${post.user_reaction === 'like' ? 'bg-[#fae9cc] border border-amber-600/60 text-[#78350f] ring-2 ring-amber-500/40 font-black' : 'bg-[#fbf7f0] hover:bg-[#f2e4ce] border border-[#9c784e]/35 text-[#85430e] font-bold'}"
                data-reaction="like"
                data-post-id="${post.id}"
                title="${escapeHtml(d.reactionLike || 'بەدڵمە')}"
              >
                <i class="fa-solid fa-thumbs-up text-[12px] text-[#b45309] group-hover:scale-125 transition-transform"></i>
                <span class="font-latin text-xs">${post.reactions_like || 0}</span>
              </button>
            </div>

            <button 
              type="button" 
              class="btn-share-post px-3.5 py-1.5 rounded-full bg-[#e4d4bd]/85 hover:bg-[#d9c4a6] border border-[#9c784e]/30 text-[#361c0c] font-bold transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              data-post-id="${post.id}"
              data-post-title="${escapeHtml(post.title)}"
            >
              <i class="fa-solid fa-share-nodes text-[11px] text-[#b45309]"></i>
              <span>${escapeHtml(d.btnShareText || 'هاوبەشکردن')}</span>
            </button>
          </div>
        </article>
      `;
    }).join('');

    initDreamAudioPlayers();
  }

  // --- DREAM AUDIO PLAYERS INITIALIZATION & CONTROLS ---
  function initDreamAudioPlayers() {
    const players = document.querySelectorAll('.dream-voice-player');
    players.forEach(player => {
      if (player._audioInitialized) return;
      player._audioInitialized = true;

      const audio = player.querySelector('.voice-audio-element');
      const playBtn = player.querySelector('.voice-play-btn');
      const playIcon = playBtn ? playBtn.querySelector('i') : null;
      const waveContainer = player.querySelector('.voice-waveform-container');
      const timeLabel = player.querySelector('.voice-time-label');
      const speedPill = player.querySelector('.voice-speed-pill');

      if (!audio) return;

      // Generate 32 decorative waveform bars with natural audio-like heights
      const barHeights = [28, 42, 65, 80, 50, 35, 75, 90, 60, 45, 85, 100, 70, 40, 55, 75, 90, 65, 45, 80, 95, 70, 50, 35, 60, 85, 55, 40, 30, 45, 65, 35];
      if (waveContainer) {
        waveContainer.innerHTML = barHeights.map((h, i) => `
          <span class="voice-wave-bar" data-index="${i}" style="height: ${h}%; animation-delay: ${-(i * 0.08)}s"></span>
        `).join('');
      }

      const bars = waveContainer ? waveContainer.querySelectorAll('.voice-wave-bar') : [];

      const formatTime = (sec) => {
        if (!sec || isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
      };

      // Set initial duration
      audio.addEventListener('loadedmetadata', () => {
        if (timeLabel) timeLabel.textContent = `0:00 / ${formatTime(audio.duration)}`;
      });
      if (audio.duration && !isNaN(audio.duration)) {
        if (timeLabel) timeLabel.textContent = `0:00 / ${formatTime(audio.duration)}`;
      }

      // Play / Pause Toggle
      playBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audio.paused) {
          // Pause all other dream voice players
          document.querySelectorAll('.dream-voice-player audio').forEach(otherAudio => {
            if (otherAudio !== audio && !otherAudio.paused) {
              otherAudio.pause();
            }
          });
          audio.play().catch(e => console.warn('Audio play error:', e));
        } else {
          audio.pause();
        }
      });

      audio.addEventListener('play', () => {
        player.classList.add('is-playing');
        if (playIcon) {
          playIcon.className = 'fa-solid fa-pause text-sm';
        }
      });

      audio.addEventListener('pause', () => {
        player.classList.remove('is-playing');
        if (playIcon) {
          playIcon.className = 'fa-solid fa-play text-sm';
        }
      });

      audio.addEventListener('ended', () => {
        player.classList.remove('is-playing');
        if (playIcon) {
          playIcon.className = 'fa-solid fa-play text-sm';
        }
        audio.currentTime = 0;
        bars.forEach(b => b.classList.remove('played'));
        if (timeLabel) timeLabel.textContent = `0:00 / ${formatTime(audio.duration)}`;
      });

      // Update progress and bars UI
      const updateWaveformUI = () => {
        if (!audio.duration || isNaN(audio.duration)) return;
        const fraction = Math.max(0, Math.min(1, audio.currentTime / audio.duration));
        const playedCount = Math.floor(fraction * bars.length);
        bars.forEach((b, idx) => {
          if (idx <= playedCount) b.classList.add('played');
          else b.classList.remove('played');
        });
        if (timeLabel) {
          timeLabel.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        }
      };

      audio.addEventListener('timeupdate', updateWaveformUI);

      // Seek / scrub audio to exact position
      const seekAudioToPosition = (clientX) => {
        if (!audio.duration || isNaN(audio.duration)) return;
        const rect = waveContainer.getBoundingClientRect();
        if (rect.width <= 0) return;
        const isRtl = getComputedStyle(waveContainer).direction === 'rtl';
        const clickOffset = isRtl ? (rect.right - clientX) : (clientX - rect.left);
        const ratio = Math.max(0, Math.min(1, clickOffset / rect.width));
        audio.currentTime = ratio * audio.duration;
        updateWaveformUI();
      };

      // Interactive Pointer/Touch Scrubbing (پێش و پاش بردن بە پەنجە و ماوس)
      let isScrubbing = false;

      waveContainer?.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isScrubbing = true;
        waveContainer.classList.add('is-scrubbing');
        try { waveContainer.setPointerCapture(e.pointerId); } catch(err) {}
        seekAudioToPosition(e.clientX);
      });

      waveContainer?.addEventListener('pointermove', (e) => {
        if (!isScrubbing) return;
        e.preventDefault();
        seekAudioToPosition(e.clientX);
      });

      const stopScrubbing = (e) => {
        if (!isScrubbing) return;
        isScrubbing = false;
        waveContainer.classList.remove('is-scrubbing');
        if (e && e.pointerId) {
          try { waveContainer.releasePointerCapture(e.pointerId); } catch(err) {}
        }
      };

      waveContainer?.addEventListener('pointerup', stopScrubbing);
      waveContainer?.addEventListener('pointercancel', stopScrubbing);

      // Mobile Touch events fallback
      waveContainer?.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
          isScrubbing = true;
          waveContainer.classList.add('is-scrubbing');
          seekAudioToPosition(e.touches[0].clientX);
        }
      }, { passive: true });

      waveContainer?.addEventListener('touchmove', (e) => {
        if (isScrubbing && e.touches && e.touches[0]) {
          seekAudioToPosition(e.touches[0].clientX);
        }
      }, { passive: true });

      waveContainer?.addEventListener('touchend', () => {
        isScrubbing = false;
        waveContainer.classList.remove('is-scrubbing');
      });

      // Quick Seek Buttons (+5s / -5s بازدان بۆ پێشەوە و دواوە)
      const seekButtons = player.querySelectorAll('.voice-seek-btn');
      seekButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const delta = parseFloat(btn.getAttribute('data-seek')) || 0;
          if (audio.duration && !isNaN(audio.duration)) {
            audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
            updateWaveformUI();
          }
        });
      });

      // Speed Pill
      let speeds = [1.0, 1.5, 2.0];
      let speedIdx = 0;
      speedPill?.addEventListener('click', (e) => {
        e.stopPropagation();
        speedIdx = (speedIdx + 1) % speeds.length;
        const nextSpeed = speeds[speedIdx];
        audio.playbackRate = nextSpeed;
        speedPill.textContent = `${nextSpeed.toFixed(1)}x`;
      });
    });
  }

  // --- HANDLE REACTION ---
  async function handleDreamReaction(postId, reactionType) {
    const post = state.cachedDreamPosts.find(p => p.id === postId);
    if (!post) return;

    // Optimistic UI Update
    const prevReaction = post.user_reaction;
    if (prevReaction === reactionType) {
      // Toggle off
      post.user_reaction = null;
      if (prevReaction === 'like') post.reactions_like = Math.max(0, (post.reactions_like || 1) - 1);
      if (prevReaction === 'dua') post.reactions_dua = Math.max(0, (post.reactions_dua || 1) - 1);
      if (prevReaction === 'heart') post.reactions_heart = Math.max(0, (post.reactions_heart || 1) - 1);
    } else {
      if (prevReaction === 'like') post.reactions_like = Math.max(0, (post.reactions_like || 1) - 1);
      if (prevReaction === 'dua') post.reactions_dua = Math.max(0, (post.reactions_dua || 1) - 1);
      if (prevReaction === 'heart') post.reactions_heart = Math.max(0, (post.reactions_heart || 1) - 1);

      post.user_reaction = reactionType;
      if (reactionType === 'like') post.reactions_like = (post.reactions_like || 0) + 1;
      if (reactionType === 'dua') post.reactions_dua = (post.reactions_dua || 0) + 1;
      if (reactionType === 'heart') post.reactions_heart = (post.reactions_heart || 0) + 1;
    }

    playReactionSound(reactionType);
    renderDreamPosts();

    // Send to Server
    try {
      const res = await fetch(`/api/dreams/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: state.clientId,
          reactionType: post.user_reaction
        })
      });
      const data = await res.json();
      if (data.success && data.post) {
        const idx = state.cachedDreamPosts.findIndex(p => p.id === postId);
        if (idx !== -1) {
          state.cachedDreamPosts[idx] = data.post;
          renderDreamPosts();
        }
      }
    } catch (err) {
      console.error('Reaction request error:', err);
      loadDreamPosts();
    }
  }

  // --- SHARE DREAM POST ---
  function handleShareDreamPost(postId, postTitle) {
    const shareUrl = `${window.location.origin}/dreams#dream-${postId}`;
    const d = DIALECTS[state.currentDialect] || DIALECTS.sorani;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast(d.linkCopied || 'لینکی پۆستەکە لەبەرگیرایەوە', 'success');
        playSubtleClick();
      }).catch(() => {
        prompt('لینکی پۆستەکە کۆپی بکە:', shareUrl);
      });
    } else {
      prompt('لینکی پۆستەکە کۆپی بکە:', shareUrl);
    }
  }

  // --- DELETE DREAM POST (Admin) ---
  async function deleteDreamPost(postId) {
    const d = DIALECTS[state.currentDialect] || DIALECTS.sorani;
    if (!confirm(d.deleteConfirm || 'دڵنیایت لە سڕینەوەی ئەم خەونە لێکدراوەیە؟')) return;

    try {
      const token = localStorage.getItem('ferga_token') || localStorage.getItem('seereen_token');
      const res = await fetch(`/api/dreams/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast(d.postDeleted || 'پۆستەکە بە سەرکەوتوویی سڕایەوە', 'info');
        state.cachedDreamPosts = state.cachedDreamPosts.filter(p => p.id !== postId);
        renderDreamPosts();
      } else {
        showToast(data.error || 'سڕینەوە سەرکەوتوو نەبوو', 'error');
      }
    } catch (err) {
      showToast('هەڵەیەک لە پەیوەندی بە سێرڤەر ڕوویدا', 'error');
    }
  }

  // --- EDIT DREAM POST (Admin) ---
  function openEditDreamModal(postId) {
    const post = state.cachedDreamPosts.find(p => p.id === postId);
    if (!post || !el.modalEditDreamPost) return;

    if (el.editDreamPostId) el.editDreamPostId.value = post.id;
    if (el.editDreamInputTitle) el.editDreamInputTitle.value = post.title || '';
    if (el.editDreamInputText) el.editDreamInputText.value = post.dream_text || '';
    if (el.editDreamInputInterpretation) el.editDreamInputInterpretation.value = post.interpretation || '';
    if (el.editDreamInputImage) el.editDreamInputImage.value = post.image_url || '';

    el.modalEditDreamPost.classList.remove('hidden');
    if (el.editDreamInputTitle) el.editDreamInputTitle.focus();
  }

  function closeEditDreamModal() {
    if (!el.modalEditDreamPost) return;
    el.modalEditDreamPost.classList.add('hidden');
    if (el.formEditDreamPost) el.formEditDreamPost.reset();
  }

  // --- PUBLISHER PERMISSION & UI HELPERS ---
  function isDreamPublisher(user) {
    if (!user) return false;
    const role = (user.role || '').toLowerCase().trim();
    const uname = (user.username || '').toLowerCase().trim();
    const fname = (user.full_name || '').trim();
    return (
      role === 'admin' ||
      role === 'super_admin' ||
      role === 'teacher' ||
      uname === 'azad' ||
      Number(user.id) === 6 ||
      fname.includes('ئازاد')
    );
  }

  function updateDreamPublisherUI() {
    const allowed = isDreamPublisher(state.currentUser);
    if (el.adminDreamActionContainer) {
      el.adminDreamActionContainer.classList.toggle('hidden', !allowed);
    }
    const heroPub = document.getElementById('heroDreamPublishContainer');
    if (heroPub) {
      heroPub.classList.toggle('hidden', !allowed);
    }
  }

  // --- RICH MEDIA STATE FOR DREAM PUBLISHING ---
  let dreamMediaType = 'audio';
  let dreamMediaRecorder = null;
  let dreamAudioChunks = [];
  let dreamRecordedAudioBlob = null;
  let dreamRecordTimer = null;
  let dreamRecordSeconds = 0;

  function setDreamMediaType(type) {
    dreamMediaType = type || 'audio';
    const tabs = {
      audio: document.getElementById('dreamTabAudio'),
      image: document.getElementById('dreamTabImage'),
      video: document.getElementById('dreamTabVideo'),
      text: document.getElementById('dreamTabText')
    };
    const sections = {
      audio: document.getElementById('dreamSectionAudio'),
      image: document.getElementById('dreamSectionImage'),
      video: document.getElementById('dreamSectionVideo')
    };

    Object.keys(tabs).forEach(k => {
      const btn = tabs[k];
      if (!btn) return;
      if (k === dreamMediaType) {
        btn.className = 'dream-media-tab py-2 px-2 rounded-xl border-2 border-amber-600 bg-amber-500/15 text-[#361c0c] text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer';
      } else {
        btn.className = 'dream-media-tab py-2 px-2 rounded-xl border border-[#9c784e]/35 bg-[#fbf7f0]/80 text-[#54371f] text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer';
      }
    });

    Object.keys(sections).forEach(k => {
      const sec = sections[k];
      if (sec) sec.classList.toggle('hidden', k !== dreamMediaType);
    });
  }

  function stopDreamRecording(cancel) {
    try {
      if (dreamRecordTimer) { clearInterval(dreamRecordTimer); dreamRecordTimer = null; }
      if (dreamMediaRecorder && dreamMediaRecorder.state === 'recording') {
        dreamMediaRecorder.stop();
      }
      if (cancel) {
        dreamRecordedAudioBlob = null;
        dreamRecordSeconds = 0;
        const box = document.getElementById('dreamAudioPreviewBox');
        if (box) box.classList.add('hidden');
      }
    } catch (e) {}
    const wave = document.getElementById('dreamVoiceWave');
    const txt = document.getElementById('dreamRecordBtnText');
    const timerEl = document.getElementById('dreamRecordTimer');
    if (wave) wave.classList.add('hidden');
    if (txt) txt.textContent = 'دەستپێکردنی تۆمارکردن';
    if (timerEl) timerEl.classList.add('hidden');
  }

  async function toggleDreamRecording() {
    if (dreamMediaRecorder && dreamMediaRecorder.state === 'recording') {
      stopDreamRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      dreamAudioChunks = [];
      dreamRecordedAudioBlob = null;
      dreamRecordSeconds = 0;
      dreamMediaRecorder = new MediaRecorder(stream);
      dreamMediaRecorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) dreamAudioChunks.push(ev.data);
      };
      dreamMediaRecorder.onstop = () => {
        try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}
        if (dreamAudioChunks.length > 0) {
          dreamRecordedAudioBlob = new Blob(dreamAudioChunks, { type: 'audio/webm' });
          const prev = document.getElementById('dreamAudioPreview');
          const box = document.getElementById('dreamAudioPreviewBox');
          if (prev) prev.src = URL.createObjectURL(dreamRecordedAudioBlob);
          if (box) box.classList.remove('hidden');
        }
      };
      dreamMediaRecorder.start();
      const wave = document.getElementById('dreamVoiceWave');
      const txt = document.getElementById('dreamRecordBtnText');
      const timerEl = document.getElementById('dreamRecordTimer');
      if (wave) wave.classList.remove('hidden');
      if (txt) txt.textContent = 'وەستاندنی تۆمارکردن';
      if (timerEl) { timerEl.textContent = '00:00'; timerEl.classList.remove('hidden'); }
      dreamRecordTimer = setInterval(() => {
        dreamRecordSeconds++;
        const mins = String(Math.floor(dreamRecordSeconds / 60)).padStart(2, '0');
        const secs = String(dreamRecordSeconds % 60).padStart(2, '0');
        if (timerEl) timerEl.textContent = mins + ':' + secs;
      }, 1000);
    } catch (err) {
      showToast('ڕێگەپێدانی مایکرۆفۆن وەرنەگیرا', 'error');
    }
  }

  // --- ADMIN MODAL CONTROLS ---
  function openNewDreamModal() {
    if (!el.modalNewDreamPost) return;
    const nameEl = document.getElementById('dreamAuthorNameInput');
    const badgeEl = document.getElementById('dreamAuthorBadgeInput');
    if (nameEl && state.currentUser) {
      nameEl.value = state.currentUser.full_name || state.currentUser.username || 'مامۆستا ئازاد';
    }
    if (badgeEl && state.currentUser) {
      const r = (state.currentUser.role || '').toLowerCase();
      if (r === 'teacher') badgeEl.value = 'مامۆستای فێرگە';
      else if (r === 'super_admin') badgeEl.value = 'موعەبیر و بەڕێوەبەر';
      else badgeEl.value = 'دەستەی لێکدانەوەی خەون';
    }
    setDreamMediaType('audio');
    el.modalNewDreamPost.classList.remove('hidden');
    if (el.dreamInputTitle) el.dreamInputTitle.focus();
  }

  function closeNewDreamModal() {
    if (!el.modalNewDreamPost) return;
    stopDreamRecording(true);
    el.modalNewDreamPost.classList.add('hidden');
    if (el.formNewDreamPost) el.formNewDreamPost.reset();
    ['dreamAudioPreviewBox', 'dreamImagePreviewBox', 'dreamVideoPreviewBox'].forEach(id => {
      const box = document.getElementById(id);
      if (box) box.classList.add('hidden');
    });
  }

  // --- SETUP EVENT LISTENERS ---
  function setupEvents() {
    // Listen for storage changes across tabs to keep theme in sync
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('ferga_landing_')) {
        applyTheme();
      }
    });

    // Dialect Dropdown Toggle
    if (el.btnDialectDropdown && el.dialectDropdownMenu) {
      el.btnDialectDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = el.dialectDropdownMenu.classList.contains('hidden');
        if (isHidden) {
          el.dialectDropdownMenu.classList.remove('hidden');
          el.btnDialectDropdown.setAttribute('aria-expanded', 'true');
        } else {
          el.dialectDropdownMenu.classList.add('hidden');
          el.btnDialectDropdown.setAttribute('aria-expanded', 'false');
        }
      });

      document.querySelectorAll('.dialect-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const chosen = btn.getAttribute('data-dialect');
          if (chosen) applyDialect(chosen, true);
          el.dialectDropdownMenu.classList.add('hidden');
          el.btnDialectDropdown.setAttribute('aria-expanded', 'false');
        });
      });

      document.addEventListener('click', (e) => {
        if (!el.dialectDropdownContainer || !el.dialectDropdownContainer.contains(e.target)) {
          if (!el.dialectDropdownMenu.classList.contains('hidden')) {
            el.dialectDropdownMenu.classList.add('hidden');
            el.btnDialectDropdown.setAttribute('aria-expanded', 'false');
          }
        }
      });
    }

    // Feed Event Delegation
    if (el.dreamPostsFeed) {
      el.dreamPostsFeed.addEventListener('click', (e) => {
        // 1. Direct Pill Reaction Click (Heart / Dua / Like)
        const reactPill = e.target.closest('.dream-react-pill');
        if (reactPill) {
          e.stopPropagation();
          const postId = parseInt(reactPill.getAttribute('data-post-id'), 10);
          const reactionType = reactPill.getAttribute('data-reaction');
          if (postId && reactionType) {
            handleDreamReaction(postId, reactionType);
          }
          return;
        }

        // 2. Share Button Click
        const shareBtn = e.target.closest('.btn-share-post, .btn-share-dream-header');
        if (shareBtn) {
          const postId = parseInt(shareBtn.getAttribute('data-post-id'), 10);
          const title = shareBtn.getAttribute('data-post-title') || '';
          handleShareDreamPost(postId, title);
          return;
        }

        // 3. Admin Edit Button Click
        const editBtn = e.target.closest('.btn-edit-dream-post');
        if (editBtn) {
          const postId = parseInt(editBtn.getAttribute('data-post-id'), 10);
          if (postId) openEditDreamModal(postId);
          return;
        }

        // 4. Admin Delete Button Click
        const deleteBtn = e.target.closest('.btn-delete-dream-post');
        if (deleteBtn) {
          const postId = parseInt(deleteBtn.getAttribute('data-post-id'), 10);
          if (postId) deleteDreamPost(postId);
          return;
        }
      });
    }

    // Admin Modal Controls
    if (el.btnOpenNewDreamModal) {
      el.btnOpenNewDreamModal.addEventListener('click', openNewDreamModal);
    }
    if (el.btnCloseNewDreamModal) {
      el.btnCloseNewDreamModal.addEventListener('click', closeNewDreamModal);
    }
    if (el.btnCancelNewDream) {
      el.btnCancelNewDream.addEventListener('click', closeNewDreamModal);
    }

    // Quick Preset Images for Dreams
    document.querySelectorAll('.btn-preset-dream-img').forEach(btn => {
      btn.addEventListener('click', () => {
        const imgUrl = btn.getAttribute('data-img');
        if (el.dreamInputImage && imgUrl) {
          el.dreamInputImage.value = imgUrl;
          playSubtleClick();
        }
      });
    });

    // Rich Media Tabs & File Preview Listeners
    document.querySelectorAll('.dream-media-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        setDreamMediaType(tabBtn.getAttribute('data-media-tab') || 'audio');
      });
    });

    const btnDreamRecord = document.getElementById('btnDreamRecord');
    if (btnDreamRecord) {
      btnDreamRecord.addEventListener('click', toggleDreamRecording);
    }

    const dreamAudioFileInput = document.getElementById('dreamAudioFileInput');
    if (dreamAudioFileInput) {
      dreamAudioFileInput.addEventListener('change', () => {
        if (dreamAudioFileInput.files && dreamAudioFileInput.files[0]) {
          dreamRecordedAudioBlob = null;
          const prev = document.getElementById('dreamAudioPreview');
          const box = document.getElementById('dreamAudioPreviewBox');
          if (prev) prev.src = URL.createObjectURL(dreamAudioFileInput.files[0]);
          if (box) box.classList.remove('hidden');
        }
      });
    }

    const dreamImageFileInput = document.getElementById('dreamImageFileInput');
    if (dreamImageFileInput) {
      dreamImageFileInput.addEventListener('change', () => {
        const box = document.getElementById('dreamImagePreviewBox');
        const prev = document.getElementById('dreamImagePreview');
        if (dreamImageFileInput.files && dreamImageFileInput.files[0]) {
          if (prev) prev.src = URL.createObjectURL(dreamImageFileInput.files[0]);
          if (box) box.classList.remove('hidden');
        } else if (box) {
          box.classList.add('hidden');
        }
      });
    }

    const dreamVideoFileInput = document.getElementById('dreamVideoFileInput');
    if (dreamVideoFileInput) {
      dreamVideoFileInput.addEventListener('change', () => {
        const box = document.getElementById('dreamVideoPreviewBox');
        const prev = document.getElementById('dreamVideoPreview');
        if (dreamVideoFileInput.files && dreamVideoFileInput.files[0]) {
          if (prev) prev.src = URL.createObjectURL(dreamVideoFileInput.files[0]);
          if (box) box.classList.remove('hidden');
        } else if (box) {
          box.classList.add('hidden');
        }
      });
    }

    // Admin Form Submit: New Dream Post (supports Voice/Audio, Image, Video, Text)
    if (el.formNewDreamPost) {
      el.formNewDreamPost.addEventListener('submit', async (e) => {
        e.preventDefault();
        const d = DIALECTS[state.currentDialect] || DIALECTS.sorani;

        const submitBtn = document.getElementById('btnSubmitDreamPost');
        const submitBtnText = document.getElementById('btnSubmitDreamPostText');
        if (submitBtn) submitBtn.disabled = true;
        if (submitBtnText) submitBtnText.textContent = 'بڵاوکردنەوە...';

        const rawTitle = el.dreamInputTitle?.value.trim();
        const rawDreamText = el.dreamInputText?.value.trim();
        const rawInterpretation = el.dreamInputInterpretation?.value.trim();
        const imageUrlTyped = el.dreamInputImage?.value.trim() || '';
        const authorName = document.getElementById('dreamAuthorNameInput')?.value.trim() || state.currentUser?.full_name || 'دەستەی لێکدانەوەی خەون';
        const authorBadge = document.getElementById('dreamAuthorBadgeInput')?.value.trim() || 'مامۆستای فێرگە';

        let mediaType = dreamMediaType || 'text';
        let uploadedMediaUrl = '';
        let audioDuration = dreamRecordSeconds || 0;

        try {
          if (mediaType === 'audio') {
            const audioInput = document.getElementById('dreamAudioFileInput');
            const hasAudioFile = audioInput && audioInput.files && audioInput.files[0];
            if (dreamRecordedAudioBlob || hasAudioFile) {
              const fd = new FormData();
              if (dreamRecordedAudioBlob) fd.append('media', dreamRecordedAudioBlob, 'voice-' + Date.now() + '.webm');
              else fd.append('media', audioInput.files[0]);
              const upRes = await fetch('/api/dreams/upload-media', { method: 'POST', body: fd });
              const upData = await upRes.json();
              if (!upData.success) throw new Error(upData.error || 'هەڵە لە بارکردنی دەنگ');
              uploadedMediaUrl = upData.url;
            } else {
              mediaType = 'text';
            }
          } else if (mediaType === 'image') {
            const imgInput = document.getElementById('dreamImageFileInput');
            if (imgInput && imgInput.files && imgInput.files[0]) {
              const fd = new FormData();
              fd.append('media', imgInput.files[0]);
              const upRes = await fetch('/api/dreams/upload-media', { method: 'POST', body: fd });
              const upData = await upRes.json();
              if (!upData.success) throw new Error(upData.error || 'هەڵە لە بارکردنی وێنە');
              uploadedMediaUrl = upData.url;
            } else if (imageUrlTyped) {
              uploadedMediaUrl = imageUrlTyped;
            } else {
              mediaType = 'text';
            }
          } else if (mediaType === 'video') {
            const vidInput = document.getElementById('dreamVideoFileInput');
            if (vidInput && vidInput.files && vidInput.files[0]) {
              const fd = new FormData();
              fd.append('media', vidInput.files[0]);
              const upRes = await fetch('/api/dreams/upload-media', { method: 'POST', body: fd });
              const upData = await upRes.json();
              if (!upData.success) throw new Error(upData.error || 'هەڵە لە بارکردنی ڤیدیۆ');
              uploadedMediaUrl = upData.url;
            } else {
              mediaType = 'text';
            }
          }

          let defaultTitle = 'لێکدانەوەی نوێ';
          if (mediaType === 'audio') defaultTitle = 'تۆماری دەنگی و ئامۆژگاری';
          else if (mediaType === 'video') defaultTitle = 'ڤیدیۆی تایبەت';
          else if (mediaType === 'image') defaultTitle = 'وێنە و لێکدانەوە';

          const title = rawTitle || defaultTitle;
          const interpretation = rawInterpretation || rawDreamText || (mediaType === 'audio' ? 'تۆماری دەنگی' : (mediaType === 'video' ? 'ڤیدیۆ' : (mediaType === 'image' ? 'وێنەی خەون' : 'لێکدانەوە و ئامۆژگاری')));
          const dream_text = rawDreamText || interpretation;

          const token = localStorage.getItem('ferga_token') || localStorage.getItem('seereen_token');
          const res = await fetch('/api/dreams/posts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
              title,
              dream_text,
              interpretation,
              author_name: authorName,
              author_badge: authorBadge,
              media_type: mediaType,
              image_url: mediaType === 'image' ? uploadedMediaUrl : (imageUrlTyped || ''),
              video_url: mediaType === 'video' ? uploadedMediaUrl : '',
              audio_url: mediaType === 'audio' ? uploadedMediaUrl : '',
              audio_duration: audioDuration
            })
          });

          const data = await res.json();
          if (data.success && data.post) {
            showToast(d.postPublished || 'خەونی لێکدراوە بە سەرکەوتوویی بڵاوکرایەوە', 'success');
            state.cachedDreamPosts.unshift(data.post);
            renderDreamPosts();
            closeNewDreamModal();
          } else {
            showToast(data.error || 'بڵاوکردنەوە سەرکەوتوو نەبوو', 'error');
          }
        } catch (err) {
          showToast(err.message || 'هەڵەیەک لە پەیوەندی بە سێرڤەر ڕوویدا', 'error');
        } finally {
          if (submitBtn) submitBtn.disabled = false;
          if (submitBtnText) submitBtnText.textContent = 'بڵاوکردنەوەی پۆست';
        }
      });
    }

    // Edit Modal Buttons
    if (el.btnCloseEditDreamModal) {
      el.btnCloseEditDreamModal.addEventListener('click', closeEditDreamModal);
    }
    if (el.btnCancelEditDream) {
      el.btnCancelEditDream.addEventListener('click', closeEditDreamModal);
    }

    // Submit Edit Dream Post Form
    if (el.formEditDreamPost) {
      el.formEditDreamPost.addEventListener('submit', async (e) => {
        e.preventDefault();
        const d = DIALECTS[state.currentDialect] || DIALECTS.sorani;
        const postId = parseInt(el.editDreamPostId?.value, 10);
        if (!postId) return;

        const title = el.editDreamInputTitle?.value.trim();
        const dream_text = el.editDreamInputText?.value.trim();
        const interpretation = el.editDreamInputInterpretation?.value.trim();
        const image_url = el.editDreamInputImage?.value.trim() || '';

        try {
          const token = localStorage.getItem('ferga_token') || localStorage.getItem('seereen_token');
          const res = await fetch(`/api/dreams/posts/${postId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              title,
              dream_text,
              interpretation,
              image_url
            })
          });

          const data = await res.json();
          if (data.success && data.post) {
            showToast('گۆڕانکارییەکان بە سەرکەوتوویی پاشەکەوت کران ✨', 'success');
            const idx = state.cachedDreamPosts.findIndex(p => p.id === postId);
            if (idx !== -1) {
              state.cachedDreamPosts[idx] = { ...state.cachedDreamPosts[idx], ...data.post };
            }
            renderDreamPosts();
            closeEditDreamModal();
          } else {
            showToast(data.error || 'پاشەکەوتکردن سەرکەوتوو نەبوو', 'error');
          }
        } catch (err) {
          showToast('هەڵەیەک لە پەیوەندی بە سێرڤەر ڕوویدا', 'error');
        }
      });
    }

    // ESC key closes modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeNewDreamModal();
        closeEditDreamModal();
      }
    });
  }

  // --- INITIALIZE ---
  function init() {
    applyTheme(state.currentTheme);
    applyDialect(state.currentDialect);

    // Show publish UI if logged in with publisher permissions
    updateDreamPublisherUI();

    setupEvents();
    loadDreamPosts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
