import { useState, useMemo } from 'react';
import { Search, Boxes, TrendingDown, AlertTriangle, Package, MapPin, Clock, Calendar, ArrowDown } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Badge, Drawer, ProgressBar, EmptyState, SectionTitle } from '@/components/ui';
import { Sparkline, LineChart } from '@/components/charts';
import { classNames, stockHealthStyles, stockHealthLabels, formatCurrency, formatNumber } from '@/lib/utils';
import { getStockHealth, daysOfCoverage, projectedDepletionDate, reorderRecommended } from '@/lib/decisionEngine';
import { warehouseConfig } from '@/data/mockData';
import type { Product } from '@/types';

export function InventoryPage() {
  const { products, selectedProductId, setSelectedProductId } = useStore();
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (search && !p.sku.toLowerCase().includes(search.toLowerCase()) && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (healthFilter !== 'all' && getStockHealth(p) !== healthFilter) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      return true;
    });
  }, [products, search, healthFilter, categoryFilter]);

  const selectedProduct = products.find(p => p.id === selectedProductId || p.sku === selectedProductId);
  const healthCounts = {
    healthy: products.filter(p => getStockHealth(p) === 'healthy').length,
    low_stock: products.filter(p => getStockHealth(p) === 'low_stock').length,
    critical: products.filter(p => getStockHealth(p) === 'critical').length,
    out_of_stock: products.filter(p => getStockHealth(p) === 'out_of_stock').length,
    overstocked: products.filter(p => getStockHealth(p) === 'overstocked').length,
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink-800">Inventory Management</h1>
        <p className="text-sm text-ink-500 mt-0.5">{products.length} SKUs across {warehouseConfig.zones.length} zones</p>
      </div>

      {/* Health summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(stockHealthLabels).map(([key, label]) => (
          <Card key={key} hover className="p-3 cursor-pointer" >
            <div className="flex items-center gap-2 mb-1">
              <span className={classNames('w-2.5 h-2.5 rounded-full', key === 'healthy' ? 'bg-success-500' : key === 'low_stock' ? 'bg-warning-500' : key === 'critical' ? 'bg-error-500' : key === 'out_of_stock' ? 'bg-error-700' : 'bg-secondary-500')} />
              <span className="text-xs font-medium text-ink-600">{label}</span>
            </div>
            <p className="text-xl font-bold text-ink-800">{healthCounts[key as keyof typeof healthCounts]}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SKU or product name..." className="input pl-9" />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="select w-auto">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={healthFilter} onChange={e => setHealthFilter(e.target.value)} className="select w-auto">
            <option value="all">All Health</option>
            {Object.entries(stockHealthLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50/50">
                <th className="text-left px-4 py-2.5 label">SKU</th>
                <th className="text-left px-4 py-2.5 label">Product</th>
                <th className="text-left px-4 py-2.5 label">Category</th>
                <th className="text-right px-4 py-2.5 label">Available</th>
                <th className="text-right px-4 py-2.5 label">Reserved</th>
                <th className="text-right px-4 py-2.5 label">In Picking</th>
                <th className="text-right px-4 py-2.5 label">Damaged</th>
                <th className="text-right px-4 py-2.5 label">Reorder Pt</th>
                <th className="text-left px-4 py-2.5 label">Location</th>
                <th className="text-left px-4 py-2.5 label">Coverage</th>
                <th className="text-left px-4 py-2.5 label">Health</th>
                <th className="text-left px-4 py-2.5 label">Trend</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const health = getStockHealth(p);
                const coverage = daysOfCoverage(p);
                return (
                  <tr key={p.id} onClick={() => setSelectedProductId(p.sku)} className="border-b border-ink-100 table-row-hover cursor-pointer">
                    <td className="px-4 py-3 text-xs font-semibold text-primary-600">{p.sku}</td>
                    <td className="px-4 py-3 text-xs font-medium text-ink-700">{p.name}</td>
                    <td className="px-4 py-3 text-xs text-ink-500">{p.category}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-right text-ink-700">{formatNumber(p.available)}</td>
                    <td className="px-4 py-3 text-xs text-right text-ink-500">{p.reserved}</td>
                    <td className="px-4 py-3 text-xs text-right text-ink-500">{p.inPicking}</td>
                    <td className="px-4 py-3 text-xs text-right text-error-500">{p.damaged}</td>
                    <td className="px-4 py-3 text-xs text-right text-ink-500">{p.reorderPoint}</td>
                    <td className="px-4 py-3 text-xs text-ink-500">{p.aisle} / {p.bin}</td>
                    <td className="px-4 py-3">
                      <span className={classNames('text-xs font-medium', coverage < 2 ? 'text-error-600' : coverage < 3 ? 'text-warning-600' : 'text-ink-500')}>
                        {coverage === Infinity ? '∞' : `${coverage.toFixed(1)}d`}
                      </span>
                    </td>
                    <td className="px-4 py-3"><span className={classNames('chip', stockHealthStyles[health])}>{stockHealthLabels[health]}</span></td>
                    <td className="px-4 py-3"><Sparkline data={p.demandHistory.slice(-7)} color={health === 'out_of_stock' ? '#ef4444' : health === 'critical' ? '#ef4444' : health === 'low_stock' ? '#f59e0b' : '#10b981'} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState icon={<Boxes className="w-8 h-8" />} title="No products found" message="Try adjusting your filters" />}
      </Card>

      <ProductDetailDrawer product={selectedProduct} onClose={() => setSelectedProductId(null)} />
    </div>
  );
}

function ProductDetailDrawer({ product, onClose }: { product?: Product; onClose: () => void }) {
  if (!product) return null;
  const health = getStockHealth(product);
  const coverage = daysOfCoverage(product);
  const depletionDate = projectedDepletionDate(product);
  const needsReorder = reorderRecommended(product);
  const zone = warehouseConfig.zones.find(z => z.id === product.zoneId);

  return (
    <Drawer open={!!product} onClose={onClose} title={`${product.sku} · ${product.name}`} width="max-w-xl">
      <div className="p-5 space-y-5">
        {/* Status header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink-800">{product.name}</p>
              <p className="text-xs text-ink-400">{product.category} · {product.sku}</p>
            </div>
          </div>
          <Badge className={stockHealthStyles[health]}>{stockHealthLabels[health]}</Badge>
        </div>

        {/* Stock summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <p className="label mb-1">Available Stock</p>
            <p className="text-2xl font-bold text-ink-800">{formatNumber(product.available)}</p>
            <p className="text-[10px] text-ink-400">of {product.targetStock} target</p>
          </Card>
          <Card className="p-3">
            <p className="label mb-1">Days of Coverage</p>
            <p className={classNames('text-2xl font-bold', coverage < 2 ? 'text-error-600' : coverage < 3 ? 'text-warning-600' : 'text-ink-800')}>
              {coverage === Infinity ? '∞' : coverage.toFixed(1)}
            </p>
            <p className="text-[10px] text-ink-400">{product.avgDailyDemand}/day demand</p>
          </Card>
        </div>

        {/* Stock breakdown */}
        <Card className="p-4">
          <SectionTitle>Stock Breakdown</SectionTitle>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-ink-600">Available</span><span className="font-semibold text-ink-700">{product.available}</span></div>
              <ProgressBar value={product.available} max={product.targetStock} barClassName="bg-success-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-ink-600">Reserved</span><span className="font-semibold text-ink-700">{product.reserved}</span></div>
              <ProgressBar value={product.reserved} max={product.targetStock} barClassName="bg-primary-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-ink-600">In Picking</span><span className="font-semibold text-ink-700">{product.inPicking}</span></div>
              <ProgressBar value={product.inPicking} max={product.targetStock} barClassName="bg-accent-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-ink-600">Damaged</span><span className="font-semibold text-error-600">{product.damaged}</span></div>
              <ProgressBar value={product.damaged} max={20} barClassName="bg-error-500" />
            </div>
          </div>
        </Card>

        {/* Reorder recommendation */}
        {needsReorder && (
          <div className="rounded-lg bg-warning-50 border border-warning-200 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-warning-600" />
              <span className="text-sm font-semibold text-warning-700">Reorder Recommended</span>
            </div>
            <p className="text-xs text-ink-600 mb-2">
              At {product.avgDailyDemand} units/day demand, current stock covers {coverage.toFixed(1)} days — below the {3}-day threshold.
              Projected stockout: {depletionDate ? depletionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'N/A'}.
            </p>
            <p className="text-xs text-ink-500">
              Recommended: Order {Math.round(product.avgDailyDemand * 10)} units to reach target stock of {product.targetStock}.
              {product.incomingStock > 0 && ` ${product.incomingStock} units incoming.`}
            </p>
          </div>
        )}

        {/* Incoming stock */}
        {product.incomingStock > 0 && (
          <Card className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
              <ArrowDown className="w-4 h-4 text-accent-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-700">{product.incomingStock} units incoming</p>
              <p className="text-[10px] text-ink-400">ETA: {product.incomingEta ? new Date(product.incomingEta).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}</p>
            </div>
          </Card>
        )}

        {/* Demand history */}
        <Card className="p-4">
          <SectionTitle>Historical Demand (14 days)</SectionTitle>
          <LineChart data={product.demandHistory.map((v, i) => ({ label: `D-${14 - i}`, value: v }))} height={120} color="#2b7da6" />
        </Card>

        {/* Location */}
        <Card className="p-3 flex items-center gap-3">
          <MapPin className="w-4 h-4 text-ink-400" />
          <div>
            <p className="text-xs font-semibold text-ink-700">{zone?.name || product.zoneId}</p>
            <p className="text-[10px] text-ink-400">Aisle {product.aisle} · Bin {product.bin}</p>
          </div>
        </Card>
      </div>
    </Drawer>
  );
}
