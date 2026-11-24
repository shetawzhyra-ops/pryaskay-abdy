/**
 * Dedicated Poems Page Script — دیوانی شیعرەکانی م. ئازاد
 */

(() => {
  'use strict';

  let allPoems = [];
  let currentUser = null;
  let currentDialect = localStorage.getItem('pryaska_dialect') || 'sorani';

  const DIALECTS = {
    sorani: {
      label: 'شێوەزار: سۆرانی',
      back: 'گەڕانەوە بۆ سەرەکی',
      title: 'پریاسکەی ئەدەبی',
      subtitle: 'هۆنراوە و بەرهەمە ئەدەبی و ڕۆحییەکانی ئازاد عەبدی',
      countSuffix: 'بابەت بڵاوکراوەتەوە',
      authorDefault: ''
    },
    kurmanji: {
      label: 'شێوەزار: کرمانجی',
      back: 'ڤەگەڕیان بۆ سەرەکی',
      title: 'پریاسکەیا ئەدەبی',
      subtitle: 'دیوانا هەلبەست و بەرهەمێن ئەدەبی یێن مامۆستا ئازاد. تو دشێی هەلبەستان بخوینی و دلێ خۆ دەربڕی.',
      countSuffix: 'هەلبەست هاتینە بەلاڤکرن',
      authorDefault: ''
    },
    hawrami: {
      label: 'شێوەزار: هەورامی',
      back: 'گێڵایۆ پەی سەرەکی',
      title: 'پریاسکەی ئەدەبی',
      subtitle: 'دیوانو هۆنیێ و بەرهەمە ئەدەبییەکاو مامۆستا ئازادی. تاوی شێعرەکا بوانیۆ و کاردانەوەو وێت بنیا.',
      countSuffix: 'شێعرێ وەڵاوە کریاینە',
      authorDefault: ''
    }
  };

  // Helper: Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Toast
  function showToast(msg) {
    const toast = document.getElementById('poemToast');
    const toastText = document.getElementById('poemToastText');
    if (!toast || !toastText) return;
    toastText.innerText = msg;
    toast.classList.remove('hidden');
    clearTimeout(window._poemToastTimer);
    window._poemToastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3200);
  }

  // Helper: Check if logged-in user is Mamosta Azad
  function isAzadUser(u) {
    if (!u) return false;
    const uname = (u.username || '').toLowerCase().trim();
    const fname = (u.full_name || '').trim();
    return uname === 'azad' || Number(u.id) === 6 || fname.includes('ئازاد');
  }

  function updatePoemPublisherUI() {
    const allowed = isAzadUser(currentUser);
    const adminBtn = document.getElementById('adminPoemActionContainer');
    const heroBtn = document.getElementById('heroPoemPublishContainer');
    if (adminBtn) adminBtn.classList.toggle('hidden', !allowed);
    if (heroBtn) heroBtn.classList.toggle('hidden', !allowed);
  }

  // Restore cached user immediately
  try {
    const cached = localStorage.getItem('ferga_user');
    if (cached) {
      currentUser = JSON.parse(cached);
    }
  } catch (e) {}

  // Auth check
  async function checkUserAuth() {
    updatePoemPublisherUI();
    const token = localStorage.getItem('ferga_token') || localStorage.getItem('seereen_token');
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        currentUser = (data && data.user) ? data.user : data;
        try { localStorage.setItem('ferga_user', JSON.stringify(currentUser)); } catch (e) {}
        updatePoemPublisherUI();
        renderPoems(allPoems);
      }
    } catch (e) {
      console.warn('Auth check failed:', e);
    }
  }

  // Load Poems from API
  async function loadPoems() {
    try {
      const res = await fetch('/api/poems');
      const data = await res.json();
      if (data.success && Array.isArray(data.poems)) {
        allPoems = data.poems;
        updatePoemsCount(allPoems.length);
        renderPoems(allPoems);
      }
    } catch (err) {
      console.error('Error loading poems:', err);
      const container = document.getElementById('poemsFeed');
      if (container) {
        container.innerHTML = `
          <div class="glass-card p-8 rounded-3xl text-center text-rose-500 font-bold text-sm">
            هەڵەیەک ڕوویدا لە بارکردنی شیعرەکان. تکایە دواتر تاقی بکەرەوە.
          </div>
        `;
      }
    }
  }

  function updatePoemsCount(count) {
    const textEl = document.getElementById('poemsCountText');
    if (textEl) {
      const d = DIALECTS[currentDialect] || DIALECTS.sorani;
      if (count === 1) {
        textEl.innerText = (currentDialect === 'sorani') ? 'یەک بابەت بڵاوکراوەتەوە' : `1 ${d.countSuffix}`;
      } else {
        textEl.innerText = `${count} ${d.countSuffix}`;
      }
    }
  }

  // Render Poems Cards
  function renderPoems(list) {
    const container = document.getElementById('poemsFeed');
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = `
        <div class="glass-card p-12 text-center text-[#54371f] rounded-3xl space-y-3">
          <i class="fa-solid fa-feather-pointed text-3xl text-amber-500/50 block"></i>
          <p class="font-bold text-sm">هیچ شیعرێک نەدۆزرایەوە</p>
        </div>
      `;
      return;
    }

    const isAzad = isAzadUser(currentUser);

    container.innerHTML = list.map(poem => {
      const d = new Date(poem.created_at || Date.now());
      const dateStr = d.toLocaleDateString('ckb-IQ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const deleteBtn = isAzad ? `
        <button 
          onclick="deletePoem(${poem.id})" 
          class="text-rose-500 hover:text-rose-700 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
          title="سڕینەوەی ئەم شیعرە"
        >
          <i class="fa-solid fa-trash-can text-[11px]"></i>
          <span class="hidden sm:inline">سڕینەوە</span>
        </button>
      ` : '';

      return `
        <article class="glass-card rounded-3xl p-5 sm:p-8 border border-[#9c784e]/35 shadow-xl hover:shadow-2xl hover:border-amber-600/50 transition-all duration-300 relative overflow-hidden group">
          <!-- Card Header -->
          <div class="flex items-center justify-between gap-3 pb-3.5 mb-4 border-b border-[#9c784e]/25">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 shadow-sm shrink-0"></span>
              <h2 class="text-lg sm:text-xl font-bold text-[#361c0c] tracking-tight truncate">
                ${escapeHtml(poem.title)}
              </h2>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-[11px] text-[#785336] font-bold flex items-center gap-1">
                <i class="fa-regular fa-calendar-days text-[10px] text-[#b45309]"></i>
                <span>${dateStr}</span>
              </span>
              ${deleteBtn}
            </div>
          </div>

          <!-- Poem Verses Body -->
          <div class="my-4 p-5 sm:p-7 rounded-2xl bg-[#fbf7f0]/90 border border-[#9c784e]/25 shadow-inner">
            <div class="poem-verse-text text-center font-serif text-base sm:text-lg md:text-xl text-[#361c0c] leading-[2.3] sm:leading-[2.5] whitespace-pre-line select-text font-medium tracking-wide">
${escapeHtml(poem.content)}
            </div>
          </div>

          <!-- Card Footer -->
          <div class="pt-3 border-t border-[#9c784e]/25 flex items-center justify-end gap-3 flex-wrap text-xs">

            <!-- Actions: Like & Share -->
            <div class="flex items-center gap-2">
              <button 
                onclick="sharePoem(${poem.id})" 
                class="px-3.5 py-1.5 rounded-xl bg-[#e4d4bd]/85 hover:bg-[#d9c4a6] border border-[#9c784e]/30 text-[#361c0c] font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="هاوبەشکردن یان لەبەرگرتنەوەی شیعرەکە"
              >
                <i class="fa-solid fa-share-nodes text-[11px] text-[#b45309]"></i>
                <span>هاوبەشکردن</span>
              </button>

              <button 
                onclick="reactToPoem(${poem.id})" 
                id="btnLikePoem_${poem.id}"
                class="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-700 font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm group"
                title="بەدڵمە"
              >
                <i class="fa-solid fa-heart text-[12px] group-hover:scale-125 transition-transform text-rose-600"></i>
                <span id="poemLikes_${poem.id}" class="font-latin text-xs">${poem.likes || 0}</span>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // Filter poems by search query
  window.filterPoems = function(q) {
    const clean = (q || '').trim().toLowerCase();
    if (!clean) {
      renderPoems(allPoems);
      return;
    }
    const filtered = allPoems.filter(p => {
      const t = (p.title || '').toLowerCase();
      const c = (p.content || '').toLowerCase();
      const a = (p.author || '').toLowerCase();
      return t.includes(clean) || c.includes(clean) || a.includes(clean);
    });
    renderPoems(filtered);
  };

  // Like Poem
  window.reactToPoem = async function(id) {
    try {
      const clientId = localStorage.getItem('client_id') || ('client_' + Math.random().toString(36).substring(2));
      localStorage.setItem('client_id', clientId);
      const res = await fetch(`/api/poems/${id}/react`, {
        method: 'POST',
        headers: { 'x-client-id': clientId }
      });
      const data = await res.json();
      if (data && typeof data.likes === 'number') {
        const span = document.getElementById(`poemLikes_${id}`);
        if (span) span.innerText = data.likes;
        const poem = allPoems.find(p => p.id === id);
        if (poem) poem.likes = data.likes;
      }
    } catch (e) {
      console.error('Error liking poem:', e);
    }
  };

  // Share Poem
  window.sharePoem = function(id) {
    const poem = allPoems.find(p => p.id === id);
    if (!poem) return;
    const shareText = `📜 ${poem.title}\n\n${poem.content}\n\n✍️ ${poem.author || 'م. ئازاد'}\n🌐 پریاسکەی عەبدی: ${window.location.origin}/poems`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        showToast('دەقی شیعرەکە کۆپی کرا بۆ کلیپبۆرد 📋');
      }).catch(() => {
        alert(shareText);
      });
    } else {
      alert(shareText);
    }
  };

  // Delete Poem
  window.deletePoem = async function(id) {
    if (!confirm('دڵنیایت لە سڕینەوەی ئەم شیعرە لە دیوانی م. ئازاد؟')) return;
    const token = localStorage.getItem('ferga_token') || localStorage.getItem('seereen_token');
    try {
      const res = await fetch(`/api/poems/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('شیعرەکە بە سەرکەوتوویی سڕایەوە 🗑️');
        allPoems = allPoems.filter(p => p.id !== id);
        updatePoemsCount(allPoems.length);
        renderPoems(allPoems);
      } else {
        alert(data.error || 'نەتوانرا شیعرەکە بسڕدرێتەوە');
      }
    } catch (e) {
      alert('هەڵەیەک ڕوویدا لە پەیوەندی');
    }
  };

  // Add Poem Modal
  window.openNewPoemModal = function() {
    const m = document.getElementById('modalNewPoem');
    if (m) m.classList.remove('hidden');
    const input = document.getElementById('poemInputTitle');
    if (input) setTimeout(() => input.focus(), 100);
  };

  window.closeNewPoemModal = function() {
    const m = document.getElementById('modalNewPoem');
    if (m) m.classList.add('hidden');
  };

  window.submitNewPoem = async function(e) {
    if (e) e.preventDefault();
    const title = (document.getElementById('poemInputTitle')?.value || '').trim();
    const content = (document.getElementById('poemInputContent')?.value || '').trim();
    const author = (document.getElementById('poemInputAuthor')?.value || '').trim() || 'م. ئازاد';

    if (!title || !content) {
      alert('تکایە ناونیشان و دەقی شیعر بنووسە');
      return;
    }

    const token = localStorage.getItem('ferga_token') || localStorage.getItem('seereen_token');
    if (!token) {
      alert('تکایە سەرەتا بە هەژماری مامۆستا ئازاد بچۆ ژوورەوە');
      return;
    }

    const btn = document.getElementById('btnSubmitPoem');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>بڵاوکردنەوە...</span>';
    }

    try {
      const res = await fetch('/api/poems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, author })
      });
      const data = await res.json();
      if (data.success) {
        showToast('شیعرەکە بە سەرکەوتوویی بڵاوکرایەوە ✨');
        closeNewPoemModal();
        document.getElementById('formNewPoem')?.reset();
        await loadPoems();
      } else {
        alert(data.error || 'هەڵەیەک ڕوویدا لە بڵاوکردنەوەی شیعر');
      }
    } catch (err) {
      alert('هەڵەیەک ڕوویدا لە پەیوەندی لەگەڵ سێرڤەر');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane text-xs"></i><span>بڵاوکردنەوەی شیعر</span>';
      }
    }
  };

  // Dialect Switching
  window.togglePoemDialect = function(e) {
    if (e) e.stopPropagation();
    const m = document.getElementById('dialectDropdownMenu');
    if (m) m.classList.toggle('hidden');
  };

  window.selectPoemDialect = function(dKey) {
    currentDialect = dKey;
    localStorage.setItem('pryaska_dialect', dKey);
    const m = document.getElementById('dialectDropdownMenu');
    if (m) m.classList.add('hidden');

    const d = DIALECTS[dKey] || DIALECTS.sorani;
    const label = document.getElementById('currentDialectLabel');
    if (label) label.innerText = d.label;
    const backText = document.getElementById('btnBackToHomeText');
    if (backText) backText.innerText = d.back;
    const title = document.getElementById('poemsPageTitle');
    if (title) title.innerText = d.title;
    const subtitle = document.getElementById('poemsPageSubtitle');
    if (subtitle) subtitle.innerText = d.subtitle;

    updatePoemsCount(allPoems.length);
  };

  document.addEventListener('click', (e) => {
    const container = document.getElementById('dialectDropdownContainer');
    if (container && !container.contains(e.target)) {
      document.getElementById('dialectDropdownMenu')?.classList.add('hidden');
    }
  });

  // Real-time socket updates
  try {
    if (typeof io !== 'undefined') {
      const socket = io();
      socket.on('poem_liked', (data) => {
        if (data && data.id) {
          const span = document.getElementById(`poemLikes_${data.id}`);
          if (span) span.innerText = data.likes;
          const poem = allPoems.find(p => p.id === data.id);
          if (poem) poem.likes = data.likes;
        }
      });
      socket.on('new_poem_published', () => {
        loadPoems();
      });
      socket.on('poem_deleted', (data) => {
        if (data && data.id) {
          allPoems = allPoems.filter(p => p.id !== data.id);
          renderPoems(allPoems);
          updatePoemsCount(allPoems.length);
        }
      });
    }
  } catch (e) {
    console.warn('Socket error on poems page:', e);
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    selectPoemDialect(currentDialect);
    checkUserAuth();
    loadPoems();
  });

})();
