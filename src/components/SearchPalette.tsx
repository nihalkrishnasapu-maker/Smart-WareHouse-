import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Search, Package, Boxes, Clock, ArrowRight, X, TrendingUp, AlertTriangle, Truck, BarChart3 } from 'lucide-react';
import { useStore, type PageId } from '@/store';
import { classNames } from '@/lib/utils';
import { orderStatusLabels } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'order' | 'product' | 'page' | 'exception';
  title: string;
  sublabel: string;
  icon: typeof Package;
  action: () => void;
}

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { orders, products, exceptions, setPage, setSelectedOrderId, setSelectedProductId, recentSearches, addRecentSearch, clearRecentSearches } = useStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const results: SearchResult[] = [];

  if (query.trim()) {
    const q = query.toLowerCase();
    orders.filter(o => o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)).slice(0, 5).forEach(o => {
      results.push({
        id: o.id, type: 'order', title: o.id, sublabel: `${o.customer} · ${orderStatusLabels[o.status]}`, icon: Package,
        action: () => { setSelectedOrderId(o.id); setPage('orders'); onClose(); },
      });
    });
    products.filter(p => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)).slice(0, 5).forEach(p => {
      results.push({
        id: p.sku, type: 'product', title: p.name, sublabel: `${p.sku} · ${p.category} · ${p.available} in stock`, icon: Boxes,
        action: () => { setSelectedProductId(p.sku); setPage('inventory'); onClose(); },
      });
    });
    exceptions.filter(e => e.description.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)).slice(0, 3).forEach(e => {
      results.push({
        id: e.id, type: 'exception', title: e.id, sublabel: e.description.slice(0, 60), icon: AlertTriangle,
        action: () => { setPage('exceptions'); onClose(); },
      });
    });
  }

  // Page suggestions
  const pageSuggestions: { id: PageId; label: string; icon: typeof Package; keywords: string[] }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, keywords: ['dashboard', 'overview', 'home', 'kpi'] },
    { id: 'orders', label: 'Orders', icon: Package, keywords: ['order', 'fulfillment', 'customer'] },
    { id: 'inventory', label: 'Inventory', icon: Boxes, keywords: ['inventory', 'stock', 'sku', 'product'] },
    { id: 'allocation', label: 'Allocation', icon: Truck, keywords: ['allocation', 'conflict', 'stock'] },
    { id: 'picking', label: 'Picking', icon: Package, keywords: ['picking', 'picker', 'zone', 'aisle'] },
    { id: 'packing', label: 'Packing', icon: Package, keywords: ['packing', 'pack', 'station'] },
    { id: 'exceptions', label: 'Exceptions', icon: AlertTriangle, keywords: ['exception', 'error', 'damaged', 'issue'] },
    { id: 'dispatch', label: 'Dispatch', icon: Truck, keywords: ['dispatch', 'shipping', 'carrier', 'shipment'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, keywords: ['analytics', 'metrics', 'bottleneck', 'performance'] },
    { id: 'simulator', label: 'Decision Simulator', icon: TrendingUp, keywords: ['simulate', 'what-if', 'scenario'] },
    { id: 'settings', label: 'Settings', icon: Package, keywords: ['settings', 'config', 'preferences'] },
  ];

  const matchingPages = query.trim()
    ? pageSuggestions.filter(p => p.label.toLowerCase().includes(query.toLowerCase()) || p.keywords.some(k => k.includes(query.toLowerCase())))
    : [];

  matchingPages.forEach(p => {
    results.push({
      id: `page-${p.id}`, type: 'page', title: p.label, sublabel: 'Navigate to page', icon: p.icon,
      action: () => { setPage(p.id); onClose(); },
    });
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[selectedIndex]) { e.preventDefault(); results[selectedIndex].action(); addRecentSearch(query); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  const handleSearch = (q: string) => {
    setQuery(q);
    setSelectedIndex(0);
  };

  const handleSubmit = () => {
    if (results[selectedIndex]) {
      results[selectedIndex].action();
      if (query.trim()) addRecentSearch(query);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] px-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-ink-900 rounded-2xl shadow-panel border border-ink-200 dark:border-ink-800 animate-scale-in overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-ink-200 dark:border-ink-800">
          <Search className="w-5 h-5 text-ink-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search orders, SKUs, products, pages..."
            className="flex-1 bg-transparent text-sm text-ink-800 dark:text-ink-200 placeholder:text-ink-400 focus:outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-ink-400 bg-ink-100 dark:bg-ink-800 border border-ink-200 dark:border-ink-700">ESC</kbd>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600"><X className="w-4 h-4" /></button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {results.length === 0 && !query.trim() && (
            <div className="p-4">
              {recentSearches.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="label">Recent Searches</span>
                    <button onClick={clearRecentSearches} className="text-[10px] text-primary-600 dark:text-primary-400 hover:underline">Clear</button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((s, i) => (
                      <button key={i} onClick={() => handleSearch(s)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-xs text-ink-600 dark:text-ink-400">
                        <Clock className="w-3.5 h-3.5 text-ink-400" /> {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className="mt-3">
                <span className="label block mb-2">Quick Navigation</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {pageSuggestions.slice(0, 8).map(p => (
                    <button key={p.id} onClick={() => { setPage(p.id); onClose(); }} className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-xs font-medium text-ink-600 dark:text-ink-400">
                      <p.icon className="w-3.5 h-3.5 text-ink-400" /> {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {results.length === 0 && query.trim() && (
            <div className="p-8 text-center">
              <Search className="w-8 h-8 text-ink-300 mx-auto mb-2" />
              <p className="text-sm text-ink-500">No results found for "{query}"</p>
              <p className="text-xs text-ink-400 mt-1">Try searching for order IDs, SKUs, or product names</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="py-1.5">
              {results.map((r, i) => (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => { r.action(); if (query.trim()) addRecentSearch(query); }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={classNames(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    i === selectedIndex ? 'bg-primary-50 dark:bg-primary-950/40' : 'hover:bg-ink-50 dark:hover:bg-ink-800',
                  )}
                >
                  <div className={classNames('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', r.type === 'order' ? 'bg-primary-100 dark:bg-primary-900' : r.type === 'product' ? 'bg-accent-100 dark:bg-accent-900' : r.type === 'exception' ? 'bg-error-100 dark:bg-error-900' : 'bg-ink-100 dark:bg-ink-800')}>
                    <r.icon className={classNames('w-4 h-4', r.type === 'order' ? 'text-primary-600 dark:text-primary-400' : r.type === 'product' ? 'text-accent-600 dark:text-accent-400' : r.type === 'exception' ? 'text-error-600 dark:text-error-400' : 'text-ink-500')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-800 dark:text-ink-200 truncate">{r.title}</p>
                    <p className="text-xs text-ink-500 truncate">{r.sublabel}</p>
                  </div>
                  <span className="text-[10px] text-ink-400 uppercase tracking-wide shrink-0">{r.type}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-ink-300 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-ink-200 dark:border-ink-800 bg-ink-50 dark:bg-ink-950/50">
          <div className="flex items-center gap-3 text-[10px] text-ink-400">
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-ink-200 dark:bg-ink-800 font-mono">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-ink-200 dark:bg-ink-800 font-mono">↵</kbd> Select</span>
          </div>
          <span className="text-[10px] text-ink-400">{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
