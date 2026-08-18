import type {
  Order, Product, Priority, PriorityFactor, AllocationStrategy,
  StockHealth, Exception, Shipment, PickTask, Zone,
} from '@/types';

const now = new Date('2026-08-17T14:30:00');

// ─── Priority Scoring ──────────────────────────────────────────────
const priorityWeights = {
  urgency: 0.40,
  slaRisk: 0.25,
  customerPriority: 0.15,
  orderAge: 0.10,
  shippingCutoff: 0.10,
};

const priorityBaseScore: Record<Priority, number> = {
  critical: 100, urgent: 80, high: 60, normal: 40, low: 20,
};

const customerTierScore: Record<string, number> = {
  platinum: 100, gold: 75, silver: 50, standard: 30,
};

export function computePriorityFactors(order: Order): PriorityFactor[] {
  const created = new Date(order.createdAt);
  const sla = new Date(order.slaDeadline);
  const cutoff = new Date(order.shippingCutoff);
  const ageHours = (now.getTime() - created.getTime()) / 3600000;
  const slaHoursLeft = (sla.getTime() - now.getTime()) / 3600000;
  const cutoffMinsLeft = (cutoff.getTime() - now.getTime()) / 60000;

  // Urgency: base priority
  const urgencyScore = priorityBaseScore[order.priority];

  // SLA risk: closer to deadline = higher
  let slaScore = 0;
  if (slaHoursLeft <= 0) slaScore = 100;
  else if (slaHoursLeft <= 3) slaScore = 90;
  else if (slaHoursLeft <= 6) slaScore = 70;
  else if (slaHoursLeft <= 12) slaScore = 50;
  else if (slaHoursLeft <= 18) slaScore = 30;
  else slaScore = 15;

  // Customer priority
  const customerScore = customerTierScore[order.customerTier] ?? 30;

  // Order age: older = higher
  let ageScore = 0;
  if (ageHours >= 20) ageScore = 100;
  else if (ageHours >= 12) ageScore = 75;
  else if (ageHours >= 6) ageScore = 50;
  else if (ageHours >= 2) ageScore = 30;
  else ageScore = 15;

  // Shipping cutoff proximity
  let cutoffScore = 0;
  if (cutoffMinsLeft <= 0) cutoffScore = 100;
  else if (cutoffMinsLeft <= 30) cutoffScore = 95;
  else if (cutoffMinsLeft <= 60) cutoffScore = 80;
  else if (cutoffMinsLeft <= 120) cutoffScore = 60;
  else if (cutoffMinsLeft <= 240) cutoffScore = 40;
  else cutoffScore = 20;

  const factors: PriorityFactor[] = [
    { name: 'Urgency', weight: priorityWeights.urgency, score: urgencyScore, contribution: urgencyScore * priorityWeights.urgency, note: `Base priority: ${order.priority}` },
    { name: 'SLA Risk', weight: priorityWeights.slaRisk, score: slaScore, contribution: slaScore * priorityWeights.slaRisk, note: slaHoursLeft <= 0 ? 'SLA breached' : `${slaHoursLeft.toFixed(1)}h left of ${((sla.getTime() - created.getTime()) / 3600000).toFixed(0)}h SLA` },
    { name: 'Customer Priority', weight: priorityWeights.customerPriority, score: customerScore, contribution: customerScore * priorityWeights.customerPriority, note: `${order.customerTier} tier customer` },
    { name: 'Order Age', weight: priorityWeights.orderAge, score: ageScore, contribution: ageScore * priorityWeights.orderAge, note: `${ageHours.toFixed(1)}h old` },
    { name: 'Shipping Cutoff', weight: priorityWeights.shippingCutoff, score: cutoffScore, contribution: cutoffScore * priorityWeights.shippingCutoff, note: cutoffMinsLeft <= 0 ? 'Cutoff passed' : `${Math.round(cutoffMinsLeft)}m to cutoff` },
  ];
  return factors;
}

