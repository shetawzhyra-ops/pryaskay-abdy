(function () {
  'use strict';

  const SPEED_STEPS = [1, 1.25, 1.5, 2, 0.75];
  const LAST_PLAYED_KEY = 'hezara_last_playback_v1';

  const state = {
    token: null,
    user: null,
    canManage: false,
    tracks: [],
    categories: [],
    activeCategory: 'all',
    searchQuery: '',
    currentTrackId: null,
    isPlaying: false,
    autoNext: true,
    speedIdx: 0,
    isSeeking: false,
    socket: null,
    uploadMode: 'file', // file | mic
    selectedFile: null,
    recordedBlob: null,
    detectedDuration: 0,
    mic: {
      recorder: null,
      stream: null,
      chunks: [],
      audioCtx: null,
      analyser: null,
      rafId: null,
      timerId: null,
      startedAt: 0,
      pausedMs: 0,
      pauseStarted: 0
    }
  };

  const $ = (id) => document.getElementById(id);
  const audio = () => $('hzAudioElement');

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fmtTime(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const rem = s % 60;
    const mm = String(mins).padStart(2, '0');
    const ss = String(rem).padStart(2, '0');
    return hrs > 0 ? `${hrs}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  function fmtSize(bytes) {
    const b = Number(bytes) || 0;
    if (b <= 0) return '';
    if (b < 1024 * 1024) return Math.round(b / 1024) + ' KB';
    return (b / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function fmtQualityLabel(track) {
    const url = String(track?.audio_url || '').toLowerCase();
    const ext = url.includes('.') ? url.split('.').pop().toUpperCase() : 'AUDIO';
    const size = fmtSize(track?.file_size);
    return size ? `${ext} • ${size}` : ext;
  }

  function toast(msg, isError = false) {
    const stack = $('hzToastStack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'hz-toast' + (isError ? ' is-error' : '');
    el.innerHTML = `<i class="fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i><span>${escHtml(msg)}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.25s';
      setTimeout(() => el.remove(), 260);
    }, 3400);
  }

  function confirmDialog(title, body) {
    return new Promise((resolve) => {
      const modal = $('hzConfirmModal');
      $('hzConfirmTitle').textContent = title || 'دڵنیایت؟';
      $('hzConfirmBody').textContent = body || '';
      const okBtn = $('hzConfirmOk');
      const cancelBtn = $('hzConfirmCancel');
      const close = (val) => {
        modal.classList.add('hidden');
        okBtn.onclick = null;
        cancelBtn.onclick = null;
        modal.onclick = null;
        resolve(val);
      };
      okBtn.onclick = () => close(true);
      cancelBtn.onclick = () => close(false);
      modal.onclick = (e) => { if (e.target === modal) close(false); };
      modal.classList.remove('hidden');
    });
  }

  async function apiFetch(url, options = {}) {
    const headers = Object.assign({}, options.headers || {});
    if (state.token) headers['Authorization'] = 'Bearer ' + state.token;
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, Object.assign({}, options, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'هەڵەیەک ڕوویدا لە پەیوەندیکردن');
    }
    return data;
  }

  // =========================================================================
  // THEME SYNC
  // =========================================================================
  function syncThemeUI() {
    const isDark = document.documentElement.classList.contains('dark');
    document.body.classList.toggle('dark-theme', isDark);
    const icon = $('hzThemeIcon');
    if (icon) icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    document.documentElement.classList.toggle('dark-theme', isDark);
    try { localStorage.setItem('seereen_theme', isDark ? 'dark' : 'light'); } catch (e) {}
    syncThemeUI();
  }

  // =========================================================================
  // FILTERING & RENDERING PLAYLIST
  // =========================================================================
  function getFilteredTracks() {
    const q = state.searchQuery.trim().toLowerCase();
    return state.tracks.filter((t) => {
      if (state.activeCategory !== 'all' && String(t.category || '').trim() !== state.activeCategory) {
        return false;
      }
      if (!q) return true;
      const hay = `${t.title || ''} ${t.speaker || ''} ${t.category || ''} ${t.description || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }

  function renderCategories() {
    const host = $('hzCategoryPills');
    const dl = $('hzCategorySuggestions');
    if (!host) return;
    const cats = state.categories || [];
    if (dl) {
      dl.innerHTML = cats.map((c) => `<option value="${escHtml(c)}">`).join('');
    }
    if (!cats.length) {
      host.innerHTML = '';
      return;
    }
    const items = ['all', ...cats];
    host.innerHTML = items.map((c) => {
      const active = state.activeCategory === c ? ' is-active' : '';
      const label = c === 'all' ? 'هەموو دەنگەکان' : escHtml(c);
      return `<button type="button" class="hz-cat-pill${active}" data-cat="${escHtml(c)}">${label}</button>`;
    }).join('');
  }

  function renderTracks() {
    const wrap = $('hzTracksWrap');
    const countChip = $('hzTrackCountChip');
    if (countChip) countChip.textContent = `${state.tracks.length} دەنگ`;
    if (!wrap) return;

    const list = getFilteredTracks();
    if (!list.length) {
      wrap.innerHTML = `
        <div class="hz-empty-state">
          <i class="fa-solid fa-headphones"></i>
          <p>${state.tracks.length ? 'هیچ دەنگێک لەگەڵ گەڕانەکەت نەدۆزرایەوە' : 'هێشتا هیچ دەنگێک لە هەزارەی عەبدی دانەنراوە'}</p>
        </div>`;
      return;
    }

    wrap.innerHTML = list.map((t, idx) => {
      const isActive = Number(state.currentTrackId) === Number(t.id);
      const isPlayingNow = isActive && state.isPlaying;
      const dur = t.duration_sec > 0 ? fmtTime(t.duration_sec) : '--:--';
      const editControls = state.canManage ? `
        <div class="hz-track-actions" data-no-play="1">
          <button type="button" class="hz-mini-btn" data-edit-id="${t.id}" title="دەستکاری ناونیشان">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button type="button" class="hz-mini-btn is-danger" data-delete-id="${t.id}" title="سڕینەوە">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>` : '';

      return `
        <article class="hz-track-card${isActive ? ' is-active' : ''}" data-play-id="${t.id}">
          <div class="hz-track-main">
            <div class="hz-track-play-badge">
              <i class="fa-solid ${isPlayingNow ? 'fa-pause' : 'fa-play'}"></i>
            </div>
            <div class="hz-track-info">
              <div class="hz-track-title-row">
                <span class="hz-track-num">#${t.sort_order || (idx + 1)}</span>
                <h3 class="hz-track-title">${escHtml(t.title)}</h3>
              </div>
              <div class="hz-track-sub">
                <span><i class="fa-solid fa-user-tie"></i> ${escHtml(t.speaker || t.uploader_name || 'مامۆستا')}</span>
                ${t.category ? `<span><i class="fa-solid fa-folder-open"></i> ${escHtml(t.category)}</span>` : ''}
                <span><i class="fa-regular fa-clock"></i> ${dur}</span>
                <span>${escHtml(fmtQualityLabel(t))}</span>
              </div>
              ${t.description ? `<p class="hz-track-desc">${escHtml(t.description)}</p>` : ''}
            </div>
          </div>
          ${editControls}
        </article>`;
    }).join('');
  }

  // =========================================================================
  // PERSISTENT LOCK-SCREEN / SCREEN-OFF BACKGROUND AUDIO ENGINE
  // =========================================================================
  function getCurrentTrack() {
    return state.tracks.find((t) => Number(t.id) === Number(state.currentTrackId)) || null;
  }

  function updateMediaSessionMetadata(track) {
    if (!('mediaSession' in navigator) || !track) return;
    try {
      const origin = window.location.origin;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || 'هەزارەی عەبدی',
        artist: track.speaker || track.uploader_name || 'مامۆستا — پریاسکەی عەبدی',
        album: track.category ? `هەزارەی عەبدی • ${track.category}` : 'هەزارەی عەبدی',
        artwork: [
          { src: origin + '/images/icon-192.png?v=6', sizes: '192x192', type: 'image/png' },
          { src: origin + '/images/icon-512.png?v=6', sizes: '512x512', type: 'image/png' },
          { src: origin + '/images/logo.jpg?v=1796050000', sizes: '512x512', type: 'image/jpeg' }
        ]
      });
    } catch (e) {}
  }

  function syncMediaSessionPosition() {
    if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;
    const el = audio();
    if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: el.duration,
        playbackRate: el.playbackRate || 1,
        position: Math.min(el.currentTime || 0, el.duration)
      });
    } catch (e) {}
  }

  function updateDeckUI() {
    const track = getCurrentTrack();
    const titleEl = $('hzNowTitle');
    const speakerEl = $('hzNowSpeaker');
    const catEl = $('hzNowCategory');
    const qualEl = $('hzNowQuality');
    const disc = $('hzDeckDisc');
    const playIcon = $('hzPlayIcon');
    const seek = $('hzSeekRange');

    if (track) {
      if (titleEl) titleEl.textContent = track.title;
      if (speakerEl) {
        speakerEl.textContent = (track.speaker || track.uploader_name || 'مامۆستا') + (track.description ? ` — ${track.description}` : '');
      }
      if (catEl) {
        catEl.textContent = track.category || '';
        catEl.classList.toggle('hidden', !track.category);
      }
      if (qualEl) {
        qualEl.textContent = fmtQualityLabel(track);
        qualEl.classList.remove('hidden');
      }
      if (seek) seek.disabled = false;
    } else {
      if (titleEl) titleEl.textContent = 'دەنگێک هەڵبژێرە بۆ گوێگرتن';
      if (speakerEl) speakerEl.textContent = 'کلیک لەسەر هەر تۆمارێکی خوارەوە بکە — لەکاتی کوژانەوەی شاشەی مۆبایلیش بەردەوام دەبێت';
      if (catEl) catEl.classList.add('hidden');
      if (qualEl) qualEl.classList.add('hidden');
      if (seek) {
        seek.value = 0;
        seek.disabled = true;
      }
    }

    if (disc) disc.classList.toggle('is-playing', state.isPlaying);
    if (playIcon) playIcon.className = state.isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = state.isPlaying ? 'playing' : 'paused';
      } catch (e) {}
    }

    renderTracks();
  }

  function saveLastPlayback(trackId, timeSec) {
    try {
      localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify({ id: Number(trackId), time: Math.floor(timeSec || 0) }));
    } catch (e) {}
  }

  function playTrackById(id, { autoPlay = true, seekToSec = 0 } = {}) {
    const track = state.tracks.find((t) => Number(t.id) === Number(id));
    if (!track) return;
    const el = audio();
    if (!el) return;

    const sameTrack = Number(state.currentTrackId) === Number(track.id);
    if (sameTrack && el.src) {
      if (autoPlay) {
        if (el.paused) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      }
      return;
    }

    state.currentTrackId = track.id;
    const streamUrl = `/api/hezara/stream/${track.id}`;
    el.src = streamUrl;
    el.playbackRate = SPEED_STEPS[state.speedIdx] || 1;
    el.load();

    if (seekToSec > 0) {
      const onMeta = () => {
        el.removeEventListener('loadedmetadata', onMeta);
        try {
          if (Number.isFinite(el.duration) && seekToSec < el.duration) {
            el.currentTime = seekToSec;
          }
        } catch (e) {}
      };
      el.addEventListener('loadedmetadata', onMeta);
    }

    updateMediaSessionMetadata(track);
    updateDeckUI();
    saveLastPlayback(track.id, seekToSec);

    if (autoPlay) {
      el.play().catch((err) => {
        console.warn('Audio play interrupted:', err);
      });
    }
  }

  function playStep(delta) {
    const list = getFilteredTracks().length ? getFilteredTracks() : state.tracks;
    if (!list.length) return;
    const idx = list.findIndex((t) => Number(t.id) === Number(state.currentTrackId));
    let nextIdx = idx === -1 ? 0 : idx + delta;
    if (nextIdx < 0) nextIdx = list.length - 1;
    if (nextIdx >= list.length) nextIdx = 0;
    playTrackById(list[nextIdx].id, { autoPlay: true });
  }

  function initAudioEngine() {
    const el = audio();
    if (!el) return;

    el.addEventListener('play', () => {
      state.isPlaying = true;
      updateDeckUI();
      syncMediaSessionPosition();
    });

    el.addEventListener('pause', () => {
      state.isPlaying = false;
      updateDeckUI();
      syncMediaSessionPosition();
      if (state.currentTrackId) saveLastPlayback(state.currentTrackId, el.currentTime);
    });

    el.addEventListener('loadedmetadata', () => {
      const total = $('hzTimeTotal');
      const seek = $('hzSeekRange');
      if (total) total.textContent = fmtTime(el.duration);
      if (seek) {
        seek.max = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 100;
        seek.disabled = false;
      }
      syncMediaSessionPosition();
    });

    el.addEventListener('timeupdate', () => {
      if (state.isSeeking) return;
      const cur = $('hzTimeCurrent');
      const total = $('hzTimeTotal');
      const seek = $('hzSeekRange');
      if (cur) cur.textContent = fmtTime(el.currentTime);
      if (total && Number.isFinite(el.duration) && el.duration > 0) total.textContent = fmtTime(el.duration);
      if (seek && Number.isFinite(el.duration) && el.duration > 0) {
        seek.max = el.duration;
        seek.value = el.currentTime;
      }
      if (state.currentTrackId && Math.floor(el.currentTime) % 5 === 0) {
        saveLastPlayback(state.currentTrackId, el.currentTime);
      }
    });

    el.addEventListener('ratechange', syncMediaSessionPosition);
    el.addEventListener('seeked', syncMediaSessionPosition);

    el.addEventListener('ended', () => {
      state.isPlaying = false;
      if (state.autoNext && state.tracks.length > 0) {
        const list = getFilteredTracks().length ? getFilteredTracks() : state.tracks;
        const idx = list.findIndex((t) => Number(t.id) === Number(state.currentTrackId));
        if (idx !== -1 && idx + 1 < list.length) {
          playTrackById(list[idx + 1].id, { autoPlay: true });
          return;
        }
      }
      updateDeckUI();
    });

    if ('mediaSession' in navigator) {
      const bindAction = (action, fn) => {
        try { navigator.mediaSession.setActionHandler(action, fn); } catch (e) {}
      };
      bindAction('play', () => {
        if (!state.currentTrackId && state.tracks.length) {
          playTrackById(state.tracks[0].id, { autoPlay: true });
        } else {
          el.play().catch(() => {});
        }
      });
      bindAction('pause', () => el.pause());
      bindAction('stop', () => { el.pause(); el.currentTime = 0; });
      bindAction('previoustrack', () => playStep(-1));
      bindAction('nexttrack', () => playStep(1));
      bindAction('seekbackward', (details) => {
        const skip = details?.seekOffset || 15;
        el.currentTime = Math.max(0, (el.currentTime || 0) - skip);
        syncMediaSessionPosition();
      });
      bindAction('seekforward', (details) => {
        const skip = details?.seekOffset || 15;
        const dur = Number.isFinite(el.duration) ? el.duration : (el.currentTime + skip);
        el.currentTime = Math.min(dur, (el.currentTime || 0) + skip);
        syncMediaSessionPosition();
      });
      bindAction('seekto', (details) => {
        if (details && Number.isFinite(details.seekTime)) {
          el.currentTime = Math.max(0, details.seekTime);
          syncMediaSessionPosition();
        }
      });
    }
  }

  // =========================================================================
  // TEACHER STUDIO MIC RECORDING & AUDIO-ONLY FILE UPLOAD
  // =========================================================================
  function getBestAudioMime() {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/webm'
    ];
    if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return '';
    return candidates.find((c) => MediaRecorder.isTypeSupported(c)) || '';
  }

  function stopMicStreams() {
    if (state.mic.rafId) {
      cancelAnimationFrame(state.mic.rafId);
      state.mic.rafId = null;
    }
    if (state.mic.timerId) {
      clearInterval(state.mic.timerId);
      state.mic.timerId = null;
    }
    if (state.mic.stream) {
      try { state.mic.stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
      state.mic.stream = null;
    }
    if (state.mic.audioCtx) {
      try { state.mic.audioCtx.close(); } catch (e) {}
      state.mic.audioCtx = null;
    }
    state.mic.recorder = null;
  }

  function drawMicMeter() {
    const canvas = $('hzMicVisualizer');
    if (!canvas || !state.mic.analyser) return;
    const ctx = canvas.getContext('2d');
    const data = new Uint8Array(state.mic.analyser.frequencyBinCount);

    const tick = () => {
      if (!state.mic.analyser) return;
      state.mic.analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 40;
      const step = Math.max(1, Math.floor(data.length / bars));
      const barW = canvas.width / bars;
      for (let i = 0; i < bars; i++) {
        const val = data[i * step] / 255;
        const h = Math.max(4, val * (canvas.height - 8));
        ctx.fillStyle = val > 0.65 ? '#e11d48' : '#10b981';
        ctx.fillRect(i * barW + 2, (canvas.height - h) / 2, Math.max(2, barW - 4), h);
      }
      state.mic.rafId = requestAnimationFrame(tick);
    };
    state.mic.rafId = requestAnimationFrame(tick);
  }

  function setLocalPreview(blobOrFile, labelText) {
    const box = $('hzPreviewBox');
    const previewAudio = $('hzPreviewAudio');
    const meta = $('hzPreviewDuration');
    if (!box || !previewAudio) return;

    const url = URL.createObjectURL(blobOrFile);
    previewAudio.src = url;
    previewAudio.onloadedmetadata = () => {
      const dur = Number.isFinite(previewAudio.duration) ? previewAudio.duration : 0;
      state.detectedDuration = Math.round(dur);
      if (meta) {
        meta.textContent = `${dur > 0 ? fmtTime(dur) : ''} ${labelText ? '• ' + labelText : ''}`.trim();
      }
    };
    box.classList.remove('hidden');
  }

  function switchUploadMode(mode) {
    state.uploadMode = mode;
    document.querySelectorAll('.hz-source-tab').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.mode === mode);
    });
    $('hzFileModePane').classList.toggle('hidden', mode !== 'file');
    $('hzMicModePane').classList.toggle('hidden', mode !== 'mic');
  }

  async function startMicRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast('بڕاوزەرەکەت پشتگیری تۆمارکردنی مایکرۆفۆن ناکات', true);
      return;
    }
    try {
      stopMicStreams();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      const mimeType = getBestAudioMime();
      const opts = { audioBitsPerSecond: 256000 };
      if (mimeType) opts.mimeType = mimeType;

      let recorder;
      try {
        recorder = new MediaRecorder(stream, opts);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      state.mic.stream = stream;
      state.mic.recorder = recorder;
      state.mic.chunks = [];
      state.mic.startedAt = Date.now();
      state.mic.pausedMs = 0;

      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          src.connect(analyser);
          state.mic.audioCtx = ctx;
          state.mic.analyser = analyser;
          drawMicMeter();
        }
      } catch (e) {}

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) state.mic.chunks.push(ev.data);
      };

      recorder.onstop = () => {
        const usedMime = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(state.mic.chunks, { type: usedMime });
        state.recordedBlob = blob;
        state.selectedFile = null;
        stopMicStreams();
        $('hzMicStartBtn').classList.remove('hidden');
        $('hzMicPauseBtn').classList.add('hidden');
        $('hzMicStopBtn').classList.add('hidden');
        $('hzMicStatus').textContent = 'تۆمارکردن تەواو بوو! لە خوارەوە گوێی لێ بگرە پاشان بڵاوی بکەرەوە';
        setLocalPreview(blob, fmtSize(blob.size));
      };

      recorder.start(300);
      $('hzMicStartBtn').classList.add('hidden');
      $('hzMicPauseBtn').classList.remove('hidden');
      $('hzMicStopBtn').classList.remove('hidden');
      $('hzMicPauseBtn').innerHTML = '<i class="fa-solid fa-pause"></i><span>وەستان</span>';
      $('hzMicStatus').textContent = 'خەریکە بە کوالێتی بەرز تۆمار دەکرێت...';

      state.mic.timerId = setInterval(() => {
        if (!state.mic.recorder || state.mic.recorder.state === 'paused') return;
        const elapsed = (Date.now() - state.mic.startedAt - state.mic.pausedMs) / 1000;
        $('hzMicTimer').textContent = fmtTime(elapsed);
      }, 250);
    } catch (err) {
      toast('دەستگەیشتن بە مایکرۆفۆن ڕێگەی پێنەدرا', true);
    }
  }

  function togglePauseMicRecording() {
    const rec = state.mic.recorder;
    if (!rec) return;
    if (rec.state === 'recording') {
      rec.pause();
      state.mic.pauseStarted = Date.now();
      $('hzMicPauseBtn').innerHTML = '<i class="fa-solid fa-play"></i><span>بەردەوامبوون</span>';
      $('hzMicStatus').textContent = 'تۆمارکردن وەستێنراوە';
    } else if (rec.state === 'paused') {
      state.mic.pausedMs += Date.now() - state.mic.pauseStarted;
      rec.resume();
      $('hzMicPauseBtn').innerHTML = '<i class="fa-solid fa-pause"></i><span>وەستان</span>';
      $('hzMicStatus').textContent = 'خەریکە بە کوالێتی بەرز تۆمار دەکرێت...';
    }
  }

  function stopMicRecording() {
    const rec = state.mic.recorder;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    }
  }

  function openUploadModal(editTrack = null) {
    if (!state.canManage) return;
    stopMicStreams();
    state.selectedFile = null;
    state.recordedBlob = null;
    state.detectedDuration = editTrack ? Number(editTrack.duration_sec || 0) : 0;

    $('hzEditId').value = editTrack ? String(editTrack.id) : '';
    $('hzInputTitle').value = editTrack ? (editTrack.title || '') : '';
    $('hzInputSpeaker').value = editTrack ? (editTrack.speaker || '') : (state.user?.full_name || '');
    $('hzInputCategory').value = editTrack ? (editTrack.category || '') : '';
    $('hzInputDesc').value = editTrack ? (editTrack.description || '') : '';

    $('hzAudioFileInput').value = '';
    $('hzFileChosenText').innerHTML = '<strong>کلیک بکە یان فایلی دەنگی لێرە دابنێ</strong><span>MP3, M4A, WAV, AAC, OGG, FLAC, OPUS — کوالێتی ئەسڵی دەپارێزرێت</span>';
    $('hzPreviewBox').classList.add('hidden');
    $('hzUploadProgressWrap').classList.add('hidden');
    $('hzMicTimer').textContent = '00:00';
    $('hzMicStartBtn').classList.remove('hidden');
    $('hzMicPauseBtn').classList.add('hidden');
    $('hzMicStopBtn').classList.add('hidden');

    const isEdit = Boolean(editTrack);
    $('hzSourceTabsWrap').classList.toggle('hidden', isEdit);
    $('hzModalTitle').textContent = isEdit ? 'دەستکاریکردنی زانیاری دەنگ' : 'دانانی دەنگی نوێ لە هەزارەی عەبدی';
    $('hzSubmitBtnText').textContent = isEdit ? 'پاشەکەوتکردن' : 'بڵاوکردنەوەی دەنگ';

    switchUploadMode('file');
    $('hzUploadModal').classList.remove('hidden');
  }

  function closeUploadModal() {
    stopMicStreams();
    $('hzUploadModal').classList.add('hidden');
  }

  function handleFileChosen(file) {
    if (!file) return;
    const ext = file.name.includes('.') ? '.' + file.name.split('.').pop().toLowerCase() : '';
    const allowed = ['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.oga', '.opus', '.flac', '.webm'];
    const mime = String(file.type || '').toLowerCase();
    if (!allowed.includes(ext) && !mime.startsWith('audio/')) {
      toast('تەنها فایلی دەنگی ڕێگەپێدراوە (وێنە و ڤیدیۆ قەدەغەیە)', true);
      return;
    }
    if (mime.startsWith('video/')) {
      toast('ئەم بەشە تەنها بۆ دەنگە و فایلی ڤیدیۆ وەرناگیرێت', true);
      return;
    }
    state.selectedFile = file;
    state.recordedBlob = null;
    $('hzFileChosenText').innerHTML = `<strong>${escHtml(file.name)}</strong><span>قەبارە: ${fmtSize(file.size)} — ئامادەیە بۆ بەرزکردنەوە</span>`;
    if (!$('hzInputTitle').value.trim()) {
      $('hzInputTitle').value = file.name.replace(/\.[^/.]+$/, '');
    }
    setLocalPreview(file, fmtSize(file.size));
  }

  async function submitUploadOrEdit(e) {
    e.preventDefault();
    if (!state.canManage) return;

    const editId = $('hzEditId').value.trim();
    const title = $('hzInputTitle').value.trim();
    const speaker = $('hzInputSpeaker').value.trim();
    const category = $('hzInputCategory').value.trim();
    const description = $('hzInputDesc').value.trim();

    if (!title) {
      toast('تکایە ناونیشانی دەنگەکە بنووسە', true);
      return;
    }

    if (editId) {
      try {
        $('hzSubmitBtn').disabled = true;
        await apiFetch(`/api/hezara/${editId}`, {
          method: 'PUT',
          body: JSON.stringify({ title, speaker, category, description })
        });
        toast('زانیارییەکان نوێ کرانەوە');
        closeUploadModal();
        await loadTracks();
      } catch (err) {
        toast(err.message, true);
      } finally {
        $('hzSubmitBtn').disabled = false;
      }
      return;
    }

    const audioPayload = state.selectedFile || state.recordedBlob;
    if (!audioPayload) {
      toast('تکایە سەرەتا فایلی دەنگی هەڵبژێرە یان تۆماری بکە', true);
      return;
    }

    const fd = new FormData();
    if (state.selectedFile) {
      fd.append('audio', state.selectedFile, state.selectedFile.name);
    } else {
      const m = String(state.recordedBlob.type || 'audio/webm');
      const ext = m.includes('mp4') ? '.m4a' : (m.includes('ogg') ? '.ogg' : '.webm');
      fd.append('audio', state.recordedBlob, `hezara-${Date.now()}${ext}`);
    }
    fd.append('title', title);
    fd.append('speaker', speaker);
    fd.append('category', category);
    fd.append('description', description);
    fd.append('duration_sec', String(state.detectedDuration || 0));

    const pWrap = $('hzUploadProgressWrap');
    const pFill = $('hzUploadBarFill');
    const pPct = $('hzUploadPct');
    pWrap.classList.remove('hidden');
    pFill.style.width = '0%';
    pPct.textContent = '0%';
    $('hzSubmitBtn').disabled = true;

    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/hezara/upload', true);
        if (state.token) xhr.setRequestHeader('Authorization', 'Bearer ' + state.token);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            pFill.style.width = pct + '%';
            pPct.textContent = pct + '%';
          }
        };
        xhr.onload = () => {
          let data = {};
          try { data = JSON.parse(xhr.responseText || '{}'); } catch (err) {}
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            reject(new Error(data.error || 'هەڵە لە بەرزکردنەوەی دەنگ'));
          }
        };
        xhr.onerror = () => reject(new Error('پەیوەندی بە سێرڤەر پچڕا'));
        xhr.send(fd);
      });

      toast('دەنگەکە بە سەرکەوتوویی بڵاوکرایەوە');
      closeUploadModal();
      await loadTracks();
    } catch (err) {
      toast(err.message, true);
    } finally {
      $('hzSubmitBtn').disabled = false;
    }
  }

  // =========================================================================
  // DATA LOAD & EVENTS
  // =========================================================================
  async function loadTracks() {
    try {
      const data = await apiFetch('/api/hezara');
      state.tracks = Array.isArray(data.tracks) ? data.tracks : [];
      state.categories = Array.isArray(data.categories) ? data.categories : [];
      state.canManage = Boolean(data.canManage);
      $('hzAddTrackBtn').classList.toggle('hidden', !state.canManage);

      renderCategories();
      updateDeckUI();

      // Restore last played track metadata without forcing autoplay
      if (!state.currentTrackId && state.tracks.length > 0) {
        let restored = null;
        try {
          restored = JSON.parse(localStorage.getItem(LAST_PLAYED_KEY) || 'null');
        } catch (e) {}
        if (restored && restored.id && state.tracks.some((t) => Number(t.id) === Number(restored.id))) {
          playTrackById(restored.id, { autoPlay: false, seekToSec: restored.time || 0 });
        }
      }
    } catch (err) {
      toast(err.message || 'هەڵە لە هێنانی دەنگەکان', true);
    }
  }

  function bindEvents() {
    $('hzThemeToggle')?.addEventListener('click', toggleTheme);
    $('hzAddTrackBtn')?.addEventListener('click', () => openUploadModal(null));
    $('hzCloseModalBtn')?.addEventListener('click', closeUploadModal);
    $('hzCancelModalBtn')?.addEventListener('click', closeUploadModal);
    $('hzUploadForm')?.addEventListener('submit', submitUploadOrEdit);

    $('hzSearchInput')?.addEventListener('input', (e) => {
      state.searchQuery = e.target.value || '';
      renderTracks();
    });

    $('hzCategoryPills')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cat]');
      if (!btn) return;
      state.activeCategory = btn.dataset.cat || 'all';
      renderCategories();
      renderTracks();
    });

    $('hzPlayPauseBtn')?.addEventListener('click', () => {
      const el = audio();
      if (!el) return;
      if (!state.currentTrackId) {
        const list = getFilteredTracks().length ? getFilteredTracks() : state.tracks;
        if (list.length) playTrackById(list[0].id, { autoPlay: true });
        return;
      }
      if (el.paused) el.play().catch(() => {});
      else el.pause();
    });

    $('hzPrevBtn')?.addEventListener('click', () => playStep(-1));
    $('hzNextBtn')?.addEventListener('click', () => playStep(1));
    $('hzBack15Btn')?.addEventListener('click', () => {
      const el = audio();
      if (el && state.currentTrackId) {
        el.currentTime = Math.max(0, (el.currentTime || 0) - 15);
      }
    });
    $('hzFwd15Btn')?.addEventListener('click', () => {
      const el = audio();
      if (el && state.currentTrackId) {
        const dur = Number.isFinite(el.duration) ? el.duration : (el.currentTime + 15);
        el.currentTime = Math.min(dur, (el.currentTime || 0) + 15);
      }
    });

    $('hzSpeedBtn')?.addEventListener('click', () => {
      state.speedIdx = (state.speedIdx + 1) % SPEED_STEPS.length;
      const rate = SPEED_STEPS[state.speedIdx];
      $('hzSpeedBtn').textContent = rate + 'x';
      const el = audio();
      if (el) el.playbackRate = rate;
    });

    $('hzAutoNextBtn')?.addEventListener('click', () => {
      state.autoNext = !state.autoNext;
      $('hzAutoNextBtn').classList.toggle('is-active', state.autoNext);
    });

    const seek = $('hzSeekRange');
    if (seek) {
      seek.addEventListener('mousedown', () => { state.isSeeking = true; });
      seek.addEventListener('touchstart', () => { state.isSeeking = true; }, { passive: true });
      seek.addEventListener('input', () => {
        const cur = $('hzTimeCurrent');
        if (cur) cur.textContent = fmtTime(seek.value);
      });
      seek.addEventListener('change', () => {
        const el = audio();
        if (el && state.currentTrackId) {
          el.currentTime = Number(seek.value || 0);
        }
        state.isSeeking = false;
      });
      seek.addEventListener('mouseup', () => { state.isSeeking = false; });
      seek.addEventListener('touchend', () => { state.isSeeking = false; });
    }

    $('hzTracksWrap')?.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('[data-edit-id]');
      if (editBtn) {
        e.stopPropagation();
        const t = state.tracks.find((x) => Number(x.id) === Number(editBtn.dataset.editId));
        if (t) openUploadModal(t);
        return;
      }
      const delBtn = e.target.closest('[data-delete-id]');
      if (delBtn) {
        e.stopPropagation();
        const id = Number(delBtn.dataset.deleteId);
        const t = state.tracks.find((x) => Number(x.id) === id);
        const ok = await confirmDialog('سڕینەوەی تۆماری دەنگی', `دڵنیایت دەتەوێت «${t?.title || ''}» بسڕیتەوە؟`);
        if (!ok) return;
        try {
          await apiFetch(`/api/hezara/${id}`, { method: 'DELETE' });
          if (Number(state.currentTrackId) === id) {
            const el = audio();
            if (el) { el.pause(); el.removeAttribute('src'); el.load(); }
            state.currentTrackId = null;
            state.isPlaying = false;
          }
          toast('دەنگەکە سڕایەوە');
          await loadTracks();
        } catch (err) {
          toast(err.message, true);
        }
        return;
      }
      if (e.target.closest('[data-no-play]')) return;
      const card = e.target.closest('[data-play-id]');
      if (card) {
        playTrackById(Number(card.dataset.playId), { autoPlay: true });
      }
    });

    // Modal Source Tabs & Dropzone
    document.querySelectorAll('.hz-source-tab').forEach((btn) => {
      btn.addEventListener('click', () => switchUploadMode(btn.dataset.mode || 'file'));
    });

    $('hzAudioFileInput')?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) handleFileChosen(e.target.files[0]);
    });

    const dz = $('hzDropzone');
    if (dz) {
      dz.addEventListener('dragover', (e) => { e.preventDefault(); });
      dz.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer?.files?.[0]) handleFileChosen(e.dataTransfer.files[0]);
      });
    }

    $('hzMicStartBtn')?.addEventListener('click', startMicRecording);
    $('hzMicPauseBtn')?.addEventListener('click', togglePauseMicRecording);
    $('hzMicStopBtn')?.addEventListener('click', stopMicRecording);
  }

  function initSocket() {
    if (typeof io !== 'function') return;
    try {
      const sock = io(state.token ? { auth: { token: state.token } } : {});
      state.socket = sock;
      sock.on('hezara_track_created', () => loadTracks());
      sock.on('hezara_track_updated', () => loadTracks());
      sock.on('hezara_track_deleted', () => loadTracks());
    } catch (e) {}
  }

  async function init() {
    syncThemeUI();
    initAudioEngine();
    bindEvents();

    try {
      state.token = localStorage.getItem('ferga_token') || localStorage.getItem('seereen_token');
    } catch (e) {}

    if (state.token) {
      try {
        const me = await apiFetch('/api/auth/me');
        state.user = me.user || me;
        if (state.user && state.user.id) {
          $('hzUserName').textContent = state.user.full_name || state.user.username || '';
          const role = String(state.user.role || '').toLowerCase();
          const roleText = (role === 'teacher' || role === 'super_admin' || role === 'admin') ? 'مامۆستا' : 'گوێگر';
          $('hzUserRoleBadge').textContent = roleText;
          $('hzUserPill').classList.remove('hidden');
        }
      } catch (e) {
        state.token = null;
      }
    }

    await loadTracks();
    initSocket();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
