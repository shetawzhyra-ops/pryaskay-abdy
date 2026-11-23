/**
 * PWA & Android App Installation Controller for پریاسکەی عەبدی
 */

(() => {
  'use strict';

  let deferredInstallPrompt = null;
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isSecure = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  // 1. Register Service Worker (only on secure contexts)
  if (isSecure && 'serviceWorker' in navigator) {
    const registerSW = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration failed:', err);
      });
    };
    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }
  }

  // 2. Capture native beforeinstallprompt (fires automatically on HTTPS)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    window.__pryaskaInstallPrompt = e;

    showInstallPromptUI();
    const btnText = document.getElementById('androidInstallBtnText');
    if (btnText) btnText.textContent = 'داگرتن و دانان';
  });

  // 3. Listen for app installed
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    window.__pryaskaInstallPrompt = null;
    hideInstallPromptUI();
    try {
      sessionStorage.setItem('pryaska_pwa_installed', 'true');
    } catch (e) {}
  });

  // 4. Function to trigger 1-click install
  window.installPryaskaApp = async function() {
    const promptEvt = deferredInstallPrompt || window.__pryaskaInstallPrompt;
    if (promptEvt) {
      try {
        await promptEvt.prompt();
        const choice = await promptEvt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          hideInstallPromptUI();
        }
        deferredInstallPrompt = null;
        window.__pryaskaInstallPrompt = null;
      } catch (err) {
        showManualInstallModal();
      }
    } else {
      showManualInstallModal();
    }
  };

  // 5. Build and inject Install Banner & Modal
  function createInstallUI() {
    if (document.getElementById('androidInstallBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'androidInstallBanner';
    banner.className = 'hidden fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-[9999] transition-all duration-500 transform translate-y-8 opacity-0';
    banner.innerHTML = `
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2c382a] via-[#364433] to-[#252f23] text-white p-3.5 sm:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.55)] border border-[#7e9975]/40 flex items-center justify-between gap-3 backdrop-blur-xl">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 p-0.5 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
            <img src="/images/icon-192.png?v=5" alt="پریاسکەی عەبدی" class="w-full h-full object-cover rounded-[10px]" onerror="this.src='/images/logo.png'">
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <h4 style="color: #fde68a !important;" class="font-black text-xs sm:text-sm truncate">داگرتنی ئەپی پریاسکە</h4>
              <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-bold">مۆبایل</span>
            </div>
            <p style="color: #e2e8f0 !important;" class="text-[11px] truncate mt-0.5">بە یەک کرتە لەسەر مۆبایلەکەت دایبەزێنە</p>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button 
            type="button" 
            onclick="installPryaskaApp()" 
            class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <i class="fa-solid fa-download text-[12px]"></i>
            <span id="androidInstallBtnText">${deferredInstallPrompt ? 'داگرتن و دانان' : 'داگرتنی ئەپ'}</span>
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

    const stepsHtml = isIOS ? `
          <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; border-radius: 14px; background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(160, 120, 75, 0.22); box-shadow: 0 2px 6px rgba(60, 40, 20, 0.05);">
            <span style="width: 24px; height: 24px; border-radius: 50%; background: #d97706; color: #ffffff !important; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; margin-top: 1px;">١</span>
            <p style="color: #3b2314 !important; font-size: 12.5px; font-weight: 600; line-height: 1.6; margin: 0;">
              لە خوارەوەی براوسەری Safari پەنجە بنێ بە دوگمەی <strong style="color: #92400e !important; font-weight: 900;">Share</strong> (<i class="fa-solid fa-arrow-up-from-bracket" style="color: #b45309;"></i>).
            </p>
          </div>
          <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; border-radius: 14px; background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(160, 120, 75, 0.22); box-shadow: 0 2px 6px rgba(60, 40, 20, 0.05);">
            <span style="width: 24px; height: 24px; border-radius: 50%; background: #d97706; color: #ffffff !important; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; margin-top: 1px;">٢</span>
            <p style="color: #3b2314 !important; font-size: 12.5px; font-weight: 600; line-height: 1.6; margin: 0;">
              بۆ خوارەوە بچۆ و <strong style="color: #047857 !important; font-weight: 900;">Add to Home Screen</strong> هەڵبژێرە، پاشان <strong style="color: #047857 !important; font-weight: 900;">Add</strong>.
            </p>
          </div>
    ` : `
          <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; border-radius: 14px; background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(160, 120, 75, 0.22); box-shadow: 0 2px 6px rgba(60, 40, 20, 0.05);">
            <span style="width: 24px; height: 24px; border-radius: 50%; background: #d97706; color: #ffffff !important; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; margin-top: 1px;">١</span>
            <p style="color: #3b2314 !important; font-size: 12.5px; font-weight: 600; line-height: 1.6; margin: 0;">
              لە بەشی سەرەوەی براوسەرەکە (Chrome) پەنجە بنێ بە <strong style="color: #92400e !important; font-weight: 900;">سێ خاڵەکە</strong> (<span style="color: #b45309; font-weight: 900; font-size: 16px;">⋮</span> لە گۆشەی شاشەکە).
            </p>
          </div>

          <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; border-radius: 14px; background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(160, 120, 75, 0.22); box-shadow: 0 2px 6px rgba(60, 40, 20, 0.05);">
            <span style="width: 24px; height: 24px; border-radius: 50%; background: #d97706; color: #ffffff !important; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; margin-top: 1px;">٢</span>
            <div style="color: #3b2314 !important; font-size: 12.5px; font-weight: 600; line-height: 1.6; margin: 0;">
              لە لیستەکەدا پەنجە بنێ بە:
              <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; background: rgba(5, 150, 105, 0.12); color: #047857 !important; font-weight: 800;">• Install app / Add to Home screen</span>
                <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; background: rgba(5, 150, 105, 0.08); color: #047857 !important; font-weight: 700;">• یان: زیادکردن بۆ سەر شاشەی سەرەکی</span>
                <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; background: rgba(5, 150, 105, 0.08); color: #047857 !important; font-weight: 700;">• یان: إضافة إلى الشاشة الرئيسية</span>
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; border-radius: 14px; background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(160, 120, 75, 0.22); box-shadow: 0 2px 6px rgba(60, 40, 20, 0.05);">
            <span style="width: 24px; height: 24px; border-radius: 50%; background: #d97706; color: #ffffff !important; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; margin-top: 1px;">٣</span>
            <p style="color: #3b2314 !important; font-size: 12.5px; font-weight: 600; line-height: 1.6; margin: 0;">
              پەنجە بە <strong style="color: #047857 !important; font-weight: 900;">«Install / Add / زیادکردن»</strong> بنێ؛ ئایکۆنی ئەپەکە دێتە سەر شاشەی مۆبایلەکەت.
            </p>
          </div>
    `;

    // Create Manual Instructions Modal (fallback when browser suppresses native prompt)
    const modal = document.createElement('div');
    modal.id = 'manualInstallModal';
    modal.className = 'hidden fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm';
    modal.innerHTML = `
      <div style="width: 100%; max-width: 400px; border-radius: 24px; background: linear-gradient(165deg, #fdfbf7 0%, #f4ede1 100%); border: 1.5px solid rgba(160, 120, 75, 0.35); padding: 22px 18px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45); position: relative; direction: rtl; text-align: right;">
        <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 1px solid rgba(160,120,75,0.2); margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); display: flex; align-items: center; justify-content: center; color: #059669; flex-shrink: 0;">
              <i class="fa-solid fa-mobile-screen text-xl"></i>
            </div>
            <div>
              <h3 style="color: #2b1708 !important; font-size: 15px; font-weight: 900; margin: 0;">دانانی ئەپ لەسەر شاشەی مۆبایل</h3>
              <p style="color: #78350f !important; font-size: 11px; font-weight: 600; margin-top: 2px;">بە چەند چرکەیەک ئایکۆنی ئەپەکە بخەرە سەر شاشە</p>
            </div>
          </div>
          <button type="button" onclick="closeManualInstallModal()" style="width: 32px; height: 32px; border-radius: 8px; background: rgba(160,120,75,0.12); border: none; color: #54371f; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <i class="fa-solid fa-xmark" style="font-size: 14px;"></i>
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
          ${stepsHtml}
        </div>

        <button type="button" onclick="closeManualInstallModal()" style="width: 100%; padding: 12px; border-radius: 14px; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: #ffffff !important; font-weight: 800; font-size: 13.5px; border: none; cursor: pointer; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35);">
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

  // Automatically show download banner whenever a mobile visitor opens the site
  window.addEventListener('DOMContentLoaded', () => {
    if (!isStandalone && (isAndroid || isMobile)) {
      setTimeout(() => {
        showInstallPromptUI();
      }, 800);
    }
  });

})();
