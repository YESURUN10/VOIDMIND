import { pgTable, text, integer, doublePrecision, timestamp, serial, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * 1. Users & Authentication
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull(), // OPERATIONS_ANALYST, SUPPLY_CHAIN_MANAGER, etc.
  title: text('title').notNull(),
  department: text('department').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * 2. Suppliers
 */
export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  country: text('country').notNull(),
  region: text('region').notNull(),
  tier: integer('tier').notNull(), // 1, 2, 3
  leadTimeDays: integer('lead_time_days').notNull(),
  onTimeDeliveryRate: doublePrecision('on_time_delivery_rate').notNull(), // e.g. 94.2
  defectRate: doublePrecision('defect_rate').notNull(), // e.g. 0.8
  riskScore: integer('risk_score').notNull(), // 0-100
  status: text('status').notNull(), // ACTIVE, WATCHLIST, RESTRICTED
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 3. Warehouses
 */
export const warehouses = pgTable('warehouses', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  country: text('country').notNull(),
  region: text('region').notNull(), // USA, EU, APAC
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  capacityUnits: integer('capacity_units').notNull(),
  utilizedUnits: integer('utilized_units').notNull(),
  status: text('status').notNull(),
});

/**
 * 4. Inventory SKUs
 */
export const inventorySkus = pgTable('inventory_skus', {
  id: text('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(), // Raw Materials, WIP, Finished Goods, Spare Parts, Returns
  unitCost: doublePrecision('unit_cost').notNull(),
  currentStock: integer('current_stock').notNull(),
  expectedStock: integer('expected_stock').notNull(),
  safetyStock: integer('safety_stock').notNull(),
  reorderPoint: integer('reorder_point').notNull(),
  leadTimeDays: integer('lead_time_days').notNull(),
  preferredSupplierId: text('preferred_supplier_id').references(() => suppliers.id),
  warehouseId: text('warehouse_id').references(() => warehouses.id),
  status: text('status').notNull(), // HEALTHY, LOW_STOCK, CRITICAL_SHORTAGE
});

/**
 * 5. Warehouse Stock Allocation
 */
export const warehouseStock = pgTable('warehouse_stock', {
  id: text('id').primaryKey(),
  warehouseId: text('warehouse_id').references(() => warehouses.id).notNull(),
  skuId: text('sku_id').references(() => inventorySkus.id).notNull(),
  stockOnHand: integer('stock_on_hand').notNull(),
  allocatedStock: integer('allocated_stock').notNull(),
  availableStock: integer('available_stock').notNull(),
  binLocation: text('bin_location').notNull(),
});

/**
 * 6. Purchase Orders
 */
export const purchaseOrders = pgTable('purchase_orders', {
  id: text('id').primaryKey(),
  poNumber: text('po_number').notNull().unique(),
  supplierId: text('supplier_id').references(() => suppliers.id).notNull(),
  warehouseId: text('warehouse_id').references(() => warehouses.id).notNull(),
  orderDate: timestamp('order_date').notNull(),
  expectedDeliveryDate: timestamp('expected_delivery_date').notNull(),
  revisedDeliveryDate: timestamp('revised_delivery_date'),
  totalCost: doublePrecision('total_cost').notNull(),
  status: text('status').notNull(), // DRAFT, ISSUED, IN_TRANSIT, DELAYED, FULFILLED
});

/**
 * 7. Purchase Order Lines
 */
export const purchaseOrderLines = pgTable('purchase_order_lines', {
  id: text('id').primaryKey(),
  poId: text('po_id').references(() => purchaseOrders.id).notNull(),
  skuId: text('sku_id').references(() => inventorySkus.id).notNull(),
  quantityOrdered: integer('quantity_ordered').notNull(),
  quantityReceived: integer('quantity_received').notNull(),
  unitPrice: doublePrecision('unit_price').notNull(),
});

/**
 * 8. Shipments
 */
export const shipments = pgTable('shipments', {
  id: text('id').primaryKey(),
  trackingNumber: text('tracking_number').notNull().unique(),
  poId: text('po_id').references(() => purchaseOrders.id).notNull(),
  carrier: text('carrier').notNull(),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  status: text('status').notNull(), // BOOKED, IN_TRANSIT, CUSTOMS_HOLD, DELAYED, DELIVERED
  departureDate: timestamp('departure_date').notNull(),
  estimatedDeliveryDate: timestamp('estimated_delivery_date').notNull(),
  revisedDeliveryDate: timestamp('revised_delivery_date'),
  actualDeliveryDate: timestamp('actual_delivery_date'),
  delayDays: integer('delay_days').default(0).notNull(),
  currentLocation: text('current_location').notNull(),
  lastWebhookTimestamp: timestamp('last_webhook_timestamp').defaultNow().notNull(),
});

/**
 * 9. Shipment Tracking Events
 */
export const shipmentTrackingEvents = pgTable('shipment_tracking_events', {
  id: text('id').primaryKey(),
  shipmentId: text('shipment_id').references(() => shipments.id).notNull(),
  eventId: text('event_id').notNull(),
  status: text('status').notNull(),
  location: text('location').notNull(),
  description: text('description').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  isAnomaly: boolean('is_anomaly').default(false).notNull(),
});

/**
 * 10. Customers
 */
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  tier: text('tier').notNull(), // TIER_1_STRATEGIC, TIER_2_ENTERPRISE, TIER_3_STANDARD
  region: text('region').notNull(),
  penaltyClausePerDayLate: doublePrecision('penalty_clause_per_day_late').notNull(),
  slaTargetHours: integer('sla_target_hours').notNull(),
});