export function computePriorityScore(order: Order): number {
  const factors = computePriorityFactors(order);
  return Math.round(factors.reduce((sum, f) => sum + f.contribution, 0));
}

export function scoreBand(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'CRITICAL', color: 'error' };
  if (score >= 70) return { label: 'URGENT', color: 'warning' };
  if (score >= 50) return { label: 'HIGH', color: 'primary' };
  if (score >= 30) return { label: 'NORMAL', color: 'ink' };
  return { label: 'LOW', color: 'ink' };
}

export function enrichOrderPriority(order: Order): Order {
  const factors = computePriorityFactors(order);
  const score = Math.round(factors.reduce((s, f) => s + f.contribution, 0));
  return { ...order, priorityScore: score, priorityFactors: factors };
}

// ─── Stock Health & Forecasting ────────────────────────────────────
export function getStockHealth(product: Product): StockHealth {
  if (product.available === 0) return 'out_of_stock';
  if (product.available > product.targetStock * 1.5) return 'overstocked';
  if (product.available < product.reorderPoint * 0.5) return 'critical';
  if (product.available < product.reorderPoint) return 'low_stock';
  return 'healthy';
}

export function daysOfCoverage(product: Product): number {
  if (product.avgDailyDemand <= 0) return Infinity;
  return product.available / product.avgDailyDemand;
}

export function projectedDepletionDate(product: Product): Date | null {
  if (product.avgDailyDemand <= 0) return null;
  const days = product.available / product.avgDailyDemand;
  return new Date(now.getTime() + days * 86400000);
}

export function reorderRecommended(product: Product, thresholdDays = 3): boolean {
  return daysOfCoverage(product) < thresholdDays;
}

// ─── Allocation Engine ─────────────────────────────────────────────
export interface AllocationConflict {
  sku: string;
  productName: string;
  available: number;
  orders: { orderId: string; customer: string; priority: Priority; score: number; requested: number; recommended: number; status: string }[];
  strategy: AllocationStrategy;
  explanation: string;
}

export function findAllocationConflicts(orders: Order[], products: Product[]): AllocationConflict[] {
  const conflicts: AllocationConflict[] = [];
  const bySku = new Map<string, { order: Order; item: Order['items'][0] }[]>();

  orders.forEach(order => {
    if (['new', 'awaiting_allocation'].includes(order.status)) {
      order.items.forEach(item => {
        const list = bySku.get(item.sku) || [];
        list.push({ order, item });
        bySku.set(item.sku, list);
      });
    }
  });

  bySku.forEach((entries, sku) => {
    const product = products.find(p => p.sku === sku);
    if (!product) return;
    const totalDemand = entries.reduce((s, e) => s + e.item.quantity, 0);
    if (totalDemand > product.available && entries.length > 1) {
      const conflict = buildConflictAllocation(entries, product, 'maximize_urgent');
      conflicts.push(conflict);
    } else if (totalDemand > product.available) {
      const conflict = buildConflictAllocation(entries, product, 'maximize_urgent');
      conflicts.push(conflict);
    }
  });

  return conflicts;
}

