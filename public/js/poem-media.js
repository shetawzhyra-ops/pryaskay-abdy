/**
 * Shared Optional Media Controller & Renderer for Poems (پریاسکەی عەبدی)
 * Supports optional Audio (mic record + file), Image, and Video attachments.
 */
(() => {
  'use strict';

  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function fmtAudioSec(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  }

  function ensurePoemAudioStyles() {
    if (typeof document === 'undefined' || document.getElementById('poemAudioPlayerStyles')) return;
    const style = document.createElement('style');
    style.id = 'poemAudioPlayerStyles';
    style.textContent = `
      .pm-audio-card {
        position: relative;
        overflow: hidden;
        padding: 1rem 1.1rem;
        border-radius: 22px;
        background: linear-gradient(155deg, rgba(254, 250, 242, 0.98) 0%, rgba(242, 229, 207, 0.96) 100%);
        border: 1px solid rgba(180, 105, 14, 0.34);
        box-shadow: 0 14px 32px -14px rgba(54, 28, 12, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.85);
      }
      .pm-audio-card.is-compact {
        padding: 0.78rem 0.88rem;
        border-radius: 18px;
      }
      html.dark .pm-audio-card,
      body.dark-theme .pm-audio-card {
        background: linear-gradient(155deg, rgba(20, 38, 29, 0.96) 0%, rgba(14, 26, 20, 0.98) 100%);
        border-color: rgba(251, 191, 36, 0.26);
        box-shadow: 0 14px 32px -14px rgba(0, 0, 0, 0.55);
      }
      .pm-audio-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 16%;
        right: 16%;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(180, 105, 14, 0.55), transparent);
        pointer-events: none;
      }
      .pm-audio-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.6rem;
        margin-bottom: 0.72rem;
        flex-wrap: wrap;
      }
      .pm-audio-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        font-weight: 800;
        color: #78350f;
      }
      html.dark .pm-audio-badge,
      body.dark-theme .pm-audio-badge {
        color: #fcd34d;
      }
      .pm-audio-badge-icon {
        width: 30px;
        height: 30px;
        border-radius: 10px;
        background: linear-gradient(135deg, rgba(217, 119, 6, 0.18), rgba(180, 83, 9, 0.26));
        border: 1px solid rgba(180, 83, 9, 0.28);
        color: #b45309;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.82rem;
        flex-shrink: 0;
      }
      html.dark .pm-audio-badge-icon,
      body.dark-theme .pm-audio-badge-icon {
        color: #fbbf24;
        border-color: rgba(251, 191, 36, 0.35);
      }
      .pm-audio-tools {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
      }
      .pm-audio-pill-btn {
        padding: 0.22rem 0.62rem;
        border-radius: 999px;
        border: 1px solid rgba(156, 120, 78, 0.35);
        background: rgba(255, 252, 246, 0.9);
        color: #54371f;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        font-size: 0.72rem;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.15s;
      }
      .pm-audio-pill-btn:hover {
        border-color: #b45309;
        color: #b45309;
      }
      html.dark .pm-audio-pill-btn,
      body.dark-theme .pm-audio-pill-btn {
        background: rgba(15, 29, 22, 0.9);
        border-color: rgba(251, 191, 36, 0.28);
        color: #e2e8f0;
      }
      .pm-audio-deck {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.62rem 0.78rem;
        border-radius: 16px;
        background: rgba(255, 252, 246, 0.86);
        border: 1px solid rgba(156, 120, 78, 0.24);
        box-shadow: inset 0 1px 3px rgba(54, 28, 12, 0.06);
      }
      html.dark .pm-audio-deck,
      body.dark-theme .pm-audio-deck {
        background: rgba(11, 22, 17, 0.72);
        border-color: rgba(251, 191, 36, 0.18);
      }
      .pm-audio-play-btn {
        width: 44px;
        height: 44px;
        border-radius: 999px;
        border: 1px solid rgba(255, 240, 200, 0.5);
        background: linear-gradient(135deg, #1b432e 0%, #b4690e 100%);
        color: #ffffff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.98rem;
        cursor: pointer;
        flex-shrink: 0;
        box-shadow: 0 8px 18px -6px rgba(180, 105, 14, 0.55);
        transition: transform 0.15s, filter 0.15s, box-shadow 0.2s;
      }
      .pm-audio-card.is-compact .pm-audio-play-btn {
        width: 38px;
        height: 38px;
        font-size: 0.88rem;
      }
      .pm-audio-play-btn:hover { filter: brightness(1.08); transform: scale(1.04); }
      .pm-audio-play-btn:active { transform: scale(0.95); }
      .pm-audio-card.is-playing .pm-audio-play-btn {
        box-shadow: 0 0 0 5px rgba(180, 105, 14, 0.18), 0 8px 18px -6px rgba(180, 105, 14, 0.6);
      }
      .pm-audio-timeline-wrap {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.28rem;
      }
      .pm-audio-bars {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2.5px;
        height: 16px;
        padding: 0 2px;
        pointer-events: none;
        opacity: 0.72;
      }
      .pm-audio-bar {
        flex: 1;
        border-radius: 999px;
        background: rgba(156, 120, 78, 0.45);
        transition: background 0.15s, transform 0.2s;
      }
      .pm-audio-bar.is-filled {
        background: linear-gradient(180deg, #d97706 0%, #1b432e 100%);
      }
      html.dark .pm-audio-bar.is-filled,
      body.dark-theme .pm-audio-bar.is-filled {
        background: linear-gradient(180deg, #fbbf24 0%, #10b981 100%);
      }
      .pm-audio-card.is-playing .pm-audio-bar {
        animation: pmBarPulse 1.1s ease-in-out infinite alternate;
      }
      .pm-audio-card.is-playing .pm-audio-bar:nth-child(odd) {
        animation-delay: 0.2s;
      }
      .pm-audio-card.is-playing .pm-audio-bar:nth-child(3n) {
        animation-delay: 0.42s;
      }
      @keyframes pmBarPulse {
        from { transform: scaleY(0.75); }
        to { transform: scaleY(1.18); }
      }
      .pm-audio-range {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 5px;
        border-radius: 999px;
        background: rgba(156, 120, 78, 0.25);
        outline: none;
        cursor: pointer;
        accent-color: #b4690e;
      }
      .pm-audio-range::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #b4690e;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28);
        cursor: pointer;
      }
      .pm-audio-times {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: 'Plus Jakarta Sans', monospace;
        font-size: 0.72rem;
        font-weight: 700;
        color: #6e4e34;
      }
      html.dark .pm-audio-times,
      body.dark-theme .pm-audio-times {
        color: #cbd5e1;
      }
    `;
    document.head.appendChild(style);
  }

  let _pmAudioDelegationBound = false;
  function bindPoemAudioDelegation() {
    if (_pmAudioDelegationBound || typeof document === 'undefined') return;
    _pmAudioDelegationBound = true;
    ensurePoemAudioStyles();

    const SPEED_LIST = [1, 1.25, 1.5, 0.75];

    function syncCardProgress(card) {
      const audioEl = card.querySelector('audio[data-pm-audio]');
      const rangeEl = card.querySelector('[data-pm-range]');
      const curEl = card.querySelector('[data-pm-cur]');
      const durEl = card.querySelector('[data-pm-dur]');
      const playIcon = card.querySelector('[data-pm-play-icon]');
      const bars = card.querySelectorAll('.pm-audio-bar');
      if (!audioEl) return;

      const dur = Number.isFinite(audioEl.duration) && audioEl.duration > 0
        ? audioEl.duration
        : Number(audioEl.dataset.initDur || 0);
      const cur = Number(audioEl.currentTime || 0);
      if (curEl) curEl.textContent = fmtAudioSec(cur);
      if (durEl && dur > 0) durEl.textContent = fmtAudioSec(dur);
      if (rangeEl && dur > 0 && !rangeEl.dataset.dragging) {
        rangeEl.max = String(dur);
        rangeEl.value = String(cur);
      }
      const pct = dur > 0 ? Math.min(1, Math.max(0, cur / dur)) : 0;
      const filledCount = Math.round(pct * bars.length);
      bars.forEach((b, idx) => {
        b.classList.toggle('is-filled', idx < filledCount);
      });
      const playing = !audioEl.paused && !audioEl.ended;
      card.classList.toggle('is-playing', playing);
      if (playIcon) playIcon.className = playing ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    }

    document.addEventListener('click', (e) => {
      const playBtn = e.target.closest('[data-pm-play]');
      if (playBtn) {
        const card = playBtn.closest('.pm-audio-card');
        const audioEl = card?.querySelector('audio[data-pm-audio]');
        if (!audioEl) return;

        // Pause any other playing poem audio player cleanly
        document.querySelectorAll('audio[data-pm-audio]').forEach((other) => {
          if (other !== audioEl && !other.paused) {
            other.pause();
            const otherCard = other.closest('.pm-audio-card');
            if (otherCard) syncCardProgress(otherCard);
          }
        });

        if (audioEl.paused) {
          audioEl.play().catch(() => {});
        } else {
          audioEl.pause();
        }
        syncCardProgress(card);
        return;
      }

      const speedBtn = e.target.closest('[data-pm-speed]');
      if (speedBtn) {
        const card = speedBtn.closest('.pm-audio-card');
        const audioEl = card?.querySelector('audio[data-pm-audio]');
        if (!audioEl) return;
        const curRate = Number(audioEl.playbackRate || 1);
        const idx = SPEED_LIST.indexOf(curRate);
        const nextRate = SPEED_LIST[(idx + 1) % SPEED_LIST.length];
        audioEl.playbackRate = nextRate;
        speedBtn.textContent = nextRate + 'x';
        return;
      }

      const muteBtn = e.target.closest('[data-pm-mute]');
      if (muteBtn) {
        const card = muteBtn.closest('.pm-audio-card');
        const audioEl = card?.querySelector('audio[data-pm-audio]');
        if (!audioEl) return;
        audioEl.muted = !audioEl.muted;
        muteBtn.innerHTML = audioEl.muted
          ? '<i class="fa-solid fa-volume-xmark"></i>'
          : '<i class="fa-solid fa-volume-high"></i>';
      }
    });

    document.addEventListener('input', (e) => {
      const range = e.target.closest('[data-pm-range]');
      if (!range) return;
      range.dataset.dragging = '1';
      const card = range.closest('.pm-audio-card');
      const curEl = card?.querySelector('[data-pm-cur]');
      if (curEl) curEl.textContent = fmtAudioSec(range.value);
    });

    document.addEventListener('change', (e) => {
      const range = e.target.closest('[data-pm-range]');
      if (!range) return;
      delete range.dataset.dragging;
      const card = range.closest('.pm-audio-card');
      const audioEl = card?.querySelector('audio[data-pm-audio]');
      if (audioEl) {
        audioEl.currentTime = Number(range.value || 0);
        syncCardProgress(card);
      }
    });

    ['play', 'pause', 'timeupdate', 'loadedmetadata', 'ended'].forEach((evtName) => {
      document.addEventListener(evtName, (e) => {
        const audioEl = e.target;
        if (!audioEl || !audioEl.matches || !audioEl.matches('audio[data-pm-audio]')) return;
        const card = audioEl.closest('.pm-audio-card');
        if (card) syncCardProgress(card);
      }, true);
    });
  }

  if (typeof document !== 'undefined') {
    ensurePoemAudioStyles();
    bindPoemAudioDelegation();
  }

  window.renderPoemMediaHtml = function renderPoemMediaHtml(poem, options) {
    if (!poem) return '';
    ensurePoemAudioStyles();
    bindPoemAudioDelegation();
    const compact = Boolean(options && options.compact);
    const maxMediaHeight = compact ? 'max-h-[260px]' : 'max-h-[420px]';
    const marginClass = compact ? 'my-2' : 'my-3';
    const parts = [];

    if (poem.image_url) {
      parts.push(`
        <div class="${marginClass} rounded-2xl overflow-hidden border border-[#9c784e]/25 bg-[#efe3d1]/60 shadow-sm">
          <img src="${esc(poem.image_url)}" alt="${esc(poem.title)}" loading="lazy" class="w-full ${maxMediaHeight} object-contain mx-auto" onerror="this.parentElement.style.display='none'">
        </div>
      `);
    }
    if (poem.video_url) {
      parts.push(`
        <div class="${marginClass} rounded-2xl overflow-hidden border border-[#9c784e]/30 bg-black/95 shadow-md">
          <video src="${esc(poem.video_url)}" controls preload="metadata" playsinline class="w-full ${maxMediaHeight} object-contain rounded-2xl"></video>
        </div>
      `);
    }
    if (poem.audio_url) {
      const initDur = Math.max(0, Number(poem.audio_duration || 0));
      const barHeights = [35, 65, 90, 50, 75, 100, 60, 40, 85, 95, 55, 70, 100, 65, 45, 80, 60, 90, 50, 72, 42, 62];
      const barsHtml = barHeights.map((h) => `<span class="pm-audio-bar" style="height:${h}%"></span>`).join('');
      parts.push(`
        <div class="${marginClass} pm-audio-card${compact ? ' is-compact' : ''}">
          <audio src="${esc(poem.audio_url)}" preload="metadata" playsinline data-pm-audio="1" data-init-dur="${initDur}" class="hidden"></audio>
          <div class="pm-audio-top">
            <div class="pm-audio-badge">
              <span class="pm-audio-badge-icon"><i class="fa-solid fa-microphone-lines"></i></span>
              <span>تۆماری دەنگی / خوێندنەوەی شیعر</span>
            </div>
            <div class="pm-audio-tools">
              <button type="button" class="pm-audio-pill-btn" data-pm-speed="1" title="خێرایی خوێندنەوە" dir="ltr">1x</button>
              <button type="button" class="pm-audio-pill-btn" data-pm-mute="1" title="کپکردن / دەنگ">
                <i class="fa-solid fa-volume-high"></i>
              </button>
            </div>
          </div>
          <div class="pm-audio-deck" dir="ltr">
            <button type="button" class="pm-audio-play-btn" data-pm-play="1" title="لێدان / وەستان">
              <i class="fa-solid fa-play" data-pm-play-icon="1"></i>
            </button>
            <div class="pm-audio-timeline-wrap">
              <div class="pm-audio-bars" aria-hidden="true">${barsHtml}</div>
              <input type="range" class="pm-audio-range" min="0" max="${initDur > 0 ? initDur : 100}" value="0" step="0.1" data-pm-range="1" aria-label="کاتی دەنگ">
              <div class="pm-audio-times">
                <span data-pm-cur="1">00:00</span>
                <span data-pm-dur="1">${initDur > 0 ? fmtAudioSec(initDur) : '00:00'}</span>
              </div>
            </div>
          </div>
        </div>
      `);
    }
    return parts.join('');
  };

  window.createPoemMediaController = function createPoemMediaController(prefix, hostId) {
    const state = {
      activePanel: '',
      audioUrl: '',
      imageUrl: '',
      videoUrl: '',
      audioDuration: 0,
      recordedBlob: null,
      mediaRecorder: null,
      audioChunks: [],
      recordTimer: null,
      recordSeconds: 0
    };

    const host = document.getElementById(hostId);
    if (host) {
      host.innerHTML = `
        <div class="p-3 rounded-2xl bg-[#f4e9d8]/70 border border-[#9c784e]/30 space-y-3">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="text-xs font-bold text-[#361c0c] flex items-center gap-1.5">
              <i class="fa-solid fa-photo-film text-[#b45309]"></i>
              <span>میدیای هاوپێچ (ئیختیاری)</span>
            </span>
            <span class="text-[11px] text-[#785336] font-medium">دەتوانیت دەنگ، وێنە یان ڤیدیۆ دابنێیت</span>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <button type="button" id="${prefix}TabAudio" class="py-2 px-2 rounded-xl border border-[#9c784e]/35 bg-[#fbf7f0] text-[#54371f] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer hover:border-amber-600">
              <i class="fa-solid fa-microphone text-[#b45309]"></i>
              <span>دەنگ</span>
              <span id="${prefix}DotAudio" class="hidden w-2 h-2 rounded-full bg-emerald-600"></span>
            </button>
            <button type="button" id="${prefix}TabImage" class="py-2 px-2 rounded-xl border border-[#9c784e]/35 bg-[#fbf7f0] text-[#54371f] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer hover:border-amber-600">
              <i class="fa-solid fa-image text-emerald-700"></i>
              <span>وێنە</span>
              <span id="${prefix}DotImage" class="hidden w-2 h-2 rounded-full bg-emerald-600"></span>
            </button>
            <button type="button" id="${prefix}TabVideo" class="py-2 px-2 rounded-xl border border-[#9c784e]/35 bg-[#fbf7f0] text-[#54371f] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer hover:border-amber-600">
              <i class="fa-solid fa-video text-rose-700"></i>
              <span>ڤیدیۆ</span>
              <span id="${prefix}DotVideo" class="hidden w-2 h-2 rounded-full bg-emerald-600"></span>
            </button>
          </div>

          <div id="${prefix}PanelAudio" class="hidden p-3 rounded-xl bg-[#fbf7f0] border border-[#9c784e]/25 space-y-2.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <button type="button" id="${prefix}BtnRecord" class="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm">
                <i class="fa-solid fa-microphone"></i>
                <span id="${prefix}RecordText">تۆمارکردنی دەنگ</span>
              </button>
              <span id="${prefix}RecordTimer" class="hidden text-xs font-mono font-bold text-rose-700">00:00</span>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-[#54371f] mb-1">یان فایلی دەنگی هەڵبژێرە (MP3, WAV, M4A...):</label>
              <input type="file" id="${prefix}AudioFile" accept="audio/*" class="block w-full text-xs text-[#54371f] cursor-pointer">
            </div>
            <div id="${prefix}AudioPreviewBox" class="hidden pt-1 space-y-1.5">
              <audio id="${prefix}AudioPreview" controls class="w-full h-9"></audio>
              <button type="button" id="${prefix}ClearAudio" class="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer">لابردنی دەنگ</button>
            </div>
          </div>

          <div id="${prefix}PanelImage" class="hidden p-3 rounded-xl bg-[#fbf7f0] border border-[#9c784e]/25 space-y-2">
            <label class="block text-[11px] font-bold text-[#54371f]">وێنە هەڵبژێرە (JPG, PNG, WebP...):</label>
            <input type="file" id="${prefix}ImageFile" accept="image/*" class="block w-full text-xs text-[#54371f] cursor-pointer">
            <div id="${prefix}ImagePreviewBox" class="hidden pt-1 space-y-1.5">
              <img id="${prefix}ImagePreview" src="" alt="Preview" class="w-full max-h-44 object-contain rounded-xl border border-[#9c784e]/25 bg-white">
              <button type="button" id="${prefix}ClearImage" class="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer">لابردنی وێنە</button>
            </div>
          </div>

          <div id="${prefix}PanelVideo" class="hidden p-3 rounded-xl bg-[#fbf7f0] border border-[#9c784e]/25 space-y-2">
            <label class="block text-[11px] font-bold text-[#54371f]">ڤیدیۆ هەڵبژێرە (MP4, MOV, WebM...):</label>
            <input type="file" id="${prefix}VideoFile" accept="video/*" class="block w-full text-xs text-[#54371f] cursor-pointer">
            <div id="${prefix}VideoPreviewBox" class="hidden pt-1 space-y-1.5">
              <video id="${prefix}VideoPreview" controls playsinline class="w-full max-h-44 rounded-xl bg-black"></video>
              <button type="button" id="${prefix}ClearVideo" class="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer">لابردنی ڤیدیۆ</button>
            </div>
          </div>
        </div>
      `;
    }

    function updateIndicators() {
      const aInput = document.getElementById(`${prefix}AudioFile`);
      const iInput = document.getElementById(`${prefix}ImageFile`);
      const vInput = document.getElementById(`${prefix}VideoFile`);
      const hasA = Boolean(state.audioUrl || state.recordedBlob || (aInput && aInput.files && aInput.files[0]));
      const hasI = Boolean(state.imageUrl || (iInput && iInput.files && iInput.files[0]));
      const hasV = Boolean(state.videoUrl || (vInput && vInput.files && vInput.files[0]));
      document.getElementById(`${prefix}DotAudio`)?.classList.toggle('hidden', !hasA);
      document.getElementById(`${prefix}DotImage`)?.classList.toggle('hidden', !hasI);
      document.getElementById(`${prefix}DotVideo`)?.classList.toggle('hidden', !hasV);
    }

    function togglePanel(type) {
      state.activePanel = (state.activePanel === type) ? '' : type;
      ['Audio', 'Image', 'Video'].forEach(k => {
        const lower = k.toLowerCase();
        const isOpen = state.activePanel === lower;
        document.getElementById(`${prefix}Panel${k}`)?.classList.toggle('hidden', !isOpen);
        const tab = document.getElementById(`${prefix}Tab${k}`);
        if (tab) {
          tab.className = isOpen
            ? 'py-2 px-2 rounded-xl border-2 border-amber-600 bg-amber-500/15 text-[#361c0c] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer'
            : 'py-2 px-2 rounded-xl border border-[#9c784e]/35 bg-[#fbf7f0] text-[#54371f] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer hover:border-amber-600';
        }
      });
    }

    function stopRecording(cancel) {
      try {
        if (state.recordTimer) { clearInterval(state.recordTimer); state.recordTimer = null; }
        if (state.mediaRecorder && state.mediaRecorder.state === 'recording') state.mediaRecorder.stop();
        if (cancel) {
          state.recordedBlob = null;
          state.recordSeconds = 0;
        }
      } catch (e) {}
      const txt = document.getElementById(`${prefix}RecordText`);
      const timerEl = document.getElementById(`${prefix}RecordTimer`);
      if (txt) txt.textContent = 'تۆمارکردنی دەنگ';
      if (timerEl) timerEl.classList.add('hidden');
      updateIndicators();
    }

    async function toggleRecording() {
      if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
        stopRecording(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.audioChunks = [];
        state.recordedBlob = null;
        state.recordSeconds = 0;
        state.mediaRecorder = new MediaRecorder(stream);
        state.mediaRecorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) state.audioChunks.push(ev.data);
        };
        state.mediaRecorder.onstop = () => {
          try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}
          if (state.audioChunks.length > 0) {
            state.recordedBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
            state.audioUrl = '';
            state.audioDuration = state.recordSeconds;
            const prev = document.getElementById(`${prefix}AudioPreview`);
            const box = document.getElementById(`${prefix}AudioPreviewBox`);
            if (prev) prev.src = URL.createObjectURL(state.recordedBlob);
            if (box) box.classList.remove('hidden');
            updateIndicators();
          }
        };
        state.mediaRecorder.start();
        const txt = document.getElementById(`${prefix}RecordText`);
        const timerEl = document.getElementById(`${prefix}RecordTimer`);
        if (txt) txt.textContent = 'وەستاندنی تۆمارکردن';
        if (timerEl) { timerEl.textContent = '00:00'; timerEl.classList.remove('hidden'); }
        state.recordTimer = setInterval(() => {
          state.recordSeconds++;
          const m = String(Math.floor(state.recordSeconds / 60)).padStart(2, '0');
          const s = String(state.recordSeconds % 60).padStart(2, '0');
          if (timerEl) timerEl.textContent = `${m}:${s}`;
        }, 1000);
      } catch (err) {
        alert('ڕێگەپێدانی مایکرۆفۆن وەرنەگیرا');
      }
    }

    function clearMedia(kind) {
      if (kind === 'audio') {
        stopRecording(true);
        state.audioUrl = '';
        state.audioDuration = 0;
        const inp = document.getElementById(`${prefix}AudioFile`);
        if (inp) inp.value = '';
        const prev = document.getElementById(`${prefix}AudioPreview`);
        if (prev) prev.src = '';
        document.getElementById(`${prefix}AudioPreviewBox`)?.classList.add('hidden');
      } else if (kind === 'image') {
        state.imageUrl = '';
        const inp = document.getElementById(`${prefix}ImageFile`);
        if (inp) inp.value = '';
        const prev = document.getElementById(`${prefix}ImagePreview`);
        if (prev) prev.src = '';
        document.getElementById(`${prefix}ImagePreviewBox`)?.classList.add('hidden');
      } else if (kind === 'video') {
        state.videoUrl = '';
        const inp = document.getElementById(`${prefix}VideoFile`);
        if (inp) inp.value = '';
        const prev = document.getElementById(`${prefix}VideoPreview`);
        if (prev) prev.src = '';
        document.getElementById(`${prefix}VideoPreviewBox`)?.classList.add('hidden');
      }
      updateIndicators();
    }

    document.getElementById(`${prefix}TabAudio`)?.addEventListener('click', () => togglePanel('audio'));
    document.getElementById(`${prefix}TabImage`)?.addEventListener('click', () => togglePanel('image'));
    document.getElementById(`${prefix}TabVideo`)?.addEventListener('click', () => togglePanel('video'));
    document.getElementById(`${prefix}BtnRecord`)?.addEventListener('click', toggleRecording);
    document.getElementById(`${prefix}ClearAudio`)?.addEventListener('click', () => clearMedia('audio'));
    document.getElementById(`${prefix}ClearImage`)?.addEventListener('click', () => clearMedia('image'));
    document.getElementById(`${prefix}ClearVideo`)?.addEventListener('click', () => clearMedia('video'));

    document.getElementById(`${prefix}AudioFile`)?.addEventListener('change', (ev) => {
      const f = ev.target.files && ev.target.files[0];
      if (f) {
        state.recordedBlob = null;
        state.audioUrl = '';
        const prev = document.getElementById(`${prefix}AudioPreview`);
        if (prev) prev.src = URL.createObjectURL(f);
        document.getElementById(`${prefix}AudioPreviewBox`)?.classList.remove('hidden');
      }
      updateIndicators();
    });
    document.getElementById(`${prefix}ImageFile`)?.addEventListener('change', (ev) => {
      const f = ev.target.files && ev.target.files[0];
      if (f) {
        state.imageUrl = '';
        const prev = document.getElementById(`${prefix}ImagePreview`);
        if (prev) prev.src = URL.createObjectURL(f);
        document.getElementById(`${prefix}ImagePreviewBox`)?.classList.remove('hidden');
      }
      updateIndicators();
    });
    document.getElementById(`${prefix}VideoFile`)?.addEventListener('change', (ev) => {
      const f = ev.target.files && ev.target.files[0];
      if (f) {
        state.videoUrl = '';
        const prev = document.getElementById(`${prefix}VideoPreview`);
        if (prev) prev.src = URL.createObjectURL(f);
        document.getElementById(`${prefix}VideoPreviewBox`)?.classList.remove('hidden');
      }
      updateIndicators();
    });

    return {
      reset() {
        clearMedia('audio');
        clearMedia('image');
        clearMedia('video');
        state.activePanel = '';
        togglePanel('');
      },
      loadExisting(poem) {
        this.reset();
        if (!poem) return;
        let firstTab = '';
        if (poem.audio_url) {
          firstTab = firstTab || 'audio';
          state.audioUrl = poem.audio_url;
          state.audioDuration = Number(poem.audio_duration || 0);
          const prev = document.getElementById(`${prefix}AudioPreview`);
          if (prev) prev.src = poem.audio_url;
          document.getElementById(`${prefix}AudioPreviewBox`)?.classList.remove('hidden');
        }
        if (poem.image_url) {
          firstTab = firstTab || 'image';
          state.imageUrl = poem.image_url;
          const prev = document.getElementById(`${prefix}ImagePreview`);
          if (prev) prev.src = poem.image_url;
          document.getElementById(`${prefix}ImagePreviewBox`)?.classList.remove('hidden');
        }
        if (poem.video_url) {
          firstTab = firstTab || 'video';
          state.videoUrl = poem.video_url;
          const prev = document.getElementById(`${prefix}VideoPreview`);
          if (prev) prev.src = poem.video_url;
          document.getElementById(`${prefix}VideoPreviewBox`)?.classList.remove('hidden');
        }
        if (firstTab) togglePanel(firstTab);
        updateIndicators();
      },
      async resolvePayload(token) {
        async function uploadSingle(fileOrBlob, filename) {
          const fd = new FormData();
          if (filename) fd.append('media', fileOrBlob, filename);
          else fd.append('media', fileOrBlob);
          const res = await fetch('/api/poems/upload-media', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fd
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || 'هەڵە لە بارکردنی فایل');
          return data.url;
        }

        let audioUrl = state.audioUrl;
        const audioFile = document.getElementById(`${prefix}AudioFile`)?.files?.[0];
        if (state.recordedBlob) {
          audioUrl = await uploadSingle(state.recordedBlob, `poem-voice-${Date.now()}.webm`);
        } else if (audioFile) {
          audioUrl = await uploadSingle(audioFile);
        }

        let imageUrl = state.imageUrl;
        const imageFile = document.getElementById(`${prefix}ImageFile`)?.files?.[0];
        if (imageFile) {
          imageUrl = await uploadSingle(imageFile);
        }

        let videoUrl = state.videoUrl;
        const videoFile = document.getElementById(`${prefix}VideoFile`)?.files?.[0];
        if (videoFile) {
          videoUrl = await uploadSingle(videoFile);
        }

        return {
          image_url: imageUrl || '',
          video_url: videoUrl || '',
          audio_url: audioUrl || '',
          audio_duration: Number(state.audioDuration || 0)
        };
      }
    };
  };
})();
