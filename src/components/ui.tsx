import type { ReactNode } from 'react';
import { classNames } from '@/lib/utils';

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

export function ProgressBar({ value, max = 100, className, barClassName }: { value: number; max?: number; className?: string; barClassName?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={classNames('h-2 w-full rounded-full bg-ink-100 overflow-hidden', className)}>
      <div className={classNames('h-full rounded-full transition-all duration-500', barClassName || 'bg-primary-500')} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className={classNames('relative w-full bg-white rounded-2xl shadow-panel animate-scale-in max-h-[90vh] flex flex-col', sizes[size])}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
            <h3 className="text-base font-semibold text-ink-800">{title}</h3>
            <button onClick={onClose} className="btn-ghost p-1.5 -mr-1">
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
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className={classNames('relative h-full w-full bg-white shadow-panel animate-slide-in-right flex flex-col', width)}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200 shrink-0">
          <h3 className="text-base font-semibold text-ink-800">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5 -mr-1">
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
      {icon && <div className="text-ink-300 mb-3">{icon}</div>}
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
    <div className="rounded-full flex items-center justify-center text-white font-semibold shrink-0" style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}
