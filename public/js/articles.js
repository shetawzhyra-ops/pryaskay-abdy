/**
 * Dedicated Articles Page Script — کورتە وتاری فێرخوازان
 */

(() => {
  'use strict';

  let allArticles = [];
  let currentUser = null;
  let currentDialect = localStorage.getItem('pryaska_dialect') || 'sorani';

  const DIALECTS = {
    sorani: {
      label: 'شێوەزار: سۆرانی',
      back: 'گەڕانەوە بۆ سەرەکی',
      title: 'پریاسکەی وتار',
      subtitle: 'ناوەندێکی مەعریفی و ئەدەبی بۆ نووسین و بڵاوکردنەوەی وتارە زانستی، ئەدەبی و فکرییەکانی بەشداربوانی پێشکەوتووی پریاسکەی عەبدی.',
      countSuffix: 'وتار بڵاوکراوەتەوە'
    },
    kurmanji: {
      label: 'شێوەزار: کرمانجی',
      back: 'ڤەگەڕیان بۆ سەرەکی',
      title: 'پریاسکەیا گۆتاران',
      subtitle: 'ناڤەندەکا مەعریفی بۆ بەلاڤکرنا کورتە گۆتارێن زانستی و فکری یێن پشکدارێن پێشکەفتی یێن پریاسکەیا عەبدی.',
      countSuffix: 'گۆتار هاتینە بەلاڤکرن'
    },
    hawrami: {
      label: 'شێوەزار: هەورامی',
      back: 'گێڵایۆ پەی سەرەکی',
      title: 'پریاسکەی وتار',
      subtitle: 'یاگێ وەڵاوەکەردەیۆ وتاراو بەشداربووە پێشکەوتووەکاو پریاسکەو عەبدی.',
      countSuffix: 'وتارێ وەڵاوە کریاینە'
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
    const toast = document.getElementById('articleToast');
    const toastText = document.getElementById('articleToastText');
    if (!toast || !toastText) return;
    toastText.innerText = msg;
    toast.classList.remove('hidden');
    clearTimeout(window._articleToastTimer);
    window._articleToastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3200);
  }

  // Format Date
  function formatDate(timestamp) {
    if (!timestamp) return '';
    try {
      const d = new Date(Number(timestamp));
      return d.toLocaleDateString('ckb', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return '';
    }
  }

  // Auth check
  async function checkUserAuth() {
    const token = localStorage.getItem('ferga_token') || localStorage.getItem('seereen_token');
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        currentUser = await res.json();
        renderArticles(allArticles);
      }
    } catch (e) {
      console.warn('Auth check failed:', e);
    }
  }

  // Load Approved Articles from API
  async function loadArticles() {
    const skeleton = document.getElementById('articlesLoadingSkeleton');
    const emptyState = document.getElementById('articlesEmptyState');

    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      if (data.success && Array.isArray(data.articles)) {
        allArticles = data.articles;
        updateArticlesCount(allArticles.length);
        if (skeleton) skeleton.remove();
        renderArticles(allArticles);
      } else {
        if (skeleton) skeleton.remove();
        if (emptyState) emptyState.classList.remove('hidden');
      }
    } catch (err) {
      console.error('Error loading articles:', err);
      if (skeleton) skeleton.remove();
      if (emptyState) emptyState.classList.remove('hidden');
    }
  }

  // Update Count Badge
  function updateArticlesCount(count) {
    const el = document.getElementById('articlesCountText');
    if (!el) return;
    const info = DIALECTS[currentDialect] || DIALECTS.sorani;
    el.innerText = `${count} ${info.countSuffix}`;
  }

  // Render Articles
  function renderArticles(articles) {
    const container = document.getElementById('articlesFeed');
    const emptyState = document.getElementById('articlesEmptyState');
    if (!container) return;

    if (!articles || articles.length === 0) {
      container.innerHTML = '';
      if (emptyState) {
        container.appendChild(emptyState);
        emptyState.classList.remove('hidden');
      }
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    const role = (currentUser && currentUser.role ? currentUser.role : '').toLowerCase();
    const isAdmin = role === 'admin' || role === 'super_admin' || role === 'teacher';

    const cardsHtml = articles.map(art => {
      const authorInitial = (art.author_name || 'ق')[0];
      const authorRoleLabel = art.author_role === 'student' ? 'بەشداربووی پێشکەوتوو' : (art.author_role === 'teacher' ? 'مامۆستا' : 'ئەندام');
      const dateStr = formatDate(art.created_at);

      return `
        <article class="relative overflow-hidden rounded-3xl p-5 sm:p-8 bg-slate-900/80 border border-emerald-500/25 shadow-xl hover:border-emerald-500/40 transition-all duration-300 space-y-4">
          
          <!-- Top Row: Author Info & Approval Badge -->
          <div class="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-white/5">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                ${escapeHtml(authorInitial)}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="font-black text-sm sm:text-base text-white hover:text-emerald-300 transition-colors">
                    ${escapeHtml(art.author_name)}
                  </h4>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    ${authorRoleLabel}
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  ${dateStr ? `<i class="fa-regular fa-clock text-[10px] ml-1"></i> ${dateStr}` : ''}
                </p>
              </div>
            </div>

            <!-- Verified Approval Badge -->
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <i class="fa-solid fa-circle-check text-emerald-400"></i>
              <span>پەسەندکراوە</span>
            </div>
          </div>

          <!-- Title -->
          <h2 class="text-lg sm:text-2xl font-black text-white hover:text-emerald-300 transition-colors leading-snug">
            ${escapeHtml(art.title)}
          </h2>

          <!-- Content Body -->
          <div class="article-body-text text-sm sm:text-[15px] text-slate-300 leading-relaxed pt-1">
            ${escapeHtml(art.content)}
          </div>

          <!-- Bottom Actions: Like, Share, Admin controls -->
          <div class="flex items-center justify-between pt-4 border-t border-white/5">
            <div class="flex items-center gap-2 sm:gap-3">
              <!-- Like Button -->
              <button 
                type="button" 
                onclick="window.handleLikeArticle(${art.id}, this)"
                class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 text-xs font-bold transition cursor-pointer"
                title="پێم باشە"
              >
                <i class="fa-solid fa-heart text-rose-500"></i>
                <span class="like-count">${art.likes || 0}</span>
              </button>

              <!-- Share Button -->
              <button 
                type="button" 
                onclick="window.handleShareArticle(${art.id}, '${escapeHtml(art.title)}')"
                class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                title="هاوبەشکردن"
              >
                <i class="fa-solid fa-share-nodes text-emerald-400"></i>
                <span>هاوبەشکردن</span>
              </button>
            </div>

            <!-- Admin Actions -->
            ${isAdmin ? `
              <div class="flex items-center gap-2">
                <button 
                  type="button" 
                  onclick="window.handleAdminDeleteArticle(${art.id})" 
                  class="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  title="سڕینەوەی وتار (ئەدمین)"
                >
                  <i class="fa-solid fa-trash-can text-[11px]"></i>
                  <span>سڕینەوە</span>
                </button>
              </div>
            ` : ''}
          </div>

        </article>
      `;
    }).join('');

    container.innerHTML = cardsHtml;
  }

  // Like Article
  window.handleLikeArticle = async function(articleId, btnEl) {
    try {
      let clientId = localStorage.getItem('article_client_id');
      if (!clientId) {
        clientId = 'client_' + Math.random().toString(36).substring(2) + Date.now();
        localStorage.setItem('article_client_id', clientId);
      }

      const res = await fetch(`/api/articles/${articleId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId
        }
      });
      const data = await res.json();
      if (data.success) {
        const countEl = btnEl.querySelector('.like-count');
        if (countEl) countEl.innerText = data.likes;
        btnEl.classList.add('scale-110');
        setTimeout(() => btnEl.classList.remove('scale-110'), 200);
      }
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  // Share Article
  window.handleShareArticle = function(id, title) {
    const url = window.location.origin + '/articles#' + id;
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `کورتە وتاری «${title}» لە پریاسکەی عەبدی`,
        url: url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        showToast('بەستەری وتارەکە کۆپی کرا');
      }).catch(() => {
        showToast('نەتوانرا بەستەرەکە کۆپی بکرێت');
      });
    }
  };

  // Admin Delete Article
  window.handleAdminDeleteArticle = async function(articleId) {
    if (!confirm('ئایا دڵنیایت لە سڕینەوەی ئەم وتارە؟')) return;
    const token = localStorage.getItem('ferga_token') || localStorage.getItem('seereen_token');
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('وتارەکە سڕایەوە');
        allArticles = allArticles.filter(a => a.id !== articleId);
        updateArticlesCount(allArticles.length);
        renderArticles(allArticles);
      } else {
        alert(data.error || 'هەڵە لە سڕینەوەی وتار');
      }
    } catch (e) {
      alert('هەڵە لە پەیوەندی بە سێرڤەر');
    }
  };

  // Open / Close Write Modal on Page
  window.openPageWriteArticleModal = function() {
    const token = localStorage.getItem('ferga_token') || localStorage.getItem('seereen_token');
    if (!token) {
      alert('تکایە سەرەتا لە پەڕەی سەرەکییەوە بچۆ ژوورەوە بۆ ئەوەی بتوانیت وتار بنووسیت.');
      window.location.href = '/';
      return;
    }
    const modal = document.getElementById('modalArticlePageWrite');
    if (modal) modal.classList.remove('hidden');
  };

  window.closePageWriteArticleModal = function() {
    const modal = document.getElementById('modalArticlePageWrite');
    if (modal) modal.classList.add('hidden');
  };

  // Handle Submit Article from Dedicated Page
  window.handlePageSubmitArticle = async function(e) {
    e.preventDefault();
    const token = localStorage.getItem('ferga_token') || localStorage.getItem('seereen_token');
    if (!token) {
      alert('تکایە سەرەتا بچۆ ژوورەوە');
      return;
    }

    const titleInput = document.getElementById('pageArticleTitleInput');
    const contentInput = document.getElementById('pageArticleContentInput');
    const btn = document.getElementById('pageArticleSubmitBtn');

    const title = titleInput ? titleInput.value.trim() : '';
    const content = contentInput ? contentInput.value.trim() : '';

    if (!title || !content) {
      alert('تکایە ناونیشان و دەقی کورتە وتارەکە بنووسە');
      return;
    }

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>لە چاوەڕوانیدا...</span>';
      }

      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content })
      });

      const data = await res.json();
      if (data.success) {
        closePageWriteArticleModal();
        if (titleInput) titleInput.value = '';
        if (contentInput) contentInput.value = '';
        alert('دەستخۆش! وتارەکەت بە سەرکەوتوویی نێردرا.\n\nتێبینی: وتارەکەت پاش پێداچوونەوە لەلایەن ئەدمین، بە ناوی خۆتەوە لە پەڕەی پریاسکەی وتار بڵاودەکرێتەوە.');
      } else {
        alert(data.error || 'هەڵە لە ناردنی وتار');
      }
    } catch (err) {
      alert('هەڵە لە پەیوەندی بە سێرڤەر');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i><span>ناردن بۆ چاودێری</span>';
      }
    }
  };

  // Search Filter
  function initSearch() {
    const input = document.getElementById('articleSearchInput');
    if (!input) return;

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        renderArticles(allArticles);
        return;
      }
      const filtered = allArticles.filter(a => {
        const titleMatch = (a.title || '').toLowerCase().includes(q);
        const contentMatch = (a.content || '').toLowerCase().includes(q);
        const authorMatch = (a.author_name || '').toLowerCase().includes(q);
        return titleMatch || contentMatch || authorMatch;
      });
      renderArticles(filtered);
    });
  }

  // Dialect Switching
  function applyDialect(dialect) {
    currentDialect = dialect;
    localStorage.setItem('pryaska_dialect', dialect);
    const info = DIALECTS[dialect] || DIALECTS.sorani;

    const labelEl = document.getElementById('currentDialectLabel');
    if (labelEl) labelEl.innerText = info.label;

    const backEl = document.getElementById('txtBackToHome');
    if (backEl) backEl.innerText = info.back;

    const titleEl = document.getElementById('heroTitle');
    if (titleEl) titleEl.innerText = info.title;

    const subEl = document.getElementById('heroSubtitle');
    if (subEl) subEl.innerText = info.subtitle;

    updateArticlesCount(allArticles.length);

    document.querySelectorAll('.dialect-opt').forEach(btn => {
      const check = btn.querySelector('.checkmark');
      if (btn.dataset.dialect === dialect) {
        if (check) check.classList.remove('opacity-0');
      } else {
        if (check) check.classList.add('opacity-0');
      }
    });
  }

  function initDialectDropdown() {
    const btn = document.getElementById('dialectDropdownBtn');
    const menu = document.getElementById('dialectDropdownMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      menu.classList.add('hidden');
    });

    document.querySelectorAll('.dialect-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        applyDialect(opt.dataset.dialect);
        menu.classList.add('hidden');
      });
    });

    applyDialect(currentDialect);
  }

  // Theme Toggle
  function initThemeToggle() {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }
    });
  }

  // Button binding
  function initButtons() {
    const btn = document.getElementById('btnOpenWriteArticle');
    if (btn) {
      btn.addEventListener('click', openPageWriteArticleModal);
    }
  }

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initDialectDropdown();
    initSearch();
    initButtons();
    checkUserAuth();
    loadArticles();
  });

})();
