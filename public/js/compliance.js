/**
 * Store Compliance Module — Apple App Store & Google Play Readiness
 * 1. Self-service Account & Data Deletion (Apple Guideline 5.1.1(v) & Google Play Data Safety)
 * 2. UGC Reporting & 24h Admin Moderation Queue (Apple Guideline 1.2 & Google Play UGC)
 * 3. Instant User-to-User Blocking & Unblocking
 */
(function () {
  'use strict';

  const REPORT_REASONS = [
    { value: 'inappropriate', label: 'ناوەڕۆکی نەشیاو یان نەگونجاو' },
    { value: 'harassment', label: 'هەراسانکردن، بێڕێزی یان هەڕەشە' },
    { value: 'hate_speech', label: 'وتاری ڕق و کینە و سووکایەتی' },
    { value: 'spam', label: 'سپام، دووبارەکردنەوە یان ڕیکلامی بێ مۆڵەت' },
    { value: 'privacy', label: 'بڵاوکردنەوەی زانیاریی تایبەتی کەسانی تر' },
    { value: 'copyright', label: 'پێشێلکردنی مافی خاوەندارێتی (Copyright)' },
    { value: 'other', label: 'هۆکاری تر' }
  ];

  const REASON_LABELS = Object.fromEntries(REPORT_REASONS.map((r) => [r.value, r.label]));

  const TARGET_LABELS = {
    comment: 'کۆمێنتی گشتی',
    message: 'پەیامی چاتی پۆل',
    custom_group_message: 'پەیامی گروپ چات',
    article: 'وتار',
    poem: 'شیعر',
    dream: 'خەون',
    user: 'هەژماری بەکارهێنەر'
  };

  window.pryaskaBlockedUserIds = new Set();
  window.pryaskaBlockedUsersList = [];

  function getAuthToken() {
    try {
      return (typeof token !== 'undefined' && token) ||
        localStorage.getItem('ferga_token') ||
        localStorage.getItem('seereen_token') ||
        '';
    } catch (e) {
      return '';
    }
  }

  function getClientId() {
    try {
      let cid = localStorage.getItem('pryaska_public_client_id') || localStorage.getItem('ferga_client_device_id');
      if (!cid) {
        cid = 'client_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        localStorage.setItem('pryaska_public_client_id', cid);
      }
      return cid;
    } catch (e) {
      return 'client_guest';
    }
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function notify(msg, type = 'info') {
    if (typeof showToast === 'function') {
      showToast(msg, type === 'error' ? 'error' : 'success');
      return;
    }
    alert(msg);
  }

  function applyBlockedDomFilter() {
    const blocked = window.pryaskaBlockedUserIds;
    document.querySelectorAll('[data-sender-id]').forEach((el) => {
      const uid = Number(el.getAttribute('data-sender-id'));
      if (uid && blocked.has(uid)) {
        el.classList.add('hidden');
      } else {
        el.classList.remove('hidden');
      }
    });
  }

  window.isUserBlockedByMe = function (userId) {
    const uid = Number(userId);
    return Boolean(uid && window.pryaskaBlockedUserIds.has(uid));
  };

  window.loadMyBlockedUsers = async function () {
    const t = getAuthToken();
    if (!t) {
      window.pryaskaBlockedUserIds = new Set();
      window.pryaskaBlockedUsersList = [];
      return;
    }
    try {
      const res = await fetch('/api/users/blocks', {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success) {
        window.pryaskaBlockedUserIds = new Set((data.blockedIds || []).map(Number));
        window.pryaskaBlockedUsersList = data.blocked || [];
        applyBlockedDomFilter();
      }
    } catch (e) {}
  };

  window.toggleBlockUser = async function (targetUserId, targetName = '') {
    const uid = Number(targetUserId);
    const t = getAuthToken();
    if (!uid || !t) return;

    const alreadyBlocked = window.pryaskaBlockedUserIds.has(uid);
    const confirmMsg = alreadyBlocked
      ? `ئایا دڵنیایت لە هەڵوەشاندنەوەی بلۆکی «${targetName || 'ئەم بەکارهێنەرە'}»؟`
      : `ئایا دڵنیایت لە بلۆککردنی «${targetName || 'ئەم بەکارهێنەرە'}»؟\nدەستبەجێ هەموو پەیامەکانی لات دەشاردرێنەوە.`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(alreadyBlocked ? `/api/users/blocks/${uid}` : '/api/users/blocks', {
        method: alreadyBlocked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t}`
        },
        body: alreadyBlocked ? undefined : JSON.stringify({ blocked_user_id: uid })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        notify(data.error || 'کردارەکە سەرکەوتوو نەبوو', 'error');
        return;
      }
      window.pryaskaBlockedUserIds = new Set((data.blockedIds || []).map(Number));
      window.pryaskaBlockedUsersList = data.blocked || [];
      applyBlockedDomFilter();
      notify(data.message || (alreadyBlocked ? 'بلۆک هەڵوەشێنرایەوە' : 'بەکارهێنەر بلۆک کرا'), 'success');

      // Refresh profile safety button if open
      const btn = document.getElementById('profBlockUserBtn');
      if (btn && Number(btn.dataset.userId) === uid) {
        const nowBlocked = window.pryaskaBlockedUserIds.has(uid);
        btn.innerHTML = nowBlocked
          ? '<i class="fa-solid fa-user-check"></i><span>هەڵوەشاندنەوەی بلۆک</span>'
          : '<i class="fa-solid fa-user-slash"></i><span>بلۆککردنی بەکارهێنەر</span>';
      }
      const listEl = document.getElementById('blockedUsersListBody');
      if (listEl && !document.getElementById('blockedUsersModal')?.classList.contains('hidden')) {
        renderBlockedUsersList();
      }
    } catch (e) {
      notify('هەڵە لە پەیوەندی بە سێرڤەرەوە', 'error');
    }
  };

  function ensureComplianceModals() {
    if (document.getElementById('complianceModalsRoot')) return;
    const root = document.createElement('div');
    root.id = 'complianceModalsRoot';
    root.innerHTML = `
      <!-- 1. UGC Report Content / User Modal -->
      <div id="contentReportModal" class="hidden fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-amber-800/30 bg-[#f6eee0] dark:bg-[#132119] text-[#361c0c] dark:text-[#fff8eb] space-y-4">
          <div class="flex items-center justify-between border-b border-amber-900/20 dark:border-amber-500/20 pb-3">
            <h3 class="font-black text-base flex items-center gap-2">
              <i class="fa-solid fa-flag text-rose-600"></i>
              <span>ڕاپۆرتکردنی ناوەڕۆک یان سەرپێچی</span>
            </h3>
            <button type="button" onclick="closeContentReportModal()" class="w-8 h-8 rounded-xl bg-amber-900/10 hover:bg-amber-900/20 flex items-center justify-center cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <p id="reportTargetSummary" class="text-xs opacity-80 bg-amber-900/5 dark:bg-white/5 p-2.5 rounded-xl border border-amber-900/15"></p>
          <form id="contentReportForm" class="space-y-3">
            <div>
              <label class="block text-xs font-bold mb-1.5">هۆکاری ڕاپۆرتکردن:</label>
              <select id="reportReasonSelect" class="w-full px-3 py-2.5 rounded-xl border border-amber-900/30 bg-white dark:bg-[#1b2e23] text-sm font-bold outline-none">
                ${REPORT_REASONS.map((r) => `<option value="${r.value}">${esc(r.label)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold mb-1.5">تێبینی زیاتر (ئارەزوومەندانە):</label>
              <textarea id="reportDetailsInput" rows="3" maxlength="500" placeholder="وردەکاری بنووسە بۆ یارمەتیدانی تیمی چاودێری..." class="w-full px-3 py-2 rounded-xl border border-amber-900/30 bg-white dark:bg-[#1b2e23] text-xs outline-none"></textarea>
            </div>
            <p class="text-[11px] opacity-75 leading-relaxed">
              تیمی بەڕێوەبەرایەتی لە ماوەی کەمتر لە ٢٤ کاتژمێردا پێداچوونەوە بە ڕاپۆرتەکەتدا دەکات.
            </p>
            <div class="flex items-center justify-end gap-2 pt-1">
              <button type="button" onclick="closeContentReportModal()" class="px-4 py-2 rounded-xl text-xs font-bold border border-amber-900/25 cursor-pointer">پاشگەزبوونەوە</button>
              <button type="submit" id="submitContentReportBtn" class="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow cursor-pointer">ناردنی ڕاپۆرت</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 2. Self-Service Permanent Account Deletion Modal -->
      <div id="selfDeleteAccountModal" class="hidden fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div class="w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-rose-500/40 bg-[#f6eee0] dark:bg-[#132119] text-[#361c0c] dark:text-[#fff8eb] space-y-4">
          <div class="flex items-center justify-between border-b border-rose-500/25 pb-3">
            <h3 class="font-black text-base text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>سڕینەوەی هەژمار و داتاکانم</span>
            </h3>
            <button type="button" onclick="closeSelfDeleteAccountModal()" class="w-8 h-8 rounded-xl bg-amber-900/10 hover:bg-amber-900/20 flex items-center justify-center cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="p-3 rounded-2xl bg-rose-600/10 border border-rose-500/30 text-xs leading-relaxed text-rose-800 dark:text-rose-200 font-bold">
            ئاگاداربە: سڕینەوەی هەژمار کردارێکی یەکجارەکییە و ناگەڕێتەوە. تەواوی زانیارییە کەسییەکانت، نامە تایبەتەکانت، نۆتیفیکەیشنەکان و تۆمارەکانت بە یەکجاری دەسڕدرێنەوە.
          </div>
          <form id="selfDeleteAccountForm" class="space-y-3">
            <div>
              <label class="block text-xs font-bold mb-1.5">بۆ دڵنیابوونەوە، وشەی نهێنیی ئێستات بنووسە:</label>
              <input type="password" id="selfDeletePasswordInput" required placeholder="وشەی نهێنی..." class="w-full px-3.5 py-2.5 rounded-xl border border-rose-500/35 bg-white dark:bg-[#1b2e23] text-sm outline-none">
            </div>
            <div class="flex items-center justify-end gap-2 pt-1">
              <button type="button" onclick="closeSelfDeleteAccountModal()" class="px-4 py-2 rounded-xl text-xs font-bold border border-amber-900/25 cursor-pointer">پاشگەزبوونەوە</button>
              <button type="submit" id="confirmSelfDeleteBtn" class="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow cursor-pointer">بەڵێ، هەژمارەکەم بسڕەوە</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 3. Blocked Users Management Modal -->
      <div id="blockedUsersModal" class="hidden fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-amber-800/30 bg-[#f6eee0] dark:bg-[#132119] text-[#361c0c] dark:text-[#fff8eb] space-y-4">
          <div class="flex items-center justify-between border-b border-amber-900/20 dark:border-amber-500/20 pb-3">
            <h3 class="font-black text-base flex items-center gap-2">
              <i class="fa-solid fa-user-slash text-amber-600"></i>
              <span>لیستی بەکارهێنەرە بلۆککراوەکان</span>
            </h3>
            <button type="button" onclick="closeBlockedUsersModal()" class="w-8 h-8 rounded-xl bg-amber-900/10 hover:bg-amber-900/20 flex items-center justify-center cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div id="blockedUsersListBody" class="space-y-2 max-h-72 overflow-y-auto"></div>
        </div>
      </div>

      <!-- 4. Admin UGC Reports Moderation Modal -->
      <div id="adminReportsModal" class="hidden fixed inset-0 z-[92] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl p-5 sm:p-6 shadow-2xl border border-amber-800/30 bg-[#f6eee0] dark:bg-[#132119] text-[#361c0c] dark:text-[#fff8eb] space-y-4">
          <div class="flex items-center justify-between border-b border-amber-900/20 dark:border-amber-500/20 pb-3 shrink-0">
            <h3 class="font-black text-base flex items-center gap-2">
              <i class="fa-solid fa-shield-halved text-rose-600"></i>
              <span>ڕاپۆرتەکانی بەکارهێنەران (چاودێریی ناوەڕۆک)</span>
            </h3>
            <button type="button" onclick="closeAdminReportsModal()" class="w-8 h-8 rounded-xl bg-amber-900/10 hover:bg-amber-900/20 flex items-center justify-center cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div id="adminReportsListBody" class="flex-1 overflow-y-auto space-y-2.5 pr-1"></div>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    document.getElementById('contentReportForm').addEventListener('submit', handleSubmitContentReport);
    document.getElementById('selfDeleteAccountForm').addEventListener('submit', handleSubmitSelfDelete);
  }

  let activeReportPayload = null;

  window.openContentReportModal = function (opts = {}) {
    ensureComplianceModals();
    activeReportPayload = {
      target_type: opts.targetType || 'message',
      target_id: Number(opts.targetId) || 0,
      reported_user_id: opts.reportedUserId ? Number(opts.reportedUserId) : null,
      reported_name: opts.reportedName || '',
      content_snapshot: opts.preview || ''
    };
    const summaryEl = document.getElementById('reportTargetSummary');
    if (summaryEl) {
      const tLabel = TARGET_LABELS[activeReportPayload.target_type] || 'ناوەڕۆک';
      const who = activeReportPayload.reported_name ? ` — ${activeReportPayload.reported_name}` : '';
      const snip = activeReportPayload.content_snapshot ? `\n«${activeReportPayload.content_snapshot.slice(0, 120)}»` : '';
      summaryEl.textContent = `${tLabel}${who}${snip}`;
    }
    const details = document.getElementById('reportDetailsInput');
    if (details) details.value = '';
    document.getElementById('contentReportModal').classList.remove('hidden');
  };

  window.closeContentReportModal = function () {
    document.getElementById('contentReportModal')?.classList.add('hidden');
    activeReportPayload = null;
  };

  async function handleSubmitContentReport(e) {
    e.preventDefault();
    if (!activeReportPayload || !activeReportPayload.target_id) return;
    const btn = document.getElementById('submitContentReportBtn');
    const reason = document.getElementById('reportReasonSelect')?.value || 'inappropriate';
    const details = (document.getElementById('reportDetailsInput')?.value || '').trim();
    if (btn) btn.disabled = true;

    try {
      const headers = { 'Content-Type': 'application/json', 'x-client-id': getClientId() };
      const t = getAuthToken();
      if (t) headers.Authorization = `Bearer ${t}`;

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...activeReportPayload, reason, details })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        notify(data.error || 'نەتوانرا ڕاپۆرتەکە بنێردرێت', 'error');
        return;
      }
      window.closeContentReportModal();
      notify(data.message || 'ڕاپۆرتەکەت بە سەرکەوتوویی نێردرا', 'success');
    } catch (err) {
      notify('هەڵە لە پەیوەندی بە سێرڤەرەوە', 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  window.openSelfDeleteAccountModal = function () {
    ensureComplianceModals();
    const inp = document.getElementById('selfDeletePasswordInput');
    if (inp) inp.value = '';
    document.getElementById('selfDeleteAccountModal').classList.remove('hidden');
  };

  window.closeSelfDeleteAccountModal = function () {
    document.getElementById('selfDeleteAccountModal')?.classList.add('hidden');
  };

  async function handleSubmitSelfDelete(e) {
    e.preventDefault();
    const password = document.getElementById('selfDeletePasswordInput')?.value || '';
    const t = getAuthToken();
    if (!password || !t) return;

    const btn = document.getElementById('confirmSelfDeleteBtn');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t}`
        },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        notify(data.error || 'سڕینەوەی هەژمار سەرکەوتوو نەبوو', 'error');
        return;
      }
      window.closeSelfDeleteAccountModal();
      try {
        localStorage.removeItem('ferga_token');
        localStorage.removeItem('seereen_token');
        localStorage.removeItem('ferga_user');
      } catch (err) {}
      alert(data.message || 'هەژمارەکەت بە یەکجاری سڕایەوە.');
      window.location.href = '/';
    } catch (err) {
      notify('هەڵە لە پەیوەندی بە سێرڤەرەوە', 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function renderBlockedUsersList() {
    const body = document.getElementById('blockedUsersListBody');
    if (!body) return;
    const list = window.pryaskaBlockedUsersList || [];
    if (list.length === 0) {
      body.innerHTML = '<p class="text-xs text-center py-6 opacity-75">هیچ بەکارهێنەرێکت بلۆک نەکردووە.</p>';
      return;
    }
    body.innerHTML = list.map((u) => {
      const name = u.username || u.full_name || `#${u.blocked_user_id}`;
      return `
        <div class="flex items-center justify-between gap-2 p-3 rounded-2xl bg-amber-900/5 dark:bg-white/5 border border-amber-900/15">
          <div class="min-w-0">
            <p class="font-bold text-xs truncate">${esc(name)}</p>
          </div>
          <button type="button" onclick="toggleBlockUser(${u.blocked_user_id}, '${esc(name)}')" class="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shrink-0">
            لابردنی بلۆک
          </button>
        </div>
      `;
    }).join('');
  }

  window.openBlockedUsersModal = async function () {
    ensureComplianceModals();
    document.getElementById('blockedUsersModal').classList.remove('hidden');
    const body = document.getElementById('blockedUsersListBody');
    if (body) body.innerHTML = '<p class="text-xs text-center py-5 opacity-75">چاوەڕێبە...</p>';
    await window.loadMyBlockedUsers();
    renderBlockedUsersList();
  };

  window.closeBlockedUsersModal = function () {
    document.getElementById('blockedUsersModal')?.classList.add('hidden');
  };

  window.openAdminReportsModal = async function () {
    ensureComplianceModals();
    document.getElementById('adminReportsModal').classList.remove('hidden');
    await loadAdminReportsList();
  };

  window.closeAdminReportsModal = function () {
    document.getElementById('adminReportsModal')?.classList.add('hidden');
  };

  async function loadAdminReportsList() {
    const body = document.getElementById('adminReportsListBody');
    const t = getAuthToken();
    if (!body || !t) return;
    body.innerHTML = '<p class="text-xs text-center py-6 opacity-75">بارکردنی ڕاپۆرتەکان...</p>';
    try {
      const res = await fetch('/api/admin/reports', {
        headers: { Authorization: `Bearer ${t}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        body.innerHTML = `<p class="text-xs text-center py-6 text-rose-600">${esc(data.error || 'دەسەڵاتت نییە')}</p>`;
        return;
      }
      const list = data.reports || [];
      if (list.length === 0) {
        body.innerHTML = '<p class="text-xs text-center py-6 opacity-75">هیچ ڕاپۆرتێک تۆمار نەکراوە ✅</p>';
        return;
      }
      body.innerHTML = list.map((r) => {
        const isPending = r.status === 'pending';
        const statusBadge = isPending
          ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-800 dark:text-amber-300">چاوەڕوان</span>'
          : (r.status === 'resolved'
            ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">چارەسەرکرا</span>'
            : '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-500/20 opacity-80">داخرا</span>');
        return `
          <div class="p-3.5 rounded-2xl bg-amber-900/5 dark:bg-white/5 border border-amber-900/15 space-y-2">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <span class="text-xs font-black">${esc(TARGET_LABELS[r.target_type] || r.target_type)} #${r.target_id} — ${esc(REASON_LABELS[r.reason] || r.reason)}</span>
              ${statusBadge}
            </div>
            ${r.reported_name ? `<p class="text-[11px] opacity-80">کەسی ڕاپۆرتلێدراو: <strong>${esc(r.reported_name)}</strong></p>` : ''}
            ${r.content_snapshot ? `<p class="text-xs p-2 rounded-xl bg-white/70 dark:bg-black/25 border border-amber-900/10">«${esc(r.content_snapshot)}»</p>` : ''}
            ${r.details ? `<p class="text-[11px] opacity-85">تێبینی: ${esc(r.details)}</p>` : ''}
            ${isPending ? `
              <div class="flex items-center gap-2 pt-1 flex-wrap">
                ${['comment', 'message', 'custom_group_message'].includes(r.target_type) ? `
                  <button type="button" onclick="reviewAdminReport(${r.id}, 'resolved', true)" class="px-3 py-1 rounded-xl text-[11px] font-black bg-rose-600 hover:bg-rose-700 text-white cursor-pointer">سڕینەوەی ناوەڕۆک و چارەسەر</button>
                ` : ''}
                <button type="button" onclick="reviewAdminReport(${r.id}, 'resolved', false)" class="px-3 py-1 rounded-xl text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">چارەسەرکرا</button>
                <button type="button" onclick="reviewAdminReport(${r.id}, 'dismissed', false)" class="px-3 py-1 rounded-xl text-[11px] font-bold border border-amber-900/25 cursor-pointer">ڕەتکردنەوە</button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    } catch (err) {
      body.innerHTML = '<p class="text-xs text-center py-6 text-rose-600">هەڵە لە بارکردندا</p>';
    }
  }

  window.reviewAdminReport = async function (reportId, status, deleteContent) {
    const t = getAuthToken();
    if (!t) return;
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ status, delete_content: Boolean(deleteContent) })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notify(data.message || 'نوێکرایەوە', 'success');
        loadAdminReportsList();
      } else {
        notify(data.error || 'هەڵە ڕوویدا', 'error');
      }
    } catch (e) {
      notify('هەڵە لە پەیوەندی بە سێرڤەرەوە', 'error');
    }
  };

  // Auto-load blocked users once authenticated session is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => window.loadMyBlockedUsers(), 700));
  } else {
    setTimeout(() => window.loadMyBlockedUsers(), 700);
  }
})();
