import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none no-print">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold max-w-sm animate-in slide-in-from-bottom-3 duration-200 ${
            t.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-800'
              : t.type === 'error'
              ? 'bg-rose-900 text-white border-rose-800'
              : 'bg-stone-900 text-white border-stone-800'
          }`}
        >
          {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {t.type === 'info' && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-white/60 hover:text-white p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
