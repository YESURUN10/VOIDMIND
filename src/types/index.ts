/**
 * DisruptionIQ Core Supply-Chain Types & Role Definitions
 */

export type UserRole =
  | 'OPERATIONS_ANALYST'
  | 'SUPPLY_CHAIN_MANAGER'
  | 'WAREHOUSE_OPERATOR'
  | 'PROCUREMENT_APPROVER'
  | 'ADMINISTRATOR';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  title: string;
  avatarUrl?: string;
  department: string;
  createdAt: string;
}

export interface RolePermission {
  canViewTelemetry: boolean;
  canTriggerSimulation: boolean;
  canCreateRecoveryPlan: boolean;
  canModifyInventory: boolean;
  canApprovePlan: boolean;
  canExecuteRecovery: boolean;
  canAccessAuditLogs: boolean;
  canManageSettings: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermission> = {
  OPERATIONS_ANALYST: {
    canViewTelemetry: true,
    canTriggerSimulation: true,
    canCreateRecoveryPlan: false,
    canModifyInventory: false,
    canApprovePlan: false,
    canExecuteRecovery: false,
    canAccessAuditLogs: true,
    canManageSettings: false,
  },
  SUPPLY_CHAIN_MANAGER: {
    canViewTelemetry: true,
    canTriggerSimulation: true,
    canCreateRecoveryPlan: true,
    canModifyInventory: true,
    canApprovePlan: false, // Separation of duties: Managers author plans, Approvers approve them
    canExecuteRecovery: false,
    canAccessAuditLogs: true,
    canManageSettings: false,
  },
  WAREHOUSE_OPERATOR: {
    canViewTelemetry: true,
    canTriggerSimulation: false,
    canCreateRecoveryPlan: false,
    canModifyInventory: true,
    canApprovePlan: false,
    canExecuteRecovery: false,
    canAccessAuditLogs: false,
    canManageSettings: false,
  },
  PROCUREMENT_APPROVER: {
    canViewTelemetry: true,
    canTriggerSimulation: false,
    canCreateRecoveryPlan: false,
    canModifyInventory: false,
    canApprovePlan: true,
    canExecuteRecovery: true,
    canAccessAuditLogs: true,
    canManageSettings: false,
  },
  ADMINISTRATOR: {
    canViewTelemetry: true,
    canTriggerSimulation: true,
    canCreateRecoveryPlan: true,
    canModifyInventory: true,
    canApprovePlan: true,
    canExecuteRecovery: true,
    canAccessAuditLogs: true,
    canManageSettings: true,
  },
};

export type DisruptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DisruptionType = 'PORT_CONGESTION' | 'SUPPLIER_DELAY' | 'CUSTOMS_HOLD' | 'FACTORY_OUTAGE' | 'WEATHER_ANOMALY';
export type DisruptionStatus = 'DETECTED' | 'ANALYZING' | 'RECOVERY_IN_PROGRESS' | 'RESOLVED';

export interface Supplier {
  id: string;
  code: string;
  name: string;
  country: string;
  region: string;
  tier: 1 | 2 | 3;
  leadTimeDays: number;
  onTimeDeliveryRate: number; // e.g. 94.2
  defectRate: number; // e.g. 0.8
  riskScore: number; // 0-100
  status: 'ACTIVE' | 'WATCHLIST' | 'RESTRICTED';
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
  region: 'USA' | 'EU' | 'APAC' | 'LATAM';
  coordinates: [number, number]; // [lat, lng]
  capacityUnits: number;
  utilizedUnits: number;
  status: 'OPTIMAL' | 'NEAR_CAPACITY' | 'CRITICAL';
}

export interface InventorySku {
  id: string;
  sku: string;
  name: string;
  category: 'Raw Materials' | 'WIP' | 'Finished Goods' | 'Spare Parts' | 'Returns / Defective';
  unitCost: number;
  currentStock: number;
  expectedStock: number;
  safetyStock: number;
  reorderPoint: number;
  leadTimeDays: number;
  preferredSupplierId: string;
  warehouseId: string;
  status: 'HEALTHY' | 'LOW_STOCK' | 'CRITICAL_SHORTAGE';
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  warehouseId: string;
  orderDate: string;
  expectedDeliveryDate: string;
  revisedDeliveryDate?: string;
  totalCost: number;
  status: 'DRAFT' | 'ISSUED' | 'IN_TRANSIT' | 'PARTIALLY_RECEIVED' | 'FULFILLED' | 'DELAYED';
}

export interface PurchaseOrderLine {
  id: string;
  poId: string;
  skuId: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice: number;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  poId: string;
  carrier: string;
  origin: string;
  destination: string;
  status: 'BOOKED' | 'DEPARTED' | 'IN_TRANSIT' | 'CUSTOMS_HOLD' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'DELAYED';
  departureDate: string;
  estimatedDeliveryDate: string;
  revisedDeliveryDate?: string;
  actualDeliveryDate?: string;
  delayDays: number;
  currentLocation: string;
  lastWebhookTimestamp: string;
}

export interface Customer {
  id: string;
  name: string;
  tier: 'TIER_1_STRATEGIC' | 'TIER_2_ENTERPRISE' | 'TIER_3_STANDARD';
  region: string;
  penaltyClausePerDayLate: number;
  slaTargetHours: number;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  warehouseId: string;
  orderDate: string;
  promisedDate: string;
  estimatedFulfillmentDate: string;
  totalValue: number;
  status: 'PENDING' | 'ALLOCATED' | 'AT_RISK' | 'SHIPPED' | 'DELIVERED';
  riskScore: number;
}

export interface CustomerOrderLine {
  id: string;
  orderId: string;
  skuId: string;
  quantity: number;
  fulfilledQuantity: number;
}

export interface DisruptionEvent {
  id: string;
  title: string;
  type: DisruptionType;
  severity: DisruptionSeverity;
  status: DisruptionStatus;
  affectedShipmentId: string;
  affectedSupplierId: string;
  delayImpactDays: number;
  location: string;
  description: string;
  detectedAt: string;
  resolvedAt?: string;
  riskScore: number;
  affectedOrdersCount: number;
  totalRevenueAtRisk: number;
}

export type RecoveryStrategy =
  | 'STOCK_REALLOCATION'
  | 'EXPEDITED_FREIGHT'
  | 'ALTERNATE_SUPPLIER'
  | 'SPLIT_ORDER';

export interface RecoveryPlan {
  id: string;
  disruptionId: string;
  strategy: RecoveryStrategy;
  title: string;
  description: string;
  authorId: string;
  authorRole: UserRole;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  feasibilityScore: number; // 0-100 deterministic
  deltaCost: number; // e.g. +$4,500
  deltaDays: number; // e.g. -6 days saved
  mitigatedRevenue: number;
  beforeRiskScore: number;
  afterRiskScore: number;
  deterministicCalculations: {
    newDeliveryEta: string;
    affectedSkus: Array<{ sku: string; qty: number; reallocatedFrom?: string }>;
    carrierOrSupplierChange?: string;
    costBreakdown: { freight: number; material: number; penaltySavings: number };
  };
  geminiExplanation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryApproval {
  id: string;
  planId: string;
  approverId: string;
  approverRole: UserRole;
  action: 'APPROVE' | 'REJECT' | 'REQUEST_MODIFICATION';
  notes: string;
  decisionTimestamp: string;
}

export interface AuditEvent {
  id: string;
  eventType: string;
  actorId: string;
  actorRole: UserRole;
  entityType: string;
  entityId: string;
  beforeState: Record<string, any> | null;
  afterState: Record<string, any>;
  actionHash: string;
  timestamp: string;
}

export type GlobalTimeframe = 'TODAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
export type GlobalRegion = 'ALL' | 'USA' | 'EU' | 'APAC';
