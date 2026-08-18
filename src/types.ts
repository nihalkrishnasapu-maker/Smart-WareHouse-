// Core domain types for WarehouseIQ

export type Priority = 'critical' | 'urgent' | 'high' | 'normal' | 'low';
export type CustomerTier = 'platinum' | 'gold' | 'silver' | 'standard';

export type OrderStatus =
  | 'new'
  | 'awaiting_allocation'
  | 'allocated'
  | 'picking'
  | 'packing'
  | 'quality_check'
  | 'ready_to_dispatch'
  | 'dispatched'
  | 'exception'
  | 'completed';

export type StockHealth = 'healthy' | 'low_stock' | 'critical' | 'out_of_stock' | 'overstocked';
export type AllocationStatus = 'full' | 'partial' | 'none' | 'waiting';
export type PickerStatus = 'active' | 'idle' | 'break' | 'offline';
export type PickTaskStatus = 'pending' | 'in_progress' | 'paused' | 'completed' | 'flagged';
export type PackingStationStatus = 'available' | 'busy' | 'waiting' | 'maintenance';
export type PackingStatus = 'queued' | 'packing' | 'quality_check' | 'ready' | 'dispatched';
export type ExceptionCategory =
  | 'missing_item'
  | 'damaged_item'
  | 'stock_mismatch'
  | 'wrong_sku'
  | 'picking_delay'
  | 'packing_issue'
  | 'inventory_conflict'
  | 'dispatch_delay';
export type ExceptionStatus = 'open' | 'in_progress' | 'resolved' | 'escalated';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type ShipmentStatus =
  | 'ready'
  | 'awaiting_carrier'
  | 'dispatched'
  | 'delayed'
  | 'in_transit';

export type AllocationStrategy =
  | 'maximize_urgent'
  | 'fair'
  | 'maximize_revenue'
  | 'minimize_late';

export interface Zone {
  id: string;
  name: string;
  aisles: string[];
  congestion: number; // 0-100
  avgPickTime: number; // minutes
  pickerCount: number;
}

export interface Employee {
  id: string;
  name: string;
  role: 'warehouse_manager' | 'inventory_manager' | 'picker' | 'packer' | 'quality_inspector';
  avatarColor: string;
  zoneId?: string;
  status: PickerStatus;
  ordersHandled: number;
  avgPickTime: number; // minutes per pick
  shiftStart: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  available: number;
  reserved: number;
  inPicking: number;
  damaged: number;
  reorderPoint: number;
  targetStock: number;
  unitPrice: number;
  zoneId: string;
  aisle: string;
  bin: string;
  avgDailyDemand: number;
  incomingStock: number;
  incomingEta?: string;
  demandHistory: number[]; // last 14 days
}

export interface OrderItem {
  sku: string;
  productName: string;
  quantity: number;
  available: number;
  allocated: number;
  zoneId: string;
  location: string;
  unitPrice: number;
}

export interface TimelineEvent {
  stage: OrderStatus | 'created';
  timestamp: string;
  label: string;
  done: boolean;
}

export interface Order {
  id: string;
  customer: string;
  customerTier: CustomerTier;
  items: OrderItem[];
  priority: Priority;
  priorityScore: number;
  priorityFactors: PriorityFactor[];
  status: OrderStatus;
  allocationStatus: AllocationStatus;
  assignedPicker?: string;
  packer?: string;
  qcInspector?: string;
  createdAt: string;
  slaDeadline: string;
  shippingCutoff: string;
  estimatedCompletion: string;
  carrier: string;
  trackingId?: string;
  destination: string;
  totalValue: number;
  weight: number;
  packagingType: string;
  timeline: TimelineEvent[];
  exceptionIds: string[];
  atRisk: boolean;
  overriddenPriority?: { from: Priority; to: Priority; reason: string; by: string } | null;
}

export interface PriorityFactor {
  name: string;
  weight: number; // percentage
  score: number; // 0-100
  contribution: number; // weighted
  note: string;
}

export interface PickTask {
  id: string;
  orderId: string;
  picker?: string;
  zoneId: string;
  aisle: string;
  sku: string;
  productName: string;
  quantity: number;
  bin: string;
  priority: Priority;
  status: PickTaskStatus;
  estimatedMinutes: number;
  elapsedMinutes: number;
  sequence?: number;
}

export interface PackingTask {
  id: string;
  orderId: string;
  customer: string;
  items: number;
  packagingType: string;
  weight: number;
  station?: string;
  status: PackingStatus;
  qcStatus: 'pending' | 'passed' | 'failed' | 'skipped';
  priority: Priority;
  dispatchCutoff: string;
}

export interface PackingStation {
  id: string;
  name: string;
  status: PackingStationStatus;
  currentOrder?: string;
  utilization: number; // 0-100
  packsToday: number;
}

export interface Exception {
  id: string;
  category: ExceptionCategory;
  severity: Severity;
  orderId?: string;
  sku?: string;
  description: string;
  detectedAt: string;
  assignedTo?: string;
  recommendation: string;
  status: ExceptionStatus;
  resolutionHistory: { action: string; by: string; at: string; note: string }[];
}

export interface Shipment {
  id: string;
  orderId: string;
  customer: string;
  carrier: string;
  trackingId: string;
  destination: string;
  packageCount: number;
  dispatchDeadline: string;
  status: ShipmentStatus;
  weight: number;
  timeline: { stage: string; label: string; done: boolean; time?: string }[];
}

export interface Notification {
  id: string;
  type: 'critical_sla' | 'low_stock' | 'zone_congested' | 'damaged' | 'dispatch_cutoff' | 'allocation_conflict' | 'new_order';
  title: string;
  message: string;
  severity: Severity;
  link: { page: string; id?: string };
  read: boolean;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  category: 'inventory_conflict' | 'stockout' | 'sla_risk' | 'zone_efficiency' | 'allocation';
  severity: Severity;
  title: string;
  reason: string;
  action: string;
  actionLabel: string;
  link: { page: string; id?: string };
  dismissed?: boolean;
}

export interface WarehouseConfig {
  name: string;
  code: string;
  address: string;
  shippingCutoff: string; // HH:MM
  reorderThresholdDays: number;
  slaHours: number;
  zones: Zone[];
}
