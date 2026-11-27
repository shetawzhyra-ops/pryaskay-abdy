/**
 * Global Full-Text Search Modal (SQLite FTS5) — Modern Heritage Manuscript Luxe
 * Works seamlessly across /, /dreams, /articles, /poems, and inside #mainApp.
 * Trigger via header search button or Ctrl+K / Cmd+K.
 */
(function () {
  if (window.__pryaskaGlobalSearchInit) return;
  window.__pryaskaGlobalSearchInit = true;

  let activeType = 'all';
  let debounceTimer = null;
  let lastController = null;

  const TYPE_META = {
    all: { label: 'هەموو', icon: 'fa-sparkles' },
    dream: { label: 'خەونەکان', icon: 'fa-moon' },
    article: { label: 'وتارەکان', icon: 'fa-feather-pointed' },
    poem: { label: 'شیعرەکان', icon: 'fa-scroll' },
    announcement: { label: 'ئاگاداری', icon: 'fa-bullhorn' },
    book: { label: 'کتێبخانە', icon: 'fa-book-open' },
    lesson: { label: 'وانەکان', icon: 'fa-headphones' }
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function injectStyles() {
    if (document.getElementById('pryaskaGlobalSearchStyles')) return;
    const style = document.createElement('style');
    style.id = 'pryaskaGlobalSearchStyles';
    style.textContent = `
      #pryaskaGlobalSearchOverlay {
        position: fixed;
        inset: 0;
        z-index: 9990;
        display: none;
        align-items: flex-start;
        justify-content: center;
        padding: 4.5rem 1rem 1.5rem;
        background: rgba(32, 58, 44, 0.64);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }
      #pryaskaGlobalSearchOverlay.is-open { display: flex; }
      #pryaskaGlobalSearchDialog {
        position: relative;
        width: 100%;
        max-width: 640px;
        max-height: 82vh;
        display: flex;
        flex-direction: column;
        border-radius: 1.6rem;
        background: linear-gradient(166deg, rgba(244, 233, 216, 0.99) 0%, rgba(231, 216, 194, 0.98) 100%);
        border: 1.5px solid rgba(156, 120, 78, 0.46);
        box-shadow: 0 28px 64px -14px rgba(34, 22, 10, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.85);
        color: #361c0c;
        overflow: hidden;
        direction: rtl;
        font-family: 'Noto Naskh Arabic', 'Amiri', serif;
      }
      #pryaskaGlobalSearchDialog::before {
        content: "";
        position: absolute;
        inset: 6px;
        border-radius: 1.25rem;
        border: 1px solid rgba(156, 120, 78, 0.18);
        pointer-events: none;
        z-index: 1;
      }
      .pgs-head, .pgs-filters, .pgs-body { position: relative; z-index: 2; }
      .pgs-head {
        padding: 1rem 1.15rem 0.75rem;
        border-bottom: 1px solid rgba(156, 120, 78, 0.25);
        display: flex;
        align-items: center;
        gap: 0.65rem;
      }
      .pgs-input-wrap {
        position: relative;
        flex: 1;
      }
      .pgs-input-wrap i {
        position: absolute;
        right: 0.9rem;
        top: 50%;
        transform: translateY(-50%);
        color: #b45309;
        font-size: 0.95rem;
        pointer-events: none;
      }
      #pryaskaGlobalSearchInput {
        width: 100%;
        padding: 0.68rem 2.55rem 0.68rem 0.9rem;
        border-radius: 0.95rem;
        background: #ffffff !important;
        border: 1.5px solid rgba(156, 120, 78, 0.40) !important;
        color: #361c0c !important;
        font-family: inherit;
        font-size: 0.96rem;
        font-weight: 700;
        outline: none !important;
        box-shadow: inset 0 1px 3px rgba(54, 28, 12, 0.06) !important;
      }
      #pryaskaGlobalSearchInput::-webkit-search-cancel-button {
        -webkit-appearance: none;
        appearance: none;
      }
      #pryaskaGlobalSearchInput:focus {
        border-color: rgba(217, 119, 6, 0.90) !important;
        box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.24) !important;
      }
      .pgs-close {
        width: 2.35rem;
        height: 2.35rem;
        border-radius: 0.8rem;
        border: 1px solid rgba(156, 120, 78, 0.34);
        background: rgba(251, 247, 240, 0.92);
        color: #785336;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      .pgs-close:hover {
        background: rgba(225, 29, 72, 0.14);
        border-color: rgba(225, 29, 72, 0.38);
        color: #be123c;
      }
      .pgs-filters {
        padding: 0.55rem 1.15rem;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        overflow-x: auto;
        border-bottom: 1px solid rgba(156, 120, 78, 0.18);
      }
      .pgs-chip {
        padding: 0.3rem 0.72rem;
        border-radius: 999px;
        border: 1px solid rgba(156, 120, 78, 0.32);
        background: rgba(251, 247, 240, 0.88);
        color: #54371f;
        font-family: inherit;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.18s ease;
      }
      .pgs-chip:hover { border-color: rgba(180, 83, 9, 0.52); color: #361c0c; }
      .pgs-chip.active {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border-color: rgba(180, 83, 9, 0.55);
        color: #ffffff;
        box-shadow: 0 4px 10px -2px rgba(180, 83, 9, 0.35);
      }
      .pgs-body {
        padding: 0.9rem 1.15rem 1.15rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
      }
      .pgs-empty {
        text-align: center;
        padding: 2rem 1rem;
        color: #785336;
        font-size: 0.9rem;
      }
      .pgs-item {
        display: block;
        text-decoration: none;
        padding: 0.85rem 1rem;
        border-radius: 1.1rem;
        background: linear-gradient(166deg, #fdfaf4 0%, #f3e8d7 100%);
        border: 1px solid rgba(156, 120, 78, 0.30);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 4px 12px -4px rgba(42, 24, 10, 0.08);
        transition: all 0.2s ease;
        color: #361c0c;
      }
      .pgs-item:hover {
        transform: translateY(-2px);
        border-color: rgba(180, 83, 9, 0.54);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92), 0 10px 20px -6px rgba(42, 24, 10, 0.14);
      }
      .pgs-item-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.3rem;
      }
      .pgs-item-title {
        font-family: 'Amiri', 'Noto Naskh Arabic', serif;
        font-size: 1.08rem;
        font-weight: 700;
        color: #361c0c;
      }
      .pgs-badge {
        padding: 0.12rem 0.55rem;
        border-radius: 999px;
        background: rgba(134, 184, 156, 0.26);
        border: 1px solid rgba(61, 122, 89, 0.36);
        color: #1e5237;
        font-size: 0.7rem;
        font-weight: 800;
        white-space: nowrap;
      }
      .pgs-snippet {
        font-size: 0.82rem;
        line-height: 1.7;
        color: #54371f;
      }
      .pgs-trigger-btn {
        display: inline-flex !important;
        align-items: center !important;
        gap: 0.4rem !important;
        padding: 0.38rem 0.72rem !important;
        border-radius: 0.85rem !important;
        background: linear-gradient(145deg, rgba(250, 244, 234, 0.96) 0%, rgba(232, 217, 194, 0.94) 100%) !important;
        border: 1px solid rgba(156, 120, 78, 0.38) !important;
        color: #361c0c !important;
        font-size: 0.78rem !important;
        font-weight: 800 !important;
        cursor: pointer !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78), 0 3px 8px -2px rgba(42, 24, 10, 0.10) !important;
        transition: all 0.2s ease !important;
      }
      .pgs-trigger-btn:hover {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
        border-color: rgba(180, 83, 9, 0.55) !important;
        color: #2b1406 !important;
        transform: translateY(-1px);
      }
      .pgs-trigger-btn i { color: #b45309 !important; }
      .pgs-trigger-btn:hover i { color: #2b1406 !important; }
    `;
    document.head.appendChild(style);
  }

  function buildModal() {
    if (document.getElementById('pryaskaGlobalSearchOverlay')) return;
    injectStyles();

    const overlay = document.createElement('div');
    overlay.id = 'pryaskaGlobalSearchOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'گەڕانی گشتی لە پریاسکە');
    overlay.innerHTML = `
      <div id="pryaskaGlobalSearchDialog">
        <div class="pgs-head">
          <div class="pgs-input-wrap">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input id="pryaskaGlobalSearchInput" type="search" autocomplete="off" placeholder="گەڕان لە خەونەکان، وتارەکان، شیعرەکان، کتێبخانە..." />
          </div>
          <button type="button" class="pgs-close" id="pryaskaGlobalSearchClose" title="داخستن (Esc)">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="pgs-filters" id="pryaskaGlobalSearchFilters"></div>
        <div class="pgs-body" id="pryaskaGlobalSearchResults">
          <div class="pgs-empty">وشەیەک بنووسە بۆ گەڕانی خێرا لە هەموو بەشەکانی پریاسکە...</div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeGlobalSearch();
    });
    document.getElementById('pryaskaGlobalSearchClose').addEventListener('click', closeGlobalSearch);
    document.getElementById('pryaskaGlobalSearchInput').addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(runSearch, 180);
    });

    renderFilterChips();
  }

  function hasAuthToken() {
    try {
      return Boolean(localStorage.getItem('token'));
    } catch (e) {
      return false;
    }
  }

  function renderFilterChips() {
    const wrap = document.getElementById('pryaskaGlobalSearchFilters');
    if (!wrap) return;
    const isAuthed = hasAuthToken();
    const keys = isAuthed
      ? ['all', 'dream', 'article', 'poem', 'announcement', 'book', 'lesson']
      : ['all', 'dream', 'article', 'poem', 'announcement'];

    wrap.innerHTML = keys.map((k) => {
      const m = TYPE_META[k];
      return `<button type="button" class="pgs-chip ${activeType === k ? 'active' : ''}" data-type="${k}">${escapeHtml(m.label)}</button>`;
    }).join('');

    wrap.querySelectorAll('.pgs-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeType = btn.getAttribute('data-type') || 'all';
        renderFilterChips();
        runSearch();
      });
    });
  }

  async function runSearch() {
    const input = document.getElementById('pryaskaGlobalSearchInput');
    const resultsEl = document.getElementById('pryaskaGlobalSearchResults');
    if (!input || !resultsEl) return;
    const q = input.value.trim();

    if (!q) {
      resultsEl.innerHTML = '<div class="pgs-empty">وشەیەک بنووسە بۆ گەڕانی خێرا لە هەموو بەشەکانی پریاسکە...</div>';
      return;
    }

    if (lastController) lastController.abort();
    lastController = new AbortController();

    resultsEl.innerHTML = '<div class="pgs-empty">لە گەڕاندایە...</div>';

    try {
      const headers = {};
      const token = (() => { try { return localStorage.getItem('token'); } catch (e) { return null; } })();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = `/api/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(activeType)}&limit=20`;
      const res = await fetch(url, { headers, signal: lastController.signal });
      const data = await res.json();

      if (!data.success || !Array.isArray(data.results) || data.results.length === 0) {
        resultsEl.innerHTML = `<div class="pgs-empty">هیچ ئەنجامێک بۆ «${escapeHtml(q)}» نەدۆزرایەوە.</div>`;
        return;
      }

      resultsEl.innerHTML = data.results.map((item) => `
        <a class="pgs-item" href="${escapeHtml(item.url)}" data-type="${escapeHtml(item.type)}" data-id="${escapeHtml(item.id)}">
          <div class="pgs-item-top">
            <span class="pgs-item-title">${escapeHtml(item.title)}</span>
            <span class="pgs-badge">${escapeHtml(item.typeLabel)}</span>
          </div>
          ${item.snippet ? `<div class="pgs-snippet">${escapeHtml(item.snippet)}</div>` : ''}
        </a>
      `).join('');

      resultsEl.querySelectorAll('.pgs-item').forEach((link) => {
        link.addEventListener('click', (e) => {
          const itemType = link.getAttribute('data-type');
          if (itemType === 'book' && typeof window.openLibraryModal === 'function') {
            e.preventDefault();
            closeGlobalSearch();
            window.openLibraryModal();
          } else if (itemType === 'lesson' && typeof window.openRecordedLessonsModal === 'function') {
            e.preventDefault();
            closeGlobalSearch();
            window.openRecordedLessonsModal();
          } else {
            closeGlobalSearch();
          }
        });
      });
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      resultsEl.innerHTML = '<div class="pgs-empty">هەڵەیەک لە گەڕاندا ڕوویدا، دووبارە هەوڵبدەوە.</div>';
    }
  }

  function openGlobalSearch() {
    buildModal();
    renderFilterChips();
    const overlay = document.getElementById('pryaskaGlobalSearchOverlay');
    if (overlay) {
      overlay.classList.add('is-open');
      setTimeout(() => {
        const input = document.getElementById('pryaskaGlobalSearchInput');
        if (input) input.focus();
      }, 40);
    }
  }

  function closeGlobalSearch() {
    const overlay = document.getElementById('pryaskaGlobalSearchOverlay');
    if (overlay) overlay.classList.remove('is-open');
  }

  let inlineDebounceTimer = null;
  let inlineController = null;

  async function runInlineHeroSearch() {
    const input = document.getElementById('heroInlineSearchInput');
    const resultsEl = document.getElementById('heroInlineSearchResults');
    const clearBtn = document.getElementById('heroInlineSearchClearBtn');
    if (!input || !resultsEl) return;

    const q = input.value.trim();
    if (clearBtn) {
      if (q.length > 0) {
        clearBtn.classList.remove('hidden');
        clearBtn.classList.add('inline-flex');
      } else {
        clearBtn.classList.add('hidden');
        clearBtn.classList.remove('inline-flex');
      }
    }

    if (!q) {
      resultsEl.classList.add('hidden');
      resultsEl.innerHTML = '';
      return;
    }

    if (inlineController) inlineController.abort();
    inlineController = new AbortController();

    injectStyles();
    resultsEl.classList.remove('hidden');
    resultsEl.innerHTML = '<div class="pgs-empty" style="padding: 1rem 0.75rem;">لە گەڕاندایە...</div>';

    try {
      const headers = {};
      const token = (() => { try { return localStorage.getItem('token'); } catch (e) { return null; } })();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = `/api/search?q=${encodeURIComponent(q)}&type=all&limit=15`;
      const res = await fetch(url, { headers, signal: inlineController.signal });
      const data = await res.json();

      if (!data.success || !Array.isArray(data.results) || data.results.length === 0) {
        resultsEl.innerHTML = `<div class="pgs-empty" style="padding: 1rem 0.75rem;">هیچ ئەنجامێک بۆ «${escapeHtml(q)}» نەدۆزرایەوە.</div>`;
        return;
      }

      resultsEl.innerHTML = `<div class="flex flex-col gap-2">${data.results.map((item) => `
        <a class="pgs-item" href="${escapeHtml(item.url)}" data-type="${escapeHtml(item.type)}" data-id="${escapeHtml(item.id)}">
          <div class="pgs-item-top">
            <span class="pgs-item-title">${escapeHtml(item.title)}</span>
            <span class="pgs-badge">${escapeHtml(item.typeLabel)}</span>
          </div>
          ${item.snippet ? `<div class="pgs-snippet">${escapeHtml(item.snippet)}</div>` : ''}
        </a>
      `).join('')}</div>`;

      resultsEl.querySelectorAll('.pgs-item').forEach((link) => {
        link.addEventListener('click', (e) => {
          const itemType = link.getAttribute('data-type');
          if (itemType === 'book' && typeof window.openLibraryModal === 'function') {
            e.preventDefault();
            resultsEl.classList.add('hidden');
            window.openLibraryModal();
          } else if (itemType === 'lesson' && typeof window.openRecordedLessonsModal === 'function') {
            e.preventDefault();
            resultsEl.classList.add('hidden');
            window.openRecordedLessonsModal();
          } else {
            resultsEl.classList.add('hidden');
          }
        });
      });
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      resultsEl.innerHTML = '<div class="pgs-empty" style="padding: 1rem 0.75rem;">هەڵەیەک لە گەڕاندا ڕوویدا.</div>';
    }
  }

  function initInlineHeroSearch() {
    const input = document.getElementById('heroInlineSearchInput');
    const resultsEl = document.getElementById('heroInlineSearchResults');
    const clearBtn = document.getElementById('heroInlineSearchClearBtn');
    const container = document.getElementById('heroInlineSearchContainer');
    if (!input || input.__inlineBound) return;
    input.__inlineBound = true;

    input.addEventListener('input', () => {
      clearTimeout(inlineDebounceTimer);
      inlineDebounceTimer = setTimeout(runInlineHeroSearch, 180);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && resultsEl) {
        resultsEl.classList.add('hidden');
        input.blur();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(inlineDebounceTimer);
        runInlineHeroSearch();
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        input.value = '';
        clearBtn.classList.add('hidden');
        clearBtn.classList.remove('inline-flex');
        if (resultsEl) {
          resultsEl.classList.add('hidden');
          resultsEl.innerHTML = '';
        }
        input.focus();
      });
    }

    document.addEventListener('click', (e) => {
      if (!resultsEl || resultsEl.classList.contains('hidden')) return;
      if (container && !container.contains(e.target)) {
        resultsEl.classList.add('hidden');
      }
    });
  }

  function mountTriggerButton() {
    initInlineHeroSearch();
    if (document.getElementById('globalSearchTriggerBtn')) return;
    injectStyles();

    const makeBtn = (id) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = id;
      btn.className = 'pgs-trigger-btn';
      btn.title = 'گەڕانی گشتی (Ctrl+K)';
      btn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i><span class="hidden sm:inline">گەڕان</span>';
      btn.addEventListener('click', openGlobalSearch);
      return btn;
    };

    // Mount cleanly inside subpage action containers (/dreams, /articles, /poems)
    const subpageActions =
      document.querySelector('#dreamsHeaderActions, #articlesHeaderActions, #poemsHeaderActions') ||
      document.querySelector('#dreamsHeader .flex.items-center.gap-2, #articlesHeader .flex.items-center.gap-2, #poemsHeader .flex.items-center.gap-2');
    if (subpageActions) {
      subpageActions.prepend(makeBtn('globalSearchTriggerBtn'));
    }
  }

  window.openPryaskaGlobalSearch = openGlobalSearch;
  window.closePryaskaGlobalSearch = closeGlobalSearch;

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openGlobalSearch();
    } else if (e.key === 'Escape') {
      closeGlobalSearch();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountTriggerButton);
  } else {
    mountTriggerButton();
  }
})();
