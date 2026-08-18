import { useState, useMemo } from 'react';
import { GitBranch, Zap, ArrowRight, Check, AlertTriangle, TrendingUp, Scale, DollarSign, Clock } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Badge, ProgressBar } from '@/components/ui';
import { classNames, priorityStyles, priorityDot, formatCurrency } from '@/lib/utils';
import { findAllocationConflicts, computeAllocationImpact, reallocateConflict, type AllocationConflict } from '@/lib/decisionEngine';
import type { AllocationStrategy } from '@/types';

const strategies: { id: AllocationStrategy; label: string; icon: typeof Zap; description: string }[] = [
  { id: 'maximize_urgent', label: 'Maximize Urgent', icon: Zap, description: 'Prioritize critical SLA risk and shipping cutoff' },
  { id: 'fair', label: 'Fair Allocation', icon: Scale, description: 'Distribute evenly to minimize partial fulfillment' },
  { id: 'maximize_revenue', label: 'Maximize Revenue', icon: DollarSign, description: 'Prioritize highest-value orders' },
  { id: 'minimize_late', label: 'Minimize Late', icon: Clock, description: 'Prioritize orders closest to SLA deadline' },
];

export function AllocationPage() {
  const { orders, products, allocateOrder } = useStore();
  const [strategy, setStrategy] = useState<AllocationStrategy>('maximize_urgent');
  const [selectedConflictIdx, setSelectedConflictIdx] = useState(0);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  const conflicts = useMemo(() => findAllocationConflicts(orders, products), [orders, products]);
  const activeConflict = conflicts[selectedConflictIdx];
  const adjustedConflict = activeConflict ? reallocateConflict(activeConflict, strategy, products) : null;
  const impact = activeConflict ? computeAllocationImpact(adjustedConflict!, orders) : null;

  if (conflicts.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-ink-800">Allocation Engine</h1>
        <Card className="p-8 text-center">
          <Check className="w-12 h-12 text-success-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink-700">No allocation conflicts detected</p>
          <p className="text-xs text-ink-400 mt-1">All awaiting orders have sufficient inventory</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink-800">Smart Allocation Engine</h1>
        <p className="text-sm text-ink-500 mt-0.5">{conflicts.length} inventory conflicts detected · {orders.filter(o => o.status === 'awaiting_allocation').length} orders awaiting allocation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Conflict list */}
        <Card className="p-3 lg:col-span-1">
          <h2 className="text-sm font-semibold text-ink-700 uppercase tracking-wide mb-3 px-1">Active Conflicts</h2>
          <div className="space-y-2">
            {conflicts.map((c, i) => (
              <button
                key={i}
                onClick={() => { setSelectedConflictIdx(i); setStrategy('maximize_urgent'); }}
                className={classNames(
                  'w-full text-left p-3 rounded-lg border transition-all',
                  i === selectedConflictIdx ? 'border-primary-300 bg-primary-50' : 'border-ink-200 hover:bg-ink-50',
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-primary-600">{c.sku}</span>
                  <Badge className="bg-error-100 text-error-700 border-error-200">{c.available} avail</Badge>
                </div>
                <p className="text-xs text-ink-600 truncate">{c.productName}</p>
                <p className="text-[10px] text-ink-400 mt-0.5">{c.orders.length} orders competing · {c.orders.reduce((s, o) => s + o.requested, 0)} units needed</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Conflict detail */}
        <div className="lg:col-span-2 space-y-4">
          {activeConflict && adjustedConflict && (
            <>
              {/* Conflict summary */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-sm font-bold text-ink-800">Inventory Conflict: {activeConflict.sku}</p>
                    <p className="text-xs text-ink-500">{activeConflict.productName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-ink-50">
                    <p className="text-2xl font-bold text-ink-800">{activeConflict.available}</p>
                    <p className="text-[10px] text-ink-400 uppercase tracking-wide">Available</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-error-50">
                    <p className="text-2xl font-bold text-error-600">{activeConflict.orders.reduce((s, o) => s + o.requested, 0)}</p>
                    <p className="text-[10px] text-error-400 uppercase tracking-wide">Total Demand</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-warning-50">
                    <p className="text-2xl font-bold text-warning-600">{activeConflict.orders.reduce((s, o) => s + o.requested, 0) - activeConflict.available}</p>
                    <p className="text-[10px] text-warning-400 uppercase tracking-wide">Shortfall</p>
                  </div>
                </div>
              </Card>

              {/* Strategy selector */}
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-ink-700 mb-3">Allocation Strategy</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {strategies.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setStrategy(s.id)}
                      className={classNames(
                        'p-3 rounded-lg border text-left transition-all',
                        strategy === s.id ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-100' : 'border-ink-200 hover:bg-ink-50',
                      )}
                    >
                      <s.icon className={classNames('w-4 h-4 mb-1.5', strategy === s.id ? 'text-primary-600' : 'text-ink-400')} />
                      <p className="text-xs font-semibold text-ink-700">{s.label}</p>
                      <p className="text-[10px] text-ink-400 mt-0.5 leading-tight">{s.description}</p>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Decision explanation */}
              <Card className="p-4 bg-primary-50/40 border-primary-200">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide mb-1">AI Decision Explanation</p>
                    <p className="text-sm text-ink-600">{adjustedConflict.explanation}</p>
                  </div>
                </div>
              </Card>

              {/* Allocation breakdown */}
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-ink-700 mb-3">Recommended Allocation</h3>
                <div className="space-y-2">
                  {adjustedConflict.orders.map((alloc, i) => (
                    <div key={i} className={classNames('p-3 rounded-lg border', alloc.recommended >= alloc.requested ? 'border-success-200 bg-success-50/50' : alloc.recommended > 0 ? 'border-warning-200 bg-warning-50/50' : 'border-error-200 bg-error-50/50')}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={priorityStyles[alloc.priority]} dot={priorityDot[alloc.priority]}>
                            <span className="capitalize">{alloc.priority}</span>
                          </Badge>
                          <span className="text-xs font-semibold text-ink-700">{alloc.orderId}</span>
                          <span className="text-[10px] text-ink-400">{alloc.customer}</span>
                        </div>
                        <Badge className={alloc.recommended >= alloc.requested ? 'bg-success-100 text-success-700' : alloc.recommended > 0 ? 'bg-warning-100 text-warning-700' : 'bg-error-100 text-error-700'}>
                          {alloc.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-[10px] text-ink-400 mb-0.5">
                            <span>Requested: {alloc.requested}</span>
                            <span>Allocated: <span className="font-semibold text-ink-600">{alloc.recommended}</span></span>
                          </div>
                          <ProgressBar value={alloc.recommended} max={alloc.requested} barClassName={alloc.recommended >= alloc.requested ? 'bg-success-500' : alloc.recommended > 0 ? 'bg-warning-500' : 'bg-error-500'} />
                        </div>
                        <span className="text-xs font-bold text-ink-700">{alloc.requested} → {alloc.recommended}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Impact preview */}
              {impact && (
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-accent-600" /> Allocation Impact Preview
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'At Risk', before: impact.before.atRisk, after: impact.after.atRisk, color: 'error' },
                      { label: 'Partial', before: impact.before.partial, after: impact.after.partial, color: 'warning' },
                      { label: 'Waiting', before: impact.before.waiting, after: impact.after.waiting, color: 'ink' },
                      { label: 'Replenish', before: impact.before.replenishment, after: impact.after.replenishment, color: 'primary' },
                    ].map(m => (
                      <div key={m.label} className="text-center">
                        <p className="text-[10px] text-ink-400 uppercase tracking-wide mb-1">{m.label}</p>
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-sm font-bold text-ink-400 line-through">{m.before}</span>
                          <ArrowRight className="w-3 h-3 text-ink-300" />
                          <span className={classNames('text-lg font-bold', m.after < m.before ? 'text-success-600' : m.after > m.before ? 'text-error-600' : 'text-ink-700')}>{m.after}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Confirm */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    adjustedConflict.orders.forEach(o => { if (o.recommended > 0) allocateOrder(o.orderId); });
                    setConfirmed(new Set([...confirmed, activeConflict.sku]));
                  }}
                  disabled={confirmed.has(activeConflict.sku)}
                  className="btn-primary flex-1"
                >
                  {confirmed.has(activeConflict.sku) ? <><Check className="w-4 h-4" /> Allocation Applied</> : <>Apply Allocation Strategy</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