function buildConflictAllocation(
  entries: { order: Order; item: Order['items'][0] }[],
  product: Product,
  strategy: AllocationStrategy,
): AllocationConflict {
  const scored = entries.map(e => ({
    order: e.order,
    item: e.item,
    score: computePriorityScore(e.order),
  }));

  // Sort by strategy
  switch (strategy) {
    case 'maximize_urgent':
      scored.sort((a, b) => b.score - a.score);
      break;
    case 'fair':
      scored.sort((a, b) => a.item.quantity - b.item.quantity);
      break;
    case 'maximize_revenue':
      scored.sort((a, b) => (b.item.quantity * b.item.unitPrice) - (a.item.quantity * a.item.unitPrice));
      break;
    case 'minimize_late':
      scored.sort((a, b) => new Date(a.order.slaDeadline).getTime() - new Date(b.order.slaDeadline).getTime());
      break;
  }

  let remaining = product.available;
  const orderAllocations = scored.map(s => {
    const alloc = Math.min(s.item.quantity, remaining);
    remaining -= alloc;
    const status = alloc >= s.item.quantity ? 'Fully Allocated' : alloc > 0 ? 'Partially Allocated' : 'Waiting for Stock';
    return {
      orderId: s.order.id,
      customer: s.order.customer,
      priority: s.order.priority,
      score: s.score,
      requested: s.item.quantity,
      recommended: alloc,
      status,
    };
  });

  const explanations: Record<AllocationStrategy, string> = {
    maximize_urgent: `${scored[0]?.order.id ?? ''} has the highest SLA risk and shipping cutoff proximity. Allocating available stock to this order minimizes expected fulfillment delay.`,
    fair: 'Distributing available stock evenly across competing orders to minimize partial fulfillment across the board.',
    maximize_revenue: 'Prioritizing orders with the highest total value to maximize revenue captured from available inventory.',
    minimize_late: 'Prioritizing orders closest to their SLA deadline to minimize the number of late shipments.',
  };

  return {
    sku: product.sku,
    productName: product.name,
    available: product.available,
    orders: orderAllocations,
    strategy,
    explanation: explanations[strategy],
  };
}

export function reallocateConflict(conflict: AllocationConflict, strategy: AllocationStrategy, products: Product[]): AllocationConflict {
  const product = products.find(p => p.sku === conflict.sku);
  if (!product) return conflict;
  const entries = conflict.orders.map(o => {
    const order = { id: o.orderId, customer: o.customer, priority: o.priority, customerTier: 'standard' } as unknown as Order;
    return { order, item: { quantity: o.requested } as Order['items'][0] };
  });
  return buildConflictAllocation(entries, product, strategy);
}

// ─── Impact Preview ────────────────────────────────────────────────
export interface AllocationImpact {
  before: { atRisk: number; partial: number; waiting: number; replenishment: number };
  after: { atRisk: number; partial: number; waiting: number; replenishment: number };
}

export function computeAllocationImpact(conflict: AllocationConflict, orders: Order[]): AllocationImpact {
  const affectedOrders = conflict.orders.map(o => o.orderId);
  const beforeAtRisk = orders.filter(o => affectedOrders.includes(o.id) && o.atRisk).length;
  const beforePartial = conflict.orders.filter(o => o.status === 'Partially Allocated').length;
  const beforeWaiting = conflict.orders.filter(o => o.status === 'Waiting for Stock').length;

  const afterAtRisk = Math.max(0, beforeAtRisk - 1);
  const afterPartial = conflict.orders.filter(o => o.recommended > 0 && o.recommended < o.requested).length;
  const afterWaiting = conflict.orders.filter(o => o.recommended === 0).length;
  const replenishment = conflict.orders.filter(o => o.recommended < o.requested).length;

  return {
    before: { atRisk: beforeAtRisk, partial: beforePartial, waiting: beforeWaiting, replenishment: 0 },
    after: { atRisk: afterAtRisk, partial: afterPartial, waiting: afterWaiting, replenishment },
  };
}

// ─── Order Risk Assessment ─────────────────────────────────────────
export function isOrderAtRisk(order: Order): boolean {
  const est = new Date(order.estimatedCompletion);
  const sla = new Date(order.slaDeadline);
  return est > sla || order.status === 'exception';
}

// ─── Picking Optimization ──────────────────────────────────────────
export interface PickingOptimization {
  original: string[];
  optimized: string[];
  travelReduction: number;
}

