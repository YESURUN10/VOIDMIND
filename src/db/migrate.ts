import { dbContext } from './index.ts';

export async function runMigrations(): Promise<{ success: boolean; tablesCreated: string[] }> {
  const query = dbContext.query;

  const ddlStatements = [
    // 1. Users
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 2. Suppliers
    `CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      region TEXT NOT NULL,
      tier INTEGER NOT NULL,
      lead_time_days INTEGER NOT NULL,
      on_time_delivery_rate DOUBLE PRECISION NOT NULL,
      defect_rate DOUBLE PRECISION NOT NULL,
      risk_score INTEGER NOT NULL,
      status TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 3. Warehouses
    `CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      region TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      capacity_units INTEGER NOT NULL,
      utilized_units INTEGER NOT NULL,
      status TEXT NOT NULL
    );`,

    // 4. Inventory SKUs
    `CREATE TABLE IF NOT EXISTS inventory_skus (
      id TEXT PRIMARY KEY,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit_cost DOUBLE PRECISION NOT NULL,
      current_stock INTEGER NOT NULL,
      expected_stock INTEGER NOT NULL,
      safety_stock INTEGER NOT NULL,
      reorder_point INTEGER NOT NULL,
      lead_time_days INTEGER NOT NULL,
      preferred_supplier_id TEXT REFERENCES suppliers(id),
      warehouse_id TEXT REFERENCES warehouses(id),
      status TEXT NOT NULL
    );`,

    // 5. Warehouse Stock
    `CREATE TABLE IF NOT EXISTS warehouse_stock (
      id TEXT PRIMARY KEY,
      warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
      sku_id TEXT NOT NULL REFERENCES inventory_skus(id),
      stock_on_hand INTEGER NOT NULL,
      allocated_stock INTEGER NOT NULL,
      available_stock INTEGER NOT NULL,
      bin_location TEXT NOT NULL
    );`,

    // 6. Purchase Orders
    `CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      po_number TEXT NOT NULL UNIQUE,
      supplier_id TEXT NOT NULL REFERENCES suppliers(id),
      warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
      order_date TIMESTAMP NOT NULL,
      expected_delivery_date TIMESTAMP NOT NULL,
      revised_delivery_date TIMESTAMP,
      total_cost DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL
    );`,

    // 7. Purchase Order Lines
    `CREATE TABLE IF NOT EXISTS purchase_order_lines (
      id TEXT PRIMARY KEY,
      po_id TEXT NOT NULL REFERENCES purchase_orders(id),
      sku_id TEXT NOT NULL REFERENCES inventory_skus(id),
      quantity_ordered INTEGER NOT NULL,
      quantity_received INTEGER NOT NULL,
      unit_price DOUBLE PRECISION NOT NULL
    );`,

    // 8. Shipments
    `CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY,
      tracking_number TEXT NOT NULL UNIQUE,
      po_id TEXT NOT NULL REFERENCES purchase_orders(id),
      carrier TEXT NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      status TEXT NOT NULL,
      departure_date TIMESTAMP NOT NULL,
      estimated_delivery_date TIMESTAMP NOT NULL,
      revised_delivery_date TIMESTAMP,
      actual_delivery_date TIMESTAMP,
      delay_days INTEGER NOT NULL DEFAULT 0,
      current_location TEXT NOT NULL,
      last_webhook_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 9. Shipment Tracking Events
    `CREATE TABLE IF NOT EXISTS shipment_tracking_events (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL REFERENCES shipments(id),
      event_id TEXT NOT NULL,
      status TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TIMESTAMP NOT NULL,
      is_anomaly BOOLEAN NOT NULL DEFAULT FALSE
    );`,

    // 10. Customers
    `CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tier TEXT NOT NULL,
      region TEXT NOT NULL,
      penalty_clause_per_day_late DOUBLE PRECISION NOT NULL,
      sla_target_hours INTEGER NOT NULL
    );`,

    // 11. Customer Orders
    `CREATE TABLE IF NOT EXISTS customer_orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
      order_date TIMESTAMP NOT NULL,
      promised_date TIMESTAMP NOT NULL,
      estimated_fulfillment_date TIMESTAMP NOT NULL,
      total_value DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL,
      risk_score INTEGER NOT NULL DEFAULT 0
    );`,

    // 12. Customer Order Lines
    `CREATE TABLE IF NOT EXISTS customer_order_lines (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES customer_orders(id),
      sku_id TEXT NOT NULL REFERENCES inventory_skus(id),
      quantity INTEGER NOT NULL,
      fulfilled_quantity INTEGER NOT NULL DEFAULT 0
    );`,

    // 13. Disruptions
    `CREATE TABLE IF NOT EXISTS disruptions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL,
      affected_shipment_id TEXT REFERENCES shipments(id),
      affected_supplier_id TEXT REFERENCES suppliers(id),
      delay_impact_days INTEGER NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      risk_score INTEGER NOT NULL,
      affected_orders_count INTEGER NOT NULL DEFAULT 0,
      total_revenue_at_risk DOUBLE PRECISION NOT NULL DEFAULT 0,
      detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP
    );`,

    // 14. Recovery Plans
    `CREATE TABLE IF NOT EXISTS recovery_plans (
      id TEXT PRIMARY KEY,
      disruption_id TEXT NOT NULL REFERENCES disruptions(id),
      strategy TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      author_id TEXT NOT NULL REFERENCES users(id),
      author_role TEXT NOT NULL,
      status TEXT NOT NULL,
      feasibility_score INTEGER NOT NULL,
      delta_cost DOUBLE PRECISION NOT NULL,
      delta_days INTEGER NOT NULL,
      mitigated_revenue DOUBLE PRECISION NOT NULL,
      before_risk_score INTEGER NOT NULL,
      after_risk_score INTEGER NOT NULL,
      deterministic_calculations_json TEXT NOT NULL,
      gemini_explanation TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 15. Recovery Approvals
    `CREATE TABLE IF NOT EXISTS recovery_approvals (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL REFERENCES recovery_plans(id),
      approver_id TEXT NOT NULL REFERENCES users(id),
      approver_role TEXT NOT NULL,
      action TEXT NOT NULL,
      notes TEXT NOT NULL,
      decision_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 16. Audit Ledger
    `CREATE TABLE IF NOT EXISTS audit_ledger (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      before_state_json TEXT,
      after_state_json TEXT NOT NULL,
      action_hash TEXT NOT NULL,
      timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 17. Import Batches
    `CREATE TABLE IF NOT EXISTS import_batches (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      status TEXT NOT NULL,
      total_rows INTEGER NOT NULL,
      valid_rows INTEGER NOT NULL,
      quarantined_rows INTEGER NOT NULL,
      imported_by TEXT NOT NULL,
      error_summary TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 18. Quarantined Import Rows
    `CREATE TABLE IF NOT EXISTS quarantined_import_rows (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL REFERENCES import_batches(id),
      row_number INTEGER NOT NULL,
      raw_data_json TEXT NOT NULL,
      error_category TEXT NOT NULL,
      error_message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 19. Carrier Webhook Events
    `CREATE TABLE IF NOT EXISTS carrier_webhook_events (
      id TEXT PRIMARY KEY,
      idempotency_key TEXT NOT NULL UNIQUE,
      event_id TEXT NOT NULL UNIQUE,
      carrier TEXT NOT NULL,
      shipment_id TEXT REFERENCES shipments(id),
      tracking_number TEXT NOT NULL,
      event_type TEXT NOT NULL,
      location TEXT NOT NULL,
      status_transition TEXT NOT NULL,
      event_timestamp TIMESTAMP NOT NULL,
      payload_hash TEXT NOT NULL,
      raw_payload_json TEXT NOT NULL,
      processing_status TEXT NOT NULL,
      error_details TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`
  ];

  const tablesCreated: string[] = [];

  for (const stmt of ddlStatements) {
    await query(stmt);
  }

  // Seed baseline data
  await seedInitialData();

  return {
    success: true,
    tablesCreated: [
      'users',
      'suppliers',
      'warehouses',
      'inventory_skus',
      'warehouse_stock',
      'purchase_orders',
      'purchase_order_lines',
      'shipments',
      'shipment_tracking_events',
      'customers',
      'customer_orders',
      'customer_order_lines',
      'disruptions',
      'recovery_plans',
      'recovery_approvals',
      'audit_ledger',
      'import_batches',
      'quarantined_import_rows',
      'carrier_webhook_events'
    ]
  };
}

export async function seedInitialData(): Promise<void> {
  const query = dbContext.query;

  // 1. Seed 5 Roles
  const usersToSeed = [
    {
      id: 'usr_analyst_01',
      email: 'analyst@voidmind.internal',
      name: 'Elena Rostova',
      role: 'OPERATIONS_ANALYST',
      title: 'Lead Operations Analyst',
      department: 'Global Supply Chain Operations',
    },
    {
      id: 'usr_manager_01',
      email: 'manager@voidmind.internal',
      name: 'Marcus Vance',
      role: 'SUPPLY_CHAIN_MANAGER',
      title: 'Director of Logistics & Planning',
      department: 'Supply Chain Strategy',
    },
    {
      id: 'usr_warehouse_01',
      email: 'warehouse@voidmind.internal',
      name: 'David Chen',
      role: 'WAREHOUSE_OPERATOR',
      title: 'Facility Fulfillment Supervisor',
      department: 'Fulfillment & Inventory',
    },
    {
      id: 'usr_approver_01',
      email: 'approver@voidmind.internal',
      name: 'Sophia Sterling',
      role: 'PROCUREMENT_APPROVER',
      title: 'VP of Global Procurement',
      department: 'Strategic Sourcing',
    },
    {
      id: 'usr_admin_01',
      email: 'admin@voidmind.internal',
      name: 'Alexander Cole',
      role: 'ADMINISTRATOR',
      title: 'Enterprise Systems Administrator',
      department: 'Supply Chain IT & Security',
    },
  ];

  for (const u of usersToSeed) {
    await query(
      `INSERT INTO users (id, email, name, role, title, department)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET name = $3, role = $4;`,
      [u.id, u.email, u.name, u.role, u.title, u.department]
    );
  }

  // 2. Seed Suppliers
  const suppliersToSeed = [
    {
      id: 'sup_abc_01',
      code: 'SUP-ABC',
      name: 'ABC Supplies Ltd.',
      country: 'USA',
      region: 'North America',
      tier: 1,
      leadTimeDays: 5,
      onTimeDeliveryRate: 94.2,
      defectRate: 0.6,
      riskScore: 28,
      status: 'ACTIVE',
    },
    {
      id: 'sup_apex_02',
      code: 'SUP-APX',
      name: 'Apex Precision Micro',
      country: 'Taiwan',
      region: 'APAC',
      tier: 1,
      leadTimeDays: 14,
      onTimeDeliveryRate: 91.8,
      defectRate: 1.1,
      riskScore: 42,
      status: 'ACTIVE',
    },
    {
      id: 'sup_pacific_03',
      code: 'SUP-PAC',
      name: 'Pacific Freight & Assembly',
      country: 'Japan',
      region: 'APAC',
      tier: 2,
      leadTimeDays: 21,
      onTimeDeliveryRate: 88.5,
      defectRate: 1.4,
      riskScore: 52,
      status: 'WATCHLIST',
    },
    {
      id: 'sup_global_04',
      code: 'SUP-GLB',
      name: 'Global Dynamics Industrial',
      country: 'Germany',
      region: 'EU',
      tier: 1,
      leadTimeDays: 8,
      onTimeDeliveryRate: 96.4,
      defectRate: 0.4,
      riskScore: 18,
      status: 'ACTIVE',
    },
    {
      id: 'sup_synapse_05',
      code: 'SUP-SYN',
      name: 'Synapse Alternate Systems',
      country: 'USA',
      region: 'North America',
      tier: 2,
      leadTimeDays: 4,
      onTimeDeliveryRate: 97.5,
      defectRate: 0.5,
      riskScore: 15,
      status: 'ACTIVE',
    },
  ];

  for (const s of suppliersToSeed) {
    await query(
      `INSERT INTO suppliers (id, code, name, country, region, tier, lead_time_days, on_time_delivery_rate, defect_rate, risk_score, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET on_time_delivery_rate = $8, risk_score = $10;`,
      [s.id, s.code, s.name, s.country, s.region, s.tier, s.leadTimeDays, s.onTimeDeliveryRate, s.defectRate, s.riskScore, s.status]
    );
  }

  // 3. Seed Warehouses
  const warehousesToSeed = [
    {
      id: 'wh_usa_east',
      code: 'WH-USA-01',
      name: 'Chicago Main Fulfillment Center',
      city: 'Chicago',
      country: 'USA',
      region: 'USA',
      lat: 41.8781,
      lng: -87.6298,
      capacityUnits: 250000,
      utilizedUnits: 195000,
      status: 'OPTIMAL',
    },
    {
      id: 'wh_usa_west',
      code: 'WH-USA-02',
      name: 'Long Beach Gateway Logistics',
      city: 'Long Beach',
      country: 'USA',
      region: 'USA',
      lat: 33.7701,
      lng: -118.1937,
      capacityUnits: 320000,
      utilizedUnits: 285000,
      status: 'NEAR_CAPACITY',
    },
    {
      id: 'wh_eu_central',
      code: 'WH-EU-01',
      name: 'Frankfurt European Central Hub',
      city: 'Frankfurt',
      country: 'Germany',
      region: 'EU',
      lat: 50.1109,
      lng: 8.6821,
      capacityUnits: 280000,
      utilizedUnits: 210000,
      status: 'OPTIMAL',
    },
    {
      id: 'wh_apac_south',
      code: 'WH-APAC-01',
      name: 'Singapore Deepwater Logistics',
      city: 'Singapore',
      country: 'Singapore',
      region: 'APAC',
      lat: 1.3521,
      lng: 103.8198,
      capacityUnits: 400000,
      utilizedUnits: 340000,
      status: 'OPTIMAL',
    },
  ];

  for (const w of warehousesToSeed) {
    await query(
      `INSERT INTO warehouses (id, code, name, city, country, region, lat, lng, capacity_units, utilized_units, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET utilized_units = $10;`,
      [w.id, w.code, w.name, w.city, w.country, w.region, w.lat, w.lng, w.capacityUnits, w.utilizedUnits, w.status]
    );
  }

  // 4. Seed Inventory SKUs (matching XCaliber Infotech screenshot)
  const skusToSeed = [
    {
      id: 'sku_12345',
      sku: 'SKU-12345',
      name: 'Raw Materials - High-Purity Silicon Substrate',
      category: 'Raw Materials',
      unitCost: 145.0,
      currentStock: 45, // Exact match to screenshot Low Stock Alerts: 45 units
      expectedStock: 150, // Exact match to screenshot: 150 units
      safetyStock: 80,
      reorderPoint: 70,
      leadTimeDays: 5, // Exact match to screenshot: Lead Time: 5 days
      preferredSupplierId: 'sup_abc_01', // Supplier: ABC Supplies Ltd.
      warehouseId: 'wh_usa_east',
      status: 'LOW_STOCK',
    },
    {
      id: 'sku_wip_01',
      sku: 'SKU-20984',
      name: 'Work In Progress - SMT PCB Circuit Array',
      category: 'WIP',
      unitCost: 320.0,
      currentStock: 1350, // Matches screenshot WIP metric: 1,350 units
      expectedStock: 2500,
      safetyStock: 500,
      reorderPoint: 800,
      leadTimeDays: 10,
      preferredSupplierId: 'sup_apex_02',
      warehouseId: 'wh_usa_east',
      status: 'HEALTHY',
    },
    {
      id: 'sku_fg_01',
      sku: 'SKU-55410',
      name: 'Finished Goods - Edge Controller Gateway',
      category: 'Finished Goods',
      unitCost: 1250.0,
      currentStock: 15000, // Matches screenshot category donut: 15,000 units
      expectedStock: 18000,
      safetyStock: 3000,
      reorderPoint: 4500,
      leadTimeDays: 14,
      preferredSupplierId: 'sup_global_04',
      warehouseId: 'wh_usa_west',
      status: 'HEALTHY',
    },
    {
      id: 'sku_sp_01',
      sku: 'SKU-88210',
      name: 'Spare Parts - Thermal Sensor Housing Kit',
      category: 'Spare Parts',
      unitCost: 65.0,
      currentStock: 5000, // Matches screenshot category donut: 5,000 units
      expectedStock: 6000,
      safetyStock: 1200,
      reorderPoint: 1500,
      leadTimeDays: 7,
      preferredSupplierId: 'sup_pacific_03',
      warehouseId: 'wh_eu_central',
      status: 'HEALTHY',
    },
    {
      id: 'sku_ret_01',
      sku: 'SKU-99001',
      name: 'Returns / Defective - RMA Diagnostic Queue',
      category: 'Returns / Defective',
      unitCost: 80.0,
      currentStock: 2500, // Matches screenshot category donut: 2,500 units
      expectedStock: 2500,
      safetyStock: 0,
      reorderPoint: 5000,
      leadTimeDays: 3,
      preferredSupplierId: 'sup_abc_01',
      warehouseId: 'wh_usa_east',
      status: 'HEALTHY',
    },
  ];

  for (const s of skusToSeed) {
    await query(
      `INSERT INTO inventory_skus (id, sku, name, category, unit_cost, current_stock, expected_stock, safety_stock, reorder_point, lead_time_days, preferred_supplier_id, warehouse_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET current_stock = $6, expected_stock = $7, status = $13;`,
      [s.id, s.sku, s.name, s.category, s.unitCost, s.currentStock, s.expectedStock, s.safetyStock, s.reorderPoint, s.leadTimeDays, s.preferredSupplierId, s.warehouseId, s.status]
    );
  }

  // 5. Seed Customers
  const customersToSeed = [
    {
      id: 'cust_01',
      name: 'AeroDynamics Global Defense',
      tier: 'TIER_1_STRATEGIC',
      region: 'USA',
      penaltyClausePerDayLate: 8500.0,
      slaTargetHours: 24,
    },
    {
      id: 'cust_02',
      name: 'NovaTech Healthcare Robotics',
      tier: 'TIER_1_STRATEGIC',
      region: 'EU',
      penaltyClausePerDayLate: 12000.0,
      slaTargetHours: 12,
    },
    {
      id: 'cust_03',
      name: 'Apex Industrial Automation',
      tier: 'TIER_2_ENTERPRISE',
      region: 'USA',
      penaltyClausePerDayLate: 4500.0,
      slaTargetHours: 48,
    },
  ];

  for (const c of customersToSeed) {
    await query(
      `INSERT INTO customers (id, name, tier, region, penalty_clause_per_day_late, sla_target_hours)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET penalty_clause_per_day_late = $5;`,
      [c.id, c.name, c.tier, c.region, c.penaltyClausePerDayLate, c.slaTargetHours]
    );
  }

  // 6. Seed Purchase Orders & Shipments
  await query(
    `INSERT INTO purchase_orders (id, po_number, supplier_id, warehouse_id, order_date, expected_delivery_date, total_cost, status)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '3 days', $5, $6)
     ON CONFLICT (id) DO NOTHING;`,
    ['po_1001', 'PO-2026-8819', 'sup_abc_01', 'wh_usa_east', 45000.0, 'DELAYED']
  );

  await query(
    `INSERT INTO purchase_order_lines (id, po_id, sku_id, quantity_ordered, quantity_received, unit_price)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO NOTHING;`,
    ['pol_1001_1', 'po_1001', 'sku_12345', 105, 0, 145.0]
  );

  await query(
    `INSERT INTO shipments (id, tracking_number, po_id, carrier, origin, destination, status, departure_date, estimated_delivery_date, delay_days, current_location)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '1 days', $8, $9)
     ON CONFLICT (id) DO NOTHING;`,
    ['shp_8001', 'TRK-MAERSK-9021', 'po_1001', 'Maersk Line', 'Keelung Port, Taiwan', 'Chicago Hub (via Long Beach)', 'DELAYED', 6, 'Port of Long Beach - Berthing Queue']
  );

  await query(
    `INSERT INTO shipments (id, tracking_number, po_id, carrier, origin, destination, status, departure_date, estimated_delivery_date, delay_days, current_location)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP + INTERVAL '2 days', $8, $9)
     ON CONFLICT (id) DO NOTHING;`,
    ['shp_8002', 'TRK-FEDEX-4011', 'po_1001', 'FedEx Freight', 'Salt Lake City Hub', 'Chicago Hub', 'IN_TRANSIT', 0, 'Salt Lake City Hub']
  );

  // 7. Seed Customer Orders (matching $285k Revenue at Risk)
  const ordersToSeed = [
    {
      id: 'cord_9001',
      orderNumber: 'ORD-2026-4401',
      customerId: 'cust_01',
      warehouseId: 'wh_usa_east',
      totalValue: 142000.0,
      status: 'AT_RISK',
      riskScore: 82,
    },
    {
      id: 'cord_9002',
      orderNumber: 'ORD-2026-4402',
      customerId: 'cust_02',
      warehouseId: 'wh_usa_east',
      totalValue: 88000.0,
      status: 'AT_RISK',
      riskScore: 74,
    },
    {
      id: 'cord_9003',
      orderNumber: 'ORD-2026-4403',
      customerId: 'cust_03',
      warehouseId: 'wh_usa_east',
      totalValue: 55000.0,
      status: 'AT_RISK',
      riskScore: 65,
    },
  ];

  for (const o of ordersToSeed) {
    await query(
      `INSERT INTO customer_orders (id, order_number, customer_id, warehouse_id, order_date, promised_date, estimated_fulfillment_date, total_value, status, risk_score)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '8 days', $5, $6, $7)
       ON CONFLICT (id) DO NOTHING;`,
      [o.id, o.orderNumber, o.customerId, o.warehouseId, o.totalValue, o.status, o.riskScore]
    );
  }

  // Seed Customer Order Lines
  await query(
    `INSERT INTO customer_order_lines (id, order_id, sku_id, quantity, fulfilled_quantity)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO NOTHING;`,
    ['col_9001_1', 'cord_9001', 'sku_12345', 35, 0]
  );

  // 7. Seed Active Disruption
  await query(
    `INSERT INTO disruptions (id, title, type, severity, status, affected_shipment_id, affected_supplier_id, delay_impact_days, location, description, risk_score, affected_orders_count, total_revenue_at_risk)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (id) DO NOTHING;`,
    [
      'dis_port_longbeach_01',
      'Long Beach Deepwater Terminal Congestion',
      'PORT_CONGESTION',
      'HIGH',
      'DETECTED',
      'shp_8001',
      'sup_abc_01',
      6,
      'Port of Long Beach, USA',
      'Container vessel berthing delays resulting in +6 days dwell time on inbound SKU-12345 raw wafer shipments.',
      78,
      3,
      285000.0
    ]
  );

  // 8. Seed Initial Audit Record
  await query(
    `INSERT INTO audit_ledger (id, event_type, actor_id, actor_role, entity_type, entity_id, after_state_json, action_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO NOTHING;`,
    [
      'aud_init_01',
      'SYSTEM_INITIALIZATION',
      'usr_admin_01',
      'ADMINISTRATOR',
      'SYSTEM',
      'DISRUPTION_IQ_CORE',
      JSON.stringify({ status: 'INITIALIZED', stage: 'STAGE_1_ARCHITECTURE' }),
      'sha256_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    ]
  );
}

// Auto-run if invoked directly via CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running DisruptionIQ Stage 1 Migrations...');
  runMigrations()
    .then((res) => {
      console.log('✅ Migrations completed successfully. Tables created:', res.tablesCreated);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}
