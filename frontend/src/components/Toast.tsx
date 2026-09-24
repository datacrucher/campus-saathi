import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface Toast { id: number; title: string; description?: string; tone: 'success' | 'error' }
type Notify = (title: string, description?: string, tone?: Toast['tone']) => void;

const ToastContext = createContext<Notify>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notify = useCallback<Notify>((title, description, tone = 'success') => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-2), { id, title, description, tone }]);
    window.setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`}>
            <span className="t-icon">{t.tone === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}</span>
            <div>
              <div className="t-title">{t.title}</div>
              {t.description && <div className="t-desc">{t.description}</div>}
            </div>
            <button className="t-close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification"><X size={16} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
