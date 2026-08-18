import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Order, Product, Notification, Recommendation, Exception, Shipment, PickTask, PackingTask } from '@/types';
import * as mockData from '@/data/mockData';
import { enrichOrderPriority, isOrderAtRisk } from '@/lib/decisionEngine';

export type PageId = 'dashboard' | 'orders' | 'inventory' | 'allocation' | 'picking' | 'packing' | 'exceptions' | 'dispatch' | 'analytics' | 'simulator' | 'settings' | 'favorites' | 'support' | 'profile';

export interface FavoriteItem {
  id: string;
  type: 'order' | 'product';
  name: string;
  sublabel: string;
  addedAt: string;
}

export interface RecentItem {
  id: string;
  type: 'order' | 'product' | 'page';
  name: string;
  sublabel: string;
  viewedAt: string;
}

interface StoreState {
  page: PageId;
  setPage: (p: PageId) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  orders: Order[];
  products: Product[];
  exceptions: Exception[];
  shipments: Shipment[];
  pickTasks: PickTask[];
  packingTasks: PackingTask[];
  notifications: Notification[];
  recommendations: Recommendation[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissRecommendation: (id: string) => void;
  overrideOrderPriority: (orderId: string, newPriority: Order['priority'], reason: string) => void;
  resolveException: (id: string, action: string, note: string) => void;
  applyRecommendation: (id: string) => void;
  allocateOrder: (orderId: string) => void;
  updatePickTaskStatus: (taskId: string, status: PickTask['status']) => void;
  triggerDemoEvent: () => string;
  selectedWarehouse: string;
  setSelectedWarehouse: (w: string) => void;
  demoLog: string[];
  favorites: FavoriteItem[];
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorite: (id: string) => boolean;
  recents: RecentItem[];
  addRecent: (item: RecentItem) => void;
  recentSearches: string[];
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
}

const StoreContext = createContext<StoreState | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<PageId>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>(() => mockData.orders.map(o => enrichOrderPriority({ ...o, atRisk: isOrderAtRisk(o) })));
  const [products] = useState<Product[]>(mockData.products);
  const [exceptions, setExceptions] = useState<Exception[]>(mockData.exceptions);
  const [shipments] = useState<Shipment[]>(mockData.shipments);
  const [pickTasks, setPickTasks] = useState<PickTask[]>(mockData.pickTasks);
  const [packingTasks] = useState<PackingTask[]>(mockData.packingTasks);
  const [notifications, setNotifications] = useState<Notification[]>(mockData.notifications);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(mockData.recommendations);
  const [selectedWarehouse, setSelectedWarehouse] = useState(mockData.warehouses[0].id);
  const [demoLog, setDemoLog] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('warehouseiq-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [recents, setRecents] = useState<RecentItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('warehouseiq-recents');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('warehouseiq-recent-searches');
    return saved ? JSON.parse(saved) : [];
  });

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissRecommendation = useCallback((id: string) => {
    setRecommendations(prev => prev.map(r => r.id === id ? { ...r, dismissed: true } : r));
  }, []);

  const applyRecommendation = useCallback((id: string) => {
    setRecommendations(prev => prev.map(r => r.id === id ? { ...r, dismissed: true } : r));
  }, []);

  const overrideOrderPriority = useCallback((orderId: string, newPriority: Order['priority'], reason: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const updated = { ...o, priority: newPriority, overriddenPriority: { from: o.priority, to: newPriority, reason, by: 'Liam Kowalski' } };
      return enrichOrderPriority(updated);
    }));
  }, []);

  const resolveException = useCallback((id: string, action: string, note: string) => {
    setExceptions(prev => prev.map(e => e.id === id ? {
      ...e, status: 'resolved',
      resolutionHistory: [...e.resolutionHistory, { action, by: 'Liam Kowalski', at: new Date().toISOString(), note }],
    } : e));
  }, []);

  const allocateOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const items = o.items.map(it => ({ ...it, allocated: Math.min(it.quantity, it.available) }));
      const allAllocated = items.every(it => it.allocated >= it.quantity);
      return { ...o, items, status: 'allocated' as const, allocationStatus: allAllocated ? 'full' as const : 'partial' as const };
    }));
  }, []);

  const updatePickTaskStatus = useCallback((taskId: string, status: PickTask['status']) => {
    setPickTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  }, []);

  const triggerDemoEvent = useCallback(() => {
    const events = [
      { type: 'new_order', msg: 'New urgent order ORD-1098 received — 8 items, critical priority', notif: { type: 'new_order' as const, title: 'New urgent order received', message: 'ORD-1098 received with critical priority, 8 items.', severity: 'high' as const, link: { page: 'orders' as const } } },
      { type: 'inventory', msg: 'Inventory shortage detected — SKU WH-108 dropped to 3 units', notif: { type: 'low_stock' as const, title: 'SKU below reorder point', message: 'WH-108 (Noise-Cancel Headphones) critically low at 3 units.', severity: 'high' as const, link: { page: 'inventory' as const, id: 'WH-108' } } },
      { type: 'damaged', msg: 'Damaged item reported — 2 units of WH-120 damaged in Zone E', notif: { type: 'damaged' as const, title: 'Damaged inventory reported', message: '2 units of WH-120 damaged in Zone E during picking.', severity: 'medium' as const, link: { page: 'exceptions' as const } } },
      { type: 'picker_delay', msg: 'Picker delay — Zone B pick time exceeded by 35%', notif: { type: 'zone_congested' as const, title: 'Picking zone congested', message: 'Zone B congestion at 85%. Pick times elevated.', severity: 'medium' as const, link: { page: 'picking' as const } } },
      { type: 'packing', msg: 'Packing station failure — Station 3 requires maintenance', notif: { type: 'allocation_conflict' as const, title: 'Packing station down', message: 'Station 3 offline. 4 orders reassigned to queue.', severity: 'high' as const, link: { page: 'packing' as const } } },
      { type: 'dispatch', msg: 'Dispatch cutoff approaching — 12 minutes to carrier pickup', notif: { type: 'dispatch_cutoff' as const, title: 'Dispatch cutoff in 12 minutes', message: '2 shipments not ready for carrier pickup.', severity: 'critical' as const, link: { page: 'dispatch' as const } } },
    ];
    const event = events[Math.floor(Math.random() * events.length)];
    const newNotif: Notification = { ...event.notif, id: `N${Date.now()}`, read: false, createdAt: new Date().toISOString() };
    setNotifications(prev => [newNotif, ...prev]);
    setDemoLog(prev => [`[${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}] ${event.msg}`, ...prev].slice(0, 20));
    return event.msg;
  }, []);

  const toggleFavorite = useCallback((item: FavoriteItem) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === item.id && f.type === item.type);
      const next = exists ? prev.filter(f => !(f.id === item.id && f.type === item.type)) : [item, ...prev];
      localStorage.setItem('warehouseiq-favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => favorites.some(f => f.id === id), [favorites]);

  const addRecent = useCallback((item: RecentItem) => {
    setRecents(prev => {
      const filtered = prev.filter(r => !(r.id === item.id && r.type === item.type));
      const next = [item, ...filtered].slice(0, 20);
      localStorage.setItem('warehouseiq-recents', JSON.stringify(next));
      return next;
    });
  }, []);

  const addRecentSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== q.toLowerCase());
      const next = [q, ...filtered].slice(0, 8);
      localStorage.setItem('warehouseiq-recent-searches', JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('warehouseiq-recent-searches');
  }, []);

  const value: StoreState = {
    page, setPage, selectedOrderId, setSelectedOrderId,
    selectedProductId, setSelectedProductId,
    orders, products, exceptions, shipments, pickTasks, packingTasks,
    notifications, recommendations,
    markNotificationRead, markAllNotificationsRead,
    dismissRecommendation, overrideOrderPriority,
    resolveException, applyRecommendation, allocateOrder,
    updatePickTaskStatus, triggerDemoEvent,
    selectedWarehouse, setSelectedWarehouse, demoLog,
    favorites, toggleFavorite, isFavorite,
    recents, addRecent,
    recentSearches, addRecentSearch, clearRecentSearches,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