export function optimizePickRoute(aisles: string[]): PickingOptimization {
  const original = [...aisles];
  // Simple sort by aisle letter then number for optimized path
  const optimized = [...aisles].sort((a, b) => {
    const letterA = a.match(/[A-Z]/)?.[0] || '';
    const numA = parseInt(a.match(/\d+/)?.[0] || '0');
    const letterB = b.match(/[A-Z]/)?.[0] || '';
    const numB = parseInt(b.match(/\d+/)?.[0] || '0');
    if (letterA === letterB) return numA - numB;
    return letterA.localeCompare(letterB);
  });
  // Estimate travel reduction based on path ordering
  const originalDistance = original.reduce((sum, aisle, i) => {
    if (i === 0) return 0;
    return sum + aisleDistance(original[i - 1], aisle);
  }, 0);
  const optimizedDistance = optimized.reduce((sum, aisle, i) => {
    if (i === 0) return 0;
    return sum + aisleDistance(optimized[i - 1], aisle);
  }, 0);
  const travelReduction = originalDistance > 0
    ? Math.round(((originalDistance - optimizedDistance) / originalDistance) * 100)
    : 0;
  return { original, optimized, travelReduction: Math.max(0, travelReduction) };
}

function aisleDistance(a: string, b: string): number {
  const la = a.match(/[A-Z]/)?.[0] || '';
  const lb = b.match(/[A-Z]/)?.[0] || '';
  const na = parseInt(a.match(/\d+/)?.[0] || '0');
  const nb = parseInt(b.match(/\d+/)?.[0] || '0');
  return Math.abs(la.charCodeAt(0) - lb.charCodeAt(0)) * 10 + Math.abs(na - nb);
}

// ─── Bottleneck Detection ───────────────────────────────────────────
export interface Bottleneck {
  zoneId: string;
  zoneName: string;
  metric: string;
  value: string;
  deviation: string;
  causes: string[];
  recommendation: string;
  severity: 'high' | 'medium' | 'low';
}

export function detectBottlenecks(zones: Zone[]): Bottleneck[] {
  const avgPickTime = zones.reduce((s, z) => s + z.avgPickTime, 0) / zones.length;
  const bottlenecks: Bottleneck[] = [];

  zones.forEach(zone => {
    if (zone.avgPickTime > avgPickTime * 1.2) {
      const pct = Math.round(((zone.avgPickTime - avgPickTime) / avgPickTime) * 100);
      bottlenecks.push({
        zoneId: zone.id,
        zoneName: zone.name,
        metric: 'Average Pick Time',
        value: `${zone.avgPickTime} min`,
        deviation: `${pct}% above average`,
        causes: ['High order density', 'Long travel distance between aisles', 'Insufficient staff for current volume'],
        recommendation: `Move 1 picker from a low-congestion zone to ${zone.name.split(' — ')[0]} during peak hours.`,
        severity: pct > 30 ? 'high' : 'medium',
      });
    }
    if (zone.congestion > 70) {
      bottlenecks.push({
        zoneId: zone.id,
        zoneName: zone.name,
        metric: 'Zone Congestion',
        value: `${zone.congestion}%`,
        deviation: 'High congestion',
        causes: ['Too many pickers in zone', 'Aisle width limitation', 'Overlapping pick tasks'],
        recommendation: `Redistribute ${Math.ceil(zone.pickerCount / 2)} picker(s) from ${zone.name.split(' — ')[0]} to adjacent zones.`,
        severity: zone.congestion > 80 ? 'high' : 'medium',
      });
    }
  });

  return bottlenecks;
}

// ─── Decision Simulator ────────────────────────────────────────────
export interface SimulationScenario {
  type: 'inventory_shortage' | 'picker_unavailable' | 'packing_station_unavailable' | 'shipping_cutoff' | 'damaged_inventory' | 'order_spike';
  label: string;
  description: string;
  impact: { label: string; value: string }[];
  recommendation: string;
}

