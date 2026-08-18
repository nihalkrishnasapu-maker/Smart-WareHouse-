import {
  Package, Clock, AlertTriangle, Boxes, Hand, PackageCheck, Truck, Timer,
  TrendingUp, TrendingDown, ChevronRight, Zap, X, Activity, CheckCircle2,
} from 'lucide-react';
import { useStore } from '@/store';
import { Card, Badge, ProgressBar } from '@/components/ui';
import { BarChart, LineChart, DonutChart, BarList, RadialGauge } from '@/components/charts';
import { classNames, timeUntil, formatTime } from '@/lib/utils';
import { getStockHealth, daysOfCoverage } from '@/lib/decisionEngine';
import { warehouseConfig } from '@/data/mockData';
import type { ReactNode } from 'react';

function KpiCard({ icon: Icon, label, value, trend, trendUp, accent, sub }: {
  icon: typeof Package; label: string; value: string | number; trend?: string; trendUp?: boolean; accent: string; sub?: string;
}) {
  return (
    <Card hover className="p-4">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
          <Icon className="w-[18px] h-[18px]" style={{ color: accent }} />
        </div>
        {trend && (
          <span className={classNames('flex items-center gap-0.5 text-xs font-semibold', trendUp ? 'text-success-600' : 'text-error-600')}>
            {trendUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-ink-800 mt-3">{value}</p>
      <p className="text-xs text-ink-500 font-medium mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-ink-400 mt-1">{sub}</p>}
    </Card>
  );
}

function HealthBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-ink-600">{label}</span>
        <span className="text-xs font-bold text-ink-700">{value}%</span>
      </div>
      <ProgressBar value={value} barClassName={color} />
    </div>
  );
}

