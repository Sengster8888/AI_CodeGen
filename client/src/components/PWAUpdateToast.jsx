import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function PWAUpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-[90%] bg-[#1e293b]/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center justify-between gap-3 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0">
          <RefreshCw className="w-5 h-5 animate-spin-slow" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-slate-100">Update Available</h4>
          <p className="text-xs text-slate-400">A new version of AI CodeGen is ready.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md transition-all cursor-pointer active:scale-95"
        >
          Reload
        </button>
        <button
          onClick={close}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
