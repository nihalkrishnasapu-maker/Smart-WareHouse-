import type { Priority, OrderStatus, StockHealth, Severity, ExceptionCategory, AllocationStatus } from '@/types';

export function classNames(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return 'overdue';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

export function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

// ─── Badge color maps ──────────────────────────────────────────────
export const priorityStyles: Record<Priority, string> = {
  critical: 'bg-error-100 text-error-700 border-error-200',
  urgent: 'bg-warning-100 text-warning-700 border-warning-200',
  high: 'bg-primary-100 text-primary-700 border-primary-200',
  normal: 'bg-ink-100 text-ink-600 border-ink-200',
  low: 'bg-ink-50 text-ink-500 border-ink-200',
};

export const priorityDot: Record<Priority, string> = {
  critical: 'bg-error-500', urgent: 'bg-warning-500', high: 'bg-primary-500', normal: 'bg-ink-400', low: 'bg-ink-300',
};

export const orderStatusStyles: Record<OrderStatus, string> = {
  new: 'bg-ink-100 text-ink-600',
  awaiting_allocation: 'bg-secondary-100 text-secondary-700',
  allocated: 'bg-primary-100 text-primary-700',
  picking: 'bg-primary-200 text-primary-800',
  packing: 'bg-accent-100 text-accent-700',
  quality_check: 'bg-warning-100 text-warning-700',
  ready_to_dispatch: 'bg-accent-200 text-accent-800',
  dispatched: 'bg-success-100 text-success-700',
  exception: 'bg-error-100 text-error-700',
  completed: 'bg-ink-200 text-ink-700',
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  new: 'New', awaiting_allocation: 'Awaiting Allocation', allocated: 'Allocated', picking: 'Picking',
  packing: 'Packing', quality_check: 'Quality Check', ready_to_dispatch: 'Ready to Dispatch',
  dispatched: 'Dispatched', exception: 'Exception', completed: 'Completed',
};

export const stockHealthStyles: Record<StockHealth, string> = {
  healthy: 'bg-success-100 text-success-700',
  low_stock: 'bg-warning-100 text-warning-700',
  critical: 'bg-error-100 text-error-700',
  out_of_stock: 'bg-error-200 text-error-800',
  overstocked: 'bg-secondary-100 text-secondary-700',
};

export const stockHealthLabels: Record<StockHealth, string> = {
  healthy: 'Healthy', low_stock: 'Low Stock', critical: 'Critical', out_of_stock: 'Out of Stock', overstocked: 'Overstocked',
};

export const severityStyles: Record<Severity, string> = {
  critical: 'bg-error-100 text-error-700 border-error-200',
  high: 'bg-warning-100 text-warning-700 border-warning-200',
  medium: 'bg-primary-100 text-primary-700 border-primary-200',
  low: 'bg-ink-100 text-ink-600 border-ink-200',
};

export const severityDot: Record<Severity, string> = {
  critical: 'bg-error-500', high: 'bg-warning-500', medium: 'bg-primary-500', low: 'bg-ink-400',
};

export const exceptionCategoryLabels: Record<ExceptionCategory, string> = {
  missing_item: 'Missing Item', damaged_item: 'Damaged Item', stock_mismatch: 'Stock Mismatch',
  wrong_sku: 'Wrong SKU', picking_delay: 'Picking Delay', packing_issue: 'Packing Issue',
  inventory_conflict: 'Inventory Conflict', dispatch_delay: 'Dispatch Delay',
};

export const allocationStatusStyles: Record<AllocationStatus, string> = {
  full: 'bg-success-100 text-success-700', partial: 'bg-warning-100 text-warning-700',
  none: 'bg-error-100 text-error-700', waiting: 'bg-ink-100 text-ink-600',
};

export const allocationStatusLabels: Record<AllocationStatus, string> = {
  full: 'Fully Allocated', partial: 'Partial', none: 'Unallocated', waiting: 'Waiting for Stock',
};
