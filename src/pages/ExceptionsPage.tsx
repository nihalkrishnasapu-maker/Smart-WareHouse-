import { useState, useMemo } from 'react';
import { AlertTriangle, Check, ArrowUp, RotateCw, User } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Badge, Avatar, EmptyState } from '@/components/ui';
import { classNames, severityStyles, severityDot, exceptionCategoryLabels, timeAgo, formatDateTime } from '@/lib/utils';
import { employees } from '@/data/mockData';
import type { ExceptionCategory, ExceptionStatus } from '@/types';

const statusStyles: Record<ExceptionStatus, string> = {
  open: 'bg-error-100 text-error-700',
  in_progress: 'bg-warning-100 text-warning-700',
  resolved: 'bg-success-100 text-success-700',
  escalated: 'bg-secondary-100 text-secondary-700',
};

const statusLabels: Record<ExceptionStatus, string> = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', escalated: 'Escalated',
};

export function ExceptionsPage() {
  const { exceptions, resolveException } = useStore();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return exceptions.filter(e => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      return true;
    }).sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2, low: 3 };
      return sev[a.severity] - sev[b.severity];
    });
  }, [exceptions, categoryFilter, statusFilter]);

  const selected = exceptions.find(e => e.id === selectedId);
  const openCount = exceptions.filter(e => e.status === 'open' || e.status === 'escalated').length;
  const resolvedCount = exceptions.filter(e => e.status === 'resolved').length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink-800">Exceptions Center</h1>
        <p className="text-sm text-ink-500 mt-0.5">{openCount} open · {resolvedCount} resolved · {exceptions.length} total</p>
      </div>

      {/* Category summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {(Object.keys(exceptionCategoryLabels) as ExceptionCategory[]).map(cat => {
          const count = exceptions.filter(e => e.category === cat).length;
          const open = exceptions.filter(e => e.category === cat && (e.status === 'open' || e.status === 'escalated')).length;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
              className={classNames('p-2.5 rounded-lg border text-center transition-all', categoryFilter === cat ? 'border-primary-300 bg-primary-50 ring-2 ring-primary-100' : 'border-ink-200 hover:bg-ink-50')}
            >
              <p className="text-[10px] font-medium text-ink-500 truncate">{exceptionCategoryLabels[cat]}</p>
              <p className="text-lg font-bold text-ink-800">{count}</p>
              {open > 0 && <p className="text-[9px] text-error-500 font-semibold">{open} open</p>}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="select w-auto">
            <option value="all">All Categories</option>
            {(Object.keys(exceptionCategoryLabels) as ExceptionCategory[]).map(c => <option key={c} value={c}>{exceptionCategoryLabels[c]}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select w-auto">
            <option value="all">All Statuses</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Exception list */}
        <div className="lg:col-span-2 space-y-2">
          {filtered.map(ex => {
            const assignee = ex.assignedTo ? employees.find(e => e.id === ex.assignedTo) : null;
            return (
              <Card key={ex.id} hover className="p-4 cursor-pointer" >
                <button onClick={() => setSelectedId(ex.id)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={severityStyles[ex.severity]} dot={severityDot[ex.severity]}>{ex.severity.toUpperCase()}</Badge>
                      <span className="text-xs font-semibold text-ink-600 uppercase tracking-wide">{exceptionCategoryLabels[ex.category]}</span>
                    </div>
                    <span className={classNames('chip', statusStyles[ex.status])}>{statusLabels[ex.status]}</span>
                  </div>
                  <p className="text-sm text-ink-700 mb-1.5">{ex.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-ink-400">
                    {ex.orderId && <span>Order: {ex.orderId}</span>}
                    {ex.sku && <span>SKU: {ex.sku}</span>}
                    <span>Detected: {timeAgo(ex.detectedAt)}</span>
                    {assignee && (
                      <span className="flex items-center gap-1">
                        <Avatar name={assignee.name} color={assignee.avatarColor} size={16} />
                        {assignee.name.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </button>
              </Card>
            );
          })}
          {filtered.length === 0 && <Card className="p-8"><EmptyState icon={<AlertTriangle className="w-8 h-8" />} title="No exceptions found" message="All clear in this category" /></Card>}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-1">
          {selected ? (
            <Card className="p-4 sticky top-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={severityStyles[selected.severity]} dot={severityDot[selected.severity]}>{selected.severity.toUpperCase()}</Badge>
                <span className="text-xs font-semibold text-ink-600 uppercase tracking-wide">{exceptionCategoryLabels[selected.category]}</span>
              </div>
              <p className="text-sm text-ink-700 mb-3">{selected.description}</p>

              <div className="space-y-2 mb-4">
                {selected.orderId && <div className="flex justify-between text-xs"><span className="text-ink-400">Order</span><span className="font-semibold text-ink-700">{selected.orderId}</span></div>}
                {selected.sku && <div className="flex justify-between text-xs"><span className="text-ink-400">SKU</span><span className="font-semibold text-primary-600">{selected.sku}</span></div>}
                <div className="flex justify-between text-xs"><span className="text-ink-400">Detected</span><span className="text-ink-600">{formatDateTime(selected.detectedAt)}</span></div>
                <div className="flex justify-between text-xs items-center">
                  <span className="text-ink-400">Assigned</span>
                  {selected.assignedTo ? (() => { const a = employees.find(e => e.id === selected.assignedTo); return a ? <span className="flex items-center gap-1"><Avatar name={a.name} color={a.avatarColor} size={18} /><span className="text-ink-600">{a.name}</span></span> : <span className="text-ink-400">—</span>; })() : <span className="text-ink-400">Unassigned</span>}
                </div>
                <div className="flex justify-between text-xs"><span className="text-ink-400">Status</span><span className={classNames('chip', statusStyles[selected.status])}>{statusLabels[selected.status]}</span></div>
              </div>

              {/* Recommendation */}
              <div className="rounded-lg bg-primary-50/60 border border-primary-200 p-3 mb-4">
                <p className="text-[10px] font-semibold text-ink-500 uppercase tracking-wide mb-1">Recommended Resolution</p>
                <p className="text-xs text-ink-600">{selected.recommendation}</p>
              </div>

              {/* Resolution history */}
              {selected.resolutionHistory.length > 0 && (
                <div className="mb-4">
                  <p className="label mb-2">Resolution History</p>
                  <div className="space-y-2">
                    {selected.resolutionHistory.map((h, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-accent-600" />
                        </div>
                        <div>
                          <p className="font-medium text-ink-700">{h.action}</p>
                          <p className="text-[10px] text-ink-400">{h.note} · {timeAgo(h.at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selected.status !== 'resolved' && (
                <div className="space-y-2">
                  <button onClick={() => resolveException(selected.id, 'Applied recommendation', 'Recommendation applied by manager')} className="btn-primary w-full !text-xs">
                    <Check className="w-3.5 h-3.5" /> Apply Recommendation
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => resolveException(selected.id, 'Reassigned inventory', 'Stock reassigned from alternate zone')} className="btn-secondary !text-xs">
                      <RotateCw className="w-3.5 h-3.5" /> Reassign
                    </button>
                    <button onClick={() => resolveException(selected.id, 'Escalated', 'Escalated to senior management')} className="btn-secondary !text-xs">
                      <ArrowUp className="w-3.5 h-3.5" /> Escalate
                    </button>
                  </div>
                  <button onClick={() => resolveException(selected.id, 'Resolved', 'Issue resolved manually')} className="btn-ghost w-full !text-xs text-accent-700 hover:bg-accent-50">
                    <Check className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <User className="w-8 h-8 text-ink-300 mx-auto mb-2" />
              <p className="text-sm text-ink-500">Select an exception to view details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
