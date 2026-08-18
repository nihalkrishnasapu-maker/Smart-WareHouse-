import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Hand, Play, Pause, CheckCircle2, Flag, Route, TrendingDown, Users, ScanLine, X, AlertCircle, PackageCheck, History } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Badge, ProgressBar, Avatar } from '@/components/ui';
import { RadialGauge } from '@/components/charts';
import { CameraScanner } from '@/components/CameraScanner';
import { classNames, priorityStyles, priorityDot, timeAgo } from '@/lib/utils';
import { optimizePickRoute } from '@/lib/decisionEngine';
import { warehouseConfig, employees } from '@/data/mockData';
import type { PickTask, PickTaskStatus } from '@/types';

const statusStyles: Record<PickTaskStatus, string> = {
  pending: 'bg-ink-100 text-ink-600',
  in_progress: 'bg-primary-100 text-primary-700',
  paused: 'bg-warning-100 text-warning-700',
  completed: 'bg-success-100 text-success-700',
  flagged: 'bg-error-100 text-error-700',
};

const statusLabels: Record<PickTaskStatus, string> = {
  pending: 'Pending', in_progress: 'In Progress', paused: 'Paused', completed: 'Completed', flagged: 'Flagged',
};

interface ScanLogEntry {
  id: string;
  sku: string;
  task: PickTask | null;
  status: 'success' | 'not_found' | 'already_picked' | 'wrong_status';
  message: string;
  timestamp: string;
}