/**
 * 11. Customer Orders
 */
export const customerOrders = pgTable('customer_orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  customerId: text('customer_id').references(() => customers.id).notNull(),
  warehouseId: text('warehouse_id').references(() => warehouses.id).notNull(),
  orderDate: timestamp('order_date').notNull(),
  promisedDate: timestamp('promised_date').notNull(),
  estimatedFulfillmentDate: timestamp('estimated_fulfillment_date').notNull(),
  totalValue: doublePrecision('total_value').notNull(),
  status: text('status').notNull(), // PENDING, ALLOCATED, AT_RISK, SHIPPED, DELIVERED
  riskScore: integer('risk_score').default(0).notNull(),
});

/**
 * 12. Customer Order Lines
 */
export const customerOrderLines = pgTable('customer_order_lines', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => customerOrders.id).notNull(),
  skuId: text('sku_id').references(() => inventorySkus.id).notNull(),
  quantity: integer('quantity').notNull(),
  fulfilledQuantity: integer('fulfilled_quantity').default(0).notNull(),
});

/**
 * 13. Disruptions
 */
export const disruptions = pgTable('disruptions', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  type: text('type').notNull(), // PORT_CONGESTION, SUPPLIER_DELAY, etc.
  severity: text('severity').notNull(), // LOW, MEDIUM, HIGH, CRITICAL
  status: text('status').notNull(), // DETECTED, ANALYZING, RECOVERY_IN_PROGRESS, RESOLVED
  affectedShipmentId: text('affected_shipment_id').references(() => shipments.id),
  affectedSupplierId: text('affected_supplier_id').references(() => suppliers.id),
  delayImpactDays: integer('delay_impact_days').notNull(),
  location: text('location').notNull(),
  description: text('description').notNull(),
  riskScore: integer('risk_score').notNull(),
  affectedOrdersCount: integer('affected_orders_count').default(0).notNull(),
  totalRevenueAtRisk: doublePrecision('total_revenue_at_risk').default(0).notNull(),
  detectedAt: timestamp('detected_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

/**
 * 14. Recovery Plans
 */
export const recoveryPlans = pgTable('recovery_plans', {
  id: text('id').primaryKey(),
  disruptionId: text('disruption_id').references(() => disruptions.id).notNull(),
  strategy: text('strategy').notNull(), // STOCK_REALLOCATION, EXPEDITED_FREIGHT, etc.
  title: text('title').notNull(),
  description: text('description').notNull(),
  authorId: text('author_id').references(() => users.id).notNull(),
  authorRole: text('author_role').notNull(),
  status: text('status').notNull(), // DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, EXECUTED
  feasibilityScore: integer('feasibility_score').notNull(),
  deltaCost: doublePrecision('delta_cost').notNull(),
  deltaDays: integer('delta_days').notNull(),
  mitigatedRevenue: doublePrecision('mitigated_revenue').notNull(),
  beforeRiskScore: integer('before_risk_score').notNull(),
  afterRiskScore: integer('after_risk_score').notNull(),
  deterministicCalculationsJson: text('deterministic_calculations_json').notNull(),
  geminiExplanation: text('gemini_explanation'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 15. Recovery Approvals (Separation of duties)
 */
export const recoveryApprovals = pgTable('recovery_approvals', {
  id: text('id').primaryKey(),
  planId: text('plan_id').references(() => recoveryPlans.id).notNull(),
  approverId: text('approver_id').references(() => users.id).notNull(),
  approverRole: text('approver_role').notNull(),
  action: text('action').notNull(), // APPROVE, REJECT, REQUEST_MODIFICATION
  notes: text('notes').notNull(),
  decisionTimestamp: timestamp('decision_timestamp').defaultNow().notNull(),
});

/**
 * 16. Audit Ledger (Immutable verifiable events)
 */
export const auditLedger = pgTable('audit_ledger', {
  id: text('id').primaryKey(),
  eventType: text('event_type').notNull(),
  actorId: text('actor_id').notNull(),
  actorRole: text('actor_role').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  beforeStateJson: text('before_state_json'),
  afterStateJson: text('after_state_json').notNull(),
  actionHash: text('action_hash').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

/**
 * 17. Import Batches (Stage 2 Ingestion)
 */
export const importBatches = pgTable('import_batches', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  fileType: text('file_type').notNull(), // CSV, JSON
  entityType: text('entity_type').notNull(), // inventory_skus, shipments, purchase_orders, suppliers
  status: text('status').notNull(), // COMPLETED, PARTIALLY_QUARANTINED, FAILED
  totalRows: integer('total_rows').notNull(),
  validRows: integer('valid_rows').notNull(),
  quarantinedRows: integer('quarantined_rows').notNull(),
  importedBy: text('imported_by').notNull(),
  errorSummary: text('error_summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * 18. Quarantined Import Rows (Stage 2 Ingestion Quarantine)
 */
export const quarantinedImportRows = pgTable('quarantined_import_rows', {
  id: text('id').primaryKey(),
  batchId: text('batch_id').references(() => importBatches.id).notNull(),
  rowNumber: integer('row_number').notNull(),
  rawDataJson: text('raw_data_json').notNull(),
  errorCategory: text('error_category').notNull(),
  errorMessage: text('error_message').notNull(),
  status: text('status').default('PENDING_REVIEW').notNull(), // PENDING_REVIEW, RESOLVED, DISCARDED
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * 19. Carrier Webhook Events (Stage 2 Webhook Ledger)
 */
export const carrierWebhookEvents = pgTable('carrier_webhook_events', {
  id: text('id').primaryKey(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  eventId: text('event_id').notNull().unique(),
  carrier: text('carrier').notNull(),
  shipmentId: text('shipment_id').references(() => shipments.id),
  trackingNumber: text('tracking_number').notNull(),
  eventType: text('event_type').notNull(),
  location: text('location').notNull(),
  statusTransition: text('status_transition').notNull(),
  eventTimestamp: timestamp('event_timestamp').notNull(),
  payloadHash: text('payload_hash').notNull(),
  rawPayloadJson: text('raw_payload_json').notNull(),
  processingStatus: text('processing_status').notNull(), // ACCEPTED, DUPLICATE_IDEMPOTENT, PAYLOAD_CONFLICT, STALE_REJECTED, INVALID_TRANSITION
  errorDetails: text('error_details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Drizzle Relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  authoredPlans: many(recoveryPlans),
  approvals: many(recoveryApprovals),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
  inventorySkus: many(inventorySkus),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [purchaseOrders.supplierId], references: [suppliers.id] }),
  warehouse: one(warehouses, { fields: [purchaseOrders.warehouseId], references: [warehouses.id] }),
  lines: many(purchaseOrderLines),
  shipments: many(shipments),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  purchaseOrder: one(purchaseOrders, { fields: [shipments.poId], references: [purchaseOrders.id] }),
  events: many(shipmentTrackingEvents),
}));

export const customerOrdersRelations = relations(customerOrders, ({ one, many }) => ({
  customer: one(customers, { fields: [customerOrders.customerId], references: [customers.id] }),
  lines: many(customerOrderLines),
}));

export const disruptionsRelations = relations(disruptions, ({ one, many }) => ({
  shipment: one(shipments, { fields: [disruptions.affectedShipmentId], references: [shipments.id] }),
  supplier: one(suppliers, { fields: [disruptions.affectedSupplierId], references: [suppliers.id] }),
  recoveryPlans: many(recoveryPlans),
}));

export const recoveryPlansRelations = relations(recoveryPlans, ({ one, many }) => ({
  disruption: one(disruptions, { fields: [recoveryPlans.disruptionId], references: [disruptions.id] }),
  author: one(users, { fields: [recoveryPlans.authorId], references: [users.id] }),
  approvals: many(recoveryApprovals),
}));
