import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { classNames } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export function Card({ children, className, hover }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={classNames('card', hover && 'card-hover', className)}>{children}</div>;
}

export function Badge({ children, className, dot }: { children: ReactNode; className?: string; dot?: string }) {
  return (
    <span className={classNames('chip border', className)}>
      {dot && <span className={classNames('w-1.5 h-1.5 rounded-full', dot)} />}
      {children}
    </span>
  );
}

export function ProgressBar({ value, max = 100, className, barClassName, animated = true }: { value: number; max?: number; className?: string; barClassName?: string; animated?: boolean }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={classNames('h-2 w-full rounded-full bg-ink-100 overflow-hidden relative', className)}>
      <div
        className={classNames('h-full rounded-full transition-all duration-700 relative overflow-hidden', barClassName || 'bg-primary-500')}
        style={{ width: `${pct}%` }}
      >
        {animated && pct > 0 && (
          <div className="absolute inset-0 shimmer opacity-60" />
        )}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setExiting(false);
    } else if (visible) {
      setExiting(true);
      const t = setTimeout(() => { setVisible(false); setExiting(false); }, 200);
      return () => clearTimeout(t);
    }
  }, [open, visible]);

  if (!visible) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={classNames('absolute inset-0 bg-ink-950/40 backdrop-blur-sm', exiting ? 'animate-pop-out' : 'animate-backdrop-in')}
        onClick={onClose}
      />
      <div className={classNames(
        'relative w-full bg-white dark:bg-ink-900 rounded-2xl shadow-panel max-h-[90vh] flex flex-col',
        sizes[size],
        exiting ? 'animate-pop-out' : 'animate-pop-in'
      )}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200 dark:border-ink-800">
            <h3 className="text-base font-semibold text-ink-800">{title}</h3>
            <button onClick={onClose} className="btn-ghost p-1.5 -mr-1 transition-transform hover:rotate-90 duration-200">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, width = 'max-w-2xl' }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; width?: string }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setExiting(false);
    } else if (visible) {
      setExiting(true);
      const t = setTimeout(() => { setVisible(false); setExiting(false); }, 300);
      return () => clearTimeout(t);
    }
  }, [open, visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className={classNames('absolute inset-0 bg-ink-950/40 backdrop-blur-sm', exiting ? 'animate-pop-out' : 'animate-backdrop-in')}
        onClick={onClose}
      />
      <div className={classNames(
        'relative h-full w-full bg-white dark:bg-ink-900 shadow-panel flex flex-col',
        width,
        exiting ? 'animate-slide-in-right' : 'animate-drawer-in'
      )}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200 dark:border-ink-800 shrink-0">
          <h3 className="text-base font-semibold text-ink-800">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5 -mr-1 transition-transform hover:rotate-90 duration-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, message }: { icon?: ReactNode; title: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-ink-300 mb-3 animate-float">{icon}</div>}
      <p className="text-sm font-medium text-ink-600">{title}</p>
      {message && <p className="text-xs text-ink-400 mt-1">{message}</p>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-ink-700 uppercase tracking-wide">{children}</h2>
      {action}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className="text-lg font-semibold text-ink-800 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export function Avatar({ name, color, size = 32 }: { name: string; color: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('');
  return (
    <div className="rounded-full flex items-center justify-center text-white font-semibold shrink-0 transition-transform hover:scale-110" style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

export function AnimatedCounter({ value, duration = 800, suffix = '', prefix = '' }: { value: number; duration?: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const start = prevValueRef.current;
    const end = value;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = end;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  const decimals = Number.isInteger(value) ? 0 : 1;
  return <>{prefix}{display.toFixed(decimals)}{suffix}</>;
}

// ─── Toast Notification System ────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastInternal extends Toast {
  exiting: boolean;
}

const toastConfig: Record<ToastType, { icon: typeof CheckCircle2; bg: string; border: string; iconColor: string; titleColor: string }> = {
  success: { icon: CheckCircle2, bg: 'bg-success-50 dark:bg-success-950/40', border: 'border-success-200 dark:border-success-800', iconColor: 'text-success-500', titleColor: 'text-success-700 dark:text-success-400' },
  error: { icon: AlertCircle, bg: 'bg-error-50 dark:bg-error-950/40', border: 'border-error-200 dark:border-error-800', iconColor: 'text-error-500', titleColor: 'text-error-700 dark:text-error-400' },
  warning: { icon: AlertTriangle, bg: 'bg-warning-50 dark:bg-warning-950/40', border: 'border-warning-200 dark:border-warning-800', iconColor: 'text-warning-500', titleColor: 'text-warning-700 dark:text-warning-400' },
  info: { icon: Info, bg: 'bg-primary-50 dark:bg-primary-950/40', border: 'border-primary-200 dark:border-primary-800', iconColor: 'text-primary-500', titleColor: 'text-primary-700 dark:text-primary-400' },
};

export function ToastContainer({ toasts, onDismiss }: { toasts: (Toast & { exiting?: boolean })[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map(toast => {
        const cfg = toastConfig[toast.type];
        const Icon = cfg.icon;
        return (
          <div
            key={toast.id}
            className={classNames(
              'pointer-events-auto rounded-xl border shadow-panel p-3.5 flex items-start gap-3',
              cfg.bg, cfg.border,
              toast.exiting ? 'animate-toast-out' : 'animate-toast-in'
            )}
          >
            <div className={classNames('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/60 dark:bg-ink-800/60')}>
              <Icon className={classNames('w-4 h-4', cfg.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={classNames('text-sm font-semibold', cfg.titleColor)}>{toast.title}</p>
              {toast.message && <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{toast.message}</p>}
            </div>
            <button onClick={() => onDismiss(toast.id)} className="text-ink-400 hover:text-ink-600 transition-colors shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  const show = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev, { id, type, title, message, duration, exiting: false }]);
    setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const showSuccess = useCallback((title: string, message?: string) => show('success', title, message), [show]);
  const showError = useCallback((title: string, message?: string) => show('error', title, message, 5000), [show]);
  const showWarning = useCallback((title: string, message?: string) => show('warning', title, message), [show]);
  const showInfo = useCallback((title: string, message?: string) => show('info', title, message), [show]);

  return { toasts, dismiss, show, showSuccess, showError, showWarning, showInfo };
}
