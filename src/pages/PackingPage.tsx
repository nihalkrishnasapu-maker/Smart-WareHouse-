import { useState, useMemo } from 'react';
import { PackageCheck, CheckCircle2, Clock, AlertCircle, Wrench, Box, Weight } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Badge, ProgressBar, Avatar } from '@/components/ui';
import { classNames, priorityStyles, priorityDot, timeUntil, formatTime } from '@/lib/utils';
import { packingStations } from '@/data/mockData';
import type { PackingStatus, PackingStationStatus } from '@/types';

const stationStatusStyles: Record<PackingStationStatus, string> = {
  available: 'bg-success-100 text-success-700',
  busy: 'bg-primary-100 text-primary-700',
  waiting: 'bg-warning-100 text-warning-700',
  maintenance: 'bg-error-100 text-error-700',
};

const packingStatusStyles: Record<PackingStatus, string> = {
  queued: 'bg-ink-100 text-ink-600',
  packing: 'bg-primary-100 text-primary-700',
  quality_check: 'bg-warning-100 text-warning-700',
  ready: 'bg-accent-100 text-accent-700',
  dispatched: 'bg-success-100 text-success-700',
};

const packingStatusLabels: Record<PackingStatus, string> = {
  queued: 'Queued', packing: 'Packing', quality_check: 'Quality Check', ready: 'Ready', dispatched: 'Dispatched',
};

const qcStyles: Record<string, string> = {
  pending: 'bg-warning-100 text-warning-700',
  passed: 'bg-success-100 text-success-700',
  failed: 'bg-error-100 text-error-700',
  skipped: 'bg-ink-100 text-ink-500',
};

