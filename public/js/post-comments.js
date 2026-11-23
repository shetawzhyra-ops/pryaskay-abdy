/**
 * Unified Public Comments Widget — Modern Heritage Manuscript Luxe
 * Powers public comments across:
 *   - /poems   (پریاسکەی ئەدەبی / دیوان -> 'poem')
 *   - /articles (پریاسکەی وتار -> 'article')
 *   - /dreams   (خەونە لێکدراوەکان -> 'dream')
 */
(function () {
  'use strict';

  if (window.__pryaskaPostCommentsInit) return;
  window.__pryaskaPostCommentsInit = true;

  const FEED_CONFIG = [
    { feedId: 'poemsFeed', type: 'poem' },
    { feedId: 'articlesFeed', type: 'article' },
    { feedId: 'dreamPostsFeed', type: 'dream' }
  ];

  const expandedKeys = new Set(); // "type:id"
  const commentsCache = new Map(); // "type:id" -> array
  const countsCache = new Map(); // "type:id" -> number
  const fetchedCountTypes = new Set();

  function getClientId() {
    let cid = localStorage.getItem('pryaska_public_client_id') || localStorage.getItem('ferga_client_device_id') || localStorage.getItem('client_id');
    if (!cid) {
      cid = 'visitor_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      try { localStorage.setItem('pryaska_public_client_id', cid); } catch (e) {}
    }
    return cid;
  }

  function getAuthToken() {
    try {
      return localStorage.getItem('ferga_token') || localStorage.getItem('seereen_token') || '';
    } catch (e) {
      return '';
    }
  }

  function getDefaultAuthorName() {
    try {
      const saved = localStorage.getItem('pryaska_comment_author');
      if (saved && saved.trim()) return saved.trim();
      const rawUser = localStorage.getItem('ferga_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const uname = String(u.username || '').toLowerCase();
        if (uname === 'azad' || u.id === 6 || (u.full_name || '').includes('ئازاد')) return 'م. ئازاد';
        return u.username || u.full_name || '';
      }
    } catch (e) {}
    return '';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatCommentTime(ts) {
    if (!ts) return '';
    const diff = Math.max(0, Date.now() - Number(ts));
    if (diff < 60 * 1000) return 'ئێستا';
    if (diff < 60 * 60 * 1000) return `پێش ${Math.floor(diff / 60000)} خولەک`;
    if (diff < 24 * 60 * 60 * 1000) return `پێش ${Math.floor(diff / 3600000)} کاتژمێر`;
    try {
      return new Date(Number(ts)).toLocaleDateString('ckb-IQ', { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  function roleBadgeHtml(role) {
    const r = String(role || 'visitor').toLowerCase();
    if (r === 'super_admin' || r === 'teacher') {
      return '<span class="pc-role pc-role-teacher">مامۆستا</span>';
    }
    if (r === 'admin') {
      return '<span class="pc-role pc-role-admin">بەڕێوەبەر</span>';
    }
    if (r === 'student' || r === 'new_student') {
      return '<span class="pc-role pc-role-member">فێرخواز</span>';
    }
    return '<span class="pc-role pc-role-visitor">میوان</span>';
  }

  function injectStyles() {
    if (document.getElementById('pryaskaPublicCommentsStyles')) return;
    const style = document.createElement('style');
    style.id = 'pryaskaPublicCommentsStyles';
    style.textContent = `
      .pc-toggle-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.375rem 0.85rem;
        border-radius: 9999px;
        background: linear-gradient(145deg, #fbf7f0 0%, #efe1cc 100%);
        border: 1px solid rgba(156, 120, 78, 0.36);
        color: #54371f;
        font-size: 0.75rem;
        font-weight: 800;
        cursor: pointer;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82), 0 2px 6px -2px rgba(42, 24, 10, 0.10);
        transition: all 0.2s ease;
      }
      .pc-toggle-btn:hover,
      .pc-toggle-btn.is-open {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        border-color: rgba(180, 83, 9, 0.55);
        color: #2b1406;
        transform: translateY(-1px);
      }
      .pc-toggle-btn i { color: #b45309; transition: color 0.2s ease; }
      .pc-toggle-btn:hover i,
      .pc-toggle-btn.is-open i { color: #2b1406; }
      .pc-count-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.2rem;
        height: 1.2rem;
        padding: 0 0.32rem;
        border-radius: 9999px;
        background: rgba(180, 83, 9, 0.14);
        color: #78350f;
        font-size: 0.7rem;
        font-weight: 900;
      }
      .pc-toggle-btn.is-open .pc-count-pill,
      .pc-toggle-btn:hover .pc-count-pill {
        background: rgba(255, 255, 255, 0.65);
        color: #361c0c;
      }

      .pc-drawer {
        margin-top: 0.85rem;
        padding: 1rem 1.1rem;
        border-radius: 1.25rem;
        background: linear-gradient(166deg, rgba(251, 247, 240, 0.96) 0%, rgba(241, 229, 210, 0.94) 100%);
        border: 1px solid rgba(156, 120, 78, 0.32);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
        color: #361c0c;
      }
      .fb-post-card .pc-drawer {
        margin: 0 1rem 1rem 1rem;
      }
      @media (min-width: 640px) {
        .fb-post-card .pc-drawer {
          margin: 0 1.25rem 1.25rem 1.25rem;
        }
      }
      .pc-drawer.hidden { display: none; }

      .pc-form {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        padding-bottom: 0.85rem;
        border-bottom: 1px solid rgba(156, 120, 78, 0.22);
      }
      .pc-form-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: stretch;
      }
      .pc-name-input {
        flex: 0 0 auto;
        width: 100%;
        padding: 0.55rem 0.85rem;
        border-radius: 0.85rem;
        background: #ffffff;
        border: 1px solid rgba(156, 120, 78, 0.36);
        color: #361c0c;
        font-size: 0.8rem;
        font-weight: 700;
        outline: none;
      }
      @media (min-width: 560px) {
        .pc-name-input { width: 175px; }
      }
      .pc-text-input {
        flex: 1 1 200px;
        min-height: 40px;
        max-height: 110px;
        padding: 0.55rem 0.85rem;
        border-radius: 0.85rem;
        background: #ffffff;
        border: 1px solid rgba(156, 120, 78, 0.36);
        color: #361c0c;
        font-size: 0.84rem;
        line-height: 1.55;
        resize: vertical;
        outline: none;
      }
      .pc-name-input:focus,
      .pc-text-input:focus {
        border-color: rgba(217, 119, 6, 0.88);
        box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.20);
      }
      .pc-submit-btn {
        padding: 0.55rem 1.05rem;
        border-radius: 0.85rem;
        border: 1px solid rgba(180, 83, 9, 0.55);
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 55%, #d97706 100%);
        color: #ffffff !important;
        font-size: 0.8rem;
        font-weight: 800;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        box-shadow: 0 4px 12px -3px rgba(180, 83, 9, 0.36), inset 0 1px 0 rgba(255, 250, 230, 0.65);
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      .pc-submit-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }
      .pc-submit-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

      .pc-error {
        font-size: 0.76rem;
        font-weight: 700;
        color: #be123c;
        background: rgba(225, 29, 72, 0.08);
        border: 1px solid rgba(225, 29, 72, 0.25);
        border-radius: 0.7rem;
        padding: 0.4rem 0.7rem;
      }
      .pc-error.hidden { display: none; }

      .pc-list {
        margin-top: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        max-height: 360px;
        overflow-y: auto;
      }
      .pc-empty {
        text-align: center;
        padding: 0.85rem 0.5rem;
        font-size: 0.8rem;
        color: #785336;
        font-weight: 600;
      }
      .pc-item {
        padding: 0.68rem 0.85rem;
        border-radius: 0.95rem;
        background: rgba(255, 253, 249, 0.92);
        border: 1px solid rgba(156, 120, 78, 0.24);
        box-shadow: 0 2px 6px -3px rgba(42, 24, 10, 0.08);
      }
      .pc-item-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.28rem;
      }
      .pc-author-wrap {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        flex-wrap: wrap;
        min-width: 0;
      }
      .pc-avatar {
        width: 1.65rem;
        height: 1.65rem;
        border-radius: 0.55rem;
        background: linear-gradient(145deg, #fbbf24 0%, #d97706 100%);
        color: #241206;
        font-size: 0.75rem;
        font-weight: 900;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        shrink: 0;
      }
      .pc-author-name {
        font-size: 0.8rem;
        font-weight: 800;
        color: #361c0c;
      }
      .pc-role {
        font-size: 0.65rem;
        font-weight: 800;
        padding: 0.08rem 0.45rem;
        border-radius: 999px;
      }
      .pc-role-teacher { background: rgba(217, 119, 6, 0.16); border: 1px solid rgba(180, 83, 9, 0.35); color: #92400e; }
      .pc-role-admin { background: rgba(45, 98, 69, 0.16); border: 1px solid rgba(45, 98, 69, 0.34); color: #1e5237; }
      .pc-role-member { background: rgba(134, 184, 156, 0.24); border: 1px solid rgba(61, 122, 89, 0.32); color: #1e5237; }
      .pc-role-visitor { background: rgba(228, 212, 189, 0.65); border: 1px solid rgba(156, 120, 78, 0.28); color: #785336; }

      .pc-meta-right {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        shrink: 0;
      }
      .pc-time {
        font-size: 0.68rem;
        color: #785336;
        font-weight: 600;
      }
      .pc-del-btn {
        border: none;
        background: rgba(225, 29, 72, 0.10);
        color: #be123c;
        width: 1.55rem;
        height: 1.55rem;
        border-radius: 0.5rem;
        font-size: 0.68rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }
      .pc-del-btn:hover { background: rgba(225, 29, 72, 0.22); }
      .pc-body {
        font-size: 0.83rem;
        line-height: 1.75;
        color: #462a16;
        white-space: pre-line;
        word-break: break-word;
        padding-right: 2.1rem;
      }
    `;
    document.head.appendChild(style);
  }

  function extractEntityId(article, type) {
    const explicit = article.getAttribute('data-comment-id') || article.getAttribute('data-post-id');
    if (explicit && /^\d+$/.test(explicit)) return Number(explicit);

    if (type === 'poem') {
      const btn = article.querySelector('[id^="btnLikePoem_"], button[onclick*="reactToPoem("]');
      if (btn) {
        const m = (btn.id || btn.getAttribute('onclick') || '').match(/(\d+)/);
        if (m) return Number(m[1]);
      }
    } else if (type === 'article') {
      const btn = article.querySelector('button[onclick*="handleLikeArticle("]');
      if (btn) {
        const m = (btn.getAttribute('onclick') || '').match(/handleLikeArticle\((\d+)/);
        if (m) return Number(m[1]);
      }
    } else if (type === 'dream') {
      const btn = article.querySelector('[data-post-id]');
      if (btn) return Number(btn.getAttribute('data-post-id'));
    }
    return 0;
  }

  function findActionRow(article, type) {
    if (type === 'poem') {
      const shareBtn = article.querySelector('button[onclick*="sharePoem("]');
      return shareBtn ? shareBtn.parentElement : null;
    }
    if (type === 'article') {
      const likeBtn = article.querySelector('button[onclick*="handleLikeArticle("]');
      return likeBtn ? likeBtn.parentElement : null;
    }
    if (type === 'dream') {
      const reactBtn = article.querySelector('.dream-react-pill');
      return reactBtn ? reactBtn.parentElement : null;
    }
    return null;
  }

  function keyOf(type, id) {
    return `${type}:${id}`;
  }

  function renderCommentsIntoDrawer(drawer, type, id) {
    const listEl = drawer.querySelector('.pc-list');
    if (!listEl) return;
    const key = keyOf(type, id);
    const items = commentsCache.get(key);

    if (!items) {
      listEl.innerHTML = '<div class="pc-empty">بارکردنی کۆمێنتەکان...</div>';
      return;
    }
    if (items.length === 0) {
      listEl.innerHTML = '<div class="pc-empty">هێشتا هیچ کۆمێنتێک نییە — یەکەم کەس بە بۆ نووسینی کۆمێنت!</div>';
      return;
    }

    listEl.innerHTML = items.map((c) => {
      const initial = (String(c.author_name || 'س').trim()[0]) || 'س';
      return `
        <div class="pc-item" data-comment-row="${c.id}">
          <div class="pc-item-head">
            <div class="pc-author-wrap">
              <span class="pc-avatar">${escapeHtml(initial)}</span>
              <span class="pc-author-name">${escapeHtml(c.author_name)}</span>
              ${roleBadgeHtml(c.author_role)}
            </div>
            <div class="pc-meta-right">
              <span class="pc-time">${escapeHtml(formatCommentTime(c.created_at))}</span>
              ${c.can_delete ? `<button type="button" class="pc-del-btn" data-del-comment="${c.id}" title="سڕینەوەی کۆمێنت"><i class="fa-solid fa-trash-can"></i></button>` : ''}
            </div>
          </div>
          <div class="pc-body">${escapeHtml(c.content)}</div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('[data-del-comment]').forEach((delBtn) => {
      delBtn.addEventListener('click', () => handleDeleteComment(type, id, Number(delBtn.getAttribute('data-del-comment'))));
    });
  }

  function updateCountUI(type, id, count) {
    const key = keyOf(type, id);
    countsCache.set(key, Number(count) || 0);
    document.querySelectorAll(`.pc-toggle-btn[data-comment-key="${key}"] .pc-count-pill`).forEach((el) => {
      el.textContent = String(Number(count) || 0);
    });
  }

  async function fetchCommentsForPost(type, id) {
    const key = keyOf(type, id);
    const headers = { 'x-client-id': getClientId() };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/comments/${type}/${id}`, { headers });
      const data = await res.json();
      if (data && data.success) {
        commentsCache.set(key, data.comments || []);
        updateCountUI(type, id, data.count || 0);
        document.querySelectorAll(`.pc-drawer[data-comment-key="${key}"]`).forEach((drawer) => {
          renderCommentsIntoDrawer(drawer, type, id);
        });
      }
    } catch (e) {
      document.querySelectorAll(`.pc-drawer[data-comment-key="${key}"] .pc-list`).forEach((el) => {
        el.innerHTML = '<div class="pc-empty">نەتوانرا کۆمێنتەکان باربکرێن.</div>';
      });
    }
  }

  async function handleSubmitComment(type, id, drawer) {
    const nameInput = drawer.querySelector('.pc-name-input');
    const textInput = drawer.querySelector('.pc-text-input');
    const errEl = drawer.querySelector('.pc-error');
    const btn = drawer.querySelector('.pc-submit-btn');

    const showErr = (msg) => {
      if (!errEl) return;
      errEl.textContent = msg;
      errEl.classList.remove('hidden');
    };
    if (errEl) errEl.classList.add('hidden');

    const authorName = (nameInput ? nameInput.value : '').replace(/\s+/g, ' ').trim();
    const content = (textInput ? textInput.value : '').trim();

    if (authorName.length < 2) {
      showErr('تکایە سەرەتا ناوەکەت بنووسە (بەلایەنی کەم ٢ پیت).');
      if (nameInput) nameInput.focus();
      return;
    }
    if (content.length < 2) {
      showErr('تکایە کۆمێنتەکەت بنووسە.');
      if (textInput) textInput.focus();
      return;
    }

    try { localStorage.setItem('pryaska_comment_author', authorName); } catch (e) {}

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>ناردن...</span>';
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-client-id': getClientId()
      };
      const token = getAuthToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/comments/${type}/${id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ author_name: authorName, content, client_id: getClientId() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showErr((data && data.error) || 'نەتوانرا کۆمێنتەکە بنێردرێت.');
        return;
      }

      if (textInput) textInput.value = '';
      const key = keyOf(type, id);
      const prev = commentsCache.get(key) || [];
      if (!prev.some((c) => c.id === data.comment.id)) {
        commentsCache.set(key, [data.comment, ...prev]);
      }
      updateCountUI(type, id, data.count);
      renderCommentsIntoDrawer(drawer, type, id);
    } catch (e) {
      showErr('هەڵە لە پەیوەندی بە سێرڤەرەوە.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i><span>ناردن</span>';
      }
    }
  }

  async function handleDeleteComment(type, id, commentId) {
    if (!confirm('دڵنیایت لە سڕینەوەی ئەم کۆمێنتە؟')) return;
    const headers = { 'x-client-id': getClientId() };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (res.ok && data.success) {
        const key = keyOf(type, id);
        const list = (commentsCache.get(key) || []).filter((c) => c.id !== commentId);
        commentsCache.set(key, list);
        updateCountUI(type, id, data.count);
        document.querySelectorAll(`.pc-drawer[data-comment-key="${key}"]`).forEach((drawer) => {
          renderCommentsIntoDrawer(drawer, type, id);
        });
      }
    } catch (e) {}
  }

  async function loadBatchCounts(type) {
    if (fetchedCountTypes.has(type)) return;
    fetchedCountTypes.add(type);
    try {
      const res = await fetch(`/api/comments/counts?type=${encodeURIComponent(type)}`);
      const data = await res.json();
      if (data && data.success && data.counts) {
        for (const [idStr, cnt] of Object.entries(data.counts)) {
          updateCountUI(type, idStr, cnt);
        }
      }
    } catch (e) {
      fetchedCountTypes.delete(type);
    }
  }

  function enhanceCard(article, type) {
    if (article.dataset.pcEnhanced === '1') return;
    const id = extractEntityId(article, type);
    if (!id) return;
    const actionRow = findActionRow(article, type);
    if (!actionRow) return;

    article.dataset.pcEnhanced = '1';
    const key = keyOf(type, id);
    const knownCount = countsCache.has(key) ? countsCache.get(key) : 0;
    const isOpen = expandedKeys.has(key);

    // 1. Toggle button pill in action row
    if (!actionRow.querySelector(`.pc-toggle-btn[data-comment-key="${key}"]`)) {
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = `pc-toggle-btn ${isOpen ? 'is-open' : ''}`;
      toggleBtn.setAttribute('data-comment-key', key);
      toggleBtn.setAttribute('data-comment-type', type);
      toggleBtn.setAttribute('data-comment-id', String(id));
      toggleBtn.title = 'کۆمێنتەکان';
      toggleBtn.innerHTML = `
        <i class="fa-regular fa-comment-dots text-[12px]"></i>
        <span>کۆمێنت</span>
        <span class="pc-count-pill font-latin">${knownCount}</span>
      `;

      toggleBtn.addEventListener('click', () => {
        const drawer = article.querySelector(`.pc-drawer[data-comment-key="${key}"]`);
        if (!drawer) return;
        const nowOpen = drawer.classList.contains('hidden');
        if (nowOpen) {
          expandedKeys.add(key);
          drawer.classList.remove('hidden');
          toggleBtn.classList.add('is-open');
          if (!commentsCache.has(key)) {
            fetchCommentsForPost(type, id);
          } else {
            renderCommentsIntoDrawer(drawer, type, id);
          }
          setTimeout(() => {
            const nameInp = drawer.querySelector('.pc-name-input');
            const txtInp = drawer.querySelector('.pc-text-input');
            if (nameInp && !nameInp.value.trim()) nameInp.focus();
            else if (txtInp) txtInp.focus();
          }, 40);
        } else {
          expandedKeys.delete(key);
          drawer.classList.add('hidden');
          toggleBtn.classList.remove('is-open');
        }
      });

      actionRow.appendChild(toggleBtn);
    }

    // 2. Collapsible Comment Drawer at bottom of card
    if (!article.querySelector(`.pc-drawer[data-comment-key="${key}"]`)) {
      const drawer = document.createElement('div');
      drawer.className = `pc-drawer ${isOpen ? '' : 'hidden'}`;
      drawer.setAttribute('data-comment-key', key);
      const savedAuthor = getDefaultAuthorName();

      drawer.innerHTML = `
        <form class="pc-form" novalidate>
          <div class="pc-form-row">
            <input type="text" class="pc-name-input" maxlength="50" placeholder="ناوت بنووسە..." value="${escapeHtml(savedAuthor)}" required />
            <textarea class="pc-text-input" rows="1" maxlength="800" placeholder="کۆمێنتەکەت لێرە بنووسە..." required></textarea>
            <button type="submit" class="pc-submit-btn">
              <i class="fa-solid fa-paper-plane"></i>
              <span>ناردن</span>
            </button>
          </div>
          <div class="pc-error hidden"></div>
        </form>
        <div class="pc-list"></div>
      `;

      const form = drawer.querySelector('.pc-form');
      const textArea = drawer.querySelector('.pc-text-input');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSubmitComment(type, id, drawer);
      });
      if (textArea) {
        textArea.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmitComment(type, id, drawer);
          }
        });
      }

      article.appendChild(drawer);
      if (isOpen) {
        renderCommentsIntoDrawer(drawer, type, id);
      }
    }
  }

  function scanFeed(feedEl, type) {
    if (!feedEl) return;
    loadBatchCounts(type);
    feedEl.querySelectorAll('article').forEach((article) => enhanceCard(article, type));
  }

  function setupObservers() {
    injectStyles();
    for (const cfg of FEED_CONFIG) {
      const feedEl = document.getElementById(cfg.feedId);
      if (!feedEl) continue;
      scanFeed(feedEl, cfg.type);
      const obs = new MutationObserver(() => scanFeed(feedEl, cfg.type));
      obs.observe(feedEl, { childList: true });
    }
  }

  // Real-time Socket.IO listener across visitors
  function setupRealtimeSocket() {
    try {
      if (typeof io === 'undefined') return;
      const socket = window.__pryaskaPublicCommentsSocket || io();
      window.__pryaskaPublicCommentsSocket = socket;

      socket.on('public_comment_created', (payload) => {
        if (!payload || !payload.type || !payload.entityId) return;
        const key = keyOf(payload.type, payload.entityId);
        updateCountUI(payload.type, payload.entityId, payload.count);
        if (expandedKeys.has(key)) {
          fetchCommentsForPost(payload.type, payload.entityId);
        } else {
          commentsCache.delete(key);
        }
      });

      socket.on('public_comment_deleted', (payload) => {
        if (!payload || !payload.type || !payload.entityId) return;
        const key = keyOf(payload.type, payload.entityId);
        updateCountUI(payload.type, payload.entityId, payload.count);
        if (commentsCache.has(key)) {
          const filtered = commentsCache.get(key).filter((c) => c.id !== payload.commentId);
          commentsCache.set(key, filtered);
          document.querySelectorAll(`.pc-drawer[data-comment-key="${key}"]`).forEach((drawer) => {
            renderCommentsIntoDrawer(drawer, payload.type, payload.entityId);
          });
        }
      });
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupObservers();
      setupRealtimeSocket();
    });
  } else {
    setupObservers();
    setupRealtimeSocket();
  }
})();
