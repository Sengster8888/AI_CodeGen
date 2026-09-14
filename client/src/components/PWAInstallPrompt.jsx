import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, Monitor, Info } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showDesktopInfoModal, setShowDesktopInfoModal] = useState(false);

  useEffect(() => {
    // Check if app is already running as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (isStandalone) {
      return; // Already running inside installed app window
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Show prompt if not dismissed
    const dismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (!dismissed) {
      setShowPrompt(true);
    }

    // Listen for Chrome/Android/Desktop install prompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // If browser hasn't emitted beforeinstallprompt yet or in dev mode
      setShowDesktopInfoModal(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Floating Bottom Bar Prompt */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-[#1e293b]/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-purple-500/30 flex items-center justify-between gap-3 transition-all duration-300 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
            {isIOS ? <Smartphone className="w-5 h-5 text-white" /> : <Monitor className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-100">Install AI CodeGen App</h4>
            <p className="text-xs text-slate-400">Faster access & offline support</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Install App
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop Helper Modal */}
      {showDesktopInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700/60 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-lg">Install AI CodeGen Desktop App</h3>
              </div>
              <button
                onClick={() => setShowDesktopInfoModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-300">
              To install <strong>AI CodeGen</strong> directly to your desktop:
            </p>

            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/40">
                <span className="font-bold text-purple-400">1.</span>
                <span>Click the <strong>Install / App icon <Download className="w-3.5 h-3.5 inline text-purple-400" /></strong> at the right end of your browser's address bar.</span>
              </li>
              <li className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/40">
                <span className="font-bold text-purple-400">2.</span>
                <span>Or open your browser menu (⋮ / ⋯) → Select <strong>Save and share</strong> / <strong>Apps</strong> → <strong>Install AI CodeGen</strong>.</span>
              </li>
            </ul>

            <button
              onClick={() => setShowDesktopInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors cursor-pointer mt-2"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* iOS Install Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700/60 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-lg">Install on iOS</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-300">
              Install <strong>AI CodeGen</strong> on your iPhone or iPad for quick access:
            </p>

            <ol className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/40">
                <span className="font-bold text-purple-400">1.</span>
                <span>Tap the <Share className="w-4 h-4 inline text-blue-400 mx-1" /> <strong>Share</strong> button in Safari toolbar.</span>
              </li>
              <li className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/40">
                <span className="font-bold text-purple-400">2.</span>
                <span>Scroll down and select <PlusSquare className="w-4 h-4 inline text-slate-300 mx-1" /> <strong>Add to Home Screen</strong>.</span>
              </li>
              <li className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/40">
                <span className="font-bold text-purple-400">3.</span>
                <span>Tap <strong>Add</strong> in top right corner.</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors cursor-pointer mt-2"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
