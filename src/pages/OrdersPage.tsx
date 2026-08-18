import { useState, useMemo } from 'react';
import { Search, Filter, ChevronRight, Clock, MapPin, User, Package, AlertTriangle, CheckCircle2, X, Zap } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Badge, Drawer, ProgressBar, EmptyState, Avatar } from '@/components/ui';
import { classNames, priorityStyles, priorityDot, orderStatusStyles, orderStatusLabels, allocationStatusStyles, allocationStatusLabels, formatCurrency, timeUntil, formatDateTime, timeAgo, formatTime } from '@/lib/utils';
import { scoreBand } from '@/lib/decisionEngine';
import { employees } from '@/data/mockData';
import type { Order, Priority, OrderStatus } from '@/types';

export function OrdersPage() {
  const { orders, setPage, selectedOrderId, setSelectedOrderId } = useStore();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (search && !o.id.toLowerCase().includes(search.toLowerCase()) && !o.customer.toLowerCase().includes(search.toLowerCase())) return false;
      if (priorityFilter !== 'all' && o.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (riskFilter === 'risk' && !o.atRisk) return false;
      if (riskFilter === 'safe' && o.atRisk) return false;
      return true;
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }, [orders, search, priorityFilter, statusFilter, riskFilter]);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink-800">Order Management</h1>
        <p className="text-sm text-ink-500 mt-0.5">{filtered.length} orders · sorted by priority score</p>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order ID or customer..." className="input pl-9" />
          </div>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="select w-auto">
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select w-auto">
            <option value="all">All Statuses</option>
            {Object.entries(orderStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="select w-auto">
            <option value="all">All Risk</option>
            <option value="risk">At Risk</option>
            <option value="safe">Safe</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50/50">
                <th className="text-left px-4 py-2.5 label">Order ID</th>
                <th className="text-left px-4 py-2.5 label">Customer</th>
                <th className="text-left px-4 py-2.5 label">Items</th>
                <th className="text-left px-4 py-2.5 label">Priority</th>
                <th className="text-left px-4 py-2.5 label">Score</th>
                <th className="text-left px-4 py-2.5 label">Status</th>
                <th className="text-left px-4 py-2.5 label">Allocation</th>
                <th className="text-left px-4 py-2.5 label">SLA</th>
                <th className="text-left px-4 py-2.5 label">Picker</th>
                <th className="text-left px-4 py-2.5 label">Created</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => {
                const band = scoreBand(order.priorityScore);
                const picker = order.assignedPicker ? employees.find(e => e.id === order.assignedPicker) : null;
                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="border-b border-ink-100 table-row-hover cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {order.atRisk && <AlertTriangle className="w-3.5 h-3.5 text-error-500 shrink-0" />}
                        <span className="font-semibold text-ink-700 text-xs">{order.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-ink-700">{order.customer}</p>
                      <p className="text-[10px] text-ink-400 capitalize">{order.customerTier}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-600">{order.items.length} items</td>
                    <td className="px-4 py-3">
                      <Badge className={priorityStyles[order.priority]} dot={priorityDot[order.priority]}>
                        <span className="capitalize">{order.priority}</span>
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={classNames('text-xs font-bold', band.color === 'error' ? 'text-error-600' : band.color === 'warning' ? 'text-warning-600' : 'text-ink-700')}>{order.priorityScore}</span>
                        <span className="text-[10px] text-ink-400">/100</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={classNames('chip', orderStatusStyles[order.status])}>{orderStatusLabels[order.status]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={classNames('chip', allocationStatusStyles[order.allocationStatus])}>{allocationStatusLabels[order.allocationStatus]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={classNames('text-xs font-medium', order.atRisk ? 'text-error-600' : 'text-ink-500')}>
                        {timeUntil(order.slaDeadline)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {picker ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar name={picker.name} color={picker.avatarColor} size={22} />
                          <span className="text-xs text-ink-600">{picker.name.split(' ')[0]}</span>
                        </div>
                      ) : <span className="text-xs text-ink-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-400">{timeAgo(order.createdAt)}</td>
                    <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-ink-300" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState icon={<Package className="w-8 h-8" />} title="No orders found" message="Try adjusting your filters" />}
      </Card>

      <OrderDetailDrawer order={selectedOrder} onClose={() => setSelectedOrderId(null)} onGoToAllocation={() => setPage('allocation')} />
</div>
  );
}

function OrderDetailDrawer({ order, onClose, onGoToAllocation }: { order?: Order; onClose: () => void; onGoToAllocation: () => void }) {
  const { overrideOrderPriority, allocateOrder } = useStore();
  const [showOverride, setShowOverride] = useState(false);
  const [overridePriority, setOverridePriority] = useState<Priority>('normal');
  const [overrideReason, setOverrideReason] = useState('');

  if (!order) return null;
  const band = scoreBand(order.priorityScore);
  const picker = order.assignedPicker ? employees.find(e => e.id === order.assignedPicker) : null;

  return (
    <Drawer open={!!order} onClose={onClose} title={`Order ${order.id}`} width="max-w-2xl">
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-ink-800">{order.id}</h2>
              {order.atRisk && <Badge className="bg-error-100 text-error-700 border-error-200" dot="bg-error-500">At Risk</Badge>}
            </div>
            <p className="text-sm text-ink-500">{order.customer} · <span className="capitalize">{order.customerTier}</span> tier</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-ink-800">{order.priorityScore}<span className="text-sm text-ink-400">/100</span></p>
            <Badge className={classNames('border', band.color === 'error' ? 'bg-error-100 text-error-700 border-error-200' : band.color === 'warning' ? 'bg-warning-100 text-warning-700 border-warning-200' : 'bg-ink-100 text-ink-600 border-ink-200')}>{band.label}</Badge>
          </div>
        </div>

        {order.overriddenPriority && (
          <div className="rounded-lg bg-secondary-50 border border-secondary-200 p-3 text-xs text-secondary-700">
            <strong>Priority overridden:</strong> {order.overriddenPriority.from} → {order.overriddenPriority.to}. Reason: {order.overriddenPriority.reason}
          </div>
        )}

        {/* Priority Score Breakdown */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">Priority Score Breakdown</h3>
          <div className="space-y-2.5">
            {order.priorityFactors.map(f => (
              <div key={f.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-ink-600">{f.name} <span className="text-ink-400">({Math.round(f.weight * 100)}%)</span></span>
                  <span className="text-ink-500">{f.score}/100 · <span className="font-semibold text-ink-700">+{Math.round(f.contribution)}</span></span>
                </div>
                <ProgressBar value={f.score} barClassName={f.contribution > 20 ? 'bg-error-500' : f.contribution > 10 ? 'bg-primary-500' : 'bg-ink-400'} />
                <p className="text-[10px] text-ink-400 mt-0.5">{f.note}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setShowOverride(!showOverride)} className="btn-secondary !py-1.5 !text-xs mt-3">
            {showOverride ? 'Cancel' : 'Override Priority'}
          </button>
          {showOverride && (
            <div className="mt-3 space-y-2 p-3 rounded-lg bg-ink-50 border border-ink-200">
              <div>
                <label className="label block mb-1">New Priority</label>
                <select value={overridePriority} onChange={e => setOverridePriority(e.target.value as Priority)} className="select">
                  <option value="critical">Critical</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="label block mb-1">Reason</label>
                <input value={overrideReason} onChange={e => setOverrideReason(e.target.value)} placeholder="Why override?" className="input" />
              </div>
              <button
                onClick={() => { overrideOrderPriority(order.id, overridePriority, overrideReason || 'Manager override'); setShowOverride(false); setOverrideReason(''); }}
                className="btn-primary !py-1.5 !text-xs w-full"
              >Apply Override</button>
            </div>
          )}
        </Card>

        {/* Order Items */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">Order Items</h3>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-ink-50 border border-ink-100">
                <div>
                  <p className="text-xs font-semibold text-ink-700">{item.productName}</p>
                  <p className="text-[10px] text-ink-400">{item.sku} · {item.location}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="text-ink-600">Need: <span className="font-semibold">{item.quantity}</span></p>
                  <p className="text-ink-400">Avail: {item.available} · Alloc: {item.allocated}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <p className="label mb-1.5">SLA Deadline</p>
            <p className="text-xs text-ink-700 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-ink-400" />{formatDateTime(order.slaDeadline)}</p>
            <p className={classNames('text-[10px] mt-1', order.atRisk ? 'text-error-600 font-semibold' : 'text-ink-400')}>{order.atRisk ? 'SLA breach risk' : 'On track'}</p>
          </Card>
          <Card className="p-3">
            <p className="label mb-1.5">Shipping Cutoff</p>
            <p className="text-xs text-ink-700 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-ink-400" />{formatTime(order.shippingCutoff)}</p>
            <p className="text-[10px] text-ink-400 mt-1">{timeUntil(order.shippingCutoff)} remaining</p>
          </Card>
          <Card className="p-3">
            <p className="label mb-1.5">Destination</p>
            <p className="text-xs text-ink-700 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-ink-400" />{order.destination}</p>
            <p className="text-[10px] text-ink-400 mt-1">{order.carrier}</p>
          </Card>
          <Card className="p-3">
            <p className="label mb-1.5">Assigned Picker</p>
            {picker ? (
              <div className="flex items-center gap-1.5">
                <Avatar name={picker.name} color={picker.avatarColor} size={22} />
                <p className="text-xs text-ink-700">{picker.name}</p>
              </div>
            ) : <p className="text-xs text-ink-400">Not assigned</p>}
          </Card>
        </div>

        {/* Fulfillment Timeline */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">Fulfillment Timeline</h3>
          <div className="space-y-0">
            {order.timeline.map((event, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={classNames('w-6 h-6 rounded-full flex items-center justify-center shrink-0', event.done ? 'bg-accent-500' : 'bg-ink-200')}>
                    {event.done ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <span className="w-1.5 h-1.5 rounded-full bg-ink-400" />}
                  </div>
                  {i < order.timeline.length - 1 && <div className={classNames('w-0.5 h-6', event.done ? 'bg-accent-300' : 'bg-ink-200')} />}
                </div>
                <div className="pb-2">
                  <p className={classNames('text-xs font-medium', event.done ? 'text-ink-700' : 'text-ink-400')}>{event.label}</p>
                  {event.timestamp && <p className="text-[10px] text-ink-400">{formatDateTime(event.timestamp)}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          {order.status === 'awaiting_allocation' && (
            <button onClick={() => { allocateOrder(order.id); }} className="btn-primary !text-xs flex-1">
              <Zap className="w-3.5 h-3.5" /> Allocate Stock
            </button>
          )}
          <button onClick={onGoToAllocation} className="btn-secondary !text-xs flex-1">View Allocation</button>
        </div>
      </div>
    </Drawer>
  );
}