export function simulateScenario(
  type: SimulationScenario['type'],
  orders: Order[],
  products: Product[],
): SimulationScenario {
  switch (type) {
    case 'inventory_shortage': {
      const product = products.find(p => p.sku === 'WH-105')!;
      const affected = orders.filter(o => o.items.some(it => it.sku === 'WH-105'));
      return {
        type, label: 'Inventory Shortage',
        description: `What happens if 20 units of SKU WH-105 become unavailable?`,
        impact: [
          { label: 'Orders Affected', value: `${affected.length}` },
          { label: 'Orders Delayed', value: `${Math.ceil(affected.length * 0.5)}` },
          { label: 'Orders Partially Fulfilled', value: `${Math.floor(affected.length * 0.33)}` },
          { label: 'Orders Requiring Substitution', value: '1' },
        ],
        recommendation: 'Reallocate remaining stock by priority. Initiate emergency replenishment from secondary supplier with 24h ETA. Offer product substitution for 1 order.',
      };
    }
    case 'picker_unavailable': {
      return {
        type, label: 'Picker Unavailable',
        description: 'What happens if 1 picker calls out sick during peak shift?',
        impact: [
          { label: 'Pick Tasks Delayed', value: '8' },
          { label: 'Orders At Risk', value: '5' },
          { label: 'Avg Pick Time Increase', value: '+22%' },
          { label: 'Estimated Recovery', value: '3.5 hours' },
        ],
        recommendation: 'Reassign 8 active pick tasks to remaining pickers. Prioritize critical and cutoff-bound orders. Offer overtime to off-shift pickers.',
      };
    }
    case 'packing_station_unavailable': {
      return {
        type, label: 'Packing Station Failure',
        description: 'What happens if packing Station 2 goes down for maintenance?',
        impact: [
          { label: 'Orders Queued', value: '12' },
          { label: 'Dispatch At Risk', value: '6' },
          { label: 'Queue Wait Time', value: '+18 min' },
          { label: 'Throughput Drop', value: '-25%' },
        ],
        recommendation: 'Redistribute Station 2 queue across Stations 1, 3, and 4. Expedite quality checks. Hold non-urgent orders for next shift.',
      };
    }
    case 'shipping_cutoff': {
      return {
        type, label: 'Shipping Cutoff Approaching',
        description: 'What happens if carrier pickup is in 30 minutes with 8 orders not ready?',
        impact: [
          { label: 'Orders Missing Cutoff', value: '8' },
          { label: 'Next Dispatch Window', value: 'Tomorrow 10:00 AM' },
          { label: 'Customer Impact', value: '6 late deliveries' },
          { label: 'SLA Breaches', value: '3' },
        ],
        recommendation: 'Expedite the 3 SLA-critical orders through packing and QC. Defer remaining 5 to tomorrow\'s first dispatch. Notify affected customers.',
      };
    }
    case 'damaged_inventory': {
      return {
        type, label: 'Damaged Inventory',
        description: 'What happens if 15 units are damaged in a forklift incident in Zone D?',
        impact: [
          { label: 'SKUs Affected', value: '4' },
          { label: 'Orders Blocked', value: '6' },
          { label: 'Inventory Write-off', value: '$340' },
          { label: 'Replenishment Needed', value: '2 SKUs' },
        ],
        recommendation: 'Write off damaged units. Trigger emergency restock for 2 critical SKUs. Re-pick affected orders from undamaged stock in adjacent bins.',
      };
    }
    case 'order_spike': {
      return {
        type, label: 'Sudden Order Spike',
        description: 'What happens if 25 new orders arrive in the next hour?',
        impact: [
          { label: 'New Orders', value: '25' },
          { label: 'Capacity Utilization', value: '94%' },
          { label: 'Avg Fulfillment Time', value: '+45 min' },
          { label: 'At Risk Orders', value: '7' },
        ],
        recommendation: 'Activate overflow picking from Zone F picker. Prioritize by SLA risk. Stagger non-urgent orders to next shift. Consider partial fulfillment for bulk orders.',
      };
    }
  }
}
