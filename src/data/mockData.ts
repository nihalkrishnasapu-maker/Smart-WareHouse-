import type {
  Product, Order, Employee, Zone, PickTask, PackingTask,
  PackingStation, Exception, Shipment, Notification, Recommendation,
  OrderItem, OrderStatus, AllocationStatus, Priority, CustomerTier,
  TimelineEvent, WarehouseConfig, PackingStatus,
} from '@/types';

// Deterministic pseudo-random for stable mock data
let seed = 42;
function rand(): number {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(rand() * (max - min + 1)) + min; }
function randFloat(min: number, max: number): number { return rand() * (max - min) + min; }

const now = new Date('2026-08-17T14:30:00');

function iso(offsetMin: number): string {
  const d = new Date(now.getTime() + offsetMin * 60000);
  return d.toISOString();
}

export const warehouseConfig: WarehouseConfig = {
  name: 'Northgate Distribution Center',
  code: 'DC-NG-01',
  address: '2400 Logistics Pkwy, Memphis, TN 38118',
  shippingCutoff: '16:00',
  reorderThresholdDays: 3,
  slaHours: 24,
  zones: [
    { id: 'Z-A', name: 'Zone A — Fast Movers', aisles: ['A1', 'A2', 'A3', 'A4'], congestion: 42, avgPickTime: 3.2, pickerCount: 4 },
    { id: 'Z-B', name: 'Zone B — Electronics', aisles: ['B1', 'B2', 'B3'], congestion: 78, avgPickTime: 5.8, pickerCount: 3 },
    { id: 'Z-C', name: 'Zone C — Apparel', aisles: ['C1', 'C2', 'C3', 'C4'], congestion: 35, avgPickTime: 3.8, pickerCount: 2 },
    { id: 'Z-D', name: 'Zone D — Bulk Goods', aisles: ['D1', 'D2'], congestion: 28, avgPickTime: 6.5, pickerCount: 2 },
    { id: 'Z-E', name: 'Zone E — Fragile', aisles: ['E1', 'E2'], congestion: 50, avgPickTime: 7.2, pickerCount: 1 },
    { id: 'Z-F', name: 'Zone F — Returns', aisles: ['F1'], congestion: 20, avgPickTime: 4.1, pickerCount: 1 },
    { id: 'Z-G', name: 'Zone G — Cold Chain', aisles: ['G1', 'G2'], congestion: 60, avgPickTime: 5.0, pickerCount: 1 },
    { id: 'Z-H', name: 'Zone H — Hazmat', aisles: ['H1'], congestion: 15, avgPickTime: 8.5, pickerCount: 1 },
  ],
};