export function PickingPage() {
  const { pickTasks, updatePickTaskStatus } = useStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [scanInput, setScanInput] = useState('');
  const [scanLog, setScanLog] = useState<ScanLogEntry[]>([]);
  const [scanFlash, setScanFlash] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    return pickTasks.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (zoneFilter !== 'all' && t.zoneId !== zoneFilter) return false;
      return true;
    });
  }, [pickTasks, statusFilter, zoneFilter]);

  const activePickers = employees.filter(e => e.role === 'picker');
  const completed = pickTasks.filter(t => t.status === 'completed').length;
  const inProgress = pickTasks.filter(t => t.status === 'in_progress').length;
  const avgPickTime = pickTasks.filter(t => t.status === 'completed').reduce((s, t) => s + t.elapsedMinutes, 0) / (completed || 1);

  const demoRoute = ['A1', 'F2', 'B1', 'D3', 'A3'];
  const routeOpt = optimizePickRoute(demoRoute);

  const handleScan = useCallback((rawInput: string) => {
    const sku = rawInput.trim().toUpperCase();
    if (!sku) return;

    const task = pickTasks.find(t => t.sku.toUpperCase() === sku);

    let entry: ScanLogEntry;

    if (!task) {
      entry = { id: `scan-${Date.now()}`, sku, task: null, status: 'not_found', message: `SKU ${sku} not found in any pick task`, timestamp: new Date().toISOString() };
      setScanFlash({ type: 'error', msg: `SKU ${sku} not found` });
    } else if (task.status === 'completed') {
      entry = { id: `scan-${Date.now()}`, sku, task, status: 'already_picked', message: `${task.id} for ${task.orderId} already completed`, timestamp: new Date().toISOString() };
      setScanFlash({ type: 'info', msg: `${task.sku} already picked for ${task.orderId}` });
    } else if (task.status === 'flagged') {
      entry = { id: `scan-${Date.now()}`, sku, task, status: 'wrong_status', message: `${task.id} is flagged — resolve the flag first`, timestamp: new Date().toISOString() };
      setScanFlash({ type: 'error', msg: `Task ${task.id} is flagged — resolve first` });
    } else {
      updatePickTaskStatus(task.id, 'completed');
      entry = { id: `scan-${Date.now()}`, sku, task, status: 'success', message: `${task.id} completed — ${task.orderId} · ${task.quantity} units picked from ${task.bin}`, timestamp: new Date().toISOString() };
      setScanFlash({ type: 'success', msg: `${task.sku} picked — ${task.orderId} complete` });
    }

    setScanLog(prev => [entry, ...prev].slice(0, 12));
    setScanInput('');
    setTimeout(() => scanRef.current?.focus(), 50);

    setTimeout(() => setScanFlash(null), 3000);
  }, [pickTasks, updatePickTaskStatus]);

  const quickScanSkus = pickTasks.filter(t => t.status === 'in_progress' || t.status === 'pending').slice(0, 5).map(t => t.sku);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink-800">Picking Management</h1>
        <p className="text-sm text-ink-500 mt-0.5">{pickTasks.length} pick tasks · {inProgress} in progress · {completed} completed</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="label mb-1">Active Pickers</p>
          <p className="text-xl font-bold text-ink-800">{activePickers.filter(p => p.status === 'active').length}/{activePickers.length}</p>
        </Card>
        <Card className="p-3">
          <p className="label mb-1">Avg Pick Time</p>
          <p className="text-xl font-bold text-ink-800">{avgPickTime.toFixed(1)}m</p>
          <p className="text-[10px] text-ink-400">per task</p>
        </Card>
        <Card className="p-3">
          <p className="label mb-1">Completed Today</p>
          <p className="text-xl font-bold text-success-600">{completed}</p>
        </Card>
        <Card className="p-3">
          <p className="label mb-1">Waiting</p>
          <p className="text-xl font-bold text-warning-600">{pickTasks.filter(t => t.status === 'pending').length}</p>
        </Card>
      </div>

      {/* Scan Panel */}
      <Card className="p-4 border-2 border-primary-200 dark:border-primary-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <ScanLine className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink-800 dark:text-ink-200">Scan to Update</h3>
            <p className="text-[10px] text-ink-500">Scan or type a SKU to mark its pick task as completed</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              ref={scanRef}
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleScan(scanInput); }}
              placeholder="Scan or type SKU (e.g. WH-105)..."
              className="input pl-9 !text-sm font-mono"
              autoFocus
            />
            {scanInput && (
              <button onClick={() => setScanInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={() => handleScan(scanInput)} disabled={!scanInput.trim()} className="btn-primary !py-2">
            <PackageCheck className="w-4 h-4" /> Pick
          </button>
        </div>

        <CameraScanner onScan={handleScan} />

        {/* Quick scan buttons */}
        {quickScanSkus.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-ink-400 font-medium">Quick scan:</span>
            {quickScanSkus.map(sku => (
              <button
                key={sku}
                onClick={() => handleScan(sku)}
                className="px-2 py-0.5 rounded-md bg-ink-100 dark:bg-ink-800 hover:bg-primary-100 dark:hover:bg-primary-900 text-[10px] font-mono font-semibold text-ink-600 dark:text-ink-400 hover:text-primary-700 dark:hover:text-primary-400 transition-colors"
              >
                {sku}
              </button>
            ))}
          </div>
        )}

        {/* Flash message */}
        {scanFlash && (
          <div className={classNames(
            'mt-2.5 p-2.5 rounded-lg flex items-center gap-2 text-xs font-medium animate-fade-in',
            scanFlash.type === 'success' ? 'bg-success-50 dark:bg-success-950/40 text-success-700 dark:text-success-400 border border-success-200 dark:border-success-800' :
            scanFlash.type === 'error' ? 'bg-error-50 dark:bg-error-950/40 text-error-700 dark:text-error-400 border border-error-200 dark:border-error-800' :
            'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
          )}>
            {scanFlash.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : scanFlash.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <PackageCheck className="w-4 h-4 shrink-0" />}
            {scanFlash.msg}
          </div>
        )}

        {/* Scan log */}
        {scanLog.length > 0 && (
          <div className="mt-3 pt-3 border-t border-ink-200 dark:border-ink-800">
            <div className="flex items-center gap-1.5 mb-2">
              <History className="w-3.5 h-3.5 text-ink-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Scan History</span>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {scanLog.map(entry => (
                <div key={entry.id} className={classNames(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px]',
                  entry.status === 'success' ? 'bg-success-50 dark:bg-success-950/30' :
                  entry.status === 'not_found' ? 'bg-error-50 dark:bg-error-950/30' :
                  entry.status === 'already_picked' ? 'bg-ink-50 dark:bg-ink-800/50' :
                  'bg-warning-50 dark:bg-warning-950/30'
                )}>
                  <span className={classNames(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    entry.status === 'success' ? 'bg-success-500' :
                    entry.status === 'not_found' ? 'bg-error-500' :
                    entry.status === 'already_picked' ? 'bg-ink-400' :
                    'bg-warning-500'
                  )} />
                  <span className="font-mono font-semibold text-ink-700 dark:text-ink-300 shrink-0">{entry.sku}</span>
                  <span className="text-ink-500 dark:text-ink-400 flex-1 truncate">{entry.message}</span>
                  <span className="text-ink-400 shrink-0">{timeAgo(entry.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Zone congestion */}
        <Card className="p-4 lg:col-span-1">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">Zone Congestion</h3>
          <div className="space-y-3">
            {warehouseConfig.zones.map(zone => (
              <div key={zone.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-ink-600">{zone.name.split(' — ')[0]}</span>
                  <span className={classNames('font-semibold', zone.congestion > 70 ? 'text-error-600' : zone.congestion > 50 ? 'text-warning-600' : 'text-success-600')}>{zone.congestion}%</span>
                </div>
                <ProgressBar value={zone.congestion} barClassName={zone.congestion > 70 ? 'bg-error-500' : zone.congestion > 50 ? 'bg-warning-500' : 'bg-success-500'} />
                <p className="text-[10px] text-ink-400 mt-0.5">{zone.avgPickTime}m avg · {zone.pickerCount} pickers</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Route optimization */}
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Route className="w-4 h-4 text-accent-600" />
            <h3 className="text-sm font-semibold text-ink-700">Optimized Picking Route</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="label mb-2">Original Route</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {routeOpt.original.map((a, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1.5 rounded-lg bg-ink-100 text-xs font-semibold text-ink-600">{a}</span>
                    {i < routeOpt.original.length - 1 && <span className="text-ink-300">→</span>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="label mb-2">Optimized Route</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {routeOpt.optimized.map((a, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1.5 rounded-lg bg-accent-100 text-xs font-semibold text-accent-700">{a}</span>
                    {i < routeOpt.optimized.length - 1 && <span className="text-accent-400">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-accent-50 border border-accent-100 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-accent-600" />
            <span className="text-sm font-semibold text-accent-700">Estimated travel reduction: {routeOpt.travelReduction}%</span>
          </div>
        </Card>
      </div>

      {/* Active pickers */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-primary-600" /> Active Pickers</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {activePickers.map(p => (
            <div key={p.id} className="p-3 rounded-lg border border-ink-200 text-center">
              <Avatar name={p.name} color={p.avatarColor} size={40} />
              <p className="text-xs font-semibold text-ink-700 mt-2">{p.name}</p>
              <p className="text-[10px] text-ink-400">{warehouseConfig.zones.find(z => z.id === p.zoneId)?.name.split(' — ')[0] || 'Unassigned'}</p>
              <div className="flex items-center justify-center gap-1 mt-1.5">
                <span className={classNames('w-1.5 h-1.5 rounded-full', p.status === 'active' ? 'bg-success-500' : 'bg-ink-300')} />
                <span className="text-[10px] text-ink-500">{p.status === 'active' ? 'Active' : 'Idle'}</span>
              </div>
              <p className="text-[10px] text-ink-400 mt-0.5">{p.ordersHandled} picks · {p.avgPickTime.toFixed(1)}m avg</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Task table */}
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select w-auto">
            <option value="all">All Statuses</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} className="select w-auto">
            <option value="all">All Zones</option>
            {warehouseConfig.zones.map(z => <option key={z.id} value={z.id}>{z.name.split(' — ')[0]}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50/50">
                <th className="text-left px-3 py-2.5 label">Pick ID</th>
                <th className="text-left px-3 py-2.5 label">Order</th>
                <th className="text-left px-3 py-2.5 label">Picker</th>
                <th className="text-left px-3 py-2.5 label">Zone</th>
                <th className="text-left px-3 py-2.5 label">SKU</th>
                <th className="text-right px-3 py-2.5 label">Qty</th>
                <th className="text-left px-3 py-2.5 label">Location</th>
                <th className="text-left px-3 py-2.5 label">Priority</th>
                <th className="text-left px-3 py-2.5 label">Status</th>
                <th className="text-left px-3 py-2.5 label">Progress</th>
                <th className="text-right px-3 py-2.5 label">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => {
                const picker = task.picker ? employees.find(e => e.id === task.picker) : null;
                const zone = warehouseConfig.zones.find(z => z.id === task.zoneId);
                return (
                  <tr key={task.id} className="border-b border-ink-100 table-row-hover">
                    <td className="px-3 py-3 text-xs font-semibold text-ink-700">{task.id}</td>
                    <td className="px-3 py-3 text-xs text-ink-600">{task.orderId}</td>
                    <td className="px-3 py-3">
                      {picker ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar name={picker.name} color={picker.avatarColor} size={20} />
                          <span className="text-xs text-ink-600">{picker.name.split(' ')[0]}</span>
                        </div>
                      ) : <span className="text-xs text-ink-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-xs text-ink-500">{zone?.name.split(' — ')[0] || task.zoneId}</td>
                    <td className="px-3 py-3 text-xs font-medium text-primary-600">{task.sku}</td>
                    <td className="px-3 py-3 text-xs text-right text-ink-600">{task.quantity}</td>
                    <td className="px-3 py-3 text-xs text-ink-500">{task.bin}</td>
                    <td className="px-3 py-3"><Badge className={priorityStyles[task.priority]} dot={priorityDot[task.priority]}><span className="capitalize">{task.priority}</span></Badge></td>
                    <td className="px-3 py-3"><span className={classNames('chip', statusStyles[task.status])}>{statusLabels[task.status]}</span></td>
                    <td className="px-3 py-3 min-w-[80px]">
                      {task.status === 'in_progress' || task.status === 'completed' ? (
                        <>
                          <ProgressBar value={task.elapsedMinutes} max={task.estimatedMinutes} barClassName={task.elapsedMinutes > task.estimatedMinutes ? 'bg-error-500' : 'bg-primary-500'} />
                          <p className="text-[10px] text-ink-400 mt-0.5">{task.elapsedMinutes}/{task.estimatedMinutes}m</p>
                        </>
                      ) : <span className="text-[10px] text-ink-300">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {task.status === 'pending' && <button onClick={() => updatePickTaskStatus(task.id, 'in_progress')} className="btn-ghost p-1.5" title="Start"><Play className="w-3.5 h-3.5 text-success-600" /></button>}
                        {task.status === 'in_progress' && <button onClick={() => updatePickTaskStatus(task.id, 'paused')} className="btn-ghost p-1.5" title="Pause"><Pause className="w-3.5 h-3.5 text-warning-600" /></button>}
                        {task.status === 'paused' && <button onClick={() => updatePickTaskStatus(task.id, 'in_progress')} className="btn-ghost p-1.5" title="Resume"><Play className="w-3.5 h-3.5 text-success-600" /></button>}
                        {(task.status === 'in_progress' || task.status === 'paused') && <button onClick={() => updatePickTaskStatus(task.id, 'completed')} className="btn-ghost p-1.5" title="Complete"><CheckCircle2 className="w-3.5 h-3.5 text-accent-600" /></button>}
                        {task.status !== 'flagged' && task.status !== 'completed' && <button onClick={() => updatePickTaskStatus(task.id, 'flagged')} className="btn-ghost p-1.5" title="Flag"><Flag className="w-3.5 h-3.5 text-error-600" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
