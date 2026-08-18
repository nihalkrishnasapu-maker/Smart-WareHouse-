import { useState } from 'react';
import { Zap, Play, AlertTriangle, Package, User, Wrench, Clock, Boxes, TrendingUp } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Badge } from '@/components/ui';
import { classNames } from '@/lib/utils';
import { simulateScenario, type SimulationScenario } from '@/lib/decisionEngine';

const scenarioTypes: { type: SimulationScenario['type']; label: string; icon: typeof Zap; color: string; description: string }[] = [
  { type: 'inventory_shortage', label: 'Inventory Shortage', icon: Boxes, color: '#ef4444', description: 'Simulate stock becoming unavailable' },
  { type: 'picker_unavailable', label: 'Picker Unavailable', icon: User, color: '#f59e0b', description: 'Simulate a picker call-out' },
  { type: 'packing_station_unavailable', label: 'Station Failure', icon: Wrench, color: '#ef4444', description: 'Simulate packing station breakdown' },
  { type: 'shipping_cutoff', label: 'Cutoff Approaching', icon: Clock, color: '#f59e0b', description: 'Simulate tight dispatch window' },
  { type: 'damaged_inventory', label: 'Damaged Inventory', icon: AlertTriangle, color: '#ef4444', description: 'Simulate inventory damage event' },
  { type: 'order_spike', label: 'Order Spike', icon: TrendingUp, color: '#2b7da6', description: 'Simulate sudden volume increase' },
];

export function SimulatorPage() {
  const { orders, products } = useStore();
  const [selectedType, setSelectedType] = useState<SimulationScenario['type'] | null>(null);
  const [result, setResult] = useState<SimulationScenario | null>(null);

  const runSimulation = (type: SimulationScenario['type']) => {
    setSelectedType(type);
    setResult(simulateScenario(type, orders, products));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink-800">AI Decision Simulator</h1>
        <p className="text-sm text-ink-500 mt-0.5">Simulate warehouse events and preview their impact before taking action</p>
      </div>

      {/* Scenario selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {scenarioTypes.map(s => (
          <button
            key={s.type}
            onClick={() => runSimulation(s.type)}
            className={classNames(
              'card p-4 text-left transition-all hover:shadow-card-hover',
              selectedType === s.type ? 'border-primary-300 ring-2 ring-primary-100' : 'hover:border-ink-300',
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-800">{s.label}</p>
                <p className="text-[10px] text-ink-400">{s.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-primary-600 font-medium">
              <Play className="w-3 h-3" /> Run Simulation
            </div>
          </button>
        ))}
      </div>

      {/* Results */}
      {result && (
        <Card className="p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink-800">Simulation Result: {result.label}</p>
              <p className="text-xs text-ink-500">{result.description}</p>
            </div>
          </div>

          {/* Impact metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {result.impact.map((m, i) => (
              <div key={i} className="p-3 rounded-lg bg-ink-50 border border-ink-100 text-center">
                <p className="text-2xl font-bold text-ink-800">{m.value}</p>
                <p className="text-[10px] text-ink-500 font-medium uppercase tracking-wide mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Recommendation */}
          <div className="rounded-lg bg-accent-50 border border-accent-200 p-4">
            <p className="text-[10px] font-semibold text-ink-500 uppercase tracking-wide mb-1.5">Recommended Resolution</p>
            <p className="text-sm text-ink-600">{result.recommendation}</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <button className="btn-primary !text-xs flex-1">
              <Zap className="w-3.5 h-3.5" /> Apply Resolution
            </button>
            <button onClick={() => { setSelectedType(null); setResult(null); }} className="btn-secondary !text-xs">
              Clear
            </button>
          </div>
        </Card>
      )}

      {/* Info card when nothing selected */}
      {!result && (
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink-600">Select a scenario to simulate</p>
          <p className="text-xs text-ink-400 mt-1">Preview the impact of warehouse events before they happen. Each simulation shows predicted order impact and recommends the best resolution.</p>
        </Card>
      )}
    </div>
  );
}