const productCatalog = [
  { name: 'Wireless Mouse Pro', category: 'Electronics', zone: 'Z-B', aisle: 'B2', price: 29.99, demand: 24 },
  { name: 'USB-C Hub 8-in-1', category: 'Electronics', zone: 'Z-B', aisle: 'B1', price: 49.99, demand: 18 },
  { name: 'Mechanical Keyboard', category: 'Electronics', zone: 'Z-B', aisle: 'B3', price: 119.99, demand: 12 },
  { name: '4K Monitor 27"', category: 'Electronics', zone: 'Z-B', aisle: 'B3', price: 329.99, demand: 6 },
  { name: 'Noise-Cancel Headphones', category: 'Electronics', zone: 'Z-B', aisle: 'B2', price: 199.99, demand: 9 },
  { name: 'Laptop Stand Aluminum', category: 'Electronics', zone: 'Z-B', aisle: 'B1', price: 39.99, demand: 15 },
  { name: 'Webcam 1080p', category: 'Electronics', zone: 'Z-B', aisle: 'B2', price: 59.99, demand: 11 },
  { name: 'USB-C Charger 65W', category: 'Electronics', zone: 'Z-B', aisle: 'B1', price: 34.99, demand: 28 },
  { name: 'Cotton T-Shirt', category: 'Apparel', zone: 'Z-C', aisle: 'C1', price: 14.99, demand: 40 },
  { name: 'Denim Jacket', category: 'Apparel', zone: 'Z-C', aisle: 'C2', price: 64.99, demand: 16 },
  { name: 'Running Shoes', category: 'Apparel', zone: 'Z-C', aisle: 'C3', price: 89.99, demand: 22 },
  { name: 'Wool Sweater', category: 'Apparel', zone: 'Z-C', aisle: 'C2', price: 49.99, demand: 14 },
  { name: 'Athletic Socks 6pk', category: 'Apparel', zone: 'Z-C', aisle: 'C1', price: 19.99, demand: 35 },
  { name: 'Leather Belt', category: 'Apparel', zone: 'Z-C', aisle: 'C4', price: 24.99, demand: 10 },
  { name: 'Paper Towels 12pk', category: 'Bulk Goods', zone: 'Z-D', aisle: 'D1', price: 18.99, demand: 30 },
  { name: 'Bottled Water 24pk', category: 'Bulk Goods', zone: 'Z-D', aisle: 'D2', price: 6.99, demand: 45 },
  { name: 'Laundry Detergent 5L', category: 'Bulk Goods', zone: 'Z-D', aisle: 'D1', price: 22.99, demand: 20 },
  { name: 'Toilet Paper 30pk', category: 'Bulk Goods', zone: 'Z-D', aisle: 'D2', price: 24.99, demand: 38 },
  { name: 'Glass Vase Set', category: 'Fragile', zone: 'Z-E', aisle: 'E1', price: 44.99, demand: 7 },
  { name: 'Ceramic Dinnerware', category: 'Fragile', zone: 'Z-E', aisle: 'E2', price: 79.99, demand: 5 },
  { name: 'Wine Glasses 4pk', category: 'Fragile', zone: 'Z-E', aisle: 'E1', price: 34.99, demand: 9 },
  { name: 'Insulated Cooler Bag', category: 'Cold Chain', zone: 'Z-G', aisle: 'G1', price: 27.99, demand: 12 },
  { name: 'Frozen Meal Pack', category: 'Cold Chain', zone: 'Z-G', aisle: 'G2', price: 12.99, demand: 33 },
  { name: 'Ice Packs 6pk', category: 'Cold Chain', zone: 'Z-G', aisle: 'G1', price: 9.99, demand: 18 },
  { name: 'AA Batteries 24pk', category: 'Fast Movers', zone: 'Z-A', aisle: 'A1', price: 15.99, demand: 50 },
  { name: 'Phone Cable USB-C', category: 'Fast Movers', zone: 'Z-A', aisle: 'A2', price: 11.99, demand: 42 },
  { name: 'Power Strip 6-outlet', category: 'Fast Movers', zone: 'Z-A', aisle: 'A3', price: 19.99, demand: 26 },
  { name: 'LED Bulb 4pk', category: 'Fast Movers', zone: 'Z-A', aisle: 'A4', price: 13.99, demand: 31 },
  { name: 'Adhesive Tape Pack', category: 'Fast Movers', zone: 'Z-A', aisle: 'A1', price: 8.99, demand: 44 },
  { name: 'Cleaning Wipes 3pk', category: 'Fast Movers', zone: 'Z-A', aisle: 'A3', price: 10.99, demand: 36 },
  { name: 'Lithium Battery Pack', category: 'Hazmat', zone: 'Z-H', aisle: 'H1', price: 29.99, demand: 8 },
  { name: 'Aerosol Paint Can', category: 'Hazmat', zone: 'Z-H', aisle: 'H1', price: 16.99, demand: 6 },
];

