import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
}

const ToastContext = createContext<{ push: (t: Omit<ToastItem, 'id'>) => void } | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const item: ToastItem = { id, ...t };
    setToasts((s) => [item, ...s]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`max-w-sm w-full rounded-lg p-3 shadow-md ring-1 ring-black/20 bg-surface-elevated/80 backdrop-blur-sm text-sm ${
              t.kind === 'success' ? 'border border-green-400/20' : t.kind === 'error' ? 'border border-rose-400/20' : 'border border-slate-500/10'
            }`}
          >
            <div className="font-semibold text-slate-100">{t.title}</div>
            {t.description && <div className="text-slate-300 text-xs mt-1">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
