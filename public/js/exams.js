(function () {
  'use strict';

  // =========================================================================
  // STATE & REFERENCES
  // =========================================================================
  const state = {
    token: null,
    user: null,
    isManager: false,
    socket: null,
    view: 'loading', // loading | auth | list | builder | student | submissions | grade
    viewStack: [],
    adminExams: [],
    studentExams: [],
    builder: {
      examId: null,
      status: 'published',
      questions: []
    },
    studentPaper: {
      exam: null,
      submission: null,
      answersMap: {},
      drafts: {}
    },
    submissionsView: {
      exam: null,
      submissions: [],
      filter: 'all'
    },
    grading: {
      exam: null,
      submission: null,
      gradesMap: {}, // questionId -> { is_correct, score, teacher_note }
      answersMap: {}, // questionId -> answer row
      saveTimers: {}
    },
    recorder: {
      activeUid: null,
      mediaRecorder: null,
      chunks: [],
      stream: null,
      startedAt: 0,
      timerId: null
    }
  };

  let uidCounter = 1;
  function nextUid() {
    return 'q_' + Date.now() + '_' + (uidCounter++);
  }

  const $ = (id) => document.getElementById(id);

  // =========================================================================
  // HELPERS
  // =========================================================================
  function escHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function roundScore(val) {
    const n = Number(val);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.round(n * 100) / 100;
  }

  function fmtNum(val) {
    const n = roundScore(val);
    return Number.isInteger(n) ? String(n) : String(n);
  }

  function fmtDate(ts) {
    if (!ts) return '—';
    try {
      const d = new Date(Number(ts));
      return d.toLocaleDateString('ckb-IQ', { year: 'numeric', month: 'short', day: 'numeric' }) +
        ' • ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      try {
        const d = new Date(Number(ts));
        return d.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
      } catch (_) {
        return '—';
      }
    }
  }

  function fmtFileSize(bytes) {
    const n = Number(bytes || 0);
    if (!n) return '';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function getGradeLabel(pct) {
    if (pct >= 90) return { text: 'نایاب و سەرکەوتوو 🌟', pass: true };
    if (pct >= 80) return { text: 'زۆر باش 👏', pass: true };
    if (pct >= 70) return { text: 'باش 👍', pass: true };
    if (pct >= 60) return { text: 'ناوەند ✨', pass: true };
    if (pct >= 50) return { text: 'پەسەند ✅', pass: true };
    return { text: 'پێویستی بە هەوڵی زیاترە 💪', pass: false };
  }

  function checkIsManager(user) {
    if (!user) return false;
    const r = String(user.role || '').toLowerCase();
    const uname = String(user.username || '').toLowerCase().trim();
    const fname = String(user.full_name || '').trim();
    return (
      r === 'super_admin' ||
      uname === 'hemntjabar' ||
      uname === 'hemn' ||
      uname === 'azad' ||
      uname === 'admin' ||
      Number(user.id) === 1 ||
      Number(user.id) === 3 ||
      Number(user.id) === 6 ||
      fname.includes('ئازاد')
    );
  }

  function toast(msg, isError = false) {
    const stack = $('examToastStack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'exam-toast' + (isError ? ' is-error' : '');
    el.innerHTML = `<i class="fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i><span>${escHtml(msg)}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = 'opacity 0.2s, transform 0.2s';
      setTimeout(() => el.remove(), 220);
    }, 3400);
  }

  function confirmDialog({ title, body, okText = 'بەڵێ، دڵنیام', danger = false }) {
    return new Promise((resolve) => {
      const modal = $('examConfirmModal');
      $('confirmModalTitle').textContent = title || 'دڵنیایت؟';
      $('confirmModalBody').textContent = body || '';
      const okBtn = $('confirmModalOk');
      const cancelBtn = $('confirmModalCancel');
      okBtn.textContent = okText;
      okBtn.className = 'exam-btn ' + (danger ? 'exam-btn-danger' : 'exam-btn-primary');
      $('confirmModalIcon').innerHTML = danger
        ? '<i class="fa-solid fa-triangle-exclamation" style="color:var(--exam-crimson);"></i>'
        : '<i class="fa-solid fa-circle-question"></i>';

      const cleanup = (val) => {
        modal.classList.add('hidden');
        okBtn.onclick = null;
        cancelBtn.onclick = null;
        modal.onclick = null;
        resolve(val);
      };

      okBtn.onclick = () => cleanup(true);
      cancelBtn.onclick = () => cleanup(false);
      modal.onclick = (e) => { if (e.target === modal) cleanup(false); };
      modal.classList.remove('hidden');
    });
  }

  async function apiFetch(url, options = {}) {
    const headers = Object.assign({}, options.headers || {});
    if (state.token) {
      headers['Authorization'] = 'Bearer ' + state.token;
    }
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, Object.assign({}, options, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'هەڵەیەک ڕوویدا لە پەیوەندیکردن');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  // =========================================================================
  // THEME SYNC
  // =========================================================================
  function syncThemeUI() {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    const icon = $('examThemeIcon');
    if (icon) {
      icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    document.documentElement.classList.toggle('dark-theme', isDark);
    try {
      localStorage.setItem('seereen_theme', isDark ? 'dark' : 'light');
    } catch (e) {}
    syncThemeUI();
  }

  // =========================================================================
  // VIEW NAVIGATION & STEP-BY-STEP BACK BUTTON
  // =========================================================================
  const ALL_VIEWS = [
    'viewLoading',
    'viewAuthRequired',
    'viewExamsList',
    'viewExamBuilder',
    'viewStudentExam',
    'viewExamSubmissions',
    'viewGradeSubmission'
  ];

  function showView(viewKey, pushHistory = true) {
    stopActiveRecording(false);
    const viewMap = {
      loading: 'viewLoading',
      auth: 'viewAuthRequired',
      list: 'viewExamsList',
      builder: 'viewExamBuilder',
      student: 'viewStudentExam',
      submissions: 'viewExamSubmissions',
      grade: 'viewGradeSubmission'
    };

    ALL_VIEWS.forEach(id => {
      const el = $(id);
      if (el) el.classList.add('hidden');
    });

    const targetId = viewMap[viewKey] || 'viewExamsList';
    const targetEl = $(targetId);
    if (targetEl) targetEl.classList.remove('hidden');

    if (pushHistory && state.view !== viewKey && state.view !== 'loading') {
      state.viewStack.push(state.view);
      try {
        history.pushState({ examView: viewKey }, '', window.location.pathname + window.location.search);
      } catch (e) {}
    }

    state.view = viewKey;
    const backLbl = $('examBackLabel');
    if (backLbl) {
      backLbl.textContent = (viewKey === 'list' || viewKey === 'auth' || viewKey === 'loading')
        ? 'سەرەکی'
        : 'گەڕانەوە';
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function navigateBackOneStep() {
    if (state.view === 'grade' && state.submissionsView.exam) {
      openExamSubmissions(state.submissionsView.exam.id, false);
      return;
    }
    if (state.view === 'builder' || state.view === 'student' || state.view === 'submissions') {
      loadExamsDashboard(false);
      return;
    }
    window.location.href = '/';
  }

  window.addEventListener('popstate', () => {
    if (state.view === 'grade' || state.view === 'builder' || state.view === 'student' || state.view === 'submissions') {
      navigateBackOneStep();
    }
  });

  // =========================================================================
  // RENDER SHARED RICH MEDIA ATTACHMENTS & OFFICIAL RESULT STAMP
  // =========================================================================
  function renderAttachmentsHtml(attachments, { removable = false, qUid = '' } = {}) {
    if (!Array.isArray(attachments) || attachments.length === 0) return '';
    return `<div class="exam-attachments-grid">${attachments.map((att, idx) => {
      const url = escHtml(att.url || '');
      const name = escHtml(att.name || 'فایل');
      const sizeTxt = att.size ? ` (${fmtFileSize(att.size)})` : '';
      const removeBtn = removable
        ? `<button type="button" class="exam-att-remove" data-remove-att="${idx}" data-quid="${escHtml(qUid)}" title="سڕینەوەی فایل"><i class="fa-solid fa-xmark"></i></button>`
        : '';

      if (att.type === 'image') {
        return `
          <div class="exam-att-item">
            ${removeBtn}
            <img src="${url}" alt="${name}" class="exam-att-img" data-lightbox-src="${url}" loading="lazy">
            <div class="exam-att-name"><i class="fa-regular fa-image" style="color:var(--exam-gold); margin-left:0.3rem;"></i>${name}</div>
          </div>`;
      }
      if (att.type === 'video') {
        return `
          <div class="exam-att-item">
            ${removeBtn}
            <video src="${url}" class="exam-att-video" controls preload="metadata"></video>
            <div class="exam-att-name"><i class="fa-solid fa-film" style="color:var(--exam-gold); margin-left:0.3rem;"></i>${name}</div>
          </div>`;
      }
      if (att.type === 'audio') {
        return `
          <div class="exam-att-item">
            ${removeBtn}
            <div class="exam-att-audio-wrap">
              <div class="exam-att-name" style="margin-top:0;"><i class="fa-solid fa-volume-high" style="color:var(--exam-gold); margin-left:0.3rem;"></i>${name}</div>
              <audio src="${url}" controls preload="metadata"></audio>
            </div>
          </div>`;
      }
      return `
        <div class="exam-att-item">
          ${removeBtn}
          <a href="${url}" target="_blank" rel="noopener" download class="exam-att-file">
            <span class="exam-att-file-icon"><i class="fa-solid fa-file-arrow-down"></i></span>
            <span style="min-width:0; flex:1;">
              <span style="display:block; font-size:0.84rem; font-weight:800; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${name}</span>
              <span style="display:block; font-size:0.72rem; color:var(--exam-ink-muted);">داگرتن یان کردنەوەی فایل${sizeTxt}</span>
            </span>
          </a>
        </div>`;
    }).join('')}</div>`;
  }

  function buildOfficialResultBannerHtml(sub, totalsOverride = null) {
    const total = totalsOverride ? totalsOverride.total_score : sub.total_score;
    const max = totalsOverride ? totalsOverride.max_total_score : sub.max_total_score;
    const correct = totalsOverride ? totalsOverride.correct_count : sub.correct_count;
    const wrong = totalsOverride ? totalsOverride.wrong_count : sub.wrong_count;
    const pct = max > 0 ? Math.round((Number(total) / Number(max)) * 100) : 0;
    const gInfo = getGradeLabel(pct);

    return {
      pass: gInfo.pass,
      html: `
        <div class="exam-result-seal-top">
          <i class="fa-solid fa-stamp"></i>
          ئەنجامی کۆتایی ئیمتیحان — پەسەندکراو
        </div>
        <div style="display:block;">
          <div class="exam-result-giant-score">
            <span class="exam-result-giant-num">${fmtNum(total)}</span>
            <span class="exam-result-giant-sep">/</span>
            <span class="exam-result-giant-max">${fmtNum(max)}</span>
          </div>
        </div>
        <div class="exam-result-grade-title">${gInfo.text} — (${pct}%)</div>
        <div class="exam-result-stats-row">
          <span class="exam-stat-pill is-correct"><i class="fa-solid fa-circle-check"></i> وەڵامی ڕاست: ${correct || 0}</span>
          <span class="exam-stat-pill is-wrong"><i class="fa-solid fa-circle-xmark"></i> وەڵامی هەڵە: ${wrong || 0}</span>
          ${sub.graded_by_name ? `<span class="exam-stat-pill"><i class="fa-solid fa-user-tie" style="color:var(--exam-gold);"></i> هەڵسەنگێنەر: ${escHtml(sub.graded_by_name)}</span>` : ''}
          ${sub.graded_at ? `<span class="exam-stat-pill"><i class="fa-regular fa-clock" style="color:var(--exam-gold);"></i> ${escHtml(fmtDate(sub.graded_at))}</span>` : ''}
        </div>
        ${sub.teacher_feedback ? `
          <div class="exam-result-feedback">
            <strong style="color:var(--exam-gold); display:block; margin-bottom:0.2rem;"><i class="fa-solid fa-comment-dots"></i> تێبینی مامۆستا:</strong>
            ${escHtml(sub.teacher_feedback)}
          </div>` : ''}
      `
    };
  }

  // =========================================================================
  // VIEW 1: DASHBOARD (MANAGER OR STUDENT)
  // =========================================================================
  async function loadExamsDashboard(pushHistory = false) {
    try {
      if (state.isManager) {
        const res = await apiFetch('/api/exams/admin/list');
        state.adminExams = res.exams || [];
        renderManagerDashboard();
      } else {
        const res = await apiFetch('/api/exams/student/list');
        state.studentExams = res.exams || [];
        renderStudentDashboard();
      }
      showView('list', pushHistory);
    } catch (err) {
      toast(err.message || 'هەڵە لە بارکردنی ئیمتیحانەکان', true);
    }
  }

  function renderManagerDashboard() {
    $('listHeroTitle').textContent = 'بەڕێوەبردنی ئیمتیحانە ئەلکترۆنییەکان';
    $('listHeroDesc').textContent = 'دروستکردنی ئیمتیحان بە زیاتر لە ١٠٠ پرسیار و میدیای جۆراوجۆر، هەڵسەنگاندنی وەڵامەکان و ناردنی ئەنجام.';
    $('managerHeroActions').classList.remove('hidden');

    const exams = state.adminExams;
    const totalExams = exams.length;
    const publishedCount = exams.filter(e => e.status === 'published').length;
    const ungradedTotal = exams.reduce((s, e) => s + Number(e.ungraded_submissions || 0), 0);
    const gradedTotal = exams.reduce((s, e) => s + Number(e.graded_submissions || 0), 0);

    $('listStatsGrid').innerHTML = `
      <div class="exam-stat-box">
        <div class="exam-stat-icon"><i class="fa-solid fa-scroll"></i></div>
        <div><div class="exam-stat-val">${totalExams}</div><div class="exam-stat-lbl">کۆی ئیمتیحانەکان</div></div>
      </div>
      <div class="exam-stat-box">
        <div class="exam-stat-icon is-green"><i class="fa-solid fa-circle-check"></i></div>
        <div><div class="exam-stat-val">${publishedCount}</div><div class="exam-stat-lbl">ئیمتیحانی چالاک</div></div>
      </div>
      <div class="exam-stat-box">
        <div class="exam-stat-icon is-red"><i class="fa-solid fa-bell"></i></div>
        <div><div class="exam-stat-val">${ungradedTotal}</div><div class="exam-stat-lbl">چاوەڕوانی هەڵسەنگاندن</div></div>
      </div>
      <div class="exam-stat-box">
        <div class="exam-stat-icon"><i class="fa-solid fa-award"></i></div>
        <div><div class="exam-stat-val">${gradedTotal}</div><div class="exam-stat-lbl">ئەنجامی نێردراو</div></div>
      </div>
    `;

    const container = $('examsCardsContainer');
    const emptyEl = $('examsEmptyState');
    if (exams.length === 0) {
      container.innerHTML = '';
      $('emptyListTitle').textContent = 'هێشتا هیچ ئیمتیحانێکت دانەناوە';
      $('emptyListSub').textContent = 'دوگمەی «دانانی ئیمتیحانی نوێ» لە سەرەوە دابگرە بۆ دروستکردنی یەکەم پەڕەی ئیمتیحانی ئەلکترۆنی.';
      emptyEl.classList.remove('hidden');
      return;
    }

    emptyEl.classList.add('hidden');
    container.innerHTML = exams.map(ex => {
      const statusBadge = ex.status === 'published'
        ? '<span class="exam-status-badge is-published"><i class="fa-solid fa-circle-dot"></i> چالاک (بڵاوکراوە)</span>'
        : ex.status === 'draft'
          ? '<span class="exam-status-badge is-draft"><i class="fa-solid fa-pen-ruler"></i> ڕەشنووس</span>'
          : '<span class="exam-status-badge is-closed"><i class="fa-solid fa-lock"></i> داخراو</span>';

      const ungraded = Number(ex.ungraded_submissions || 0);
      const totalSubs = Number(ex.total_submissions || 0);
      const nextStatus = ex.status === 'published' ? 'closed' : 'published';
      const toggleLabel = ex.status === 'published' ? 'داخستن' : 'چالاککردن';
      const toggleIcon = ex.status === 'published' ? 'fa-lock' : 'fa-unlock';

      return `
        <article class="exam-card">
          <div class="exam-card-top">
            <div style="min-width:0;">
              <h3 class="exam-card-title">${escHtml(ex.title)}</h3>
              ${ex.subject ? `<span class="exam-card-subject"><i class="fa-solid fa-bookmark"></i> ${escHtml(ex.subject)}</span>` : ''}
            </div>
            ${statusBadge}
          </div>

          <div class="exam-card-meta">
            <span><i class="fa-solid fa-list-ol" style="color:var(--exam-gold);"></i> ${ex.question_count || 0} پرسیار</span>
            <span><i class="fa-solid fa-star" style="color:var(--exam-gold);"></i> ${fmtNum(ex.total_max_score)} نمرە</span>
            <span><i class="fa-solid fa-users" style="color:var(--exam-gold);"></i> ${totalSubs} وەڵامی نێردراو</span>
            ${ungraded > 0 ? `<span style="background:var(--exam-crimson-soft); color:var(--exam-crimson); font-weight:800;"><i class="fa-solid fa-exclamation-circle"></i> ${ungraded} نوێ بۆ هەڵسەنگاندن</span>` : ''}
          </div>

          <div class="exam-card-actions">
            <button type="button" class="exam-btn exam-btn-primary exam-btn-sm" data-open-subs="${ex.id}">
              <i class="fa-solid fa-clipboard-check"></i>
              وەڵامی قوتابیان ${ungraded > 0 ? `(${ungraded})` : ''}
            </button>
            <button type="button" class="exam-btn exam-btn-soft exam-btn-sm" data-edit-exam="${ex.id}">
              <i class="fa-solid fa-pen"></i>
              دەستکاری
            </button>
            <button type="button" class="exam-btn exam-btn-soft exam-btn-sm" data-toggle-exam="${ex.id}" data-next-status="${nextStatus}">
              <i class="fa-solid ${toggleIcon}"></i>
              ${toggleLabel}
            </button>
            <button type="button" class="exam-btn exam-btn-danger exam-btn-sm" data-delete-exam="${ex.id}" title="سڕینەوە">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </article>`;
    }).join('');
  }

  function renderStudentDashboard() {
    $('listHeroTitle').textContent = 'پەڕەی ئیمتیحانەکانم';
    $('listHeroDesc').textContent = 'ئیمتیحانە چالاکەکان بکەرەوە، وەڵامەکانت جێگیر بکە، پاشان بینێرە بۆ مامۆستا و ئەنجامەکەت ببینە.';
    $('managerHeroActions').classList.add('hidden');

    const exams = state.studentExams;
    const activeTodo = exams.filter(e => e.status === 'published' && (!e.submission_status || e.submission_status === 'in_progress')).length;
    const waitingCount = exams.filter(e => e.submission_status === 'submitted').length;
    const gradedCount = exams.filter(e => e.submission_status === 'graded').length;

    $('listStatsGrid').innerHTML = `
      <div class="exam-stat-box">
        <div class="exam-stat-icon"><i class="fa-solid fa-pen-to-square"></i></div>
        <div><div class="exam-stat-val">${activeTodo}</div><div class="exam-stat-lbl">ئیمتیحانی بەردەست</div></div>
      </div>
      <div class="exam-stat-box">
        <div class="exam-stat-icon"><i class="fa-solid fa-hourglass-half"></i></div>
        <div><div class="exam-stat-val">${waitingCount}</div><div class="exam-stat-lbl">چاوەڕوانی ئەنجام</div></div>
      </div>
      <div class="exam-stat-box">
        <div class="exam-stat-icon is-green"><i class="fa-solid fa-trophy"></i></div>
        <div><div class="exam-stat-val">${gradedCount}</div><div class="exam-stat-lbl">ئەنجامی دەرچوو</div></div>
      </div>
    `;

    const container = $('examsCardsContainer');
    const emptyEl = $('examsEmptyState');
    if (exams.length === 0) {
      container.innerHTML = '';
      $('emptyListTitle').textContent = 'لە ئێستادا هیچ ئیمتیحانێک بەردەست نییە';
      $('emptyListSub').textContent = 'هەرکات مامۆستا ئیمتیحانی نوێی دانا، ڕاستەوخۆ لێرە دەردەکەوێت.';
      emptyEl.classList.remove('hidden');
      return;
    }

    emptyEl.classList.add('hidden');
    container.innerHTML = exams.map(ex => {
      const subStatus = ex.submission_status;
      let statusBadge = '<span class="exam-status-badge is-published"><i class="fa-solid fa-circle-play"></i> ئامادەیە بۆ وەڵامدانەوە</span>';
      let actionBtnText = 'دەستپێکردنی ئیمتیحان';
      let actionBtnIcon = 'fa-pen-nib';
      let actionBtnClass = 'exam-btn-primary';
      let scorePreviewHtml = '';

      if (subStatus === 'in_progress') {
        statusBadge = `<span class="exam-status-badge is-draft"><i class="fa-solid fa-spinner"></i> لە بەردەوامبووندایە (${ex.locked_answers_count || 0}/${ex.question_count || 0})</span>`;
        actionBtnText = 'بەردەوامبوون لە ئیمتیحان';
      } else if (subStatus === 'submitted') {
        statusBadge = '<span class="exam-status-badge is-draft"><i class="fa-solid fa-hourglass-half"></i> نێردراوە — چاوەڕوانی نمرە</span>';
        actionBtnText = 'بینینی وەڵامە نێردراوەکانم';
        actionBtnIcon = 'fa-eye';
        actionBtnClass = 'exam-btn-soft';
      } else if (subStatus === 'graded') {
        const pct = ex.student_max_score > 0 ? Math.round((Number(ex.student_score) / Number(ex.student_max_score)) * 100) : 0;
        statusBadge = '<span class="exam-status-badge is-published"><i class="fa-solid fa-award"></i> ئەنجام دەرچووە</span>';
        actionBtnText = 'بینینی پەڕە و ئەنجام';
        actionBtnIcon = 'fa-trophy';
        actionBtnClass = 'exam-btn-gold';
        scorePreviewHtml = `
          <div class="exam-card-score-preview">
            <span style="font-size:0.82rem; font-weight:800; color:var(--exam-ink);">نمرەی کۆتایی تۆ:</span>
            <span class="exam-card-score-big">${fmtNum(ex.student_score)} / ${fmtNum(ex.student_max_score)} <small style="font-size:0.78rem;">(${pct}%)</small></span>
          </div>`;
      }

      return `
        <article class="exam-card">
          <div class="exam-card-top">
            <div style="min-width:0;">
              <h3 class="exam-card-title">${escHtml(ex.title)}</h3>
              ${ex.subject ? `<span class="exam-card-subject"><i class="fa-solid fa-bookmark"></i> ${escHtml(ex.subject)}</span>` : ''}
            </div>
            ${statusBadge}
          </div>

          <div class="exam-card-meta">
            <span><i class="fa-solid fa-list-ol" style="color:var(--exam-gold);"></i> ${ex.question_count || 0} پرسیار</span>
            <span><i class="fa-solid fa-star" style="color:var(--exam-gold);"></i> کۆی نمرە: ${fmtNum(ex.total_max_score)}</span>
            <span><i class="fa-solid fa-user-tie" style="color:var(--exam-gold);"></i> ${escHtml(ex.creator_name || 'مامۆستا')}</span>
          </div>

          ${scorePreviewHtml}

          <div class="exam-card-actions">
            <button type="button" class="exam-btn ${actionBtnClass} exam-btn-sm" style="width:100%;" data-open-student-exam="${ex.id}">
              <i class="fa-solid ${actionBtnIcon}"></i>
              ${actionBtnText}
            </button>
          </div>
        </article>`;
    }).join('');
  }

  // =========================================================================
  // VIEW 2: MANAGER EXAM BUILDER (100+ QUESTIONS + IMAGE/VIDEO/AUDIO/VOICE/FILE)
  // =========================================================================
  function createEmptyQuestion() {
    return {
      _uid: nextUid(),
      id: null,
      question_text: '',
      question_type: 'text',
      options: ['', '', '', ''],
      correct_answer: '',
      _correctIdx: -1,
      attachments: [],
      max_score: 1
    };
  }

  async function openExamBuilder(examId = null) {
    if (examId) {
      try {
        const res = await apiFetch('/api/exams/admin/' + examId);
        const ex = res.exam;
        state.builder = {
          examId: ex.id,
          status: ex.status || 'published',
          questions: (ex.questions || []).map(q => {
            const qType = q.question_type === 'choice'
              ? 'choice'
              : (q.question_type === 'true_false' ? 'true_false' : 'text');
            const opts = Array.isArray(q.options) && q.options.length >= 2 ? q.options.slice() : ['', '', '', ''];
            const corr = String(q.correct_answer || '').trim();
            const corrIdx = qType === 'choice' ? opts.findIndex(o => String(o || '').trim() === corr) : -1;
            return {
              _uid: nextUid(),
              id: q.id,
              question_text: q.question_text || '',
              question_type: qType,
              options: opts,
              correct_answer: corr,
              _correctIdx: corrIdx,
              attachments: Array.isArray(q.attachments) ? q.attachments.slice() : [],
              max_score: roundScore(q.max_score || 1)
            };
          })
        };
        $('builderModeHeading').textContent = 'دەستکاریکردنی پەڕەی ئیمتیحان';
        $('builderTitle').value = ex.title || '';
        $('builderSubject').value = ex.subject || '';
        $('builderDesc').value = ex.description || '';
      } catch (err) {
        toast(err.message || 'هەڵە لە کردنەوەی ئیمتیحان', true);
        return;
      }
    } else {
      state.builder = {
        examId: null,
        status: 'published',
        questions: [createEmptyQuestion()]
      };
      $('builderModeHeading').textContent = 'ئامادەکردنی پەڕەی ئیمتیحانی نوێ';
      $('builderTitle').value = '';
      $('builderSubject').value = '';
      $('builderDesc').value = '';
    }

    renderAllBuilderQuestions();
    showView('builder', true);
  }

  function updateBuilderMetricsAndNav() {
    const qs = state.builder.questions;
    const totalScore = roundScore(qs.reduce((acc, q) => acc + roundScore(q.max_score), 0));
    $('builderQCount').textContent = String(qs.length);
    $('builderTotalScore').textContent = fmtNum(totalScore);

    const navPanel = $('builderNavPanel');
    const navGrid = $('builderNavGrid');
    if (qs.length >= 6) {
      navPanel.classList.remove('hidden');
      navGrid.innerHTML = qs.map((q, idx) => {
        const filled = String(q.question_text || '').trim().length > 0 || (q.attachments && q.attachments.length > 0);
        return `<button type="button" class="exam-nav-chip ${filled ? 'is-locked' : ''}" data-jump-builder="${q._uid}">${idx + 1}</button>`;
      }).join('');
    } else {
      navPanel.classList.add('hidden');
    }
  }

  function buildBuilderQuestionCardEl(q, index) {
    const card = document.createElement('div');
    card.className = 'exam-question-card';
    card.dataset.quid = q._uid;
    card.id = 'builder_q_' + q._uid;

    const isRec = state.recorder.activeUid === q._uid;
    const isChoice = q.question_type === 'choice';
    const isTF = q.question_type === 'true_false';
    const tfKey = isTF ? String(q.correct_answer || '').trim() : '';

    card.innerHTML = `
      <div class="exam-q-head">
        <div class="exam-q-num-group">
          <span class="exam-q-num">${index + 1}</span>
          <span class="exam-q-label">پرسیاری ژمارە ${index + 1}</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:0.45rem;">
          <select class="exam-select" data-b-type="${q._uid}" style="width:auto; padding:0.32rem 0.6rem; font-size:0.78rem;">
            <option value="text" ${!isChoice && !isTF ? 'selected' : ''}>وەڵامی نووسراو</option>
            <option value="true_false" ${isTF ? 'selected' : ''}>ڕاست و هەڵە (تۆماتیکی)</option>
            <option value="choice" ${isChoice ? 'selected' : ''}>هەڵبژاردن (تۆماتیکی)</option>
          </select>
          <div class="exam-score-input-wrap" style="padding:0.15rem 0.45rem;">
            <span style="font-size:0.74rem; font-weight:800; color:var(--exam-ink-muted);">نمرە:</span>
            <input type="number" min="0" max="1000" step="0.5" value="${fmtNum(q.max_score)}" data-b-score="${q._uid}" style="width:3.4rem; font-size:0.88rem;">
          </div>
          <button type="button" class="exam-btn exam-btn-soft exam-btn-sm" data-b-move-up="${q._uid}" title="بردنە سەرەوە"><i class="fa-solid fa-arrow-up"></i></button>
          <button type="button" class="exam-btn exam-btn-soft exam-btn-sm" data-b-move-down="${q._uid}" title="بردنە خوارەوە"><i class="fa-solid fa-arrow-down"></i></button>
          <button type="button" class="exam-btn exam-btn-danger exam-btn-sm" data-b-del="${q._uid}" title="سڕینەوەی پرسیار"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>

      <textarea class="exam-textarea" data-b-text="${q._uid}" placeholder="دەقی پرسیارەکە لێرە بنووسە... (یان دەتوانیت تەنها وێنە / ڤیدیۆ / دەنگ / فایل دابنێیت)">${escHtml(q.question_text)}</textarea>

      <div class="exam-builder-options-wrap ${isTF ? '' : 'hidden'}" data-b-tf-wrap="${q._uid}">
        <div style="font-size:0.78rem; font-weight:800; color:var(--exam-gold); margin-bottom:0.5rem;">
          <i class="fa-solid fa-wand-magic-sparkles"></i> وەڵامی ڕاست دیاری بکە (بۆ سەحکردن و نمرەدانی تۆماتیکی):
        </div>
        <div class="exam-tf-key-group">
          <button type="button" class="exam-tf-key-btn is-true ${tfKey === 'ڕاست' ? 'is-selected' : ''}" data-b-tf-key="${q._uid}" data-tf-val="ڕاست">
            <i class="fa-solid fa-check"></i>
            <span>ڕاستە (ڕاست)</span>
          </button>
          <button type="button" class="exam-tf-key-btn is-false ${tfKey === 'هەڵە' ? 'is-selected' : ''}" data-b-tf-key="${q._uid}" data-tf-val="هەڵە">
            <i class="fa-solid fa-xmark"></i>
            <span>هەڵەیە (هەڵە)</span>
          </button>
        </div>
      </div>

      <div class="exam-builder-options-wrap ${isChoice ? '' : 'hidden'}" data-b-opts-wrap="${q._uid}">
        <div style="font-size:0.78rem; font-weight:800; color:var(--exam-gold); margin-bottom:0.45rem;">
          بژاردەکان بنووسە و وەڵامی ڕاست دیاری بکە (بۆ سەحکردنی تۆماتیکی):
        </div>
        <div data-b-opts-list="${q._uid}">
          ${(q.options || ['', '']).map((opt, oi) => {
            const isKey = q._correctIdx === oi || (String(opt || '').trim() !== '' && String(opt || '').trim() === String(q.correct_answer || '').trim());
            return `
            <div class="exam-builder-opt-row">
              <span style="font-size:0.8rem; font-weight:800; color:var(--exam-ink-muted); min-width:1.4rem;">${oi + 1}.</span>
              <input type="text" class="exam-input" style="padding:0.42rem 0.7rem; font-size:0.86rem;" value="${escHtml(opt)}" data-b-opt="${q._uid}" data-opt-idx="${oi}" placeholder="بژاردەی ${oi + 1}">
              <button type="button" class="exam-opt-key-btn ${isKey ? 'is-correct-key' : ''}" data-b-choice-key="${q._uid}" data-opt-idx="${oi}" title="دیاریکردنی وەڵامی ڕاست">
                <i class="fa-solid fa-check"></i>
                <span>${isKey ? 'وەڵامی ڕاست' : 'ڕاستە؟'}</span>
              </button>
              ${(q.options || []).length > 2 ? `<button type="button" class="exam-btn exam-btn-danger exam-btn-sm" data-b-del-opt="${q._uid}" data-opt-idx="${oi}"><i class="fa-solid fa-xmark"></i></button>` : ''}
            </div>`;
          }).join('')}
        </div>
        <button type="button" class="exam-btn exam-btn-soft exam-btn-sm" data-b-add-opt="${q._uid}" style="margin-top:0.25rem;">
          <i class="fa-solid fa-plus"></i> زیادکردنی بژاردە
        </button>
      </div>

      <!-- Attachments preview area -->
      <div data-b-att-wrap="${q._uid}">
        ${renderAttachmentsHtml(q.attachments, { removable: true, qUid: q._uid })}
      </div>

      <!-- Rich Media Toolbar on Every Question -->
      <div class="exam-media-toolbar">
        <button type="button" class="exam-media-btn" data-b-upload="${q._uid}" data-upload-kind="image">
          <i class="fa-regular fa-image" style="color:#0284c7;"></i> وێنە
        </button>
        <button type="button" class="exam-media-btn" data-b-upload="${q._uid}" data-upload-kind="video">
          <i class="fa-solid fa-film" style="color:#7c3aed;"></i> ڤیدیۆ
        </button>
        <button type="button" class="exam-media-btn" data-b-upload="${q._uid}" data-upload-kind="audio">
          <i class="fa-solid fa-music" style="color:#059669;"></i> دەنگ
        </button>
        <button type="button" class="exam-media-btn ${isRec ? 'is-recording' : ''}" data-b-record="${q._uid}">
          <i class="fa-solid ${isRec ? 'fa-stop' : 'fa-microphone'}" style="${isRec ? '' : 'color:#dc2626;'}"></i>
          <span>${isRec ? 'وەستاندنی تۆمارکردن' : 'تۆمارکردنی دەنگ'}</span>
        </button>
        <button type="button" class="exam-media-btn" data-b-upload="${q._uid}" data-upload-kind="file">
          <i class="fa-solid fa-paperclip" style="color:var(--exam-gold);"></i> فایل
        </button>
        <span data-b-upload-status="${q._uid}" style="font-size:0.76rem; font-weight:700; color:var(--exam-gold);"></span>
      </div>
    `;

    return card;
  }

  function renderAllBuilderQuestions() {
    const list = $('builderQuestionsList');
    list.innerHTML = '';
    const frag = document.createDocumentFragment();
    state.builder.questions.forEach((q, idx) => {
      frag.appendChild(buildBuilderQuestionCardEl(q, idx));
    });
    list.appendChild(frag);
    updateBuilderMetricsAndNav();
  }

  function appendBuilderQuestions(count) {
    const remaining = 500 - state.builder.questions.length;
    if (remaining <= 0) {
      toast('زۆرترین ژمارەی پرسیار لە یەک ئیمتیحاندا ٥٠٠ پرسیارە', true);
      return;
    }
    const toAdd = Math.min(count, remaining);
    const list = $('builderQuestionsList');
    const frag = document.createDocumentFragment();
    let firstNewEl = null;

    for (let i = 0; i < toAdd; i++) {
      const q = createEmptyQuestion();
      state.builder.questions.push(q);
      const cardEl = buildBuilderQuestionCardEl(q, state.builder.questions.length - 1);
      if (!firstNewEl) firstNewEl = cardEl;
      frag.appendChild(cardEl);
    }
    list.appendChild(frag);
    updateBuilderMetricsAndNav();

    if (firstNewEl) {
      firstNewEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const ta = firstNewEl.querySelector('textarea');
      if (ta && toAdd === 1) ta.focus();
    }
  }

  function refreshSingleBuilderAttachments(qUid) {
    const q = state.builder.questions.find(item => item._uid === qUid);
    if (!q) return;
    const wrap = document.querySelector(`[data-b-att-wrap="${qUid}"]`);
    if (wrap) {
      wrap.innerHTML = renderAttachmentsHtml(q.attachments, { removable: true, qUid });
    }
    updateBuilderMetricsAndNav();
  }

  function triggerQuestionMediaUpload(qUid, kind) {
    const input = document.createElement('input');
    input.type = 'file';
    if (kind === 'image') {
      input.accept = 'image/*';
      input.multiple = true;
    } else if (kind === 'video') {
      input.accept = 'video/*';
    } else if (kind === 'audio') {
      input.accept = 'audio/*';
    } else {
      input.multiple = true;
    }

    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (files.length === 0) return;
      const q = state.builder.questions.find(item => item._uid === qUid);
      if (!q) return;

      const statusEl = document.querySelector(`[data-b-upload-status="${qUid}"]`);
      for (let i = 0; i < files.length; i++) {
        if (statusEl) {
          statusEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> بارکردن (${i + 1}/${files.length})...`;
        }
        try {
          const fd = new FormData();
          fd.append('media', files[i]);
          const res = await apiFetch('/api/exams/upload-media', { method: 'POST', body: fd });
          if (res.attachment) {
            q.attachments.push(res.attachment);
            refreshSingleBuilderAttachments(qUid);
          }
        } catch (err) {
          toast(err.message || 'هەڵە لە بارکردنی فایل', true);
        }
      }
      if (statusEl) statusEl.textContent = '';
    };
    input.click();
  }

  async function toggleQuestionVoiceRecording(qUid) {
    if (state.recorder.activeUid === qUid) {
      stopActiveRecording(true);
      return;
    }
    if (state.recorder.activeUid) {
      stopActiveRecording(false);
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast('وێبگەڕەکەت پشتگیری تۆمارکردنی ڕاستەوخۆی دەنگ ناکات، دەتوانیت فایلی دەنگی باربکەیت', true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '');
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      state.recorder = {
        activeUid: qUid,
        mediaRecorder: mr,
        chunks: [],
        stream,
        startedAt: Date.now(),
        timerId: null
      };

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) state.recorder.chunks.push(ev.data);
      };

      const btn = document.querySelector(`[data-b-record="${qUid}"]`);
      if (btn) {
        btn.classList.add('is-recording');
        btn.innerHTML = '<i class="fa-solid fa-stop"></i> <span>وەستان (0:00)</span>';
      }

      state.recorder.timerId = setInterval(() => {
        const secs = Math.floor((Date.now() - state.recorder.startedAt) / 1000);
        const mm = Math.floor(secs / 60);
        const ss = String(secs % 60).padStart(2, '0');
        const b = document.querySelector(`[data-b-record="${qUid}"]`);
        if (b) b.innerHTML = `<i class="fa-solid fa-stop"></i> <span>وەستان (${mm}:${ss})</span>`;
      }, 500);

      mr.start();
    } catch (err) {
      toast('دەسەڵاتی مایکرۆفۆن نەدراوە بۆ تۆمارکردنی دەنگ', true);
    }
  }

  function stopActiveRecording(shouldUpload) {
    const rec = state.recorder;
    if (!rec.activeUid) return;
    const qUid = rec.activeUid;
    if (rec.timerId) clearInterval(rec.timerId);

    const resetBtn = () => {
      const btn = document.querySelector(`[data-b-record="${qUid}"]`);
      if (btn) {
        btn.classList.remove('is-recording');
        btn.innerHTML = '<i class="fa-solid fa-microphone" style="color:#dc2626;"></i> <span>تۆمارکردنی دەنگ</span>';
      }
    };

    const mr = rec.mediaRecorder;
    const stream = rec.stream;
    const chunksRef = rec.chunks;

    state.recorder = { activeUid: null, mediaRecorder: null, chunks: [], stream: null, startedAt: 0, timerId: null };
    resetBtn();

    if (mr && mr.state !== 'inactive') {
      mr.onstop = async () => {
        if (stream) stream.getTracks().forEach(t => t.stop());
        if (!shouldUpload || chunksRef.length === 0) return;

        const statusEl = document.querySelector(`[data-b-upload-status="${qUid}"]`);
        if (statusEl) statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> پاشەکەوتکردنی دەنگ...';
        try {
          const blob = new Blob(chunksRef, { type: mr.mimeType || 'audio/webm' });
          const fd = new FormData();
          fd.append('media', blob, 'voice-question-' + Date.now() + '.webm');
          const res = await apiFetch('/api/exams/upload-media', { method: 'POST', body: fd });
          const q = state.builder.questions.find(item => item._uid === qUid);
          if (q && res.attachment) {
            res.attachment.type = 'audio';
            res.attachment.name = 'دەنگی تۆمارکراو';
            q.attachments.push(res.attachment);
            refreshSingleBuilderAttachments(qUid);
            toast('دەنگەکە بە سەرکەوتوویی زیادکرا');
          }
        } catch (err) {
          toast(err.message || 'هەڵە لە پاشەکەوتکردنی دەنگ', true);
        } finally {
          if (statusEl) statusEl.textContent = '';
        }
      };
      try { mr.stop(); } catch (e) {}
    } else if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
  }

  async function saveBuilderExam(targetStatus) {
    stopActiveRecording(false);
    const title = String($('builderTitle').value || '').trim();
    const subject = String($('builderSubject').value || '').trim();
    const description = String($('builderDesc').value || '').trim();

    if (!title) {
      toast('تکایە ناونیشانی ئیمتیحانەکە بنووسە', true);
      $('builderTitle').focus();
      return;
    }

    const cleanQs = state.builder.questions
      .filter(q => String(q.question_text || '').trim().length > 0 || (q.attachments && q.attachments.length > 0))
      .map((q, idx) => {
        const qType = q.question_type === 'choice'
          ? 'choice'
          : (q.question_type === 'true_false' ? 'true_false' : 'text');
        const opts = qType === 'true_false'
          ? ['ڕاست', 'هەڵە']
          : (qType === 'choice' ? (q.options || []).map(o => String(o || '').trim()).filter(Boolean) : []);
        let correctAnswer = '';
        if (qType === 'true_false') {
          correctAnswer = String(q.correct_answer || '').trim();
        } else if (qType === 'choice') {
          const pickedByIdx = (typeof q._correctIdx === 'number' && q._correctIdx >= 0 && q.options[q._correctIdx] !== undefined)
            ? String(q.options[q._correctIdx] || '').trim()
            : '';
          const candidate = pickedByIdx || String(q.correct_answer || '').trim();
          if (candidate && opts.includes(candidate)) correctAnswer = candidate;
        }
        return {
          id: q.id || null,
          sort_order: idx + 1,
          question_text: String(q.question_text || '').trim(),
          question_type: qType,
          options: opts,
          correct_answer: correctAnswer,
          attachments: q.attachments || [],
          max_score: roundScore(q.max_score)
        };
      });

    if (cleanQs.length === 0) {
      toast('تکایە لانی کەم یەک پرسیار (دەق یان فایل) دابنێ', true);
      return;
    }

    if (targetStatus === 'published') {
      const missingKeyIndex = cleanQs.findIndex(q =>
        (q.question_type === 'true_false' || (q.question_type === 'choice' && q.options.length > 0)) &&
        !q.correct_answer
      );
      if (missingKeyIndex !== -1) {
        toast(`تکایە بۆ پرسیاری ژمارە ${missingKeyIndex + 1} وەڵامی ڕاست دیاری بکە بۆ سەحکردنی تۆماتیکی`, true);
        return;
      }
    }

    const btnDraft = $('btnBuilderSaveDraft');
    const btnPub = $('btnBuilderPublish');
    btnDraft.disabled = true;
    btnPub.disabled = true;

    try {
      const payload = { title, subject, description, status: targetStatus, questions: cleanQs };
      if (state.builder.examId) {
        await apiFetch('/api/exams/admin/' + state.builder.examId, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        toast(targetStatus === 'published' ? 'ئیمتیحانەکە نوێکرایەوە و بڵاوکرایەوە ✓' : 'ڕەشنووسی ئیمتیحان پاشەکەوتکرا ✓');
      } else {
        await apiFetch('/api/exams/admin', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        toast(targetStatus === 'published' ? 'ئیمتیحانەکە بە سەرکەوتوویی بڵاوکرایەوە بۆ قوتابیان 🎉' : 'ڕەشنووسەکە پاشەکەوتکرا ✓');
      }
      await loadExamsDashboard(false);
    } catch (err) {
      toast(err.message || 'هەڵە لە پاشەکەوتکردنی ئیمتیحان', true);
    } finally {
      btnDraft.disabled = false;
      btnPub.disabled = false;
    }
  }

  // =========================================================================
  // VIEW 3: STUDENT ELECTRONIC EXAM PAPER
  // =========================================================================
  function getDraftStorageKey(examId) {
    return 'pryaska_exam_draft_' + examId + '_' + (state.user ? state.user.id : '0');
  }

  function loadLocalDrafts(examId) {
    try {
      const raw = localStorage.getItem(getDraftStorageKey(examId));
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveLocalDraft(examId, qId, text) {
    state.studentPaper.drafts[qId] = text;
    try {
      localStorage.setItem(getDraftStorageKey(examId), JSON.stringify(state.studentPaper.drafts));
    } catch (e) {}
  }

  function clearLocalDrafts(examId) {
    state.studentPaper.drafts = {};
    try {
      localStorage.removeItem(getDraftStorageKey(examId));
    } catch (e) {}
  }

  async function openStudentExam(examId, pushHistory = true) {
    try {
      const res = await apiFetch('/api/exams/student/' + examId);
      const ansMap = {};
      (res.answers || []).forEach(a => { ansMap[Number(a.question_id)] = a; });
      state.studentPaper = {
        exam: res.exam,
        submission: res.submission,
        answersMap: ansMap,
        drafts: loadLocalDrafts(examId)
      };
      renderStudentExamPaper();
      showView('student', pushHistory);
    } catch (err) {
      toast(err.message || 'هەڵە لە کردنەوەی پەڕەی ئیمتیحان', true);
    }
  }

  function updateStudentProgressUI() {
    const { exam, submission, answersMap, drafts } = state.studentPaper;
    if (!exam) return;
    const qs = exam.questions || [];
    const lockedCount = qs.filter(q => answersMap[q.id] && answersMap[q.id].is_locked).length;
    const draftCount = qs.filter(q => !(answersMap[q.id] && answersMap[q.id].is_locked) && String(drafts[q.id] || '').trim().length > 0).length;

    $('studentLockedCount').textContent = String(lockedCount);
    $('studentTotalQCount').textContent = String(qs.length);

    const statusPill = $('studentStatusPill');
    const jumpBtn = $('btnStudentJumpSubmit');
    if (submission && submission.status === 'graded') {
      statusPill.innerHTML = `<i class="fa-solid fa-trophy" style="color:var(--exam-gold);"></i> ئەنجام: <strong>${fmtNum(submission.total_score)} / ${fmtNum(submission.max_total_score)}</strong>`;
      jumpBtn.classList.add('hidden');
    } else if (submission && submission.status === 'submitted') {
      statusPill.innerHTML = '<i class="fa-solid fa-hourglass-half" style="color:var(--exam-gold);"></i> نێردراوە بۆ مامۆستا';
      jumpBtn.classList.add('hidden');
    } else {
      statusPill.innerHTML = `<i class="fa-solid fa-pen" style="color:var(--exam-gold);"></i> ماوە: <strong>${Math.max(0, qs.length - lockedCount)}</strong>`;
      jumpBtn.classList.remove('hidden');
    }

    // Update navigator chips
    const navGrid = $('studentNavGrid');
    if (navGrid) {
      navGrid.innerHTML = qs.map((q, idx) => {
        const ans = answersMap[q.id];
        let cls = '';
        if (submission && submission.status === 'graded') {
          if (ans && ans.is_correct === 1) cls = 'is-correct';
          else if (ans && ans.is_correct === 0) cls = 'is-wrong';
        } else if (ans && ans.is_locked) {
          cls = 'is-locked';
        } else if (String(drafts[q.id] || '').trim().length > 0) {
          cls = 'is-draft';
        }
        return `<button type="button" class="exam-nav-chip ${cls}" data-jump-student-q="${q.id}">${idx + 1}</button>`;
      }).join('');
    }

    const summaryEl = $('studentSubmitSummaryText');
    if (summaryEl) {
      summaryEl.textContent = `لە کۆی ${qs.length} پرسیار: ${lockedCount} وەڵام جێگیرکراوە` +
        (draftCount > 0 ? `، ${draftCount} وەڵامی نووسراو لەکاتی ناردندا خۆکارانە جێگیر دەکرێن.` : '.');
    }
  }

  function renderSingleStudentQuestionHtml(q, index) {
    const { exam, submission, answersMap, drafts } = state.studentPaper;
    const ans = answersMap[q.id];
    const isLocked = Boolean(ans && ans.is_locked);
    const isGraded = Boolean(submission && submission.status === 'graded');
    const isSubmitted = Boolean(submission && submission.status === 'submitted');
    const canEdit = Boolean(exam.status === 'published' && submission && submission.status === 'in_progress' && !isLocked);

    let cardClass = 'exam-question-card';
    if (isGraded) {
      if (ans && ans.is_correct === 1) cardClass += ' grade-correct';
      else if (ans && ans.is_correct === 0) cardClass += ' grade-wrong';
    } else if (isLocked) {
      cardClass += ' is-locked';
    }

    let gradePillHtml = `<span class="exam-q-score-pill"><i class="fa-solid fa-star"></i> ${fmtNum(q.max_score)} نمرە</span>`;
    if (isGraded) {
      const earned = ans && ans.score != null ? fmtNum(ans.score) : '0';
      if (ans && ans.is_correct === 1) {
        gradePillHtml = `<span class="exam-stat-pill is-correct"><i class="fa-solid fa-check"></i> ڕاست • ${earned} / ${fmtNum(q.max_score)}</span>`;
      } else if (ans && ans.is_correct === 0) {
        gradePillHtml = `<span class="exam-stat-pill is-wrong"><i class="fa-solid fa-xmark"></i> هەڵە • ${earned} / ${fmtNum(q.max_score)}</span>`;
      } else {
        gradePillHtml = `<span class="exam-q-score-pill">${earned} / ${fmtNum(q.max_score)} نمرە</span>`;
      }
    }

    const currentText = isLocked
      ? (ans.answer_text || '')
      : (ans && ans.answer_text ? ans.answer_text : (drafts[q.id] || ''));

    let answerAreaHtml = '';
    if (!canEdit) {
      const displayAns = ans && ans.answer_text ? escHtml(ans.answer_text) : '<span style="color:var(--exam-ink-muted); font-style:italic;">وەڵام نەنووسراوە</span>';
      const correctHint = (isGraded && ans && ans.is_correct === 0 && q.correct_answer)
        ? `<div style="margin-top:0.45rem; font-size:0.8rem; font-weight:800; color:#15803d;"><i class="fa-solid fa-circle-check"></i> وەڵامی ڕاست: ${escHtml(q.correct_answer)}</div>`
        : '';
      answerAreaHtml = `
        <div class="exam-locked-answer-box">
          <div style="font-size:0.76rem; font-weight:800; color:#15803d; margin-bottom:0.3rem;">
            <i class="fa-solid fa-lock"></i> وەڵامی جێگیرکراوی تۆ:
          </div>
          <div>${displayAns}</div>
          ${correctHint}
        </div>
        ${isLocked && !isGraded && !isSubmitted ? `
          <div class="exam-lock-footer">
            <span class="exam-locked-pill"><i class="fa-solid fa-shield-halved"></i> جێگیرکراوە — ناتوانرێت بسڕدرێتەوە</span>
          </div>` : ''}
      `;
    } else if (q.question_type === 'true_false') {
      answerAreaHtml = `
        <div class="exam-tf-grid" data-s-mcq-group="${q.id}" style="margin-bottom:0.75rem;">
          ${['ڕاست', 'هەڵە'].map(opt => {
            const selected = currentText === opt;
            const isTrueOpt = opt === 'ڕاست';
            return `
              <div class="exam-mcq-option ${selected ? 'is-selected' : ''}" data-s-mcq-pick="${q.id}" data-opt-val="${opt}">
                <span class="exam-mcq-radio">${selected ? '<i class="fa-solid fa-check"></i>' : ''}</span>
                <span style="font-weight:800; color:${isTrueOpt ? '#15803d' : 'var(--exam-crimson)'};">
                  <i class="fa-solid ${isTrueOpt ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${opt === 'ڕاست' ? 'ڕاستە (ڕاست)' : 'هەڵەیە (هەڵە)'}
                </span>
              </div>`;
          }).join('')}
        </div>
        <div class="exam-lock-footer">
          <span style="font-size:0.78rem; color:var(--exam-ink-muted);">ڕاست یان هەڵە دیاری بکە و دوگمەی «جێگیرکردنی وەڵام» دابگرە</span>
          <button type="button" class="exam-btn exam-btn-primary exam-btn-sm" data-s-lock-btn="${q.id}">
            <i class="fa-solid fa-lock"></i> جێگیرکردنی وەڵام
          </button>
        </div>`;
    } else if (q.question_type === 'choice' && Array.isArray(q.options) && q.options.length > 0) {
      answerAreaHtml = `
        <div class="exam-mcq-list" data-s-mcq-group="${q.id}">
          ${q.options.map(opt => {
            const selected = currentText === opt;
            return `
              <div class="exam-mcq-option ${selected ? 'is-selected' : ''}" data-s-mcq-pick="${q.id}" data-opt-val="${escHtml(opt)}">
                <span class="exam-mcq-radio">${selected ? '<i class="fa-solid fa-check"></i>' : ''}</span>
                <span>${escHtml(opt)}</span>
              </div>`;
          }).join('')}
        </div>
        <div class="exam-lock-footer">
          <span style="font-size:0.78rem; color:var(--exam-ink-muted);">دوای هەڵبژاردن، دوگمەی «جێگیرکردنی وەڵام» دابگرە</span>
          <button type="button" class="exam-btn exam-btn-primary exam-btn-sm" data-s-lock-btn="${q.id}">
            <i class="fa-solid fa-lock"></i> جێگیرکردنی وەڵام
          </button>
        </div>`;
    } else {
      answerAreaHtml = `
        <textarea class="exam-textarea" data-s-textarea="${q.id}" placeholder="وەڵامەکەت لێرە بنووسە...">${escHtml(currentText)}</textarea>
        <div class="exam-lock-footer">
          <span style="font-size:0.78rem; color:var(--exam-ink-muted);"><i class="fa-solid fa-circle-info"></i> هەر وەڵامێک جێگیر بکەیت پارێزراو دەبێت و ناسڕدرێتەوە</span>
          <button type="button" class="exam-btn exam-btn-primary exam-btn-sm" data-s-lock-btn="${q.id}">
            <i class="fa-solid fa-lock"></i> جێگیرکردنی وەڵام
          </button>
        </div>`;
    }

    const teacherNoteHtml = (isGraded && ans && ans.teacher_note)
      ? `<div style="margin-top:0.75rem; padding:0.65rem 0.85rem; border-radius:0.75rem; background:var(--exam-gold-soft); border:1px solid var(--exam-border-strong); font-size:0.84rem;">
           <strong style="color:var(--exam-gold);"><i class="fa-solid fa-pen-fancy"></i> تێبینی مامۆستا:</strong> ${escHtml(ans.teacher_note)}
         </div>`
      : '';

    return `
      <div class="${cardClass}" id="student_q_${q.id}" data-sqid="${q.id}">
        <div class="exam-q-head">
          <div class="exam-q-num-group">
            <span class="exam-q-num">${index + 1}</span>
            <span class="exam-q-label">پرسیاری ${index + 1}</span>
          </div>
          ${gradePillHtml}
        </div>
        ${q.question_text ? `<p class="exam-q-text">${escHtml(q.question_text)}</p>` : ''}
        ${renderAttachmentsHtml(q.attachments)}
        ${answerAreaHtml}
        ${teacherNoteHtml}
      </div>`;
  }

  function renderStudentExamPaper() {
    const { exam, submission } = state.studentPaper;
    if (!exam) return;

    const resultBanner = $('studentResultBanner');
    const submittedNotice = $('studentSubmittedNotice');
    const submitSection = $('studentSubmitSection');

    resultBanner.classList.add('hidden');
    resultBanner.classList.remove('grade-pass', 'grade-retry');
    submittedNotice.classList.add('hidden');
    submitSection.classList.add('hidden');

    if (submission && submission.status === 'graded') {
      const built = buildOfficialResultBannerHtml(submission);
      resultBanner.innerHTML = built.html;
      resultBanner.classList.add(built.pass ? 'grade-pass' : 'grade-retry');
      resultBanner.classList.remove('hidden');
    } else if (submission && submission.status === 'submitted') {
      submittedNotice.classList.remove('hidden');
    } else if (exam.status === 'published') {
      submitSection.classList.remove('hidden');
    }

    $('studentExamTitle').textContent = exam.title || '';
    const descEl = $('studentExamDesc');
    if (exam.description) {
      descEl.textContent = exam.description;
      descEl.classList.remove('hidden');
    } else {
      descEl.classList.add('hidden');
    }

    $('studentExamMeta').innerHTML = `
      <span class="exam-meta-chip"><i class="fa-solid fa-user-graduate"></i> قوتابی: ${escHtml(state.user?.full_name || state.user?.username || '')}</span>
      ${exam.subject ? `<span class="exam-meta-chip"><i class="fa-solid fa-bookmark"></i> ${escHtml(exam.subject)}</span>` : ''}
      <span class="exam-meta-chip"><i class="fa-solid fa-list-ol"></i> ${(exam.questions || []).length} پرسیار</span>
      <span class="exam-meta-chip"><i class="fa-solid fa-star"></i> کۆی نمرە: ${fmtNum(exam.total_max_score)}</span>
      <span class="exam-meta-chip"><i class="fa-solid fa-user-tie"></i> مامۆستا: ${escHtml(exam.creator_name || 'بەڕێوەبەر')}</span>
    `;

    const listEl = $('studentQuestionsList');
    listEl.innerHTML = (exam.questions || []).map((q, idx) => renderSingleStudentQuestionHtml(q, idx)).join('');
    updateStudentProgressUI();
  }

  async function lockStudentAnswerNow(questionId, btnEl) {
    const { exam, answersMap, drafts } = state.studentPaper;
    if (!exam) return;
    if (answersMap[questionId] && answersMap[questionId].is_locked) return;

    const ta = document.querySelector(`[data-s-textarea="${questionId}"]`);
    const ansText = String(ta ? ta.value : (drafts[questionId] || '')).trim();
    if (!ansText) {
      toast('تکایە سەرەتا وەڵامەکەت بنووسە یان هەڵبژێرە', true);
      if (ta) ta.focus();
      return;
    }

    // Two-tap inline safety confirmation (fast for 100+ questions, prevents accidental locks!)
    if (btnEl && btnEl.dataset.armed !== '1') {
      btnEl.dataset.armed = '1';
      btnEl.classList.remove('exam-btn-primary');
      btnEl.classList.add('exam-btn-gold');
      btnEl.innerHTML = '<i class="fa-solid fa-check-double"></i> دووبارە کلیک بکە بۆ جێگیرکردنی هەمیشەیی';
      setTimeout(() => {
        if (btnEl && btnEl.isConnected && btnEl.dataset.armed === '1') {
          btnEl.dataset.armed = '0';
          btnEl.classList.remove('exam-btn-gold');
          btnEl.classList.add('exam-btn-primary');
          btnEl.innerHTML = '<i class="fa-solid fa-lock"></i> جێگیرکردنی وەڵام';
        }
      }, 4500);
      return;
    }

    if (btnEl) {
      btnEl.disabled = true;
      btnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جێگیرکردن...';
    }

    try {
      const res = await apiFetch('/api/exams/student/' + exam.id + '/lock-answer', {
        method: 'POST',
        body: JSON.stringify({ question_id: questionId, answer_text: ansText })
      });
      state.studentPaper.answersMap[questionId] = Object.assign({}, res.answer, { is_locked: true });
      delete state.studentPaper.drafts[questionId];
      try { localStorage.setItem(getDraftStorageKey(exam.id), JSON.stringify(state.studentPaper.drafts)); } catch (e) {}

      // Surgically replace just this question card (ultra-fast for 100+ questions!)
      const idx = (exam.questions || []).findIndex(q => Number(q.id) === Number(questionId));
      const cardEl = $('student_q_' + questionId);
      if (cardEl && idx >= 0) {
        const tmp = document.createElement('div');
        tmp.innerHTML = renderSingleStudentQuestionHtml(exam.questions[idx], idx).trim();
        cardEl.replaceWith(tmp.firstElementChild);
      }
      updateStudentProgressUI();
      toast('وەڵامەکە بە هەمیشەیی جێگیرکرا 🔒');
    } catch (err) {
      toast(err.message || 'هەڵە لە جێگیرکردنی وەڵام', true);
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.dataset.armed = '0';
        btnEl.classList.remove('exam-btn-gold');
        btnEl.classList.add('exam-btn-primary');
        btnEl.innerHTML = '<i class="fa-solid fa-lock"></i> جێگیرکردنی وەڵام';
      }
    }
  }

  async function submitStudentExamNow() {
    const { exam, answersMap, drafts } = state.studentPaper;
    if (!exam) return;
    const qs = exam.questions || [];
    const lockedCount = qs.filter(q => answersMap[q.id] && answersMap[q.id].is_locked).length;

    const pendingAnswers = [];
    qs.forEach(q => {
      if (answersMap[q.id] && answersMap[q.id].is_locked) return;
      const ta = document.querySelector(`[data-s-textarea="${q.id}"]`);
      const txt = String(ta ? ta.value : (drafts[q.id] || '')).trim();
      if (txt) pendingAnswers.push({ question_id: q.id, answer_text: txt });
    });

    const totalAnswered = lockedCount + pendingAnswers.length;
    const unanswered = qs.length - totalAnswered;

    const ok = await confirmDialog({
      title: 'ناردنی پەڕەی ئیمتیحان بۆ مامۆستا؟',
      body: `تۆ وەڵامی ${totalAnswered} پرسیارت لە کۆی ${qs.length} پرسیار داوەتەوە` +
        (unanswered > 0 ? ` (${unanswered} پرسیار بێ وەڵامە).` : ' (هەموو پرسیارەکان وەڵامدراون!).') +
        ' دوای ناردن ناتوانیت دەستکاری پەڕەکە بکەیت و ڕاستەوخۆ دەگاتە دەستی مامۆستا.',
      okText: 'بەڵێ، ئیمتیحانەکە بنێرە'
    });
    if (!ok) return;

    const btn = $('btnSubmitExamPaper');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ناردنی ئیمتیحان...';

    try {
      await apiFetch('/api/exams/student/' + exam.id + '/submit', {
        method: 'POST',
        body: JSON.stringify({ pendingAnswers })
      });
      clearLocalDrafts(exam.id);
      toast('ئیمتیحانەکەت بە سەرکەوتوویی نێردرا بۆ مامۆستا 🎉');
      await openStudentExam(exam.id, false);
    } catch (err) {
      toast(err.message || 'هەڵە لە ناردنی ئیمتیحان', true);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> ناردنی ئیمتیحان بۆ مامۆستا';
    }
  }

  // =========================================================================
  // VIEW 4: MANAGER SUBMISSIONS LIST
  // =========================================================================
  async function openExamSubmissions(examId, pushHistory = true) {
    try {
      const res = await apiFetch('/api/exams/admin/' + examId + '/submissions');
      state.submissionsView = {
        exam: res.exam,
        submissions: res.submissions || [],
        filter: 'all'
      };
      renderExamSubmissionsList();
      showView('submissions', pushHistory);
    } catch (err) {
      toast(err.message || 'هەڵە لە هێنانی وەڵامەکان', true);
    }
  }

  function renderExamSubmissionsList() {
    const { exam, submissions, filter } = state.submissionsView;
    if (!exam) return;

    $('subsExamTitle').textContent = 'وەڵامەکانی: ' + exam.title;
    $('subsExamMeta').textContent = `${(exam.questions || []).length} پرسیار • کۆی نمرە: ${fmtNum(exam.total_max_score)}`;

    const allSubs = submissions.filter(s => s.status === 'submitted' || s.status === 'graded');
    const submittedSubs = allSubs.filter(s => s.status === 'submitted');
    const gradedSubs = allSubs.filter(s => s.status === 'graded');

    $('subCountAll').textContent = String(allSubs.length);
    $('subCountSubmitted').textContent = String(submittedSubs.length);
    $('subCountGraded').textContent = String(gradedSubs.length);

    document.querySelectorAll('#subsFilterTabs .exam-filter-tab').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.filter === filter);
    });

    const filtered = filter === 'submitted' ? submittedSubs : (filter === 'graded' ? gradedSubs : allSubs);
    const listEl = $('submissionsListContainer');
    const emptyEl = $('submissionsEmptyState');

    if (filtered.length === 0) {
      listEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }

    emptyEl.classList.add('hidden');
    listEl.innerHTML = filtered.map(s => {
      const isGraded = s.status === 'graded';
      const hasAutoPreGraded = !isGraded && Number(s.graded_answers_count || 0) > 0;
      const pct = s.max_total_score > 0 ? Math.round((Number(s.total_score) / Number(s.max_total_score)) * 100) : 0;
      const lostScore = roundScore(Math.max(0, Number(s.max_total_score || 0) - Number(s.total_score || 0)));
      const badge = isGraded
        ? `<span class="exam-status-badge is-published"><i class="fa-solid fa-award"></i> نمرە: ${fmtNum(s.total_score)} / ${fmtNum(s.max_total_score)} (${pct}%)</span>`
        : (hasAutoPreGraded
          ? `<span class="exam-auto-badge"><i class="fa-solid fa-wand-magic-sparkles"></i> سەحکراوی تۆماتیکی: ${fmtNum(s.total_score)} / ${fmtNum(s.max_total_score)} (${pct}%)</span>`
          : '<span class="exam-status-badge is-pending"><i class="fa-solid fa-bell"></i> چاوەڕوانی هەڵسەنگاندن</span>');

      return `
        <div class="exam-sub-row">
          <div style="min-width:0; flex:1;">
            <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.35rem;">
              <strong style="font-size:1.05rem; color:var(--exam-ink);"><i class="fa-solid fa-user-graduate" style="color:var(--exam-gold); margin-left:0.3rem;"></i>${escHtml(s.student_name)}</strong>
              ${s.student_username ? `<span style="font-size:0.78rem; color:var(--exam-ink-muted);">@${escHtml(s.student_username)}</span>` : ''}
              ${badge}
            </div>
            <div class="exam-card-meta">
              <span><i class="fa-regular fa-clock" style="color:var(--exam-gold);"></i> کاتی ناردن: ${escHtml(fmtDate(s.submitted_at))}</span>
              <span><i class="fa-solid fa-file-pen" style="color:var(--exam-gold);"></i> وەڵامدراو: ${s.answered_count || 0} / ${s.total_questions || 0}</span>
              ${(isGraded || hasAutoPreGraded) ? `<span><i class="fa-solid fa-check" style="color:#15803d;"></i> ${s.correct_count || 0} ڕاست • <i class="fa-solid fa-xmark" style="color:var(--exam-crimson);"></i> ${s.wrong_count || 0} هەڵە • دەرەجەی لێڕۆشتوو: ${fmtNum(lostScore)}</span>` : ''}
            </div>
          </div>
          <button type="button" class="exam-btn ${isGraded ? 'exam-btn-soft' : 'exam-btn-primary'} exam-btn-sm" data-open-grade="${s.id}">
            <i class="fa-solid ${isGraded ? 'fa-eye' : 'fa-pen-clip'}"></i>
            ${isGraded ? 'بینین / گۆڕانکاری' : (hasAutoPreGraded ? 'بینین و ناردنی ئەنجام' : 'پشکنین و نمرەدان')}
          </button>
        </div>`;
    }).join('');
  }

  // =========================================================================
  // VIEW 5: MANAGER GRADING PAPER (✅ / ❌ + SCORE + 1-BUTTON FINALIZE)
  // =========================================================================
  async function openGradeSubmission(submissionId, pushHistory = true) {
    try {
      const res = await apiFetch('/api/exams/admin/submissions/' + submissionId);
      const ansMap = {};
      const gradesMap = {};
      (res.answers || []).forEach(a => {
        ansMap[Number(a.question_id)] = a;
        gradesMap[Number(a.question_id)] = {
          is_correct: a.is_correct === 1 ? 1 : (a.is_correct === 0 ? 0 : null),
          score: a.score != null ? roundScore(a.score) : '',
          teacher_note: a.teacher_note || ''
        };
      });
      (res.exam.questions || []).forEach(q => {
        if (!gradesMap[q.id]) {
          gradesMap[q.id] = { is_correct: null, score: '', teacher_note: '' };
        }
      });

      state.grading = {
        exam: res.exam,
        submission: res.submission,
        answersMap: ansMap,
        gradesMap,
        saveTimers: {}
      };
      renderGradingPaper();
      showView('grade', pushHistory);
    } catch (err) {
      toast(err.message || 'هەڵە لە کردنەوەی پەڕەی هەڵسەنگاندن', true);
    }
  }

  function computeLocalGradingTotals() {
    const { exam, gradesMap } = state.grading;
    const qs = exam ? (exam.questions || []) : [];
    let totalScore = 0;
    let maxTotal = 0;
    let correctCount = 0;
    let wrongCount = 0;
    qs.forEach(q => {
      maxTotal += roundScore(q.max_score);
      const g = gradesMap[q.id] || {};
      if (g.score !== '' && g.score != null && Number.isFinite(Number(g.score))) {
        totalScore += roundScore(g.score);
      }
      if (g.is_correct === 1) correctCount++;
      else if (g.is_correct === 0) wrongCount++;
    });
    return {
      total_score: roundScore(totalScore),
      max_total_score: roundScore(maxTotal),
      correct_count: correctCount,
      wrong_count: wrongCount
    };
  }

  function updateGradingLiveBar() {
    const totals = computeLocalGradingTotals();
    $('gradeLiveScore').textContent = fmtNum(totals.total_score);
    $('gradeLiveMax').textContent = fmtNum(totals.max_total_score);
    $('gradeLiveCorrect').textContent = String(totals.correct_count);
    $('gradeLiveWrong').textContent = String(totals.wrong_count);
    $('gradeFinalizePreviewScore').textContent = `${fmtNum(totals.total_score)} / ${fmtNum(totals.max_total_score)}`;

    const qs = state.grading.exam ? (state.grading.exam.questions || []) : [];
    const navGrid = $('gradeNavGrid');
    if (navGrid) {
      navGrid.innerHTML = qs.map((q, idx) => {
        const g = state.grading.gradesMap[q.id] || {};
        const cls = g.is_correct === 1 ? 'is-correct' : (g.is_correct === 0 ? 'is-wrong' : (g.score !== '' && g.score != null ? 'is-draft' : ''));
        return `<button type="button" class="exam-nav-chip ${cls}" data-jump-grade-q="${q.id}">${idx + 1}</button>`;
      }).join('');
    }
  }

  function renderGradingPaper() {
    const { exam, submission, answersMap, gradesMap } = state.grading;
    if (!exam || !submission) return;

    const banner = $('gradeResultBanner');
    banner.classList.add('hidden');
    banner.classList.remove('grade-pass', 'grade-retry');
    if (submission.status === 'graded') {
      const built = buildOfficialResultBannerHtml(submission);
      banner.innerHTML = built.html;
      banner.classList.add(built.pass ? 'grade-pass' : 'grade-retry');
      banner.classList.remove('hidden');
    }

    $('gradeExamTitle').textContent = exam.title || '';
    $('gradeStudentMeta').innerHTML = `
      <span class="exam-meta-chip"><i class="fa-solid fa-user-graduate"></i> قوتابی: ${escHtml(submission.student_name)}</span>
      <span class="exam-meta-chip"><i class="fa-regular fa-clock"></i> نێردراوە لە: ${escHtml(fmtDate(submission.submitted_at))}</span>
      <span class="exam-meta-chip"><i class="fa-solid fa-list-ol"></i> ${(exam.questions || []).length} پرسیار</span>
      <span class="exam-meta-chip"><i class="fa-solid fa-star"></i> کۆی نمرە: ${fmtNum(exam.total_max_score)}</span>
    `;

    $('gradeOverallFeedback').value = submission.teacher_feedback || '';
    $('btnFinalizeGrading').innerHTML = submission.status === 'graded'
      ? '<i class="fa-solid fa-arrows-rotate"></i> نوێکردنەوەی ئەنجام و ناردنەوە بۆ قوتابی'
      : '<i class="fa-solid fa-award"></i> کۆتایی هێنان و ناردنی ئەنجام بۆ قوتابی';

    const listEl = $('gradeQuestionsList');
    listEl.innerHTML = (exam.questions || []).map((q, idx) => {
      const ans = answersMap[q.id];
      const g = gradesMap[q.id] || { is_correct: null, score: '', teacher_note: '' };
      const cardCls = g.is_correct === 1
        ? 'exam-question-card grade-correct'
        : (g.is_correct === 0 ? 'exam-question-card grade-wrong' : 'exam-question-card');
      const hasAns = ans && String(ans.answer_text || '').trim().length > 0;
      const isAutoQ = (q.question_type === 'true_false' || q.question_type === 'choice') && String(q.correct_answer || '').trim() !== '';
      const lostPts = g.is_correct === 0 ? roundScore(q.max_score) : 0;

      return `
        <div class="${cardCls}" id="grade_q_${q.id}" data-gqid="${q.id}">
          <div class="exam-q-head">
            <div class="exam-q-num-group">
              <span class="exam-q-num">${idx + 1}</span>
              <span class="exam-q-label">پرسیاری ${idx + 1}</span>
              ${isAutoQ ? `<span class="exam-auto-badge"><i class="fa-solid fa-wand-magic-sparkles"></i> سەحکراوی تۆماتیکی</span>` : ''}
            </div>
            <span class="exam-q-score-pill"><i class="fa-solid fa-star"></i> لە ${fmtNum(q.max_score)} نمرە</span>
          </div>

          ${q.question_text ? `<p class="exam-q-text">${escHtml(q.question_text)}</p>` : ''}
          ${renderAttachmentsHtml(q.attachments)}

          <div class="exam-student-ans-preview">
            <div class="exam-student-ans-label">
              <i class="fa-solid fa-pen-nib"></i> وەڵامی قوتابی (${escHtml(submission.student_name)}):
            </div>
            <div class="exam-student-ans-body ${hasAns ? '' : 'exam-student-ans-empty'}">
              ${hasAns ? escHtml(ans.answer_text) : 'قوتابی وەڵامی ئەم پرسیارەی نەنووسیوە.'}
            </div>
            ${isAutoQ ? `
              <div style="margin-top:0.45rem; display:flex; flex-wrap:wrap; align-items:center; gap:0.6rem; font-size:0.8rem; font-weight:800;">
                <span style="color:#15803d;"><i class="fa-solid fa-key"></i> وەڵامی ڕاست: ${escHtml(q.correct_answer)}</span>
                ${lostPts > 0 ? `<span style="color:var(--exam-crimson);"><i class="fa-solid fa-arrow-trend-down"></i> دەرەجەی لێڕۆشتوو: ${fmtNum(lostPts)} نمرە</span>` : ''}
              </div>
            ` : ''}
          </div>

          <div class="exam-grade-bar">
            <button type="button" class="exam-mark-btn btn-correct ${g.is_correct === 1 ? 'is-active' : ''}" data-g-mark="${q.id}" data-mark-val="1" data-max-score="${fmtNum(q.max_score)}">
              <i class="fa-solid fa-check"></i> ڕاست (سەح)
            </button>
            <button type="button" class="exam-mark-btn btn-wrong ${g.is_correct === 0 ? 'is-active' : ''}" data-g-mark="${q.id}" data-mark-val="0" data-max-score="${fmtNum(q.max_score)}">
              <i class="fa-solid fa-xmark"></i> هەڵە
            </button>
            <div class="exam-score-input-wrap">
              <span style="font-size:0.78rem; font-weight:800; color:var(--exam-ink-muted);">دەرەجە:</span>
              <input type="number" min="0" max="${fmtNum(q.max_score * 2)}" step="0.25" value="${g.score !== '' && g.score != null ? fmtNum(g.score) : ''}" placeholder="0" data-g-score="${q.id}">
              <span class="exam-score-max-lbl">/ ${fmtNum(q.max_score)}</span>
            </div>
            <span class="exam-grade-saved-tag" data-g-saved="${q.id}"></span>
          </div>

          <div style="margin-top:0.55rem;">
            <input type="text" class="exam-input" style="padding:0.45rem 0.75rem; font-size:0.84rem;" value="${escHtml(g.teacher_note || '')}" data-g-note="${q.id}" placeholder="تێبینی مامۆستا بۆ ئەم پرسیارە (دڵخواز)...">
          </div>
        </div>`;
    }).join('');

    updateGradingLiveBar();
  }

  function scheduleSaveSingleGrade(qId, immediate = false) {
    const sub = state.grading.submission;
    if (!sub) return;
    if (state.grading.saveTimers[qId]) {
      clearTimeout(state.grading.saveTimers[qId]);
    }
    const statusEl = document.querySelector(`[data-g-saved="${qId}"]`);
    if (statusEl) statusEl.textContent = 'پاشەکەوتکردن...';

    const doSave = async () => {
      const g = state.grading.gradesMap[qId] || {};
      try {
        await apiFetch('/api/exams/admin/submissions/' + sub.id + '/grade-answer', {
          method: 'PUT',
          body: JSON.stringify({
            question_id: qId,
            is_correct: g.is_correct,
            score: g.score === '' ? null : roundScore(g.score),
            teacher_note: g.teacher_note || ''
          })
        });
        const sEl = document.querySelector(`[data-g-saved="${qId}"]`);
        if (sEl) sEl.innerHTML = '<i class="fa-solid fa-check"></i> پاشەکەوتکرا';
      } catch (err) {
        const sEl = document.querySelector(`[data-g-saved="${qId}"]`);
        if (sEl) sEl.textContent = 'هەڵە!';
        toast(err.message || 'هەڵە لە پاشەکەوتکردنی نمرە', true);
      }
    };

    if (immediate) doSave();
    else state.grading.saveTimers[qId] = setTimeout(doSave, 420);
  }

  async function finalizeGradingNow() {
    const { exam, submission, gradesMap } = state.grading;
    if (!exam || !submission) return;

    const totals = computeLocalGradingTotals();
    const pct = totals.max_total_score > 0 ? Math.round((totals.total_score / totals.max_total_score) * 100) : 0;

    const ok = await confirmDialog({
      title: 'کۆتایی هێنان و ناردنی ئەنجام بۆ قوتابی؟',
      body: `نمرەی کۆکراوەی «${submission.student_name}»: ${fmtNum(totals.total_score)} لە ${fmtNum(totals.max_total_score)} (${pct}%) — ✅ ${totals.correct_count} ڕاست | ❌ ${totals.wrong_count} هەڵە. ئەنجامەکە بەگەورەیی لەسەر پەڕەکە دەنووسرێت و ڕاستەوخۆ دەگەڕێتەوە بۆ قوتابی.`,
      okText: 'بەڵێ، ئەنجامەکە دەربکە و بنێرە'
    });
    if (!ok) return;

    const btn = $('btnFinalizeGrading');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> کۆکردنەوەی نمرەکان و ناردنی ئەنجام...';

    try {
      const gradesArr = (exam.questions || []).map(q => {
        const g = gradesMap[q.id] || {};
        return {
          question_id: q.id,
          is_correct: g.is_correct,
          score: g.score === '' ? null : roundScore(g.score),
          teacher_note: g.teacher_note || ''
        };
      });
      const feedback = String($('gradeOverallFeedback').value || '').trim();

      const res = await apiFetch('/api/exams/admin/submissions/' + submission.id + '/finalize', {
        method: 'POST',
        body: JSON.stringify({ grades: gradesArr, teacher_feedback: feedback })
      });

      state.grading.submission = res.submission;
      const banner = $('gradeResultBanner');
      const built = buildOfficialResultBannerHtml(res.submission);
      banner.innerHTML = built.html;
      banner.classList.remove('hidden', 'grade-pass', 'grade-retry');
      banner.classList.add(built.pass ? 'grade-pass' : 'grade-retry');

      btn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> نوێکردنەوەی ئەنجام و ناردنەوە بۆ قوتابی';
      toast('ئەنجامی ئیمتیحان کۆکرایەوە و بە سەرکەوتوویی گەڕێندرایەوە بۆ قوتابی 🏆');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast(err.message || 'هەڵە لە کۆتاییهێنان بە ئەنجام', true);
      btn.innerHTML = '<i class="fa-solid fa-award"></i> کۆتایی هێنان و ناردنی ئەنجام بۆ قوتابی';
    } finally {
      btn.disabled = false;
    }
  }

  // =========================================================================
  // GLOBAL EVENT DELEGATION
  // =========================================================================
  function bindEvents() {
    $('examThemeToggle').addEventListener('click', toggleTheme);
    $('examBackBtn').addEventListener('click', navigateBackOneStep);
    $('btnNewExam').addEventListener('click', () => openExamBuilder(null));
    $('btnAddOneQ').addEventListener('click', () => appendBuilderQuestions(1));
    $('btnAddFiveQ').addEventListener('click', () => appendBuilderQuestions(5));
    $('btnAddTenQ').addEventListener('click', () => appendBuilderQuestions(10));
    $('btnBuilderSaveDraft').addEventListener('click', () => saveBuilderExam('draft'));
    $('btnBuilderPublish').addEventListener('click', () => saveBuilderExam('published'));
    $('btnSubmitExamPaper').addEventListener('click', submitStudentExamNow);
    $('btnFinalizeGrading').addEventListener('click', finalizeGradingNow);

    $('btnStudentJumpSubmit').addEventListener('click', () => {
      const el = $('studentSubmitSection');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    $('btnGradeJumpFinalize').addEventListener('click', () => {
      const el = $('gradeFinalizeBox');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    $('btnRefreshSubs').addEventListener('click', () => {
      if (state.submissionsView.exam) openExamSubmissions(state.submissionsView.exam.id, false);
    });

    // Collapsible quick navigator toggles
    ['builder', 'student', 'grade'].forEach(prefix => {
      const tog = $(prefix + 'NavToggle');
      const grid = $(prefix + 'NavGrid');
      if (tog && grid) {
        tog.addEventListener('click', () => grid.classList.toggle('hidden'));
      }
    });

    // Lightbox close
    $('examLightboxModal').addEventListener('click', () => {
      $('examLightboxModal').classList.add('hidden');
      $('examLightboxImg').src = '';
    });

    // Delegated Clicks
    document.addEventListener('click', async (e) => {
      // Image Zoom Lightbox
      const lbImg = e.target.closest('[data-lightbox-src]');
      if (lbImg) {
        $('examLightboxImg').src = lbImg.dataset.lightboxSrc;
        $('examLightboxModal').classList.remove('hidden');
        return;
      }

      // Dashboard Manager Actions
      const openSubsBtn = e.target.closest('[data-open-subs]');
      if (openSubsBtn) { openExamSubmissions(Number(openSubsBtn.dataset.openSubs), true); return; }

      const editBtn = e.target.closest('[data-edit-exam]');
      if (editBtn) { openExamBuilder(Number(editBtn.dataset.editExam)); return; }

      const toggleBtn = e.target.closest('[data-toggle-exam]');
      if (toggleBtn) {
        const id = Number(toggleBtn.dataset.toggleExam);
        const nextStatus = toggleBtn.dataset.nextStatus;
        try {
          await apiFetch('/api/exams/admin/' + id + '/status', {
            method: 'PATCH',
            body: JSON.stringify({ status: nextStatus })
          });
          toast(nextStatus === 'published' ? 'ئیمتیحانەکە چالاککرایەوە ✓' : 'ئیمتیحانەکە داخرا');
          loadExamsDashboard(false);
        } catch (err) { toast(err.message, true); }
        return;
      }

      const delBtn = e.target.closest('[data-delete-exam]');
      if (delBtn) {
        const id = Number(delBtn.dataset.deleteExam);
        const ok = await confirmDialog({
          title: 'سڕینەوەی ئیمتیحان؟',
          body: 'بە سڕینەوەی ئەم ئیمتیحانە هەموو پرسیارەکان و وەڵامە نێردراوەکانی قوتابیان بۆ ئەم ئیمتیحانە دەسڕێنەوە.',
          okText: 'بەڵێ، بیسڕەوە',
          danger: true
        });
        if (!ok) return;
        try {
          await apiFetch('/api/exams/admin/' + id, { method: 'DELETE' });
          toast('ئیمتیحانەکە سڕایەوە');
          loadExamsDashboard(false);
        } catch (err) { toast(err.message, true); }
        return;
      }

      // Dashboard Student Action
      const openStuBtn = e.target.closest('[data-open-student-exam]');
      if (openStuBtn) { openStudentExam(Number(openStuBtn.dataset.openStudentExam), true); return; }

      // Submissions Filter & Open Grading
      const filterTab = e.target.closest('#subsFilterTabs .exam-filter-tab');
      if (filterTab) {
        state.submissionsView.filter = filterTab.dataset.filter;
        renderExamSubmissionsList();
        return;
      }

      const openGradeBtn = e.target.closest('[data-open-grade]');
      if (openGradeBtn) { openGradeSubmission(Number(openGradeBtn.dataset.openGrade), true); return; }

      // Quick Jump Chips
      const jumpB = e.target.closest('[data-jump-builder]');
      if (jumpB) {
        const el = $('builder_q_' + jumpB.dataset.jumpBuilder);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      const jumpS = e.target.closest('[data-jump-student-q]');
      if (jumpS) {
        const el = $('student_q_' + jumpS.dataset.jumpStudentQ);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      const jumpG = e.target.closest('[data-jump-grade-q]');
      if (jumpG) {
        const el = $('grade_q_' + jumpG.dataset.jumpGradeQ);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Builder Controls
      const uploadBtn = e.target.closest('[data-b-upload]');
      if (uploadBtn) {
        triggerQuestionMediaUpload(uploadBtn.dataset.bUpload, uploadBtn.dataset.uploadKind);
        return;
      }

      const recBtn = e.target.closest('[data-b-record]');
      if (recBtn) {
        toggleQuestionVoiceRecording(recBtn.dataset.bRecord);
        return;
      }

      const remAttBtn = e.target.closest('[data-remove-att]');
      if (remAttBtn) {
        const qUid = remAttBtn.dataset.quid;
        const idx = Number(remAttBtn.dataset.removeAtt);
        const q = state.builder.questions.find(item => item._uid === qUid);
        if (q) {
          q.attachments.splice(idx, 1);
          refreshSingleBuilderAttachments(qUid);
        }
        return;
      }

      const delQBtn = e.target.closest('[data-b-del]');
      if (delQBtn) {
        if (state.builder.questions.length <= 1) {
          toast('پێویستە لانی کەم یەک پرسیار بمێنێتەوە', true);
          return;
        }
        const qUid = delQBtn.dataset.bDel;
        state.builder.questions = state.builder.questions.filter(item => item._uid !== qUid);
        renderAllBuilderQuestions();
        return;
      }

      const upBtn = e.target.closest('[data-b-move-up]');
      if (upBtn) {
        const idx = state.builder.questions.findIndex(item => item._uid === upBtn.dataset.bMoveUp);
        if (idx > 0) {
          const arr = state.builder.questions;
          [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
          renderAllBuilderQuestions();
        }
        return;
      }

      const downBtn = e.target.closest('[data-b-move-down]');
      if (downBtn) {
        const idx = state.builder.questions.findIndex(item => item._uid === downBtn.dataset.bMoveDown);
        if (idx >= 0 && idx < state.builder.questions.length - 1) {
          const arr = state.builder.questions;
          [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
          renderAllBuilderQuestions();
        }
        return;
      }

      const addOptBtn = e.target.closest('[data-b-add-opt]');
      if (addOptBtn) {
        const q = state.builder.questions.find(item => item._uid === addOptBtn.dataset.bAddOpt);
        if (q && q.options.length < 10) {
          q.options.push('');
          renderAllBuilderQuestions();
        }
        return;
      }

      const delOptBtn = e.target.closest('[data-b-del-opt]');
      if (delOptBtn) {
        const q = state.builder.questions.find(item => item._uid === delOptBtn.dataset.bDelOpt);
        const oi = Number(delOptBtn.dataset.optIdx);
        if (q && q.options.length > 2) {
          q.options.splice(oi, 1);
          if (q._correctIdx === oi) {
            q._correctIdx = -1;
            q.correct_answer = '';
          } else if (q._correctIdx > oi) {
            q._correctIdx -= 1;
          }
          renderAllBuilderQuestions();
        }
        return;
      }

      const tfKeyBtn = e.target.closest('[data-b-tf-key]');
      if (tfKeyBtn) {
        const qUid = tfKeyBtn.dataset.bTfKey;
        const val = tfKeyBtn.dataset.tfVal;
        const q = state.builder.questions.find(item => item._uid === qUid);
        if (q) {
          q.correct_answer = val;
          const wrap = document.querySelector(`[data-b-tf-wrap="${qUid}"]`);
          if (wrap) {
            wrap.querySelectorAll('[data-b-tf-key]').forEach(btn => {
              btn.classList.toggle('is-selected', btn.dataset.tfVal === val);
            });
          }
        }
        return;
      }

      const choiceKeyBtn = e.target.closest('[data-b-choice-key]');
      if (choiceKeyBtn) {
        const qUid = choiceKeyBtn.dataset.bChoiceKey;
        const oi = Number(choiceKeyBtn.dataset.optIdx);
        const q = state.builder.questions.find(item => item._uid === qUid);
        if (q && Array.isArray(q.options)) {
          q._correctIdx = oi;
          q.correct_answer = String(q.options[oi] || '').trim();
          const list = document.querySelector(`[data-b-opts-list="${qUid}"]`);
          if (list) {
            list.querySelectorAll('[data-b-choice-key]').forEach(btn => {
              const isMatch = Number(btn.dataset.optIdx) === oi;
              btn.classList.toggle('is-correct-key', isMatch);
              const lbl = btn.querySelector('span');
              if (lbl) lbl.textContent = isMatch ? 'وەڵامی ڕاست' : 'ڕاستە؟';
            });
          }
        }
        return;
      }

      // Student MCQ Option Pick
      const mcqPick = e.target.closest('[data-s-mcq-pick]');
      if (mcqPick) {
        const qId = Number(mcqPick.dataset.sMcqPick);
        const val = mcqPick.dataset.optVal;
        if (state.studentPaper.exam) {
          saveLocalDraft(state.studentPaper.exam.id, qId, val);
        }
        const group = document.querySelector(`[data-s-mcq-group="${qId}"]`);
        if (group) {
          group.querySelectorAll('.exam-mcq-option').forEach(optEl => {
            const sel = optEl.dataset.optVal === val;
            optEl.classList.toggle('is-selected', sel);
            const r = optEl.querySelector('.exam-mcq-radio');
            if (r) r.innerHTML = sel ? '<i class="fa-solid fa-check"></i>' : '';
          });
        }
        updateStudentProgressUI();
        return;
      }

      // Student Permanent Answer Lock Button
      const lockBtn = e.target.closest('[data-s-lock-btn]');
      if (lockBtn) {
        lockStudentAnswerNow(Number(lockBtn.dataset.sLockBtn), lockBtn);
        return;
      }

      // Manager Grading One-Click ✅ / ❌ Button
      const markBtn = e.target.closest('[data-g-mark]');
      if (markBtn) {
        const qId = Number(markBtn.dataset.gMark);
        const isCorrect = Number(markBtn.dataset.markVal);
        const maxScore = roundScore(markBtn.dataset.maxScore);
        const g = state.grading.gradesMap[qId] || { is_correct: null, score: '', teacher_note: '' };
        g.is_correct = isCorrect;
        g.score = isCorrect === 1 ? maxScore : 0;
        state.grading.gradesMap[qId] = g;

        const card = $('grade_q_' + qId);
        if (card) {
          card.classList.toggle('grade-correct', isCorrect === 1);
          card.classList.toggle('grade-wrong', isCorrect === 0);
          card.querySelectorAll('[data-g-mark]').forEach(b => {
            b.classList.toggle('is-active', Number(b.dataset.markVal) === isCorrect);
          });
          const scoreInput = card.querySelector(`[data-g-score="${qId}"]`);
          if (scoreInput) scoreInput.value = fmtNum(g.score);
        }
        updateGradingLiveBar();
        scheduleSaveSingleGrade(qId, true);
        return;
      }
    });

    // Delegated Inputs & Changes (Surgical updates — fast even for 200+ questions!)
    document.addEventListener('input', (e) => {
      const bText = e.target.closest('[data-b-text]');
      if (bText) {
        const q = state.builder.questions.find(item => item._uid === bText.dataset.bText);
        if (q) {
          q.question_text = bText.value;
          const chip = document.querySelector(`[data-jump-builder="${q._uid}"]`);
          if (chip) {
            const filled = String(q.question_text || '').trim().length > 0 || (q.attachments && q.attachments.length > 0);
            chip.classList.toggle('is-locked', filled);
          }
        }
        return;
      }

      const bScore = e.target.closest('[data-b-score]');
      if (bScore) {
        const q = state.builder.questions.find(item => item._uid === bScore.dataset.bScore);
        if (q) {
          q.max_score = roundScore(bScore.value);
          updateBuilderMetricsAndNav();
        }
        return;
      }

      const bOpt = e.target.closest('[data-b-opt]');
      if (bOpt) {
        const q = state.builder.questions.find(item => item._uid === bOpt.dataset.bOpt);
        const oi = Number(bOpt.dataset.optIdx);
        if (q && Array.isArray(q.options)) {
          q.options[oi] = bOpt.value;
          if (q._correctIdx === oi) {
            q.correct_answer = String(bOpt.value || '').trim();
          }
        }
        return;
      }

      const sTa = e.target.closest('[data-s-textarea]');
      if (sTa && state.studentPaper.exam) {
        const qId = Number(sTa.dataset.sTextarea);
        saveLocalDraft(state.studentPaper.exam.id, qId, sTa.value);
        updateStudentProgressUI();
        return;
      }

      const gScore = e.target.closest('[data-g-score]');
      if (gScore) {
        const qId = Number(gScore.dataset.gScore);
        const g = state.grading.gradesMap[qId] || { is_correct: null, score: '', teacher_note: '' };
        g.score = gScore.value === '' ? '' : roundScore(gScore.value);
        state.grading.gradesMap[qId] = g;
        updateGradingLiveBar();
        scheduleSaveSingleGrade(qId, false);
        return;
      }

      const gNote = e.target.closest('[data-g-note]');
      if (gNote) {
        const qId = Number(gNote.dataset.gNote);
        const g = state.grading.gradesMap[qId] || { is_correct: null, score: '', teacher_note: '' };
        g.teacher_note = gNote.value;
        state.grading.gradesMap[qId] = g;
        scheduleSaveSingleGrade(qId, false);
        return;
      }
    });

    document.addEventListener('change', (e) => {
      const bType = e.target.closest('[data-b-type]');
      if (bType) {
        const qUid = bType.dataset.bType;
        const q = state.builder.questions.find(item => item._uid === qUid);
        if (q) {
          const prevType = q.question_type;
          q.question_type = bType.value === 'choice'
            ? 'choice'
            : (bType.value === 'true_false' ? 'true_false' : 'text');
          if (prevType !== q.question_type) {
            q.correct_answer = '';
            q._correctIdx = -1;
          }
          const optsWrap = document.querySelector(`[data-b-opts-wrap="${qUid}"]`);
          const tfWrap = document.querySelector(`[data-b-tf-wrap="${qUid}"]`);
          if (optsWrap) optsWrap.classList.toggle('hidden', q.question_type !== 'choice');
          if (tfWrap) {
            tfWrap.classList.toggle('hidden', q.question_type !== 'true_false');
            if (q.question_type === 'true_false') {
              tfWrap.querySelectorAll('[data-b-tf-key]').forEach(btn => btn.classList.remove('is-selected'));
            }
          }
        }
      }
    });
  }

  // =========================================================================
  // REAL-TIME SOCKET.IO UPDATES
  // =========================================================================
  function initSocket() {
    if (typeof io !== 'function' || !state.token) return;
    try {
      const sock = io({ auth: { token: state.token } });
      state.socket = sock;

      sock.on('exam_submitted', (data) => {
        if (!state.isManager) return;
        toast(`پەڕەی ئیمتیحانی نوێ لە «${data.studentName || 'قوتابی'}» گەیشت!`);
        if (state.view === 'list') loadExamsDashboard(false);
        else if (state.view === 'submissions' && state.submissionsView.exam && Number(state.submissionsView.exam.id) === Number(data.examId)) {
          openExamSubmissions(data.examId, false);
        }
      });

      sock.on('exam_published', (data) => {
        if (state.isManager) return;
        toast(`ئیمتیحانی نوێ بڵاوکرایەوە: ${data.title || ''}`);
        if (state.view === 'list') loadExamsDashboard(false);
      });

      sock.on('exam_graded', (data) => {
        if (state.isManager) return;
        toast(`🏆 ئەنجامی ئیمتیحانی «${data.examTitle || ''}» دەرچوو: ${fmtNum(data.totalScore)} / ${fmtNum(data.maxTotalScore)}`);
        if (state.view === 'student' && state.studentPaper.exam && Number(state.studentPaper.exam.id) === Number(data.examId)) {
          openStudentExam(data.examId, false);
        } else if (state.view === 'list') {
          loadExamsDashboard(false);
        }
      });
    } catch (e) {}
  }

  // =========================================================================
  // BOOTSTRAP
  // =========================================================================
  async function init() {
    syncThemeUI();
    bindEvents();

    state.token = localStorage.getItem('ferga_token') || localStorage.getItem('seereen_token');
    if (!state.token) {
      showView('auth', false);
      return;
    }

    try {
      const me = await apiFetch('/api/auth/me');
      state.user = me.user || me;
      if (!state.user || !state.user.id) {
        showView('auth', false);
        return;
      }

      state.isManager = checkIsManager(state.user);
      $('examUserName').textContent = state.user.full_name || state.user.username || '';
      $('examRoleTag').textContent = state.isManager ? 'بەڕێوەبەر' : 'قوتابی';
      $('examUserPill').classList.remove('hidden');

      initSocket();
      await loadExamsDashboard(false);
    } catch (err) {
      showView('auth', false);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