export const products: Product[] = productCatalog.map((p, i) => {
  const sku = `WH-${String(101 + i).padStart(3, '0')}`;
  const available = randInt(0, 200);
  const reorderPoint = Math.round(p.demand * 2.5);
  const targetStock = Math.round(p.demand * 10);
  const damaged = randInt(0, 5);
  const reserved = randInt(0, Math.min(40, available));
  const inPicking = randInt(0, Math.min(20, available - reserved));
  const incomingStock = rand() > 0.6 ? randInt(20, 100) : 0;
  const demandHistory = Array.from({ length: 14 }, () => Math.max(0, Math.round(p.demand * randFloat(0.6, 1.4))));
  return {
    id: `P-${i + 1}`,
    sku,
    name: p.name,
    category: p.category,
    available,
    reserved,
    inPicking,
    damaged,
    reorderPoint,
    targetStock,
    unitPrice: p.price,
    zoneId: p.zone,
    aisle: p.aisle,
    bin: `${p.aisle}-${randInt(1, 9)}${pick(['A', 'B', 'C'])}`,
    avgDailyDemand: p.demand,
    incomingStock,
    incomingEta: incomingStock > 0 ? iso(randInt(1440, 4320)) : undefined,
    demandHistory,
  };
});

// Force some low-stock and out-of-stock scenarios
products[3].available = 8; products[3].reorderPoint = 15; // 4K monitor low
products[7].available = 0; products[7].reorderPoint = 70; // charger out
products[14].available = 12; products[14].reorderPoint = 75; // paper towels low
products[21].available = 4; products[21].reorderPoint = 18; // cooler bag critical
products[29].available = 320; products[29].targetStock = 80; // wipes overstocked

