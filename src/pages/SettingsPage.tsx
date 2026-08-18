import { useState } from 'react';
import { Warehouse, Bell, Users, Clock, Package, Shield, Save } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Badge, Avatar } from '@/components/ui';
import { classNames } from '@/lib/utils';
import { warehouseConfig, employees, currentUser } from '@/data/mockData';

const roles = [
  { id: 'warehouse_manager', label: 'Warehouse Manager', description: 'Full access to all operations and settings', color: '#6366f1' },
  { id: 'inventory_manager', label: 'Inventory Manager', description: 'Manage stock, allocations, and replenishment', color: '#2b7da6' },
  { id: 'picker', label: 'Picker', description: 'View and execute pick tasks', color: '#10b981' },
  { id: 'packer', label: 'Packer', description: 'Manage packing queue and quality check', color: '#f59e0b' },
  { id: 'quality_inspector', label: 'Quality Inspector', description: 'Perform quality checks and resolve exceptions', color: '#ec4899' },
];

const notifPrefs = [
  { id: 'critical_sla', label: 'Critical SLA breaches', default: true },
  { id: 'low_stock', label: 'Low stock alerts', default: true },
  { id: 'zone_congested', label: 'Zone congestion', default: true },
  { id: 'damaged', label: 'Damaged inventory', default: true },
  { id: 'dispatch_cutoff', label: 'Dispatch cutoff warnings', default: true },
  { id: 'allocation_conflict', label: 'Allocation conflicts', default: false },
  { id: 'new_order', label: 'New orders', default: false },
];

export function SettingsPage() {
  const [reorderThreshold, setReorderThreshold] = useState(warehouseConfig.reorderThresholdDays);
  const [slaHours, setSlaHours] = useState(warehouseConfig.slaHours);
  const [shippingCutoff, setShippingCutoff] = useState(warehouseConfig.shippingCutoff);
  const [priorityUrgency, setPriorityUrgency] = useState(40);
  const [prioritySla, setPrioritySla] = useState(25);
  const [priorityCustomer, setPriorityCustomer] = useState(15);
  const [priorityAge, setPriorityAge] = useState(10);
  const [priorityCutoff, setPriorityCutoff] = useState(10);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(notifPrefs.map(p => [p.id, p.default]))
  );
  const [saved, setSaved] = useState(false);

  const total = priorityUrgency + prioritySla + priorityCustomer + priorityAge + priorityCutoff;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-800">Settings</h1>
          <p className="text-sm text-ink-500 mt-0.5">Configure warehouse operations, rules, and preferences</p>
        </div>
        <button onClick={handleSave} className="btn-primary">
          <Save className="w-4 h-4" /> {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Warehouse info */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Warehouse className="w-4 h-4 text-primary-600" />
            <h3 className="text-sm font-semibold text-ink-700">Warehouse Information</h3>
          </div>
          <div className="space-y-3">
            <div><label className="label block mb-1">Warehouse Name</label><input className="input" defaultValue={warehouseConfig.name} /></div>
            <div><label className="label block mb-1">Warehouse Code</label><input className="input" defaultValue={warehouseConfig.code} /></div>
            <div><label className="label block mb-1">Address</label><input className="input" defaultValue={warehouseConfig.address} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label block mb-1">Zones</label><input className="input" value={warehouseConfig.zones.length} readOnly /></div>
              <div>
                <label className="label block mb-1">Shipping Cutoff</label>
                <input type="time" className="input" value={shippingCutoff} onChange={e => setShippingCutoff(e.target.value)} />
              </div>
            </div>
          </div>
        </Card>

        {/* Reorder & SLA */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-accent-600" />
            <h3 className="text-sm font-semibold text-ink-700">Reorder & SLA Rules</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label block mb-1">Reorder Threshold (days of coverage)</label>
              <input type="number" className="input" value={reorderThreshold} onChange={e => setReorderThreshold(Number(e.target.value))} />
              <p className="text-[10px] text-ink-400 mt-1">Trigger reorder warning when stock coverage falls below this many days</p>
            </div>
            <div>
              <label className="label block mb-1">SLA Window (hours)</label>
              <input type="number" className="input" value={slaHours} onChange={e => setSlaHours(Number(e.target.value))} />
              <p className="text-[10px] text-ink-400 mt-1">Default SLA deadline for new orders</p>
            </div>
            <div>
              <label className="label block mb-1">Shipping Cutoff Time</label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-ink-400" />
                <input type="time" className="input" value={shippingCutoff} onChange={e => setShippingCutoff(e.target.value)} />
              </div>
              <p className="text-[10px] text-ink-400 mt-1">Daily carrier pickup deadline</p>
            </div>
          </div>
        </Card>

        {/* Priority rules */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-secondary-600" />
            <h3 className="text-sm font-semibold text-ink-700">Priority Scoring Rules</h3>
            <Badge className={classNames('ml-auto', total === 100 ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700')}>Total: {total}%</Badge>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Urgency', value: priorityUrgency, set: setPriorityUrgency },
              { label: 'SLA Risk', value: prioritySla, set: setPrioritySla },
              { label: 'Customer Priority', value: priorityCustomer, set: setPriorityCustomer },
              { label: 'Order Age', value: priorityAge, set: setPriorityAge },
              { label: 'Shipping Cutoff', value: priorityCutoff, set: setPriorityCutoff },
            ].map(r => (
              <div key={r.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-ink-600">{r.label}</span>
                  <span className="text-xs font-bold text-ink-700">{r.value}%</span>
                </div>
                <input type="range" min="0" max="100" value={r.value} onChange={e => r.set(Number(e.target.value))} className="w-full accent-primary-600" />
              </div>
            ))}
          </div>
          {total !== 100 && <p className="text-[10px] text-error-500 mt-2">Weights must total 100%. Currently: {total}%</p>}
        </Card>

        {/* User roles */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary-600" />
            <h3 className="text-sm font-semibold text-ink-700">User Roles</h3>
          </div>
          <div className="space-y-2">
            {roles.map(r => {
              const count = employees.filter(e => e.role === r.id).length;
              return (
                <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-ink-200">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${r.color}15` }}>
                    <Shield className="w-4 h-4" style={{ color: r.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-ink-700">{r.label}</p>
                    <p className="text-[10px] text-ink-400">{r.description}</p>
                  </div>
                  <Badge className="bg-ink-100 text-ink-600">{count} {count === 1 ? 'user' : 'users'}</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Notification preferences */}
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-warning-600" />
            <h3 className="text-sm font-semibold text-ink-700">Notification Preferences</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {notifPrefs.map(p => (
              <label key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-ink-200 cursor-pointer hover:bg-ink-50">
                <input
                  type="checkbox"
                  checked={prefs[p.id]}
                  onChange={e => setPrefs(prev => ({ ...prev, [p.id]: e.target.checked }))}
                  className="w-4 h-4 rounded accent-primary-600"
                />
                <span className="text-xs font-medium text-ink-600">{p.label}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Current user profile */}
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary-600" />
            <h3 className="text-sm font-semibold text-ink-700">Your Profile</h3>
          </div>
          <div className="flex items-center gap-4">
            <Avatar name={currentUser.name} color={currentUser.avatarColor} size={48} />
            <div>
              <p className="text-sm font-semibold text-ink-800">{currentUser.name}</p>
              <p className="text-xs text-ink-400">{currentUser.email}</p>
              <Badge className="bg-primary-100 text-primary-700 mt-1">Warehouse Manager</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