export function DashboardPage() {
  const { orders, products, exceptions, recommendations, setPage, dismissRecommendation, applyRecommendation } = useStore();

  const todayOrders = orders.length;
  const pendingOrders = orders.filter(o => !['dispatched', 'completed'].includes(o.status)).length;
  const atRiskOrders = orders.filter(o => o.atRisk).length;
  const lowStock = products.filter(p => {
    const h = getStockHealth(p);
    return h === 'low_stock' || h === 'critical' || h === 'out_of_stock';
  }).length;
  const pickingProgress = Math.round((orders.filter(o => ['picking', 'packing', 'quality_check', 'ready_to_dispatch', 'dispatched', 'completed'].includes(o.status)).length / todayOrders) * 100);
  const packingQueue = orders.filter(o => o.status === 'packing' || o.status === 'quality_check').length;
  const readyDispatch = orders.filter(o => o.status === 'ready_to_dispatch').length;
  const openExceptions = exceptions.filter(e => e.status === 'open' || e.status === 'escalated').length;

  const ordersOverTime = [
    { label: '8AM', value: 12 }, { label: '9AM', value: 18 }, { label: '10AM', value: 24 },
    { label: '11AM', value: 20 }, { label: '12PM', value: 16 }, { label: '1PM', value: 28 },
    { label: '2PM', value: 32 }, { label: '3PM', value: 22 },
  ];

  const ordersByPriority = [
    { label: 'Critical', value: orders.filter(o => o.priority === 'critical').length, color: '#ef4444' },
    { label: 'Urgent', value: orders.filter(o => o.priority === 'urgent').length, color: '#f59e0b' },
    { label: 'High', value: orders.filter(o => o.priority === 'high').length, color: '#2b7da6' },
    { label: 'Normal', value: orders.filter(o => o.priority === 'normal').length, color: '#64748b' },
    { label: 'Low', value: orders.filter(o => o.priority === 'low').length, color: '#cbd5e1' },
  ];

  const inventoryUtilization = [
    { label: 'Used', value: Math.round(products.reduce((s, p) => s + (p.reserved + p.inPicking), 0) / products.reduce((s, p) => s + p.targetStock, 0) * 100) },
    { label: 'Available', value: Math.round(products.reduce((s, p) => s + p.available, 0) / products.reduce((s, p) => s + p.targetStock, 0) * 100) },
  ];

  const pickingThroughput = [
    { label: '8AM', value: 45 }, { label: '9AM', value: 62 }, { label: '10AM', value: 78 },
    { label: '11AM', value: 70 }, { label: '12PM', value: 55 }, { label: '1PM', value: 82 },
    { label: '2PM', value: 91 }, { label: '3PM', value: 68 },
  ];

  const exceptionsByCategory = [
    { label: 'Missing', value: exceptions.filter(e => e.category === 'missing_item').length, color: '#ef4444' },
    { label: 'Damaged', value: exceptions.filter(e => e.category === 'damaged_item').length, color: '#f59e0b' },
    { label: 'Mismatch', value: exceptions.filter(e => e.category === 'stock_mismatch').length, color: '#2b7da6' },
    { label: 'Wrong SKU', value: exceptions.filter(e => e.category === 'wrong_sku').length, color: '#8b5cf6' },
    { label: 'Delay', value: exceptions.filter(e => e.category === 'picking_delay').length, color: '#ec4899' },
    { label: 'Conflict', value: exceptions.filter(e => e.category === 'inventory_conflict').length, color: '#dc2626' },
  ];

  const activeRecs = recommendations.filter(r => !r.dismissed);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-800">Operations Dashboard</h1>
          <p className="text-sm text-ink-500 mt-0.5">{warehouseConfig.name} · {formatTime(new Date().toISOString())} · Day Shift</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-error-50 border border-error-100">
          <Timer className="w-4 h-4 text-error-500" />
          <span className="text-xs font-semibold text-error-700">Dispatch cutoff in {timeUntil(new Date('2026-08-17T16:00:00').toISOString())}</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Package} label="Orders Today" value={todayOrders} trend="+12%" trendUp accent="#2b7da6" sub="vs yesterday" />
        <KpiCard icon={Clock} label="Orders Pending" value={pendingOrders} accent="#e08720" sub={`${packingQueue} in packing`} />
        <KpiCard icon={AlertTriangle} label="Orders at Risk" value={atRiskOrders} trend="+3" trendUp={false} accent="#ef4444" sub="SLA breach risk" />
        <KpiCard icon={Boxes} label="Low Stock Items" value={lowStock} accent="#f59e0b" sub="need replenishment" />
        <KpiCard icon={Hand} label="Picking Progress" value={`${pickingProgress}%`} accent="#2b7da6" sub="of today's orders" />
        <KpiCard icon={PackageCheck} label="Packing Queue" value={packingQueue} accent="#10b981" sub="2 stations busy" />
        <KpiCard icon={Truck} label="Ready to Dispatch" value={readyDispatch} accent="#8b5cf6" sub="awaiting carrier" />
        <KpiCard icon={Timer} label="Avg Fulfillment Time" value="3.2h" trend="-8%" trendUp accent="#10b981" sub="vs 7-day avg" />
      </div>

      {/* Operations Health + AI Decision Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Operations Health */}
        <Card className="p-4 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary-600" />
            <h2 className="text-sm font-semibold text-ink-700 uppercase tracking-wide">Operations Health</h2>
          </div>
          <div className="flex justify-center mb-4">
            <RadialGauge value={78} label="Overall" color="#10b981" />
          </div>
          <div className="space-y-3">
            <HealthBar label="Inventory Health" value={82} color="bg-success-500" />
            <HealthBar label="Picking Efficiency" value={71} color="bg-primary-500" />
            <HealthBar label="Packing Efficiency" value={88} color="bg-accent-500" />
            <HealthBar label="Dispatch Readiness" value={64} color="bg-warning-500" />
            <HealthBar label="Exception Rate" value={92} color="bg-error-500" />
          </div>
        </Card>

        {/* AI Decision Center */}
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-sm font-semibold text-ink-700 uppercase tracking-wide">AI Decision Center</h2>
            </div>
            <Badge className="bg-accent-100 text-accent-700 border-accent-200">{activeRecs.length} recommendations</Badge>
          </div>
          <div className="space-y-3 max-h-[420px] overflow-y-auto no-scrollbar">
            {activeRecs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-success-400 mb-2" />
                <p className="text-sm font-medium text-ink-600">All clear — no critical recommendations</p>
                <p className="text-xs text-ink-400 mt-1">Operations running smoothly</p>
              </div>
            ) : activeRecs.map(rec => (
              <div key={rec.id} className={classNames(
                'rounded-lg border p-3.5 transition-all',
                rec.severity === 'critical' ? 'border-error-200 bg-error-50/50' :
                rec.severity === 'high' ? 'border-warning-200 bg-warning-50/50' :
                'border-primary-200 bg-primary-50/50',
              )}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={classNames(
                      rec.severity === 'critical' ? 'bg-error-100 text-error-700 border-error-200' :
                      rec.severity === 'high' ? 'bg-warning-100 text-warning-700 border-warning-200' :
                      'bg-primary-100 text-primary-700 border-primary-200',
                    )}>{rec.severity.toUpperCase()}</Badge>
                    <span className="text-xs font-semibold text-ink-500 uppercase tracking-wide">{rec.category.replace(/_/g, ' ')}</span>
                  </div>
                  <button onClick={() => dismissRecommendation(rec.id)} className="text-ink-400 hover:text-ink-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm font-semibold text-ink-800 mb-1">{rec.title}</p>
                <p className="text-xs text-ink-500 mb-2">{rec.reason}</p>
                <div className="rounded-md bg-white/70 border border-ink-200 p-2.5 mb-3">
                  <p className="text-[10px] font-semibold text-ink-500 uppercase tracking-wide mb-1">Recommended Action</p>
                  <p className="text-xs text-ink-600">{rec.action}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { applyRecommendation(rec.id); setPage(rec.link.page as never); }}
                    className="btn-primary !py-1.5 !text-xs"
                  >
                    {rec.actionLabel}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => dismissRecommendation(rec.id)} className="btn-secondary !py-1.5 !text-xs">Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">Orders Over Time</h3>
          <LineChart data={ordersOverTime} height={160} color="#2b7da6" />
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">Orders by Priority</h3>
          <DonutChart data={ordersByPriority} centerValue={String(todayOrders)} centerLabel="Total" />
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">Inventory Utilization</h3>
          <div className="flex items-center justify-center h-[160px]">
            <DonutChart
              data={[
                { label: 'Reserved/In Picking', value: inventoryUtilization[0].value, color: '#2b7da6' },
                { label: 'Available', value: inventoryUtilization[1].value, color: '#10b981' },
              ]}
              centerValue={`${inventoryUtilization[0].value + inventoryUtilization[1].value}%`}
              centerLabel="Utilized"
            />
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">Picking Throughput</h3>
          <LineChart data={pickingThroughput} height={160} color="#10b981" />
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">Fulfillment Time (hours)</h3>
          <BarChart data={[
            { label: '<2h', value: 14 }, { label: '2-4h', value: 22 }, { label: '4-6h', value: 9 },
            { label: '6-8h', value: 4 }, { label: '>8h', value: 1 },
          ]} height={160} color="#8b5cf6" />
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">Exceptions by Category</h3>
          <BarList items={exceptionsByCategory.map(e => ({ label: e.label, value: e.value, color: e.color, sublabel: `${e.value} open` }))} />
        </Card>
      </div>

      {/* Zone congestion quick view */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink-700">Zone Congestion</h3>
          <button onClick={() => setPage('picking')} className="text-xs text-primary-600 font-medium hover:underline">View Picking →</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {warehouseConfig.zones.map(zone => (
            <div key={zone.id} className="text-center">
              <div className="flex justify-center mb-1.5">
                <RadialGauge value={zone.congestion} size={70} color={zone.congestion > 70 ? '#ef4444' : zone.congestion > 50 ? '#f59e0b' : '#10b981'} />
              </div>
              <p className="text-[10px] font-medium text-ink-600 truncate">{zone.name.split(' — ')[0]}</p>
              <p className="text-[9px] text-ink-400">{zone.pickerCount} pickers</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
