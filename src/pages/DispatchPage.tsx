import { useState, useMemo } from 'react';
import { Truck, Clock, MapPin, Package, AlertTriangle, CheckCircle2, Timer } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Badge, ProgressBar } from '@/components/ui';
import { classNames, timeUntil, formatTime, formatDateTime } from '@/lib/utils';
import type { ShipmentStatus } from '@/types';

const statusStyles: Record<ShipmentStatus, string> = {
  ready: 'bg-accent-100 text-accent-700',
  awaiting_carrier: 'bg-warning-100 text-warning-700',
  dispatched: 'bg-success-100 text-success-700',
  delayed: 'bg-error-100 text-error-700',
  in_transit: 'bg-primary-100 text-primary-700',
};

const statusLabels: Record<ShipmentStatus, string> = {
  ready: 'Ready', awaiting_carrier: 'Awaiting Carrier', dispatched: 'Dispatched', delayed: 'Delayed', in_transit: 'In Transit',
};

export function DispatchPage() {
  const { shipments } = useStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return shipments.filter(s => statusFilter === 'all' || s.status === statusFilter)
      .sort((a, b) => new Date(a.dispatchDeadline).getTime() - new Date(b.dispatchDeadline).getTime());
  }, [shipments, statusFilter]);

  const ready = shipments.filter(s => s.status === 'ready').length;
  const awaiting = shipments.filter(s => s.status === 'awaiting_carrier').length;
  const dispatched = shipments.filter(s => s.status === 'dispatched' || s.status === 'in_transit').length;
  const delayed = shipments.filter(s => s.status === 'delayed').length;
  const cutoffTime = new Date('2026-08-17T16:00:00');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-800">Dispatch Tracking</h1>
          <p className="text-sm text-ink-500 mt-0.5">{shipments.length} shipments · {ready} ready · {dispatched} dispatched</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-error-50 border border-error-100">
          <Timer className="w-4 h-4 text-error-500" />
          <span className="text-xs font-semibold text-error-700">Carrier cutoff in {timeUntil(cutoffTime.toISOString())}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3"><p className="label mb-1">Ready</p><p className="text-xl font-bold text-accent-600">{ready}</p></Card>
        <Card className="p-3"><p className="label mb-1">Awaiting Carrier</p><p className="text-xl font-bold text-warning-600">{awaiting}</p></Card>
        <Card className="p-3"><p className="label mb-1">Dispatched Today</p><p className="text-xl font-bold text-success-600">{dispatched}</p></Card>
        <Card className="p-3"><p className="label mb-1">Delayed</p><p className="text-xl font-bold text-error-600">{delayed}</p></Card>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select w-auto">
          <option value="all">All Statuses</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Card>

      {/* Shipment cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(s => {
          const isUrgent = new Date(s.dispatchDeadline) < new Date('2026-08-17T16:00:00') && s.status !== 'dispatched' && s.status !== 'in_transit';
          const isDelayed = s.status === 'delayed';
          return (
            <Card key={s.id} hover className={classNames('p-4', (isUrgent || isDelayed) && 'border-error-200')}>
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-ink-800">{s.orderId}</span>
                    {(isUrgent || isDelayed) && <AlertTriangle className="w-3.5 h-3.5 text-error-500" />}
                  </div>
                  <p className="text-xs text-ink-500">{s.customer}</p>
                </div>
                <span className={classNames('chip', statusStyles[s.status])}>{statusLabels[s.status]}</span>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="flex items-center gap-1.5 text-ink-600"><Truck className="w-3.5 h-3.5 text-ink-400" />{s.carrier}</div>
                <div className="flex items-center gap-1.5 text-ink-600"><Package className="w-3.5 h-3.5 text-ink-400" />{s.packageCount} pkgs · {s.weight}kg</div>
                <div className="flex items-center gap-1.5 text-ink-600"><MapPin className="w-3.5 h-3.5 text-ink-400" />{s.destination}</div>
                <div className="flex items-center gap-1.5 text-ink-600"><Clock className="w-3.5 h-3.5 text-ink-400" />
                  <span className={classNames(isUrgent || isDelayed ? 'text-error-600 font-semibold' : 'text-ink-500')}>
                    {isDelayed ? 'Overdue' : `Cutoff: ${timeUntil(s.dispatchDeadline)}`}
                  </span>
                </div>
              </div>

              {/* Tracking */}
              <div className="text-[10px] text-ink-400 mb-2 font-mono">{s.trackingId}</div>

              {/* Timeline */}
              <div className="flex items-center gap-0.5">
                {s.timeline.map((step, i) => (
                  <div key={i} className="flex items-center gap-0.5 flex-1">
                    <div className={classNames('w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px]', step.done ? 'bg-accent-500 text-white' : 'bg-ink-200 text-ink-400')}>
                      {step.done ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
                    </div>
                    {i < s.timeline.length - 1 && <div className={classNames('h-0.5 flex-1', step.done ? 'bg-accent-400' : 'bg-ink-200')} />}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {s.timeline.map((step, i) => (
                  <span key={i} className={classNames('text-[8px] flex-1 text-center', step.done ? 'text-accent-600 font-medium' : 'text-ink-300')}>{step.label}</span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
