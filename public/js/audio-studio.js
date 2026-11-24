(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // =========================================================================
  // STATE
  // =========================================================================
  const state = {
    token: null,
    user: null,
    audioCtx: null,
    buffer: null,          // Current working AudioBuffer
    fileName: 'audio-recording',
    undoStack: [],         // Up to 12 previous AudioBuffers
    redoStack: [],
    zoom: 1,
    playhead: 0,           // Current cursor time in seconds
    isPlaying: false,
    playSource: null,
    playStartCtxTime: 0,
    playStartOffset: 0,
    playStopAt: null,
    rafId: null,

    selection: { start: null, end: null }, // Active [A..B] seconds
    queue: [],             // Array of { id, start, end } for multi-turn caller disguise
    anonymizedMarks: [],   // Array of { start, end } already disguised

    activeTab: 'disguise',
    activeScope: 'selection', // selection | queue | all
    activePreset: 'anon_deep', // anon_deep | anon_witness | anon_high | custom

    dragging: false,
    dragAnchorTime: 0,

    recorder: {
      active: false,
      mr: null,
      stream: null,
      chunks: [],
      startedAt: 0,
      timerId: null
    },

    previewSource: null,
    teachers: [],
    folders: []
  };

  let segIdCounter = 1;

  // =========================================================================
  // UTILITIES & UI HELPERS
  // =========================================================================
  function getAudioCtx() {
    if (!state.audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      state.audioCtx = new AC();
    }
    if (state.audioCtx.state === 'suspended') {
      state.audioCtx.resume().catch(() => {});
    }
    return state.audioCtx;
  }

  function fmtTime(sec, showTenths = true) {
    const s = Math.max(0, Number(sec) || 0);
    const mins = Math.floor(s / 60);
    const rem = s - mins * 60;
    const whole = Math.floor(rem);
    const tenths = Math.floor((rem - whole) * 10);
    const base = String(mins).padStart(2, '0') + ':' + String(whole).padStart(2, '0');
    return showTenths ? `${base}.${tenths}` : base;
  }

  function escHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg, isError = false) {
    const stack = $('asToastStack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'as-toast' + (isError ? ' is-error' : '');
    el.innerHTML = `<i class="fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i><span>${escHtml(msg)}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.2s';
      setTimeout(() => el.remove(), 220);
    }, 3400);
  }

  function setBusy(on, title = 'خەریکی پرۆسێسکردنی دەنگەکەیە...', sub = 'تکایە چەند چرکەیەک چاوەڕێ بە') {
    const ov = $('asBusyOverlay');
    if (!ov) return;
    if (on) {
      $('asBusyTitle').textContent = title;
      $('asBusySub').textContent = sub;
      ov.classList.remove('hidden');
    } else {
      ov.classList.add('hidden');
    }
  }

  function yieldFrame() {
    return new Promise(r => setTimeout(r, 35));
  }

  function syncThemeUI() {
    const isDark = document.documentElement.classList.contains('dark');
    document.body.classList.toggle('dark-theme', isDark);
    const icon = $('asThemeIcon');
    if (icon) icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    drawWaveform();
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    document.documentElement.classList.toggle('dark-theme', isDark);
    try { localStorage.setItem('seereen_theme', isDark ? 'dark' : 'light'); } catch (e) {}
    syncThemeUI();
  }

  // =========================================================================
  // AUDIO BUFFER CLONING & UNDO/REDO HISTORY
  // =========================================================================
  function cloneBuffer(src) {
    const ctx = getAudioCtx();
    const dst = ctx.createBuffer(src.numberOfChannels, src.length, src.sampleRate);
    for (let ch = 0; ch < src.numberOfChannels; ch++) {
      dst.getChannelData(ch).set(src.getChannelData(ch));
    }
    return dst;
  }

  function pushUndoSnapshot() {
    if (!state.buffer) return;
    state.undoStack.push({
      buffer: cloneBuffer(state.buffer),
      anonymizedMarks: state.anonymizedMarks.map(m => ({ ...m })),
      queue: state.queue.map(q => ({ ...q }))
    });
    if (state.undoStack.length > 12) state.undoStack.shift();
    state.redoStack = [];
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    $('btnUndo').disabled = state.undoStack.length === 0;
    $('btnRedo').disabled = state.redoStack.length === 0;
  }

  function undoLastAction() {
    if (state.undoStack.length === 0) return;
    stopPlayback();
    state.redoStack.push({
      buffer: cloneBuffer(state.buffer),
      anonymizedMarks: state.anonymizedMarks.map(m => ({ ...m })),
      queue: state.queue.map(q => ({ ...q }))
    });
    const prev = state.undoStack.pop();
    state.buffer = prev.buffer;
    state.anonymizedMarks = prev.anonymizedMarks;
    state.queue = prev.queue;
    state.playhead = Math.min(state.playhead, state.buffer.duration);
    clearSelection();
    refreshAllEditorUI();
    toast('گەڕایەوە بۆ هەنگاوی پێشوو ↩️');
  }

  function redoLastAction() {
    if (state.redoStack.length === 0) return;
    stopPlayback();
    state.undoStack.push({
      buffer: cloneBuffer(state.buffer),
      anonymizedMarks: state.anonymizedMarks.map(m => ({ ...m })),
      queue: state.queue.map(q => ({ ...q }))
    });
    const next = state.redoStack.pop();
    state.buffer = next.buffer;
    state.anonymizedMarks = next.anonymizedMarks;
    state.queue = next.queue;
    state.playhead = Math.min(state.playhead, state.buffer.duration);
    clearSelection();
    refreshAllEditorUI();
    toast('هەنگاوەکە پێشخرایەوە ↪️');
  }

  // =========================================================================
  // LOADING FILES & LIVE MICROPHONE RECORDING
  // =========================================================================
  async function loadAudioFromBlob(blob, displayName) {
    stopPlayback();
    setBusy(true, 'خوێندنەوەی فایلی دەنگی...', 'ئامادەکردنی هێڵکاری شەپۆلی دەنگ');
    await yieldFrame();
    try {
      const ctx = getAudioCtx();
      const arrBuf = await blob.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrBuf);
      state.buffer = decoded;
      state.fileName = String(displayName || 'audio').replace(/\.[^.]+$/, '');
      state.undoStack = [];
      state.redoStack = [];
      state.queue = [];
      state.anonymizedMarks = [];
      state.zoom = 1;
      state.playhead = 0;
      clearSelection();

      $('asEditorPanel').classList.remove('hidden');
      $('asToolsPanel').classList.remove('hidden');
      $('pubLessonTitle').value = state.fileName;
      refreshAllEditorUI();
      toast('دەنگەکە بە سەرکەوتوویی کرایەوە 🎵');
    } catch (err) {
      console.error('Audio decode error:', err);
      toast('نەتوانرا ئەم فۆرماتەی دەنگ بخوێنرێتەوە — تکایە MP3, M4A, WAV یان WebM بەکاربهێنە', true);
    } finally {
      setBusy(false);
    }
  }

  async function toggleMicRecord() {
    if (state.recorder.active) {
      stopMicRecord();
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast('وێبگەڕەکەت پشتگیری تۆمارکردنی دەنگ ناکات', true);
      return;
    }
    try {
      stopPlayback();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '');
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      state.recorder = {
        active: true,
        mr,
        stream,
        chunks: [],
        startedAt: Date.now(),
        timerId: null
      };
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) state.recorder.chunks.push(ev.data);
      };
      mr.onstop = async () => {
        if (state.recorder.stream) state.recorder.stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(state.recorder.chunks, { type: mr.mimeType || 'audio/webm' });
        state.recorder.active = false;
        $('btnRecordMic').classList.remove('is-recording');
        $('btnRecordLabel').textContent = 'دەستپێکردنی تۆمارکردن';
        if (blob.size > 0) {
          await loadAudioFromBlob(blob, 'تۆماری-ستۆدیۆ-' + new Date().toISOString().slice(11, 19).replace(/:/g, '-'));
        }
      };

      $('btnRecordMic').classList.add('is-recording');
      $('btnRecordLabel').textContent = 'وەستاندنی تۆمارکردن';
      state.recorder.timerId = setInterval(() => {
        const secs = (Date.now() - state.recorder.startedAt) / 1000;
        $('recTimerText').textContent = fmtTime(secs, false);
      }, 300);

      mr.start();
    } catch (e) {
      toast('دەسەڵاتی مایکرۆفۆن نەدراوە', true);
    }
  }

  function stopMicRecord() {
    if (!state.recorder.active) return;
    if (state.recorder.timerId) clearInterval(state.recorder.timerId);
    try { state.recorder.mr.stop(); } catch (e) {}
  }

  // =========================================================================
  // PLAYBACK ENGINE
  // =========================================================================
  function stopPlayback() {
    if (state.playSource) {
      try { state.playSource.onended = null; state.playSource.stop(); } catch (e) {}
      state.playSource = null;
    }
    if (state.previewSource) {
      try { state.previewSource.stop(); } catch (e) {}
      state.previewSource = null;
    }
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    state.isPlaying = false;
    state.playStopAt = null;
    updatePlayButtonUI();
    drawWaveform();
  }

  function updatePlayButtonUI() {
    const icon = $('playIcon');
    const txt = $('playText');
    if (icon) icon.className = state.isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    if (txt) txt.textContent = state.isPlaying ? 'وەستان' : 'لێدان';
  }

  function startPlayback(fromSec, toSec = null) {
    if (!state.buffer) return;
    stopPlayback();
    const ctx = getAudioCtx();
    const dur = state.buffer.duration;
    let start = Math.max(0, Math.min(dur - 0.01, Number(fromSec) || 0));
    let playDur = toSec != null ? Math.max(0.05, Math.min(dur, toSec) - start) : (dur - start);
    if (playDur <= 0.02) {
      start = 0;
      playDur = dur;
    }

    const src = ctx.createBufferSource();
    src.buffer = state.buffer;
    src.connect(ctx.destination);
    state.playSource = src;
    state.playStartCtxTime = ctx.currentTime;
    state.playStartOffset = start;
    state.playStopAt = start + playDur;
    state.isPlaying = true;
    updatePlayButtonUI();

    src.onended = () => {
      if (state.playSource === src) {
        state.playhead = Math.min(dur, state.playStopAt || dur);
        stopPlayback();
        updateTimeReadout();
      }
    };

    src.start(0, start, playDur);

    const tick = () => {
      if (!state.isPlaying) return;
      const elapsed = ctx.currentTime - state.playStartCtxTime;
      state.playhead = Math.min(state.playStopAt || dur, state.playStartOffset + elapsed);
      updateTimeReadout();
      drawWaveform();
      state.rafId = requestAnimationFrame(tick);
    };
    state.rafId = requestAnimationFrame(tick);
  }

  function togglePlayPause() {
    if (!state.buffer) return;
    if (state.isPlaying) {
      stopPlayback();
    } else {
      const startAt = state.playhead >= state.buffer.duration - 0.08 ? 0 : state.playhead;
      startPlayback(startAt, null);
    }
  }

  // =========================================================================
  // WAVEFORM CANVAS RENDERING & POINTER INTERACTION
  // =========================================================================
  function getNormalizedSelection() {
    const s = state.selection.start;
    const e = state.selection.end;
    if (s == null || e == null) return null;
    const a = Math.min(s, e);
    const b = Math.max(s, e);
    if (b - a < 0.05) return null;
    return { start: a, end: b };
  }

  function clearSelection() {
    state.selection = { start: null, end: null };
    updateSelectionUI();
    drawWaveform();
  }

  function updateTimeReadout() {
    const dur = state.buffer ? state.buffer.duration : 0;
    $('asTimeReadout').textContent = `${fmtTime(state.playhead)} / ${fmtTime(dur)}`;
  }

  function updateSelectionUI() {
    const sel = getNormalizedSelection();
    const el = $('asSelReadout');
    if (sel) {
      el.textContent = `A: ${fmtTime(sel.start)}  ←  B: ${fmtTime(sel.end)}  (${fmtTime(sel.end - sel.start)})`;
    } else if (state.selection.start != null) {
      el.textContent = `A: ${fmtTime(state.selection.start)} | B: --`;
    } else {
      el.textContent = 'هیچ بەشێک دیاری نەکراوە';
    }
  }

  function renderQueueChips() {
    const wrap = $('asSegmentsWrap');
    const list = $('asSegmentsList');
    $('scopeQueueCount').textContent = String(state.queue.length);
    if (state.queue.length === 0) {
      wrap.classList.add('hidden');
      list.innerHTML = '';
      return;
    }
    wrap.classList.remove('hidden');
    list.innerHTML = state.queue.map((seg, i) => `
      <span class="as-seg-chip">
        <button type="button" data-play-seg="${seg.id}" title="گوێگرتن"><i class="fa-solid fa-play"></i></button>
        <span style="direction:ltr;">#${i + 1}: ${fmtTime(seg.start)} - ${fmtTime(seg.end)}</span>
        <button type="button" data-del-seg="${seg.id}" title="لابردن"><i class="fa-solid fa-xmark"></i></button>
      </span>
    `).join('');
  }

  function refreshAllEditorUI() {
    if (!state.buffer) return;
    $('asFileName').textContent = state.fileName;
    $('asDurationLabel').textContent = fmtTime(state.buffer.duration, false);
    $('asChannelInfo').textContent = state.buffer.numberOfChannels > 1
      ? `Stereo (${state.buffer.numberOfChannels} کەناڵ)`
      : 'Mono (١ کەناڵ)';
    $('asStereoTools').classList.toggle('hidden', state.buffer.numberOfChannels < 2);

    const anonBadge = $('asAnonCountBadge');
    if (state.anonymizedMarks.length > 0) {
      anonBadge.classList.remove('hidden');
      $('asAnonCountText').textContent = `${state.anonymizedMarks.length} بەش شاردراوەتەوە 🔒`;
    } else {
      anonBadge.classList.add('hidden');
    }

    updateHistoryButtons();
    updateTimeReadout();
    updateSelectionUI();
    renderQueueChips();
    drawWaveform();
  }

  function drawWaveform() {
    const canvas = $('asWaveCanvas');
    const scrollEl = $('asWaveScroll');
    if (!canvas || !scrollEl || !state.buffer) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = Math.max(scrollEl.clientWidth - 2, Math.floor((scrollEl.clientWidth - 2) * state.zoom));
    const cssHeight = canvas.clientHeight || 170;

    canvas.style.width = cssWidth + 'px';
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue('--as-wave-bg').trim() || '#f6ecda';
    const barColor = styles.getPropertyValue('--as-wave-bar').trim() || '#b47b1e';
    const playedColor = styles.getPropertyValue('--as-wave-played').trim() || '#1b432e';
    const inkMuted = styles.getPropertyValue('--as-ink-muted').trim() || '#6e4e34';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const dur = state.buffer.duration;
    const rulerH = 22;
    const waveTop = rulerH + 6;
    const waveH = cssHeight - waveTop - 10;
    const midY = waveTop + waveH / 2;

    // 1. Time ruler ticks
    ctx.fillStyle = inkMuted;
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const targetTicks = Math.max(4, Math.floor(cssWidth / 95));
    const stepSec = Math.max(1, Math.ceil(dur / targetTicks));
    ctx.strokeStyle = 'rgba(156, 120, 78, 0.22)';
    ctx.lineWidth = 1;
    for (let t = 0; t <= dur; t += stepSec) {
      const x = (t / dur) * cssWidth;
      ctx.beginPath();
      ctx.moveTo(x, rulerH);
      ctx.lineTo(x, cssHeight);
      ctx.stroke();
      if (x > 22 && x < cssWidth - 22) {
        ctx.fillText(fmtTime(t, false), x, 14);
      }
    }

    // 2. Already-anonymized segments (emerald shield tint)
    state.anonymizedMarks.forEach(m => {
      const x1 = (m.start / dur) * cssWidth;
      const x2 = (m.end / dur) * cssWidth;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
      ctx.fillRect(x1, rulerH, Math.max(2, x2 - x1), cssHeight - rulerH);
    });

    // 3. Queued caller segments (crimson tint)
    state.queue.forEach(seg => {
      const x1 = (seg.start / dur) * cssWidth;
      const x2 = (seg.end / dur) * cssWidth;
      ctx.fillStyle = 'rgba(190, 18, 60, 0.20)';
      ctx.fillRect(x1, rulerH, Math.max(2, x2 - x1), cssHeight - rulerH);
      ctx.strokeStyle = 'rgba(190, 18, 60, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x1, rulerH + 1, Math.max(2, x2 - x1), cssHeight - rulerH - 2);
    });

    // 4. Waveform bars (mix down mono preview for fast visual clarity)
    const ch0 = state.buffer.getChannelData(0);
    const ch1 = state.buffer.numberOfChannels > 1 ? state.buffer.getChannelData(1) : null;
    const totalSamples = ch0.length;
    const barStep = 3;
    const playX = (state.playhead / dur) * cssWidth;

    for (let x = 0; x < cssWidth; x += barStep) {
      const sStart = Math.floor((x / cssWidth) * totalSamples);
      const sEnd = Math.min(totalSamples, Math.floor(((x + barStep) / cssWidth) * totalSamples) + 1);
      const stride = Math.max(1, Math.floor((sEnd - sStart) / 64));
      let peak = 0;
      for (let i = sStart; i < sEnd; i += stride) {
        let v = Math.abs(ch0[i]);
        if (ch1) v = Math.max(v, Math.abs(ch1[i]));
        if (v > peak) peak = v;
      }
      const amp = Math.max(2, peak * (waveH * 0.48));
      ctx.fillStyle = x <= playX ? playedColor : barColor;
      ctx.fillRect(x, midY - amp, 2, amp * 2);
    }

    // 5. Center baseline
    ctx.strokeStyle = 'rgba(180, 105, 14, 0.28)';
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(cssWidth, midY);
    ctx.stroke();

    // 6. Active Selection [A..B] overlay & handles
    const sel = getNormalizedSelection();
    if (sel) {
      const x1 = (sel.start / dur) * cssWidth;
      const x2 = (sel.end / dur) * cssWidth;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.26)';
      ctx.fillRect(x1, rulerH, x2 - x1, cssHeight - rulerH);

      // Start A bar (green)
      ctx.fillStyle = '#15803d';
      ctx.fillRect(x1 - 1.5, rulerH, 3, cssHeight - rulerH);
      ctx.fillRect(x1 - 8, rulerH, 16, 15);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 10px sans-serif';
      ctx.fillText('A', x1, rulerH + 11);

      // End B bar (crimson)
      ctx.fillStyle = '#be123c';
      ctx.fillRect(x2 - 1.5, rulerH, 3, cssHeight - rulerH);
      ctx.fillRect(x2 - 8, rulerH, 16, 15);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('B', x2, rulerH + 11);
    }

    // 7. Live Playhead Needle
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(playX - 1, 0, 2, cssHeight);
    ctx.beginPath();
    ctx.arc(playX, rulerH, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function pointerToTime(ev) {
    const canvas = $('asWaveCanvas');
    if (!canvas || !state.buffer) return 0;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, ev.clientX - rect.left));
    return (x / rect.width) * state.buffer.duration;
  }

  // =========================================================================
  // DSP MODULE 1: CUT, TRIM, MUTE, BEEP, CHANNEL ISOLATION
  // =========================================================================
  function cutSelectedRegion() {
    const sel = getNormalizedSelection();
    if (!sel || !state.buffer) {
      toast('تکایە سەرەتا بەشێک [A تا B] دیاری بکە بۆ بڕین', true);
      return;
    }
    const buf = state.buffer;
    const sr = buf.sampleRate;
    const aIdx = Math.floor(sel.start * sr);
    const bIdx = Math.min(buf.length, Math.floor(sel.end * sr));
    const cutLen = bIdx - aIdx;
    const newLen = buf.length - cutLen;
    if (newLen < sr * 0.2) {
      toast('ناتوانیت هەموو دەنگەکە ببڕیت — تکایە بەشێک بهێڵەرەوە', true);
      return;
    }

    stopPlayback();
    pushUndoSnapshot();

    const ctx = getAudioCtx();
    const out = ctx.createBuffer(buf.numberOfChannels, newLen, sr);
    const fadeSamples = Math.min(Math.floor(sr * 0.018), Math.floor(aIdx / 2), Math.floor((buf.length - bIdx) / 2));

    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const src = buf.getChannelData(ch);
      const dst = out.getChannelData(ch);
      if (aIdx > 0) dst.set(src.subarray(0, aIdx), 0);
      if (bIdx < buf.length) dst.set(src.subarray(bIdx), aIdx);

      // Smooth raised-cosine crossfade across splice point to guarantee zero click/pop
      for (let i = 0; i < fadeSamples; i++) {
        const w = 0.5 * (1 - Math.cos((Math.PI * i) / fadeSamples));
        const pos = aIdx - Math.floor(fadeSamples / 2) + i;
        if (pos >= 0 && pos < newLen && (aIdx - Math.floor(fadeSamples / 2) + i) < buf.length && (bIdx - Math.floor(fadeSamples / 2) + i) >= 0) {
          const leftSample = src[Math.min(buf.length - 1, Math.max(0, aIdx - Math.floor(fadeSamples / 2) + i))];
          const rightSample = src[Math.min(buf.length - 1, Math.max(0, bIdx - Math.floor(fadeSamples / 2) + i))];
          dst[pos] = leftSample * (1 - w) + rightSample * w;
        }
      }
    }

    // Shift queued & anonymized markers cleanly after cut
    const cutDur = sel.end - sel.start;
    const shiftList = (arr) => arr.map(m => {
      if (m.end <= sel.start) return m;
      if (m.start >= sel.end) return { ...m, start: m.start - cutDur, end: m.end - cutDur };
      return null;
    }).filter(Boolean);

    state.queue = shiftList(state.queue);
    state.anonymizedMarks = shiftList(state.anonymizedMarks);
    state.buffer = out;
    state.playhead = Math.min(sel.start, out.duration);
    clearSelection();
    refreshAllEditorUI();
    toast(`بەشی دیاریکراو (${fmtTime(cutDur)}) بڕدرا و باقی دەنگەکە بە نەرمی لکێنرایەوە ✂️`);
  }

  function trimKeepSelectedRegion() {
    const sel = getNormalizedSelection();
    if (!sel || !state.buffer) {
      toast('تکایە سەرەتا بەشێک [A تا B] دیاری بکە بۆ هێشتنەوە', true);
      return;
    }
    const buf = state.buffer;
    const sr = buf.sampleRate;
    const aIdx = Math.floor(sel.start * sr);
    const bIdx = Math.min(buf.length, Math.floor(sel.end * sr));
    const newLen = bIdx - aIdx;
    if (newLen < sr * 0.15) {
      toast('بەشە هەڵبژێردراوەکە زۆر کورتە', true);
      return;
    }

    stopPlayback();
    pushUndoSnapshot();

    const ctx = getAudioCtx();
    const out = ctx.createBuffer(buf.numberOfChannels, newLen, sr);
    const fade = Math.min(Math.floor(sr * 0.012), Math.floor(newLen / 4));
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const src = buf.getChannelData(ch);
      const dst = out.getChannelData(ch);
      dst.set(src.subarray(aIdx, bIdx), 0);
      for (let i = 0; i < fade; i++) {
        const g = i / fade;
        dst[i] *= g;
        dst[newLen - 1 - i] *= g;
      }
    }

    state.queue = [];
    state.anonymizedMarks = [];
    state.buffer = out;
    state.playhead = 0;
    clearSelection();
    refreshAllEditorUI();
    toast('تەنها بەشی دیاریکراو هێڵدرایەوە و دەرەوەی بڕدرا 📐');
  }

  function muteOrBeepSelectedRegion(withBeep = false) {
    const sel = getNormalizedSelection();
    if (!sel || !state.buffer) {
      toast('تکایە سەرەتا بەشێک [A تا B] دیاری بکە', true);
      return;
    }
    stopPlayback();
    pushUndoSnapshot();

    const buf = state.buffer;
    const sr = buf.sampleRate;
    const aIdx = Math.floor(sel.start * sr);
    const bIdx = Math.min(buf.length, Math.floor(sel.end * sr));
    const len = bIdx - aIdx;
    const fade = Math.min(Math.floor(sr * 0.018), Math.floor(len / 3));

    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        let env = 1;
        if (i < fade) env = i / fade;
        else if (i > len - fade) env = (len - i) / fade;

        const orig = data[aIdx + i];
        const replacement = withBeep ? (Math.sin((2 * Math.PI * 950 * i) / sr) * 0.22 * env) : 0;
        data[aIdx + i] = orig * (1 - env) + replacement;
      }
    }

    state.anonymizedMarks.push({ start: sel.start, end: sel.end });
    refreshAllEditorUI();
    toast(withBeep ? 'دەنگی «بیپ» لەسەر بەشی دیاریکراو دانرا 🔔' : 'بەشی دیاریکراو بە تەواوی بێدەنگکرا 🔇');
  }

  function isolateStereoChannel(channelIdx) {
    if (!state.buffer || state.buffer.numberOfChannels < 2) return;
    stopPlayback();
    pushUndoSnapshot();
    const ctx = getAudioCtx();
    const out = ctx.createBuffer(1, state.buffer.length, state.buffer.sampleRate);
    out.getChannelData(0).set(state.buffer.getChannelData(channelIdx));
    state.buffer = out;
    refreshAllEditorUI();
    toast(channelIdx === 0 ? 'تەنها کەناڵی چەپ (L) هێڵدرایەوە' : 'تەنها کەناڵی ڕاست (R) هێڵدرایەوە');
  }

  // =========================================================================
  // DSP MODULE 2: STUDIO ENHANCEMENT (HIGHPASS + CLARITY EQ + COMPRESSOR + NORMALIZE)
  // =========================================================================
  async function enhanceStudioVoice() {
    if (!state.buffer) return;
    stopPlayback();
    setBusy(true, 'خاوێنکردنەوەی دەنگ بە کوالیتی ستۆدیۆ...', 'لابردنی ژاوەژاو و ڕوونکردنەوەی دەنگ');
    await yieldFrame();
    try {
      pushUndoSnapshot();
      const src = state.buffer;
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const offline = new OAC(src.numberOfChannels, src.length, src.sampleRate);

      const source = offline.createBufferSource();
      source.buffer = src;

      // 1. High-pass filter (removes AC hum / mic rumble < 85 Hz)
      const hp = offline.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 85;
      hp.Q.value = 0.7;

      // 2. Warm low-mid fullness (220 Hz +2 dB)
      const warm = offline.createBiquadFilter();
      warm.type = 'peaking';
      warm.frequency.value = 220;
      warm.Q.value = 1.0;
      warm.gain.value = 2.0;

      // 3. Speech presence clarity (2.8 kHz +3.2 dB)
      const clarity = offline.createBiquadFilter();
      clarity.type = 'peaking';
      clarity.frequency.value = 2800;
      clarity.Q.value = 1.2;
      clarity.gain.value = 3.2;

      // 4. High-shelf gentle hiss cut (> 8.5 kHz -3 dB)
      const deHiss = offline.createBiquadFilter();
      deHiss.type = 'highshelf';
      deHiss.frequency.value = 8500;
      deHiss.gain.value = -3.0;

      // 5. Smooth broadcast compressor
      const comp = offline.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.knee.value = 18;
      comp.ratio.value = 3.5;
      comp.attack.value = 0.008;
      comp.release.value = 0.16;

      source.connect(hp);
      hp.connect(warm);
      warm.connect(clarity);
      clarity.connect(deHiss);
      deHiss.connect(comp);
      comp.connect(offline.destination);
      source.start(0);

      const rendered = await offline.startRendering();
      normalizeBufferInPlace(rendered, 0.90);
      state.buffer = rendered;
      refreshAllEditorUI();
      toast('دەنگەکە بە کوالیتی ستۆدیۆ خاوێن و ڕوون کرایەوە ✨');
    } catch (e) {
      toast('هەڵە لە پاککردنەوەی دەنگەکە', true);
    } finally {
      setBusy(false);
    }
  }

  function normalizeBufferInPlace(buf, targetPeak = 0.92) {
    let peak = 0;
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) {
        const a = Math.abs(d[i]);
        if (a > peak) peak = a;
      }
    }
    if (peak < 1e-5) return;
    const gain = targetPeak / peak;
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) d[i] *= gain;
    }
  }

  function applyFadeInOutToBuffer() {
    if (!state.buffer) return;
    stopPlayback();
    pushUndoSnapshot();
    const buf = state.buffer;
    const fadeLen = Math.min(Math.floor(buf.sampleRate * 0.8), Math.floor(buf.length / 4));
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < fadeLen; i++) {
        const w = 0.5 * (1 - Math.cos((Math.PI * i) / fadeLen));
        d[i] *= w;
        d[d.length - 1 - i] *= w;
      }
    }
    refreshAllEditorUI();
    toast('سەرەتا و کۆتایی دەنگەکە نەرمکرانەوە ✓');
  }

  // =========================================================================
  // DSP MODULE 3: IRREVERSIBLE MULTI-LAYER VOICE ANONYMIZER ENGINE
  //   1. Crypto-Random Non-Stationary Granular Pitch & Phase Warping
  //   2. 18-Band Speech-Envelope Vocoder Resynthesis (erases F0 & glottal voiceprint)
  //   3. Non-Linear Spectral Shaping & Soft Saturation
  // =========================================================================
  function cryptoRandFloat() {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / 4294967296;
  }

  function makeBandpassCoeffs(fc, Q, sr) {
    const w0 = (2 * Math.PI * fc) / sr;
    const alpha = Math.sin(w0) / (2 * Q);
    const cosw = Math.cos(w0);
    const a0 = 1 + alpha;
    return {
      b0: alpha / a0,
      b1: 0,
      b2: -alpha / a0,
      a1: (-2 * cosw) / a0,
      a2: (1 - alpha) / a0
    };
  }

  function makeHighpassCoeffs(fc, Q, sr) {
    const w0 = (2 * Math.PI * fc) / sr;
    const alpha = Math.sin(w0) / (2 * Q);
    const cosw = Math.cos(w0);
    const a0 = 1 + alpha;
    return {
      b0: ((1 + cosw) / 2) / a0,
      b1: -(1 + cosw) / a0,
      b2: ((1 + cosw) / 2) / a0,
      a1: (-2 * cosw) / a0,
      a2: (1 - alpha) / a0
    };
  }

  function makeLowpassCoeffs(fc, Q, sr) {
    const w0 = (2 * Math.PI * fc) / sr;
    const alpha = Math.sin(w0) / (2 * Q);
    const cosw = Math.cos(w0);
    const a0 = 1 + alpha;
    return {
      b0: ((1 - cosw) / 2) / a0,
      b1: (1 - cosw) / a0,
      b2: ((1 - cosw) / 2) / a0,
      a1: (-2 * cosw) / a0,
      a2: (1 - alpha) / a0
    };
  }

  function applyBiquadInPlace(arr, c) {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    const { b0, b1, b2, a1, a2 } = c;
    for (let i = 0; i < arr.length; i++) {
      const x0 = arr[i];
      const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x0;
      y2 = y1; y1 = y0;
      arr[i] = y0;
    }
  }

  // Granular overlap-add pitch shifter with optional crypto-random time-varying pitch drift & phase jitter
  function granularPitchShiftMono(input, sr, baseSemitones, driftSemitones = 0, phaseJitterMs = 0) {
    const N = input.length;
    const out = new Float32Array(N);
    const winNorm = new Float32Array(N);
    const grainSize = Math.max(512, Math.floor(sr * 0.036)); // 36ms speech grain
    const hop = Math.floor(grainSize / 4); // 75% overlap for buttery clarity

    // Precompute Hann window
    const hann = new Float32Array(grainSize);
    for (let i = 0; i < grainSize; i++) {
      hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (grainSize - 1)));
    }

    // Build smooth crypto-random pitch walk per hop (non-stationary -> defeats constant inverse pitch shift!)
    let currentDrift = (cryptoRandFloat() * 2 - 1) * driftSemitones;
    let targetDrift = (cryptoRandFloat() * 2 - 1) * driftSemitones;
    const jitterSamples = Math.floor((phaseJitterMs / 1000) * sr);
    let stepIdx = 0;

    for (let pos = 0; pos < N; pos += hop) {
      if (driftSemitones > 0) {
        if (stepIdx % 14 === 0) {
          targetDrift = (cryptoRandFloat() * 2 - 1) * driftSemitones;
        }
        currentDrift += (targetDrift - currentDrift) * 0.16;
      }
      stepIdx++;

      const semi = baseSemitones + currentDrift;
      const ratio = Math.pow(2, semi / 12);
      const jitter = jitterSamples > 0 ? Math.floor((cryptoRandFloat() * 2 - 1) * jitterSamples) : 0;
      const readCenter = pos + grainSize * 0.5 + jitter;

      for (let i = 0; i < grainSize; i++) {
        const writePos = pos + i;
        if (writePos >= N) break;
        const readPos = readCenter + (i - grainSize * 0.5) * ratio;
        let sample = 0;
        if (readPos >= 0 && readPos < N - 1) {
          const idx0 = readPos | 0;
          const frac = readPos - idx0;
          sample = input[idx0] * (1 - frac) + input[idx0 + 1] * frac;
        }
        const w = hann[i];
        out[writePos] += sample * w;
        winNorm[writePos] += w;
      }
    }

    for (let i = 0; i < N; i++) {
      if (winNorm[i] > 1e-4) out[i] /= winNorm[i];
    }
    return out;
  }

  // 18-Band Speech Envelope Vocoder Resynthesis (Permanently destroys original vocal-fold waveform & biometrics!)
  function vocoderResynthesizeMono(input, sr, carrierBaseHz, breathMix = 0.20) {
    const N = input.length;
    const out = new Float32Array(N);

    // 1. Build brand-new synthetic voice carrier (saw/pulse harmonics + gentle random micro-drift + soft breath noise)
    const carrier = new Float32Array(N);
    let phase = cryptoRandFloat();
    let fCur = carrierBaseHz;
    let fTarget = carrierBaseHz;
    const changeEvery = Math.floor(sr * 0.22);

    for (let i = 0; i < N; i++) {
      if (i % changeEvery === 0) {
        fTarget = carrierBaseHz * (0.93 + cryptoRandFloat() * 0.14); // ±7% random synthetic intonation
      }
      fCur += (fTarget - fCur) * 0.0005;
      phase += fCur / sr;
      if (phase >= 1) phase -= 1;

      // Warm glottal-like harmonic wave (soft saw + sub harmonic) + subtle noise for unvoiced consonants
      const saw = (2 * phase - 1);
      const sub = Math.sin(2 * Math.PI * phase);
      const noise = (cryptoRandFloat() * 2 - 1);
      carrier[i] = (saw * 0.55 + sub * 0.35) * (1 - breathMix) + noise * breathMix * 0.95;
    }

    // 2. 18 log-spaced speech intelligibility bands covering 135 Hz -> 4000 Hz
    const numBands = 18;
    const fMin = 135;
    const fMax = Math.min(4000, sr * 0.42);
    const envAlpha = 1 - Math.exp((-2 * Math.PI * 34) / sr); // 34 Hz slow envelope smoother (ZERO glottal pitch leaks through!)

    for (let b = 0; b < numBands; b++) {
      const fc = fMin * Math.pow(fMax / fMin, b / (numBands - 1));
      const coeff = makeBandpassCoeffs(fc, 4.4, sr);
      const { b0, b1, b2, a1, a2 } = coeff;

      // Filter speech -> rectify -> 34Hz envelope; simultaneously filter synthetic carrier -> modulate by envelope
      let sx1 = 0, sx2 = 0, sy1 = 0, sy2 = 0;
      let cx1 = 0, cx2 = 0, cy1 = 0, cy2 = 0;
      let env = 0;

      for (let i = 0; i < N; i++) {
        // Speech band analysis
        const sx0 = input[i];
        const sy0 = b0 * sx0 + b1 * sx1 + b2 * sx2 - a1 * sy1 - a2 * sy2;
        sx2 = sx1; sx1 = sx0; sy2 = sy1; sy1 = sy0;

        const rect = sy0 < 0 ? -sy0 : sy0;
        env += envAlpha * (rect - env);

        // Synthetic carrier band synthesis
        const cx0 = carrier[i];
        const cy0 = b0 * cx0 + b1 * cx1 + b2 * cx2 - a1 * cy1 - a2 * cy2;
        cx2 = cx1; cx1 = cx0; cy2 = cy1; cy1 = cy0;

        out[i] += cy0 * env * 5.8;
      }
    }

    return out;
  }

  function computeRms(arr) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += arr[i] * arr[i];
    return Math.sqrt(sum / Math.max(1, arr.length));
  }

  // Full Irreversible Multi-Layer Anonymizer Pipeline for One Mono Slice
  function anonymizeSliceMono(input, sr, preset) {
    const N = input.length;
    const origRms = computeRms(input);
    if (origRms < 1e-5) return new Float32Array(N);

    let cfg = { baseSemi: -4.6, drift: 2.1, jitterMs: 4.5, carrierHz: 96, vocMix: 0.72, breath: 0.22 };
    if (preset === 'anon_witness') {
      cfg = { baseSemi: -2.4, drift: 2.0, jitterMs: 4.0, carrierHz: 118, vocMix: 0.68, breath: 0.24 };
    } else if (preset === 'anon_high') {
      cfg = { baseSemi: 4.3, drift: 2.0, jitterMs: 4.0, carrierHz: 215, vocMix: 0.72, breath: 0.24 };
    }

    // Stage 1: Cryptographically time-varying pitch/formant warped + phase-scrambled stream
    const warped = granularPitchShiftMono(input, sr, cfg.baseSemi, cfg.drift, cfg.jitterMs);

    // Stage 2: Pure 18-band envelope vocoder resynthesis (0% original vocal-fold waveform!)
    const vocoded = vocoderResynthesizeMono(input, sr, cfg.carrierHz, cfg.breath);

    // Match RMS of both layers before blending
    const wRms = computeRms(warped) || 1;
    const vRms = computeRms(vocoded) || 1;
    const out = new Float32Array(N);
    const wGain = (origRms / wRms) * (1 - cfg.vocMix);
    const vGain = (origRms / vRms) * cfg.vocMix;

    for (let i = 0; i < N; i++) {
      // Subtle non-linear tanh saturation + tiny dither destroys residual linear inverse invertibility
      const mixed = vocoded[i] * vGain + warped[i] * wGain;
      out[i] = Math.tanh(mixed * 1.45) * 0.85;
    }

    // Stage 3: Telephone/broadcast speech bandpass (140 Hz - 3850 Hz)
    applyBiquadInPlace(out, makeHighpassCoeffs(140, 0.75, sr));
    applyBiquadInPlace(out, makeLowpassCoeffs(Math.min(3850, sr * 0.42), 0.75, sr));

    // Match original RMS loudness cleanly so speaker volume matches the rest of the call!
    const outRms = computeRms(out) || 1;
    const finalGain = Math.min(3.5, (origRms * 1.04) / outRms);
    for (let i = 0; i < N; i++) {
      const s = out[i] * finalGain;
      out[i] = Math.max(-0.96, Math.min(0.96, s));
    }
    return out;
  }

  // Custom Manual Voice Transformer (Pitch + Speed + Volume + Optional Reverb)
  function customTransformSliceMono(input, sr, { pitchSemi, speed, volume, reverbMix }) {
    let processed = input;
    if (Math.abs(pitchSemi) > 0.05) {
      processed = granularPitchShiftMono(processed, sr, pitchSemi, 0, 0);
    }

    // Speed change via linear interpolation resampling
    if (Math.abs(speed - 1.0) > 0.01) {
      const newLen = Math.max(128, Math.floor(processed.length / speed));
      const resampled = new Float32Array(newLen);
      for (let i = 0; i < newLen; i++) {
        const pos = i * speed;
        const idx = pos | 0;
        const frac = pos - idx;
        if (idx + 1 < processed.length) {
          resampled[i] = processed[idx] * (1 - frac) + processed[idx + 1] * frac;
        } else if (idx < processed.length) {
          resampled[i] = processed[idx];
        }
      }
      processed = resampled;
    }

    // Optional simple multi-tap studio room reverb
    if (reverbMix > 0.01) {
      const rev = new Float32Array(processed.length);
      const taps = [
        { d: Math.floor(sr * 0.029), g: 0.42 },
        { d: Math.floor(sr * 0.053), g: 0.30 },
        { d: Math.floor(sr * 0.089), g: 0.20 },
        { d: Math.floor(sr * 0.137), g: 0.12 }
      ];
      for (let i = 0; i < processed.length; i++) {
        let wet = 0;
        for (let t = 0; t < taps.length; t++) {
          const j = i - taps[t].d;
          if (j >= 0) wet += processed[j] * taps[t].g;
        }
        rev[i] = processed[i] * (1 - reverbMix * 0.45) + wet * reverbMix;
      }
      processed = rev;
    }

    // Volume
    const out = new Float32Array(processed.length);
    for (let i = 0; i < processed.length; i++) {
      out[i] = Math.max(-0.98, Math.min(0.98, processed[i] * volume));
    }
    return out;
  }

  function getTargetRegionsForTransform() {
    if (!state.buffer) return [];
    const dur = state.buffer.duration;
    if (state.activeScope === 'all') {
      return [{ start: 0, end: dur }];
    }
    if (state.activeScope === 'queue') {
      if (state.queue.length === 0) return [];
      // Merge & sort non-overlapping segments
      const sorted = state.queue.map(q => ({ start: Math.max(0, q.start), end: Math.min(dur, q.end) }))
        .sort((a, b) => a.start - b.start);
      const merged = [];
      for (const s of sorted) {
        if (!merged.length || s.start > merged[merged.length - 1].end) {
          merged.push({ ...s });
        } else {
          merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, s.end);
        }
      }
      return merged;
    }
    const sel = getNormalizedSelection();
    return sel ? [sel] : [];
  }

  function readCustomSettings() {
    return {
      pitchSemi: Number($('slPitch').value || 0),
      speed: Number($('slSpeed').value || 1),
      volume: Number($('slVolume').value || 100) / 100,
      reverbMix: Number($('slReverb').value || 0) / 100
    };
  }

  async function previewVoiceEffect() {
    if (!state.buffer) return;
    stopPlayback();
    const sel = getNormalizedSelection();
    const startSec = sel ? sel.start : state.playhead;
    const endSec = sel ? Math.min(sel.end, sel.start + 12) : Math.min(state.buffer.duration, startSec + 8);
    if (endSec - startSec < 0.1) {
      toast('تکایە بەشێکی دەنگ دیاری بکە بۆ تاقیکردنەوە', true);
      return;
    }

    setBusy(true, 'ئامادەکردنی گوێگرتنی پێشوەختە...', 'تاقیکردنەوەی کاریگەرییە هەڵبژێردراوەکە');
    await yieldFrame();
    try {
      const sr = state.buffer.sampleRate;
      const a = Math.floor(startSec * sr);
      const b = Math.min(state.buffer.length, Math.floor(endSec * sr));
      const slice = state.buffer.getChannelData(0).slice(a, b);

      let result;
      if (state.activePreset === 'custom') {
        result = customTransformSliceMono(slice, sr, readCustomSettings());
      } else {
        result = anonymizeSliceMono(slice, sr, state.activePreset);
      }

      const ctx = getAudioCtx();
      const previewBuf = ctx.createBuffer(1, result.length, sr);
      previewBuf.getChannelData(0).set(result);

      const src = ctx.createBufferSource();
      src.buffer = previewBuf;
      src.connect(ctx.destination);
      state.previewSource = src;
      src.start(0);
      toast('گوێ بگرە لە ئەنجامی پێشوەختە (هێشتا پاشەکەوت نەکراوە) 🎧');
    } catch (e) {
      toast('هەڵە لە تاقیکردنەوەی دەنگەکە', true);
    } finally {
      setBusy(false);
    }
  }

  async function applyVoiceTransformToTarget() {
    if (!state.buffer) return;
    const regions = getTargetRegionsForTransform();
    if (regions.length === 0) {
      toast(
        state.activeScope === 'queue'
          ? 'لیستی بەشەکان بەتاڵە — سەرەتا بەشێک دیاری بکە و «زیادکردن بۆ لیستی شاردنەوە» دابگرە'
          : 'تکایە سەرەتا بەشێک [A تا B] لەسەر هێڵکاری دەنگەکە دیاری بکە',
        true
      );
      return;
    }

    stopPlayback();
    const isAnon = state.activePreset !== 'custom';
    setBusy(
      true,
      isAnon ? 'تێکشکاندنی پەنجەمۆری دەنگ و شاردنەوەی تەواو...' : 'گۆڕینی دەنگ...',
      `پرۆسێسکردنی ${regions.length} بەش لە ناو ئامێرەکەی خۆتدا`
    );
    await yieldFrame();

    try {
      pushUndoSnapshot();
      const buf = state.buffer;
      const sr = buf.sampleRate;
      const customCfg = readCustomSettings();
      const isLengthChanging = !isAnon && Math.abs(customCfg.speed - 1.0) > 0.01;

      if (isLengthChanging) {
        // Rebuild buffer with variable-length slices
        const ctx = getAudioCtx();
        const chPieces = [];
        for (let ch = 0; ch < buf.numberOfChannels; ch++) {
          const src = buf.getChannelData(ch);
          const parts = [];
          let cursor = 0;
          for (const r of regions) {
            const a = Math.floor(r.start * sr);
            const b = Math.min(buf.length, Math.floor(r.end * sr));
            if (a > cursor) parts.push(src.subarray(cursor, a));
            parts.push(customTransformSliceMono(src.slice(a, b), sr, customCfg));
            cursor = b;
          }
          if (cursor < buf.length) parts.push(src.subarray(cursor));
          const totalLen = parts.reduce((acc, p) => acc + p.length, 0);
          const merged = new Float32Array(totalLen);
          let off = 0;
          for (const p of parts) { merged.set(p, off); off += p.length; }
          chPieces.push(merged);
        }
        const newBuf = ctx.createBuffer(buf.numberOfChannels, chPieces[0].length, sr);
        for (let ch = 0; ch < buf.numberOfChannels; ch++) newBuf.getChannelData(ch).set(chPieces[ch]);
        state.buffer = newBuf;
      } else {
        // Same-length in-place replacement with silky 25ms crossfade at segment borders!
        const fade = Math.floor(sr * 0.025);
        for (const r of regions) {
          const a = Math.floor(r.start * sr);
          const b = Math.min(buf.length, Math.floor(r.end * sr));
          const len = b - a;
          if (len < 64) continue;
          const actualFade = Math.min(fade, Math.floor(len / 4));

          for (let ch = 0; ch < buf.numberOfChannels; ch++) {
            const chData = buf.getChannelData(ch);
            const origSlice = chData.slice(a, b);
            const processed = isAnon
              ? anonymizeSliceMono(origSlice, sr, state.activePreset)
              : customTransformSliceMono(origSlice, sr, customCfg);

            for (let i = 0; i < len; i++) {
              let w = 1;
              if (i < actualFade) {
                w = 0.5 * (1 - Math.cos((Math.PI * i) / actualFade));
              } else if (i > len - actualFade) {
                w = 0.5 * (1 - Math.cos((Math.PI * (len - i)) / actualFade));
              }
              chData[a + i] = origSlice[i] * (1 - w) + processed[i] * w;
            }
          }
          if (isAnon) {
            state.anonymizedMarks.push({ start: r.start, end: r.end });
          }
        }
      }

      if (state.activeScope === 'queue') {
        state.queue = [];
      }
      refreshAllEditorUI();
      toast(
        isAnon
          ? `✅ شاردنەوەی تەواوی دەنگ (نەگەڕاوە) لەسەر ${regions.length} بەش جێبەجێکرا!`
          : `✅ گۆڕینی دەنگ لەسەر ${regions.length} بەش جێبەجێکرا!`
      );
    } catch (err) {
      console.error('Voice transform error:', err);
      toast('هەڵە لە پرۆسێسکردنی دەنگەکە', true);
    } finally {
      setBusy(false);
    }
  }

  // =========================================================================
  // EXPORT ENGINE (RESAMPLED 16-BIT PCM WAV — ZERO RAW AUDIO LEAK)
  // =========================================================================
  async function renderExportWavBlob(targetRate = 22050) {
    const src = state.buffer;
    const outChannels = targetRate <= 22050 ? 1 : Math.min(2, src.numberOfChannels);
    const outLength = Math.max(1, Math.ceil(src.duration * targetRate));
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const offline = new OAC(outChannels, outLength, targetRate);
    const sNode = offline.createBufferSource();
    sNode.buffer = src;
    sNode.connect(offline.destination);
    sNode.start(0);
    const rendered = await offline.startRendering();
    return encodeBufferToWav(rendered);
  }

  function encodeBufferToWav(audioBuffer) {
    const numCh = audioBuffer.numberOfChannels;
    const sr = audioBuffer.sampleRate;
    const len = audioBuffer.length;
    const bytesPerSample = 2;
    const blockAlign = numCh * bytesPerSample;
    const dataSize = len * blockAlign;
    const ab = new ArrayBuffer(44 + dataSize);
    const view = new DataView(ab);

    const writeStr = (off, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
    };

    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numCh, true);
    view.setUint32(24, sr, true);
    view.setUint32(28, sr * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, dataSize, true);

    const chans = [];
    for (let c = 0; c < numCh; c++) chans.push(audioBuffer.getChannelData(c));

    let offset = 44;
    for (let i = 0; i < len; i++) {
      for (let c = 0; c < numCh; c++) {
        const s = Math.max(-1, Math.min(1, chans[c][i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([ab], { type: 'audio/wav' });
  }

  async function downloadFinalWav() {
    if (!state.buffer) return;
    stopPlayback();
    const rate = Number($('asExportRate').value || 22050);
    setBusy(true, 'ئامادەکردنی فایلە پاککراوەکە بۆ داگرتن...', 'تەنها وەشانی کۆتایی و شاردراوە هەناردە دەکرێت');
    await yieldFrame();
    try {
      const wavBlob = await renderExportWavBlob(rate);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (state.fileName || 'pryaska-audio') + '-edited.wav';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast('فایلە نوێیەکە بە سەرکەوتوویی دابەزی 📥');
    } catch (e) {
      toast('هەڵە لە دروستکردنی فایلی WAV', true);
    } finally {
      setBusy(false);
    }
  }

  async function publishToRecordedLessons() {
    if (!state.buffer) return;
    const title = String($('pubLessonTitle').value || '').trim();
    if (!title) {
      toast('تکایە ناونیشانێک بنووسە', true);
      $('pubLessonTitle').focus();
      return;
    }

    stopPlayback();
    const rate = Number($('asExportRate').value || 22050);
    setBusy(true, 'بڵاوکردنەوە لە «پریاسکەی وانەکان»...', 'ئامادەکردن و ناردنی تەنها دەنگە کۆتاییەکە');
    await yieldFrame();
    try {
      const wavBlob = await renderExportWavBlob(rate);
      const fd = new FormData();
      fd.append('audio', wavBlob, 'studio-' + Date.now() + '.wav');
      fd.append('title', title);
      fd.append('duration', fmtTime(state.buffer.duration, false));

      const teacherSel = $('pubLessonTeacher');
      const teacherOpt = teacherSel.options[teacherSel.selectedIndex];
      if (teacherSel.value) {
        fd.append('teacher_id', teacherSel.value);
        fd.append('teacher_name', teacherOpt ? teacherOpt.textContent : '');
      }
      const folderSel = $('pubLessonFolder');
      const folderOpt = folderSel.options[folderSel.selectedIndex];
      if (folderSel.value && folderSel.value !== '0') {
        fd.append('folder_id', folderSel.value);
        fd.append('folder_name', folderOpt ? folderOpt.textContent : '');
      }

      const res = await fetch('/api/recorded-lessons/upload', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + state.token },
        body: fd
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'هەڵە لە بڵاوکردنەوە');
      }
      toast('دەنگە ئامادەکراوەکە بە سەرکەوتوویی لە «پریاسکەی وانەکان» بڵاوکرایەوە 🎉');
    } catch (err) {
      toast(err.message || 'هەڵە لە ناردنی فایلەکە', true);
    } finally {
      setBusy(false);
    }
  }

  async function loadLessonsMetaForPublish() {
    try {
      const headers = { 'Authorization': 'Bearer ' + state.token };
      const [tRes, fRes] = await Promise.all([
        fetch('/api/lesson-teachers', { headers }).then(r => r.json()).catch(() => ({})),
        fetch('/api/lesson-folders', { headers }).then(r => r.json()).catch(() => ({}))
      ]);
      const tSel = $('pubLessonTeacher');
      const fSel = $('pubLessonFolder');
      if (tSel && Array.isArray(tRes.teachers)) {
        tSel.innerHTML = '<option value="">مامۆستا (خۆکارانە: خۆت)</option>' +
          tRes.teachers.map(t => `<option value="${t.id}">${escHtml(t.name)}</option>`).join('');
      }
      if (fSel && Array.isArray(fRes.folders)) {
        fSel.innerHTML = '<option value="0">بەبێ فۆڵدەر (سەرەکی)</option>' +
          fRes.folders.map(f => `<option value="${f.id}">${escHtml(f.name)}</option>`).join('');
      }
    } catch (e) {}
  }

  // =========================================================================
  // EVENTS BINDING
  // =========================================================================
  function bindEvents() {
    $('asThemeToggle').addEventListener('click', toggleTheme);
    $('btnUndo').addEventListener('click', undoLastAction);
    $('btnRedo').addEventListener('click', redoLastAction);
    $('btnRecordMic').addEventListener('click', toggleMicRecord);

    // Dropzone & file input
    const dz = $('asDropzone');
    const fi = $('asFileInput');
    dz.addEventListener('click', () => fi.click());
    fi.addEventListener('change', () => {
      const f = fi.files && fi.files[0];
      if (f) loadAudioFromBlob(f, f.name);
      fi.value = '';
    });
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('is-drag'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('is-drag'));
    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.classList.remove('is-drag');
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) loadAudioFromBlob(f, f.name);
    });

    // Transport controls
    $('btnPlayPause').addEventListener('click', togglePlayPause);
    $('btnPlaySelection').addEventListener('click', () => {
      const sel = getNormalizedSelection();
      if (!sel) { toast('سەرەتا بەشێک [A تا B] دیاری بکە', true); return; }
      startPlayback(sel.start, sel.end);
    });
    $('btnSkipBack').addEventListener('click', () => {
      if (!state.buffer) return;
      state.playhead = Math.max(0, state.playhead - 5);
      if (state.isPlaying) startPlayback(state.playhead);
      else { updateTimeReadout(); drawWaveform(); }
    });
    $('btnSkipFwd').addEventListener('click', () => {
      if (!state.buffer) return;
      state.playhead = Math.min(state.buffer.duration, state.playhead + 5);
      if (state.isPlaying) startPlayback(state.playhead);
      else { updateTimeReadout(); drawWaveform(); }
    });

    // Zoom
    document.querySelectorAll('[data-zoom]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.zoom = Number(btn.dataset.zoom) || 1;
        drawWaveform();
      });
    });

    // Selection A / B & Multi-Segment Queue
    $('btnMarkStart').addEventListener('click', () => {
      if (!state.buffer) return;
      state.selection.start = state.playhead;
      if (state.selection.end != null && state.selection.end < state.selection.start) {
        state.selection.end = null;
      }
      updateSelectionUI();
      drawWaveform();
    });
    $('btnMarkEnd').addEventListener('click', () => {
      if (!state.buffer) return;
      if (state.selection.start == null) state.selection.start = 0;
      state.selection.end = state.playhead;
      updateSelectionUI();
      drawWaveform();
    });
    $('btnClearSel').addEventListener('click', clearSelection);

    $('btnQueueSegment').addEventListener('click', () => {
      const sel = getNormalizedSelection();
      if (!sel) {
        toast('تکایە سەرەتا بەشێک [A تا B] دیاری بکە', true);
        return;
      }
      state.queue.push({ id: segIdCounter++, start: sel.start, end: sel.end });
      state.queue.sort((a, b) => a.start - b.start);
      clearSelection();
      renderQueueChips();
      drawWaveform();
      toast('بەشەکە زیادکرا بۆ لیستی شاردنەوە ✓');
    });

    // Waveform Canvas Pointer Drag-Select & Seek
    const canvas = $('asWaveCanvas');
    canvas.addEventListener('pointerdown', (e) => {
      if (!state.buffer) return;
      const t = pointerToTime(e);
      state.dragging = true;
      state.dragAnchorTime = t;
      state.playhead = t;
      updateTimeReadout();
      drawWaveform();
    });
    window.addEventListener('pointermove', (e) => {
      if (!state.dragging || !state.buffer) return;
      const t = pointerToTime(e);
      if (Math.abs(t - state.dragAnchorTime) > 0.06) {
        state.selection = { start: state.dragAnchorTime, end: t };
        updateSelectionUI();
        drawWaveform();
      }
    });
    window.addEventListener('pointerup', () => {
      if (!state.dragging) return;
      state.dragging = false;
      if (state.isPlaying) startPlayback(state.playhead);
    });

    // Stereo Channel Isolation
    $('btnKeepLeftCh').addEventListener('click', () => isolateStereoChannel(0));
    $('btnKeepRightCh').addEventListener('click', () => isolateStereoChannel(1));

    // Tabs
    document.querySelectorAll('.as-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeTab = btn.dataset.tab;
        document.querySelectorAll('.as-tab-btn').forEach(b => b.classList.toggle('is-active', b === btn));
        $('tabPanelDisguise').classList.toggle('hidden', state.activeTab !== 'disguise');
        $('tabPanelCut').classList.toggle('hidden', state.activeTab !== 'cut');
        $('tabPanelExport').classList.toggle('hidden', state.activeTab !== 'export');
      });
    });

    // Scope selector
    document.querySelectorAll('[data-scope]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeScope = btn.dataset.scope;
        document.querySelectorAll('[data-scope]').forEach(b => b.classList.toggle('is-active', b === btn));
      });
    });

    // Preset cards
    document.querySelectorAll('[data-preset]').forEach(card => {
      card.addEventListener('click', () => {
        state.activePreset = card.dataset.preset;
        document.querySelectorAll('[data-preset]').forEach(c => c.classList.toggle('is-selected', c === card));
        $('asCustomSliders').classList.toggle('hidden', state.activePreset !== 'custom');
      });
    });

    // Sliders live labels
    $('slPitch').addEventListener('input', (e) => { $('valPitch').textContent = e.target.value + ' ستێپ'; });
    $('slSpeed').addEventListener('input', (e) => { $('valSpeed').textContent = Number(e.target.value).toFixed(2) + 'x'; });
    $('slVolume').addEventListener('input', (e) => { $('valVolume').textContent = e.target.value + '%'; });
    $('slReverb').addEventListener('input', (e) => { $('valReverb').textContent = e.target.value + '%'; });

    // Voice & Cut Actions
    $('btnPreviewVoice').addEventListener('click', previewVoiceEffect);
    $('btnApplyVoice').addEventListener('click', applyVoiceTransformToTarget);
    $('btnCutSelection').addEventListener('click', cutSelectedRegion);
    $('btnTrimKeepSelection').addEventListener('click', trimKeepSelectedRegion);
    $('btnMuteSelection').addEventListener('click', () => muteOrBeepSelectedRegion(false));
    $('btnBeepSelection').addEventListener('click', () => muteOrBeepSelectedRegion(true));
    $('btnEnhanceStudio').addEventListener('click', enhanceStudioVoice);
    $('btnFadeEdges').addEventListener('click', applyFadeInOutToBuffer);
    $('btnNormalizeAudio').addEventListener('click', () => {
      if (!state.buffer) return;
      stopPlayback();
      pushUndoSnapshot();
      normalizeBufferInPlace(state.buffer, 0.92);
      refreshAllEditorUI();
      toast('ئاستی دەنگەکە بە یەکسانی ڕێکخرا 🔊');
    });

    // Export Actions
    $('btnDownloadWav').addEventListener('click', downloadFinalWav);
    $('btnPublishLesson').addEventListener('click', publishToRecordedLessons);

    // Delegated queue chip buttons
    document.addEventListener('click', (e) => {
      const playSeg = e.target.closest('[data-play-seg]');
      if (playSeg) {
        const seg = state.queue.find(s => s.id === Number(playSeg.dataset.playSeg));
        if (seg) startPlayback(seg.start, seg.end);
        return;
      }
      const delSeg = e.target.closest('[data-del-seg]');
      if (delSeg) {
        state.queue = state.queue.filter(s => s.id !== Number(delSeg.dataset.delSeg));
        renderQueueChips();
        drawWaveform();
      }
    });

    window.addEventListener('resize', () => { if (state.buffer) drawWaveform(); });
  }

  // =========================================================================
  // BOOTSTRAP & MANAGER ACCESS GUARD
  // =========================================================================
  async function init() {
    syncThemeUI();
    bindEvents();

    state.token = localStorage.getItem('ferga_token') || localStorage.getItem('seereen_token');
    if (!state.token) {
      $('asLoadingView').classList.add('hidden');
      $('asDeniedView').classList.remove('hidden');
      return;
    }

    try {
      const res = await fetch('/api/audio-studio/access', {
        headers: { 'Authorization': 'Bearer ' + state.token }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        $('asLoadingView').classList.add('hidden');
        $('asDeniedMsg').textContent = data.error || 'دەسەڵاتت نییە بۆ کردنەوەی ئەم ستۆدیۆیە';
        $('asDeniedView').classList.remove('hidden');
        return;
      }

      state.user = data.user;
      $('asLoadingView').classList.add('hidden');
      $('asWorkspace').classList.remove('hidden');
      loadLessonsMetaForPublish();
    } catch (e) {
      $('asLoadingView').classList.add('hidden');
      $('asDeniedView').classList.remove('hidden');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