const employeeNames = [
  'Marcus Chen', 'Sofia Rodriguez', 'James O\'Brien', 'Aisha Patel', 'Diego Martinez',
  'Yuki Tanaka', 'Olivia Bennett', 'Rashid Al-Mansour', 'Emma Schwartz', 'Liam Kowalski',
];
const roles = ['picker', 'picker', 'picker', 'picker', 'picker', 'packer', 'packer', 'quality_inspector', 'inventory_manager', 'warehouse_manager'] as const;
const avatarColors = ['#2b7da6', '#e08720', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16', '#6366f1'];

export const employees: Employee[] = employeeNames.map((name, i) => ({
  id: `E-${i + 1}`,
  name,
  role: roles[i],
  avatarColor: avatarColors[i],
  zoneId: i < 5 ? warehouseConfig.zones[i].id : undefined,
  status: i < 5 ? (rand() > 0.2 ? 'active' : 'idle') : 'active',
  ordersHandled: randInt(8, 32),
  avgPickTime: randFloat(3.5, 7.5),
  shiftStart: '06:00',
}));

const customers = [
  'Apex Retail Co', 'BlueWave Electronics', 'Cornerstone Supply', 'Delta Distribution',
  'Evergreen Markets', 'Frontline Commerce', 'GreenLeaf Stores', 'Harbor Trading',
  'Inland Wholesale', 'Jubilee Outlets', 'Keystone Retail', 'Lakeside Goods',
  'Metro Supply Co', 'Northwind Trading', 'Oakdale Stores', 'Pinnacle Wholesale',
  'Quartz Retail', 'Riverside Commerce', 'Summit Distribution', 'Trident Supply',
];
const tiers: CustomerTier[] = ['platinum', 'gold', 'silver', 'standard'];
const carriers = ['FedEx', 'UPS', 'DHL', 'USPS', 'OnTrac'];
const cities = ['Chicago, IL', 'Dallas, TX', 'Atlanta, GA', 'Phoenix, AZ', 'Denver, CO', 'Seattle, WA', 'Miami, FL', 'Boston, MA'];
const priorities: Priority[] = ['critical', 'urgent', 'high', 'normal', 'low'];
const packagingTypes = ['Standard Box', 'Padded Envelope', 'Pallet', 'Tube', 'Insulated Box'];
const statuses: OrderStatus[] = ['new', 'awaiting_allocation', 'allocated', 'picking', 'packing', 'quality_check', 'ready_to_dispatch', 'dispatched', 'exception', 'completed'];

function buildTimeline(status: OrderStatus, created: string): TimelineEvent[] {
  const stages: { s: OrderStatus | 'created'; l: string }[] = [
    { s: 'created', l: 'Order Created' },
    { s: 'awaiting_allocation', l: 'Awaiting Allocation' },
    { s: 'allocated', l: 'Stock Allocated' },
    { s: 'picking', l: 'Picking' },
    { s: 'packing', l: 'Packing' },
    { s: 'quality_check', l: 'Quality Check' },
    { s: 'ready_to_dispatch', l: 'Ready to Dispatch' },
    { s: 'dispatched', l: 'Dispatched' },
  ];
  const order = stages.map(s => s.s);
  const currentIdx = order.indexOf(status);
  return stages.map((st, i) => ({
    stage: st.s,
    timestamp: i <= currentIdx ? iso(-((currentIdx - i) * 45 + randInt(5, 30))) : '',
    label: st.l,
    done: i <= currentIdx,
  }));
}

export const orders: Order[] = Array.from({ length: 50 }, (_, i) => {
  const numItems = randInt(1, 4);
  const items: OrderItem[] = Array.from({ length: numItems }, () => {
    const p = products[randInt(0, products.length - 1)];
    const qty = randInt(1, 15);
    return {
      sku: p.sku,
      productName: p.name,
      quantity: qty,
      available: p.available,
      allocated: Math.min(qty, p.available),
      zoneId: p.zoneId,
      location: `${p.aisle} / ${p.bin}`,
      unitPrice: p.unitPrice,
    };
  });
  const status = i < 8 ? statuses[randInt(0, 2)] : i < 20 ? statuses[randInt(2, 5)] : i < 35 ? statuses[randInt(4, 7)] : pick(statuses);
  const createdOffset = -randInt(10, 600);
  const createdAt = iso(createdOffset);
  const slaDeadline = iso(createdOffset + randInt(600, 1440));
  const shippingCutoff = iso(randInt(-60, 180));
  const priority = pick(priorities);
  const totalValue = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const weight = items.reduce((s, it) => s + it.quantity * randFloat(0.2, 2.5), 0);
  const allAllocated = items.every(it => it.allocated >= it.quantity);
  const noneAllocated = items.every(it => it.allocated === 0);
  const allocationStatus: AllocationStatus = allAllocated ? 'full' : noneAllocated ? 'none' : 'partial';
  const estCompletion = iso(randInt(-120, 480));
  const atRisk = new Date(estCompletion) > new Date(slaDeadline);
  const assignedPicker = status === 'picking' || status === 'packing' ? `E-${randInt(1, 5)}` : undefined;

  return {
    id: `ORD-${1048 + i}`,
    customer: pick(customers),
    customerTier: pick(tiers),
    items,
    priority,
    priorityScore: 0, // computed later
    priorityFactors: [], // computed later
    status,
    allocationStatus,
    assignedPicker,
    createdAt,
    slaDeadline,
    shippingCutoff,
    estimatedCompletion: estCompletion,
    carrier: pick(carriers),
    trackingId: status === 'dispatched' ? `TRK${randInt(1000000, 9999999)}` : undefined,
    destination: pick(cities),
    totalValue: Math.round(totalValue * 100) / 100,
    weight: Math.round(weight * 10) / 10,
    packagingType: pick(packagingTypes),
    timeline: buildTimeline(status, createdAt),
    exceptionIds: [],
    atRisk,
    overriddenPriority: null,
  };
});

// Force specific conflict scenarios for the allocation page
// Order 1048: critical, needs 10 units of WH-105, only 7 available
const conflictSku = 'WH-105';
const conflictProduct = products.find(p => p.sku === conflictSku)!;
conflictProduct.available = 7;
orders[0] = {
  ...orders[0],
  id: 'ORD-1048',
  priority: 'critical',
  customer: 'Apex Retail Co',
  customerTier: 'platinum',
  items: [{ sku: conflictSku, productName: conflictProduct.name, quantity: 10, available: 7, allocated: 0, zoneId: conflictProduct.zoneId, location: `${conflictProduct.aisle} / ${conflictProduct.bin}`, unitPrice: conflictProduct.unitPrice }],
  status: 'awaiting_allocation',
  allocationStatus: 'none',
  slaDeadline: iso(180),
  shippingCutoff: iso(90),
  atRisk: true,
  totalValue: 299.9,
  weight: 2.5,
  timeline: buildTimeline('awaiting_allocation', iso(-30)),
};
orders[4] = {
  ...orders[4],
  id: 'ORD-1052',
  priority: 'normal',
  customer: 'Cornerstone Supply',
  customerTier: 'silver',
  items: [{ sku: conflictSku, productName: conflictProduct.name, quantity: 5, available: 7, allocated: 0, zoneId: conflictProduct.zoneId, location: `${conflictProduct.aisle} / ${conflictProduct.bin}`, unitPrice: conflictProduct.unitPrice }],
  status: 'awaiting_allocation',
  allocationStatus: 'none',
  slaDeadline: iso(720),
  shippingCutoff: iso(360),
  atRisk: false,
  totalValue: 149.95,
  weight: 1.2,
  timeline: buildTimeline('awaiting_allocation', iso(-60)),
};

// Pick tasks
export const pickTasks: PickTask[] = Array.from({ length: 20 }, (_, i) => {
  const order = orders[randInt(0, 24)];
  const item = order.items[0];
  const status: PickTask['status'] = i < 8 ? 'in_progress' : i < 12 ? 'pending' : i < 16 ? 'completed' : i < 18 ? 'paused' : 'flagged';
  return {
    id: `PK-${2001 + i}`,
    orderId: order.id,
    picker: status === 'in_progress' || status === 'completed' ? `E-${randInt(1, 5)}` : undefined,
    zoneId: item?.zoneId || 'Z-A',
    aisle: item?.location?.split(' / ')[0] || 'A1',
    sku: item?.sku || 'WH-101',
    productName: item?.productName || 'Product',
    quantity: item?.quantity || 1,
    bin: item?.location?.split(' / ')[1] || 'A1-3B',
    priority: order.priority,
    status,
    estimatedMinutes: randInt(3, 12),
    elapsedMinutes: status === 'in_progress' ? randInt(1, 10) : status === 'completed' ? randInt(3, 12) : 0,
  };
});

// Packing stations
export const packingStations: PackingStation[] = [
  { id: 'PS-1', name: 'Station 1', status: 'busy', currentOrder: 'ORD-1055', utilization: 85, packsToday: 42 },
  { id: 'PS-2', name: 'Station 2', status: 'busy', currentOrder: 'ORD-1061', utilization: 72, packsToday: 38 },
  { id: 'PS-3', name: 'Station 3', status: 'available', utilization: 0, packsToday: 51 },
  { id: 'PS-4', name: 'Station 4', status: 'waiting', utilization: 45, packsToday: 29 },
  { id: 'PS-5', name: 'Station 5', status: 'maintenance', utilization: 0, packsToday: 0 },
];

export const packingTasks: PackingTask[] = Array.from({ length: 15 }, (_, i) => {
  const order = orders[randInt(0, 30)];
  const status: PackingStatus = i < 5 ? 'packing' : i < 9 ? 'queued' : i < 12 ? 'quality_check' : 'ready';
  return {
    id: `PK-${3001 + i}`,
    orderId: order.id,
    customer: order.customer,
    items: order.items.length,
    packagingType: order.packagingType,
    weight: order.weight,
    station: status === 'packing' ? `PS-${randInt(1, 4)}` : undefined,
    status,
    qcStatus: status === 'quality_check' ? 'pending' : status === 'ready' ? 'passed' : 'pending',
    priority: order.priority,
    dispatchCutoff: order.shippingCutoff,
  };
});

// Exceptions
const exceptionTemplates: Omit<Exception, 'id'>[] = [
  {
    category: 'damaged_item', severity: 'high', orderId: 'ORD-1048', sku: 'WH-105',
    description: '3 units of SKU WH-105 reported damaged during picking. Required: 3, available good stock: 2.',
    detectedAt: iso(-45), assignedTo: 'E-3',
    recommendation: 'Allocate 2 good units and trigger replacement sourcing for 1 unit. Reserve incoming stock (ETA 2 days) for backfill.',
    status: 'open', resolutionHistory: [],
  },
  {
    category: 'inventory_conflict', severity: 'critical', orderId: 'ORD-1048', sku: 'WH-105',
    description: 'Order #1048 requires 10 units of SKU WH-105, but only 7 are available. Competing order #1052 needs 5 units.',
    detectedAt: iso(-20), assignedTo: 'E-9',
    recommendation: 'Allocate 7 units to Order #1048 (critical SLA) and defer 3 units. Mark #1052 as waiting for stock.',
    status: 'open', resolutionHistory: [],
  },
  {
    category: 'stock_mismatch', severity: 'medium', orderId: 'ORD-1063', sku: 'WH-108',
    description: 'System shows 45 units of WH-108 but physical count found 42 units. Variance of 3 units.',
    detectedAt: iso(-120), assignedTo: 'E-9',
    recommendation: 'Initiate cycle count for Zone B aisle B1. Adjust inventory after reconciliation.',
    status: 'in_progress', resolutionHistory: [{ action: 'Cycle count initiated', by: 'E-9', at: iso(-100), note: 'Count in progress for B1' }],
  },
  {
    category: 'picking_delay', severity: 'high', orderId: 'ORD-1071', sku: 'WH-115',
    description: 'Pick task PK-2007 has been in progress for 18 minutes, 200% above average pick time for Zone D.',
    detectedAt: iso(-15), assignedTo: 'E-2',
    recommendation: 'Reassign pick task or send support picker to Zone D. Check for aisle congestion.',
    status: 'open', resolutionHistory: [],
  },
  {
    category: 'wrong_sku', severity: 'medium', orderId: 'ORD-1058', sku: 'WH-122',
    description: 'Picker scanned WH-123 but task required WH-122. Mismatch detected at quality check.',
    detectedAt: iso(-90), assignedTo: 'E-8',
    recommendation: 'Return WH-123 to bin. Re-pick WH-122 from Zone G aisle G1. Update pick task.',
    status: 'in_progress', resolutionHistory: [{ action: 'Wrong item returned', by: 'E-8', at: iso(-75), note: 'WH-123 returned to G1-2A' }],
  },
  {
    category: 'missing_item', severity: 'high', orderId: 'ORD-1066', sku: 'WH-119',
    description: '1 unit of WH-119 missing from pick cart. Order cannot complete packing.',
    detectedAt: iso(-30), assignedTo: 'E-5',
    recommendation: 'Re-pick 1 unit of WH-119 from Zone E aisle E1. Flag original pick for audit.',
    status: 'open', resolutionHistory: [],
  },
  {
    category: 'packing_issue', severity: 'low', orderId: 'ORD-1054', sku: 'WH-101',
    description: 'Package weight exceeds declared weight by 15%. Station 2 flagged the discrepancy.',
    detectedAt: iso(-60), assignedTo: 'E-6',
    recommendation: 'Re-weigh package and update shipping label. Verify contents against order manifest.',
    status: 'resolved', resolutionHistory: [
      { action: 'Re-weighed and label updated', by: 'E-6', at: iso(-45), note: 'Corrected to 2.3kg' },
      { action: 'Resolved', by: 'E-6', at: iso(-40), note: 'Package released to dispatch' },
    ],
  },
  {
    category: 'dispatch_delay', severity: 'critical', orderId: 'ORD-1042', sku: undefined,
    description: 'Carrier pickup window closes in 25 minutes. 3 shipments not yet ready for dispatch.',
    detectedAt: iso(-10), assignedTo: 'E-10',
    recommendation: 'Prioritize packing for ORD-1042, ORD-1045, ORD-1047. Expedite quality check.',
    status: 'open', resolutionHistory: [],
  },
  {
    category: 'damaged_item', severity: 'medium', orderId: 'ORD-1075', sku: 'WH-120',
    description: '2 units of WH-120 (Wine Glasses) damaged in transit from Zone E to packing. Fragile handling required.',
    detectedAt: iso(-180), assignedTo: 'E-8',
    recommendation: 'Write off 2 damaged units. Re-pick 2 units with fragile handling protocol.',
    status: 'resolved', resolutionHistory: [
      { action: 'Damaged units written off', by: 'E-8', at: iso(-160), note: 'Inventory adjusted' },
      { action: 'Re-picked with fragile protocol', by: 'E-8', at: iso(-140), note: 'Completed' },
    ],
  },
  {
    category: 'inventory_conflict', severity: 'medium', orderId: 'ORD-1080', sku: 'WH-115',
    description: 'Bulk goods zone has 3 orders competing for 40 units of WH-115. Total demand: 65 units.',
    detectedAt: iso(-200), assignedTo: 'E-9',
    recommendation: 'Allocate by priority: ORD-1080 (urgent) gets 20, ORD-1083 gets 12, ORD-1085 gets 8. Backorder 25 units.',
    status: 'escalated', resolutionHistory: [
      { action: 'Escalated to inventory manager', by: 'E-9', at: iso(-180), note: 'Requires replenishment decision' },
    ],
  },
];

export const exceptions: Exception[] = exceptionTemplates.map((e, i) => ({ ...e, id: `EX-${5001 + i}` }));

// Link exceptions to orders
orders.forEach(o => {
  o.exceptionIds = exceptions.filter(e => e.orderId === o.id).map(e => e.id);
});

// Shipments
export const shipments: Shipment[] = Array.from({ length: 20 }, (_, i) => {
  const order = orders[randInt(0, 40)];
  const status: Shipment['status'] = i < 6 ? 'ready' : i < 10 ? 'awaiting_carrier' : i < 16 ? 'dispatched' : i < 18 ? 'delayed' : 'in_transit';
  const deadline = iso(randInt(-30, 240));
  return {
    id: `SHP-${6001 + i}`,
    orderId: order.id,
    customer: order.customer,
    carrier: order.carrier,
    trackingId: `TRK${randInt(1000000, 9999999)}`,
    destination: order.destination,
    packageCount: randInt(1, 5),
    dispatchDeadline: deadline,
    status,
    weight: order.weight,
    timeline: [
      { stage: 'packing', label: 'Packing', done: true, time: iso(-randInt(120, 300)) },
      { stage: 'qc', label: 'Quality Check', done: status !== 'ready' || i % 2 === 0, time: status !== 'ready' ? iso(-randInt(60, 200)) : undefined },
      { stage: 'ready', label: 'Ready', done: ['dispatched', 'in_transit', 'awaiting_carrier'].includes(status) || (status === 'ready' && i % 2 === 0), time: ['dispatched', 'in_transit'].includes(status) ? iso(-randInt(30, 120)) : undefined },
      { stage: 'carrier', label: 'Carrier Assigned', done: ['dispatched', 'in_transit'].includes(status), time: ['dispatched', 'in_transit'].includes(status) ? iso(-randInt(15, 60)) : undefined },
      { stage: 'dispatched', label: 'Dispatched', done: ['dispatched', 'in_transit'].includes(status), time: ['dispatched', 'in_transit'].includes(status) ? iso(-randInt(5, 30)) : undefined },
    ],
  };
});

// Force some delayed shipments near cutoff
shipments[0] = { ...shipments[0], status: 'ready', dispatchDeadline: iso(25), orderId: 'ORD-1042', customer: 'Apex Retail Co' };
shipments[1] = { ...shipments[1], status: 'awaiting_carrier', dispatchDeadline: iso(40), orderId: 'ORD-1045' };
shipments[16] = { ...shipments[16], status: 'delayed', dispatchDeadline: iso(-15), orderId: 'ORD-1038' };

export const notifications: Notification[] = [
  { id: 'N1', type: 'critical_sla', title: 'Critical order approaching SLA breach', message: 'ORD-1048 SLA deadline in 3 hours. Still awaiting allocation.', severity: 'critical', link: { page: 'orders', id: 'ORD-1048' }, read: false, createdAt: iso(-5) },
  { id: 'N2', type: 'low_stock', title: 'SKU below reorder point', message: 'WH-105 (Noise-Cancel Headphones) at 7 units, reorder point is 23.', severity: 'high', link: { page: 'inventory', id: 'WH-105' }, read: false, createdAt: iso(-12) },
  { id: 'N3', type: 'zone_congested', title: 'Picking zone congested', message: 'Zone B congestion at 78%. Consider redistributing pickers.', severity: 'medium', link: { page: 'picking' }, read: false, createdAt: iso(-18) },
  { id: 'N4', type: 'damaged', title: 'Damaged inventory reported', message: '3 units of WH-105 damaged during picking in Zone B.', severity: 'high', link: { page: 'exceptions', id: 'EX-5001' }, read: false, createdAt: iso(-45) },
  { id: 'N5', type: 'dispatch_cutoff', title: 'Dispatch cutoff in 30 minutes', message: '3 shipments not ready for carrier pickup at 16:00.', severity: 'critical', link: { page: 'dispatch' }, read: false, createdAt: iso(-10) },
  { id: 'N6', type: 'allocation_conflict', title: 'Allocation conflict detected', message: 'ORD-1048 and ORD-1052 competing for 7 units of WH-105.', severity: 'critical', link: { page: 'allocation' }, read: true, createdAt: iso(-20) },
  { id: 'N7', type: 'new_order', title: 'New urgent order received', message: 'ORD-1095 received with critical priority, 12 items.', severity: 'medium', link: { page: 'orders', id: 'ORD-1095' }, read: true, createdAt: iso(-120) },
];

export const recommendations: Recommendation[] = [
  {
    id: 'R1', category: 'sla_risk', severity: 'critical',
    title: '12 orders at risk of missing dispatch cutoff',
    reason: '12 orders have estimated completion times after today\'s 16:00 shipping cutoff, primarily in Zone B picking.',
    action: 'Reallocate 2 pickers from Zone D to Zone B and prioritize critical orders in the picking queue.',
    actionLabel: 'Review Allocation', link: { page: 'allocation' },
  },
  {
    id: 'R2', category: 'stockout', severity: 'high',
    title: 'SKU WH-105 projected to stock out within 2 days',
    reason: 'Average daily demand is 9 units with 7 available. Projected coverage: 0.8 days, below 3-day threshold.',
    action: 'Approve emergency replenishment order of 100 units. ETA 2 days from supplier.',
    actionLabel: 'Approve Replenishment', link: { page: 'inventory', id: 'WH-105' },
  },
  {
    id: 'R3', category: 'inventory_conflict', severity: 'critical',
    title: '3 urgent orders competing for 7 units of inventory',
    reason: 'ORD-1048 (critical), ORD-1052 (normal) require WH-105. Combined demand: 15 units, available: 7.',
    action: 'Allocate 7 units to ORD-1048 and defer 3 units. Mark ORD-1052 as waiting for stock.',
    actionLabel: 'Review Allocation', link: { page: 'allocation' },
  },
  {
    id: 'R4', category: 'zone_efficiency', severity: 'medium',
    title: 'Zone B picking time 24% above average',
    reason: 'Zone B average pick time is 5.8 minutes vs 4.4 minutes warehouse average. Congestion at 78%.',
    action: 'Move 1 picker from Zone D to Zone B during 2 PM–4 PM shift.',
    actionLabel: 'Apply Staffing Recommendation', link: { page: 'analytics' },
  },
];

export const warehouses = [
  { id: 'DC-NG-01', name: 'Northgate Distribution Center', code: 'DC-NG-01', location: 'Memphis, TN' },
  { id: 'DC-WC-02', name: 'Westcoast Fulfillment Hub', code: 'DC-WC-02', location: 'Reno, NV' },
  { id: 'DC-NE-03', name: 'Northeast Regional Center', code: 'DC-NE-03', location: 'Allentown, PA' },
];

export const currentUser = {
  id: 'E-10', name: 'Liam Kowalski', role: 'warehouse_manager' as const, avatarColor: '#6366f1', email: 'liam.kowalski@warehouseiq.io',
};