export function PackingPage() {
  const { packingTasks } = useStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return packingTasks
      .filter(t => statusFilter === 'all' || t.status === statusFilter)
      .sort((a, b) => {
        const pri = { critical: 0, urgent: 1, high: 2, normal: 3, low: 4 };
        if (pri[a.priority] !== pri[b.priority]) return pri[a.priority] - pri[b.priority];
        return new Date(a.dispatchCutoff).getTime() - new Date(b.dispatchCutoff).getTime();
      });
  }, [packingTasks, statusFilter]);

  const packing = packingTasks.filter(t => t.status === 'packing').length;
  const queued = packingTasks.filter(t => t.status === 'queued').length;
  const qc = packingTasks.filter(t => t.status === 'quality_check').length;
  const ready = packingTasks.filter(t => t.status === 'ready').length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink-800">Packing Management</h1>
        <p className="text-sm text-ink-500 mt-0.5">{packingTasks.length} packing tasks · {packing} in progress · {ready} ready for dispatch</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3"><p className="label mb-1">Packing</p><p className="text-xl font-bold text-primary-600">{packing}</p></Card>
        <Card className="p-3"><p className="label mb-1">Queued</p><p className="text-xl font-bold text-ink-700">{queued}</p></Card>
        <Card className="p-3"><p className="label mb-1">Quality Check</p><p className="text-xl font-bold text-warning-600">{qc}</p></Card>
        <Card className="p-3"><p className="label mb-1">Ready</p><p className="text-xl font-bold text-accent-600">{ready}</p></Card>
      </div>

      {/* Packing stations */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-ink-700 mb-3">Packing Stations</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {packingStations.map(st => (
            <div key={st.id} className={classNames('p-3 rounded-lg border-2 transition-all', st.status === 'available' ? 'border-success-200 bg-success-50/30' : st.status === 'busy' ? 'border-primary-200 bg-primary-50/30' : st.status === 'waiting' ? 'border-warning-200 bg-warning-50/30' : 'border-error-200 bg-error-50/30')}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <PackageCheck className={classNames('w-4 h-4', st.status === 'maintenance' ? 'text-error-500' : 'text-ink-600')} />
                  <span className="text-xs font-semibold text-ink-700">{st.name}</span>
                </div>
                <span className={classNames('chip', stationStatusStyles[st.status])}>{st.status}</span>
              </div>
              {st.currentOrder && <p className="text-[10px] text-ink-500 mb-1">Order: {st.currentOrder}</p>}
              <div className="flex items-center justify-between text-[10px] text-ink-400">
                <span>Util: {st.utilization}%</span>
                <span>{st.packsToday} today</span>
              </div>
              <ProgressBar value={st.utilization} className="mt-1.5 h-1" barClassName={st.status === 'maintenance' ? 'bg-error-400' : st.status === 'busy' ? 'bg-primary-500' : 'bg-success-500'} />
            </div>
          ))}
        </div>
      </Card>

      {/* Workflow visual */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-ink-700 mb-3">Packing Workflow</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { label: 'Pick Complete', icon: CheckCircle2, count: 16, color: 'success' },
            { label: 'Packing', icon: Box, count: packing, color: 'primary' },
            { label: 'Quality Check', icon: AlertCircle, count: qc, color: 'warning' },
            { label: 'Ready', icon: CheckCircle2, count: ready, color: 'accent' },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2 shrink-0">
              <div className={classNames('flex items-center gap-2 px-3 py-2 rounded-lg border', step.color === 'success' ? 'border-success-200 bg-success-50' : step.color === 'primary' ? 'border-primary-200 bg-primary-50' : step.color === 'warning' ? 'border-warning-200 bg-warning-50' : 'border-accent-200 bg-accent-50')}>
                <step.icon className={classNames('w-4 h-4', step.color === 'success' ? 'text-success-600' : step.color === 'primary' ? 'text-primary-600' : step.color === 'warning' ? 'text-warning-600' : 'text-accent-600')} />
                <span className="text-xs font-semibold text-ink-700">{step.label}</span>
                <span className="text-xs font-bold text-ink-500">{step.count}</span>
              </div>
              {i < 3 && <span className="text-ink-300">→</span>}
            </div>
          ))}
        </div>
      </Card>

      {/* Packing queue */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink-700">Packing Queue</h3>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select w-auto">
            <option value="all">All Statuses</option>
            {Object.entries(packingStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50/50">
                <th className="text-left px-3 py-2.5 label">Order</th>
                <th className="text-left px-3 py-2.5 label">Customer</th>
                <th className="text-right px-3 py-2.5 label">Items</th>
                <th className="text-left px-3 py-2.5 label">Packaging</th>
                <th className="text-right px-3 py-2.5 label">Weight</th>
                <th className="text-left px-3 py-2.5 label">Station</th>
                <th className="text-left px-3 py-2.5 label">Priority</th>
                <th className="text-left px-3 py-2.5 label">Status</th>
                <th className="text-left px-3 py-2.5 label">QC</th>
                <th className="text-left px-3 py-2.5 label">Cutoff</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => (
                <tr key={task.id} className="border-b border-ink-100 table-row-hover">
                  <td className="px-3 py-3 text-xs font-semibold text-ink-700">{task.orderId}</td>
                  <td className="px-3 py-3 text-xs text-ink-600">{task.customer}</td>
                  <td className="px-3 py-3 text-xs text-right text-ink-600">{task.items}</td>
                  <td className="px-3 py-3 text-xs text-ink-500">{task.packagingType}</td>
                  <td className="px-3 py-3 text-xs text-right text-ink-600">{task.weight}kg</td>
                  <td className="px-3 py-3 text-xs text-ink-500">{task.station || '—'}</td>
                  <td className="px-3 py-3"><Badge className={priorityStyles[task.priority]} dot={priorityDot[task.priority]}><span className="capitalize">{task.priority}</span></Badge></td>
                  <td className="px-3 py-3"><span className={classNames('chip', packingStatusStyles[task.status])}>{packingStatusLabels[task.status]}</span></td>
                  <td className="px-3 py-3"><span className={classNames('chip', qcStyles[task.qcStatus])}>{task.qcStatus}</span></td>
                  <td className="px-3 py-3">
                    <span className={classNames('text-xs font-medium', new Date(task.dispatchCutoff) < new Date() ? 'text-error-600' : 'text-ink-500')}>
                      {timeUntil(task.dispatchCutoff)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
