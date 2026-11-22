/**
 * PWA & Android App Installation Controller for پریاسکەی عەبدی
 */

(() => {
  'use strict';

  let deferredInstallPrompt = null;
  const isAndroid = /Android/i.test(navigator.userAgent || '');
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        // Registered successfully
      }).catch((err) => {
        console.warn('SW registration failed:', err);
      });
    });
  }

  // 2. Capture native beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default mini-infobar
    e.preventDefault();
    deferredInstallPrompt = e;
    
    // Show install banner/buttons if not dismissed
    showInstallPromptUI();
  });

  // 3. Listen for app installed
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    hideInstallPromptUI();
    try {
      sessionStorage.setItem('pryaska_pwa_installed', 'true');
    } catch (e) {}
  });

  // 4. Function to trigger install
  window.installPryaskaApp = async function() {
    if (deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          hideInstallPromptUI();
        }
        deferredInstallPrompt = null;
      } catch (err) {
        showManualInstallModal();
      }
    } else {
      // If native prompt is unavailable, show step-by-step instruction modal
      showManualInstallModal();
    }
  };

  // 5. Build and inject Install Banner & Modal
  function createInstallUI() {
    if (document.getElementById('androidInstallBanner')) return;

    // Create Android Install Banner
    const banner = document.createElement('div');
    banner.id = 'androidInstallBanner';
    banner.className = 'hidden fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-[9999] transition-all duration-500 transform translate-y-8 opacity-0';
    banner.innerHTML = `
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2c382a] via-[#364433] to-[#252f23] text-white p-3.5 sm:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.55)] border border-[#7e9975]/40 flex items-center justify-between gap-3 backdrop-blur-xl">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 p-0.5 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
            <img src="/images/icon-192.png" alt="پریاسکەی عەبدی" class="w-full h-full object-cover rounded-[10px]" onerror="this.src='/images/logo.png'">
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <h4 class="font-black text-xs sm:text-sm text-amber-200 truncate">داگرتنی ئەپی پریاسکە</h4>
              <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-bold">ئەندرۆید</span>
            </div>
            <p class="text-[11px] text-slate-300 truncate mt-0.5">بە یەک کرتە وەک ئەپ دایبەزێنە سەر مۆبایلەکەت</p>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button 
            type="button" 
            onclick="installPryaskaApp()" 
            class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <i class="fa-solid fa-download text-[11px]"></i>
            <span>داگرتن</span>
          </button>
          <button 
            type="button" 
            onclick="dismissInstallBanner()" 
            class="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
            title="داخستن"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    // Create Manual Instructions Modal
    const modal = document.createElement('div');
    modal.id = 'manualInstallModal';
    modal.className = 'hidden fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm';
    modal.innerHTML = `
      <div class="w-full max-w-sm rounded-3xl bg-[#2a3528] border border-[#7e9975]/40 text-white p-5 shadow-2xl relative overflow-hidden space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <i class="fa-brands fa-android text-lg"></i>
            </div>
            <div>
              <h3 class="font-black text-sm text-white">دابەزاندنی ئەپ بۆ مۆبایل</h3>
              <p class="text-[10px] text-emerald-300/80">ڕێنمایی دانانی ئەپ لەسەر شاشەی سەرەکی</p>
            </div>
          </div>
          <button type="button" onclick="closeManualInstallModal()" class="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer">
            <i class="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        <div class="space-y-2.5 text-xs text-slate-200">
          <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span class="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">١</span>
            <p class="leading-relaxed">
              پەنجە بنێ بە <strong>سێ خاڵەکەی بەشی سەرەوەی براوسەر</strong> (<span class="font-bold text-amber-300 text-sm">⋮</span> لە گۆشەی شاشەکە).
            </p>
          </div>

          <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span class="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">٢</span>
            <p class="leading-relaxed">
              لە لیستەکەدا هەڵبژاردنی <strong>«Install app»</strong> یان <strong>«Add to Home screen»</strong> (دانان لەسەر شاشە) دیاریبکە.
            </p>
          </div>

          <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span class="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">٣</span>
            <p class="leading-relaxed">
              پەنجە بە <strong>«Install»</strong> یان <strong>«زیادکردن»</strong> بنێ. ئایکۆنی ئەپەکە دێتە سەر شاشەی سەرەکیی مۆبایلەکەت.
            </p>
          </div>
        </div>

        <button type="button" onclick="closeManualInstallModal()" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer">
          تێگەیشتم
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function showInstallPromptUI() {
    if (isStandalone) return;
    try {
      if (sessionStorage.getItem('pryaska_pwa_dismissed') === 'true') return;
      if (sessionStorage.getItem('pryaska_pwa_installed') === 'true') return;
    } catch (e) {}

    createInstallUI();
    const banner = document.getElementById('androidInstallBanner');
    if (banner) {
      banner.classList.remove('hidden');
      setTimeout(() => {
        banner.classList.remove('translate-y-8', 'opacity-0');
        banner.classList.add('translate-y-0', 'opacity-100');
      }, 50);
    }
  }

  function hideInstallPromptUI() {
    const banner = document.getElementById('androidInstallBanner');
    if (banner) {
      banner.classList.add('translate-y-8', 'opacity-0');
      setTimeout(() => {
        banner.classList.add('hidden');
      }, 500);
    }
  }

  window.dismissInstallBanner = function() {
    hideInstallPromptUI();
    try {
      sessionStorage.setItem('pryaska_pwa_dismissed', 'true');
    } catch (e) {}
  };

  function showManualInstallModal() {
    createInstallUI();
    const modal = document.getElementById('manualInstallModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  window.closeManualInstallModal = function() {
    const modal = document.getElementById('manualInstallModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  };

  // If user is on Android or mobile, show the prompt after a short delay (1.5 seconds)
  window.addEventListener('DOMContentLoaded', () => {
    if (!isStandalone) {
      // Auto-show banner if on Android or Mobile device
      if (isAndroid || isMobile) {
        setTimeout(() => {
          showInstallPromptUI();
        }, 1500);
      }
    }
  });

})();
