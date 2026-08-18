import { useState } from 'react';
import {
  LayoutDashboard, Package, Boxes, GitBranch, Hand, PackageCheck, AlertTriangle,
  Truck, BarChart3, Settings, Warehouse, Search, Bell, ChevronDown, Zap, User,
  Menu, X, CircleDot,
} from 'lucide-react';
import { useStore, type PageId } from '@/store';
import { warehouses, currentUser } from '@/data/mockData';
import { classNames, timeAgo } from '@/lib/utils';
import { Avatar } from '@/components/ui';

const navItems: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'allocation', label: 'Allocation', icon: GitBranch },
  { id: 'picking', label: 'Picking', icon: Hand },
  { id: 'packing', label: 'Packing', icon: PackageCheck },
  { id: 'exceptions', label: 'Exceptions', icon: AlertTriangle },
  { id: 'dispatch', label: 'Dispatch', icon: Truck },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'simulator', label: 'Decision Simulator', icon: Zap },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const { page, setPage, exceptions, orders } = useStore();
  const openExceptions = exceptions.filter(e => e.status === 'open' || e.status === 'escalated').length;
  const atRiskOrders = orders.filter(o => o.atRisk).length;

  const badge: Partial<Record<PageId, number>> = {
    exceptions: openExceptions, orders: atRiskOrders,
  };

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-ink-950/50 lg:hidden" onClick={onClose} />}
      <aside className={classNames(
        'fixed lg:static z-40 h-full w-60 bg-ink-900 text-ink-300 flex flex-col shrink-0 transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-ink-800 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-900/30">
            <Warehouse className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-tight">WarehouseIQ</p>
            <p className="text-[10px] text-ink-500 font-medium uppercase tracking-wider">Command Center</p>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden text-ink-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 no-scrollbar">
          {navItems.map(item => {
            const active = page === item.id;
            const count = badge[item.id];
            return (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); onClose(); }}
                className={classNames(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                  active ? 'bg-primary-600 text-white shadow-md shadow-primary-900/30' : 'text-ink-400 hover:bg-ink-800 hover:text-white',
                )}
              >
                <item.icon className={classNames('w-[18px] h-[18px] shrink-0', active ? 'text-white' : 'text-ink-500 group-hover:text-white')} />
                <span className="flex-1 text-left">{item.label}</span>
                {count && count > 0 ? (
                  <span className={classNames(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                    active ? 'bg-white/20 text-white' : item.id === 'exceptions' ? 'bg-error-500/20 text-error-400' : 'bg-warning-500/20 text-warning-400',
                  )}>{count}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Shift indicator */}
        <div className="px-3 pb-3 shrink-0">
          <div className="rounded-lg bg-ink-800/60 border border-ink-700/50 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <CircleDot className="w-3.5 h-3.5 text-accent-400 animate-pulse-soft" />
              <span className="text-xs font-semibold text-white">Day Shift Active</span>
            </div>
            <p className="text-[10px] text-ink-500">06:00 – 18:00 · 8 employees on floor</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { notifications, markAllNotificationsRead, markNotificationRead, setPage, selectedWarehouse, setSelectedWarehouse } = useStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [whOpen, setWhOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const unread = notifications.filter(n => !n.read).length;
  const wh = warehouses.find(w => w.id === selectedWarehouse) || warehouses[0];

  return (
    <header className="h-16 bg-white border-b border-ink-200 flex items-center gap-3 px-4 lg:px-6 shrink-0 relative z-20">
      <button onClick={onMenuClick} className="lg:hidden btn-ghost p-1.5">
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <input
          type="text"
          placeholder="Search orders, SKUs, products..."
          className="input pl-9 bg-ink-50 border-ink-200 focus:bg-white"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Warehouse selector */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => { setWhOpen(!whOpen); setNotifOpen(false); setProfileOpen(false); }}
            className="btn-secondary !py-1.5"
          >
            <Warehouse className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-semibold">{wh.code}</span>
            <ChevronDown className="w-3.5 h-3.5 text-ink-400" />
          </button>
          {whOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 card shadow-panel p-1.5 animate-scale-in z-50">
              {warehouses.map(w => (
                <button
                  key={w.id}
                  onClick={() => { setSelectedWarehouse(w.id); setWhOpen(false); }}
                  className={classNames('w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-ink-50 transition-colors', w.id === selectedWarehouse && 'bg-primary-50')}
                >
                  <p className="font-medium text-ink-700 text-xs">{w.name}</p>
                  <p className="text-[10px] text-ink-400">{w.code} · {w.location}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Shift indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent-50 border border-accent-100">
          <CircleDot className="w-3.5 h-3.5 text-accent-500 animate-pulse-soft" />
          <span className="text-xs font-semibold text-accent-700">Day Shift</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setWhOpen(false); setProfileOpen(false); }}
            className="relative btn-ghost p-2"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-error-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unread}</span>
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-80 sm:w-96 card shadow-panel animate-scale-in z-50 max-h-[70vh] flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-ink-200">
                  <span className="text-sm font-semibold text-ink-800">Notifications</span>
                  <button onClick={markAllNotificationsRead} className="text-xs text-primary-600 font-medium hover:underline">Mark all read</button>
                </div>
                <div className="overflow-y-auto flex-1">
                  {notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => { markNotificationRead(n.id); setPage(n.link.page as PageId); setNotifOpen(false); }}
                      className={classNames('w-full text-left px-4 py-3 border-b border-ink-100 hover:bg-ink-50 transition-colors flex gap-3', !n.read && 'bg-primary-50/50')}
                    >
                      <span className={classNames('w-2 h-2 rounded-full mt-1.5 shrink-0', n.severity === 'critical' ? 'bg-error-500' : n.severity === 'high' ? 'bg-warning-500' : 'bg-primary-500')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-ink-700">{n.title}</p>
                        <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-ink-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); setWhOpen(false); }} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-ink-100 transition-colors">
            <Avatar name={currentUser.name} color={currentUser.avatarColor} size={30} />
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-ink-700 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-ink-400">Warehouse Manager</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-ink-400 hidden lg:block" />
          </button>
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 card shadow-panel p-1.5 animate-scale-in z-50">
                <div className="px-3 py-2 border-b border-ink-100 mb-1">
                  <p className="text-sm font-semibold text-ink-700">{currentUser.name}</p>
                  <p className="text-xs text-ink-400">{currentUser.email}</p>
                </div>
                <button onClick={() => { setPage('settings'); setProfileOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-ink-50 flex items-center gap-2 text-ink-600">
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-ink-50 flex items-center gap-2 text-ink-600">
                  <User className="w-4 h-4" /> Profile
                </button>
                <div className="border-t border-ink-100 my-1" />
                <button className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-error-50 flex items-center gap-2 text-error-600">
                  <X className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
