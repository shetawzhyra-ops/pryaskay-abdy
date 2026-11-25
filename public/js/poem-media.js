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

  window.renderPoemMediaHtml = function renderPoemMediaHtml(poem, options) {
    if (!poem) return '';
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
      parts.push(`
        <div class="${marginClass} p-3 rounded-2xl bg-[#fbf7f0]/95 border border-[#9c784e]/30 shadow-inner space-y-1.5">
          <div class="flex items-center justify-between text-[11px] font-bold text-[#78350f]">
            <span class="flex items-center gap-1.5"><i class="fa-solid fa-microphone-lines text-[#b45309]"></i> تۆماری دەنگی / خوێندنەوەی شیعر</span>
          </div>
          <audio src="${esc(poem.audio_url)}" controls preload="metadata" class="w-full h-10"></audio>
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
