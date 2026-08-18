import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, AlertCircle, Zap, Users, Clock, Package } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Badge, ProgressBar } from '@/components/ui';
import { BarChart, LineChart, DonutChart, BarList, RadialGauge } from '@/components/charts';
import { classNames } from '@/lib/utils';
import { detectBottlenecks } from '@/lib/decisionEngine';
import { warehouseConfig, employees } from '@/data/mockData';

export function AnalyticsPage() {
  const { orders, products, exceptions, setPage } = useStore();
  const [appliedRecs, setAppliedRecs] = useState<Set<string>>(new Set());
  const bottlenecks = detectBottlenecks(warehouseConfig.zones);

  const metrics = [
    { label: 'Order Fulfillment Rate', value: '94.2%', trend: '+2.1%', up: true, icon: Package, color: '#10b981' },
    { label: 'On-time Dispatch %', value: '87.5%', trend: '+5.3%', up: true, icon: Clock, color: '#2b7da6' },
    { label: 'Avg Fulfillment Time', value: '3.2h', trend: '-8%', up: true, icon: Clock, color: '#8b5cf6' },
    { label: 'Picking Accuracy', value: '98.7%', trend: '+0.4%', up: true, icon: TrendingUp, color: '#10b981' },
    { label: 'Packing Accuracy', value: '99.1%', trend: '+0.2%', up: true, icon: TrendingUp, color: '#10b981' },
    { label: 'Inventory Turnover', value: '4.2x', trend: '+0.3x', up: true, icon: BarChart3, color: '#2b7da6' },
    { label: 'Stockout Rate', value: '3.2%', trend: '-1.1%', up: true, icon: TrendingDown, color: '#10b981' },
    { label: 'Exception Rate', value: '4.8%', trend: '+0.5%', up: false, icon: AlertCircle, color: '#ef4444' },
    { label: 'Avg Pick Time', value: '4.4m', trend: '-0.3m', up: true, icon: Clock, color: '#10b981' },
    { label: 'Orders per Picker', value: '24.5', trend: '+3.2', up: true, icon: Users, color: '#2b7da6' },
    { label: 'Warehouse Utilization', value: '72%', trend: '+4%', up: true, icon: BarChart3, color: '#8b5cf6' },
    { label: 'Packing Throughput', value: '160/hr', trend: '+12', up: true, icon: Package, color: '#10b981' },
  ];

  const fulfillmentTrend = [
    { label: 'M', value: 88 }, { label: 'T', value: 91 }, { label: 'W', value: 85 },
    { label: 'T', value: 93 }, { label: 'F', value: 96 }, { label: 'S', value: 90 }, { label: 'S', value: 94 },
  ];

  const zonePerformance = warehouseConfig.zones.map(z => ({
    label: z.name.split(' — ')[0],
    value: Math.round(100 - z.congestion),
    color: z.congestion > 70 ? '#ef4444' : z.congestion > 50 ? '#f59e0b' : '#10b981',
    sublabel: `${z.avgPickTime}m avg`,
  }));

  const pickerPerformance = employees.filter(e => e.role === 'picker').map(p => ({
    label: p.name.split(' ')[0],
    value: p.ordersHandled,
    color: p.avatarColor,
    sublabel: `${p.avgPickTime.toFixed(1)}m avg`,
  }));

  const dispatchByCarrier = [
    { label: 'FedEx', value: 8, color: '#8b5cf6' },
    { label: 'UPS', value: 6, color: '#2b7da6' },
    { label: 'DHL', value: 4, color: '#f59e0b' },
    { label: 'USPS', value: 2, color: '#10b981' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink-800">Analytics & Operational Intelligence</h1>
        <p className="text-sm text-ink-500 mt-0.5">Performance metrics, trends, and bottleneck detection</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {metrics.map(m => (
          <Card key={m.label} hover className="p-3.5">
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${m.color}15` }}>
                <m.icon className="w-4 h-4" style={{ color: m.color }} />
              </div>
              <span className={classNames('flex items-center gap-0.5 text-[10px] font-semibold', m.up ? 'text-success-600' : 'text-error-600')}>
                {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {m.trend}
              </span>
            </div>
            <p className="text-xl font-bold text-ink-800">{m.value}</p>
            <p className="text-[10px] text-ink-500 font-medium">{m.label}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">Fulfillment Rate (7 days)</h3>
          <LineChart data={fulfillmentTrend} height={160} color="#10b981" />
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">Dispatch by Carrier</h3>
          <DonutChart data={dispatchByCarrier} centerValue="20" centerLabel="Shipments" />
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">Zone Performance</h3>
          <BarList items={zonePerformance} />
        </Card>
        <Card className="p-4 md:col-span-2">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">Picker Performance</h3>
          <BarChart data={pickerPerformance} height={160} color="#2b7da6" />
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">Warehouse Utilization</h3>
          <div className="flex justify-center">
            <RadialGauge value={72} label="Capacity" color="#8b5cf6" size={140} />
          </div>
        </Card>
      </div>

      {/* Bottleneck Detection */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-error-500" />
          <h2 className="text-sm font-semibold text-ink-700 uppercase tracking-wide">Bottleneck Detection</h2>
          <Badge className="bg-error-100 text-error-700 border-error-200">{bottlenecks.length} detected</Badge>
        </div>
        <div className="space-y-3">
          {bottlenecks.map((b, i) => (
            <div key={i} className={classNames('rounded-lg border p-4', b.severity === 'high' ? 'border-error-200 bg-error-50/40' : 'border-warning-200 bg-warning-50/40')}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-ink-800">{b.zoneName}</span>
                    <Badge className={b.severity === 'high' ? 'bg-error-100 text-error-700 border-error-200' : 'bg-warning-100 text-warning-700 border-warning-200'}>
                      {b.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-600">
                    <span className="font-semibold">{b.metric}:</span> {b.value} — <span className={b.severity === 'high' ? 'text-error-600 font-semibold' : 'text-warning-600 font-semibold'}>{b.deviation}</span>
                  </p>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-ink-500 uppercase tracking-wide mb-1">Possible Causes</p>
                <ul className="text-xs text-ink-500 list-disc list-inside space-y-0.5">
                  {b.causes.map((c, j) => <li key={j}>{c}</li>)}
                </ul>
              </div>
              <div className="rounded-md bg-white/70 border border-ink-200 p-2.5 mb-3">
                <p className="text-[10px] font-semibold text-ink-500 uppercase tracking-wide mb-1">Recommended Action</p>
                <p className="text-xs text-ink-600">{b.recommendation}</p>
              </div>
              <button
                onClick={() => setAppliedRecs(new Set([...appliedRecs, `${i}`]))}
                disabled={appliedRecs.has(`${i}`)}
                className={appliedRecs.has(`${i}`) ? 'btn-secondary !text-xs' : 'btn-primary !text-xs'}
              >
                {appliedRecs.has(`${i}`) ? 'Applied' : 'Apply Staffing Recommendation'}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
