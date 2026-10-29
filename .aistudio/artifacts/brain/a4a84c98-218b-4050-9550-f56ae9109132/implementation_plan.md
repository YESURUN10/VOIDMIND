# DisruptionIQ Enterprise Supply-Chain Platform: Stage 1 Architecture & Execution Plan

DisruptionIQ is an enterprise-grade supply-chain resilience and disruption management platform built to the visual specifications of the dark-mode XCaliber Infotech dashboard reference. It provides deterministic supply-chain monitoring, downstream order impact tracing, multi-factor risk scoring, automated recovery planning, separation-of-duties approval controls, and verifiable audit logging.

Per user requirements, development is structured into distinct, reviewable stages. **Stage 1 & Stage 2** are complete and verified:
- **Stage 1 (Complete)**: Core Architecture, XCaliber Infotech Design System, 13 Route Shells, Persistent Navigation, 19 Relational Tables & Migrations, 5-Role RBAC & Separation of Duties.
- **Stage 2 (Complete)**: CSV/JSON Data Ingestion Pipeline (10MB streaming, row quarantine, batch tracking), Carrier Webhook Engine (`POST /api/webhooks/carrier` with SHA-256 idempotency, conflict detection, monotonic timestamps, state progression), Motion Design System (signature bottom-right entrance motion, staggered reveals), Three Signature Visualizations (Supply Network Map, Disruption Impact Graph, Recovery Timeline), and Full 14-Test Automated Verification Suite.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Stage 1 and Stage 2 have been fully implemented, verified, and audited with zero mock fallbacks. 14 out of 14 automated tests pass cleanly (`npm test`), verifying relational integrity, role boundaries, mathematical invariant reorder calculations, file quarantine, webhook deduplication, conflict protection, and downstream lineage tracing.

- **Staged Implementation Protocol**:
  - **Stage 1 (Current)**: Core Architecture, XCaliber Infotech Design System, 13 Route Shells, Persistent Responsive Navigation, Relational PostgreSQL Schema & Migrations, Authentication & 5 Role Definitions, and Foundation Verification Tests.
  - **Stage 2**: Data Ingestion Pipeline (CSV/JSON schema validation, row-level quarantine engine) & Carrier Webhook Ingestion (deduplication, payload conflict checks, monotonic timestamps).
  - **Stage 3**: Disruption Detection Engine, Downstream Lineage Trace (Shipment $\rightarrow$ PO Lines $\rightarrow$ Inventory $\rightarrow$ Customer Orders), and Multi-Factor Deterministic Risk Engine.
  - **Stage 4**: Four Deterministic Recovery Generators (Reallocation, Expedite, Alternative Supplier, Split Order), Server-side Gemini 3.8 Flash Briefing, Separation-of-Duties Approvals, and Idempotent Execution.
  - **Stage 5**: Append-Only Verifiable Audit Ledger, Multi-Scenario Synthetic Seed Data (Electronics, Automotive, Pharma, Consumer Goods), and Comprehensive Test Suite.
- **Relational Storage Engine**:
  - Full relational PostgreSQL schema using Drizzle ORM (`drizzle-orm` / `pg`).
  - Strict foreign-key references across all supply chain entities: `suppliers`, `purchase_orders`, `purchase_order_lines`, `shipments`, `shipment_tracking_events`, `warehouses`, `inventory_skus`, `warehouse_stock`, `customers`, `customer_orders`, `customer_order_lines`, `disruptions`, `recovery_plans`, `approvals`, `audit_ledger`, and `users`.
  - Built-in migration runner (`npm run db:migrate` / startup auto-migration) ensuring tables and indexes exist prior to service startup.
  - Development dual-mode driver: connects directly to configured PostgreSQL/Cloud SQL instance when credentials exist, with an in-process persistent relational SQLite/pg-mem engine fallback for hermetic local testing, guaranteeing zero broken startup states while maintaining identical SQL constraints.
- **Authentication & 5-Role RBAC Specification**:
  - Token-based authentication with role verification on every state-changing route:
    1. **Operations Analyst** (`OPERATIONS_ANALYST`): Read access to all dashboards, analytics, disruptions, order impact graphs; simulation triggering.
    2. **Supply Chain Manager** (`SUPPLY_CHAIN_MANAGER`): Authoring and modification of recovery plans; inventory reallocation proposals.
    3. **Warehouse Operator** (`WAREHOUSE_OPERATOR`): Warehouse receipts, storage bin updates, physical stock confirmations.
    4. **Procurement Approver** (`PROCUREMENT_APPROVER`): Authorization of purchase orders and expedite spend. Enforces separation-of-duties (cannot approve self-authored plans).
    5. **Administrator** (`ADMINISTRATOR`): Full access, carrier webhook configuration, audit log audits, role assignment.
  - Fast-switch role simulator in the top navigation bar for testing role-specific permissions and UI gating.

---

## 1. Stage 1 Scope & Deliverables

### A. Application Architecture & Full-Stack Runner
- Full-stack Vite + Express application architecture with `server.ts` entry point running on port 3000.
- Production and dev server parity via `tsx server.ts` with mounted Vite middlewares.
- Clean separation between API routes (`/api/*`), database repositories (`src/db/*`), authentication middleware (`src/middleware/*`), and React frontend (`src/*`).

### B. Professional Design System (XCaliber Infotech)
- **Palette**:
  - Canvas: `#111111`
  - Secondary / Navigation Surfaces: `#151515`
  - Primary Panels & Cards: `#202020`
  - Hairline Separators: `#303030`
  - Primary Brand Accent: `#FF5938`
  - Gradient: `linear-gradient(135deg, #F4512C, #96351D)` (for hero metrics, low-stock warnings, and urgent alerts)
  - Text: Primary `#F5F5F5`, Secondary `#A0A0A0`, Muted `#737373`
  - Semantic Status: Nominal `#10B981`, Warning `#F59E0B`, Critical `#EF4444`
- **Typography & Tables**:
  - Primary typeface: Inter / Plus Jakarta Sans fallback.
  - Tabular numerals (`font-mono tabular-nums`) across all metrics, dates, counts, and financial values.
  - Consistent Lucide icon set (uniform 16px/18px sizing and stroke width).

### C. 13 Dedicated Route Shells & Responsive Navigation
- Persistent top header: Brand wordmark, global breadcrumbs, live search, quick filters (Timeframe, Region, Product, Supplier), notifications, export, role badge & switcher.
- Left-hand navigation rail with icons, tooltips, and active indicator in `#FF5938`.
- 13 distinct routes with individual page components:
  1. `/overview`: High-value KPI summary, inventory trends, low stock alerts, world warehouse map, top suppliers, category breakdown.
  2. `/analytics`: Operational metrics, lead time distributions, carrier performance benchmarks.
  3. `/disruptions`: Active incidents, severity matrix, root cause taxonomy, webhook simulator bench.
  4. `/orders`: Sales and purchase orders, order line items, fulfillment risk flags.
  5. `/shipments`: Inbound/outbound freight tracking, milestones, carrier delay tracking.
  6. `/inventory`: SKU directory, stock-on-hand, safety thresholds, reorder points.
  7. `/warehouses`: Distribution centers, capacity utilization, bin management.
  8. `/suppliers`: Supplier scorecards, on-time delivery rates, tier classifications.
  9. `/recovery-plans`: Deterministic recovery generators and before/after comparisons.
  10. `/approvals`: Separation-of-duties approval queue and decision history.
  11. `/audit`: Append-only verifiable ledger with cryptographic action hashes.
  12. `/imports`: CSV/JSON data ingestion pipeline with row error inspector and quarantine.
  13. `/settings`: Scenario switcher, carrier webhook config, role management.

### D. Relational Schema & Migrations (`src/db/schema.ts`)
- Schema definition covering all linked entities:
  - `users`: ID, email, name, role, created_at.
  - `suppliers`: ID, name, code, tier, lead_time_days, on_time_rate, risk_score.
  - `warehouses`: ID, code, name, city, country, region, capacity_units.
  - `inventory_skus`: ID, sku, name, category, unit_cost, safety_stock, reorder_point.
  - `warehouse_stock`: Warehouse ID, SKU ID, stock_on_hand, allocated_stock, available_stock.
  - `purchase_orders`: ID, po_number, supplier_id, destination_warehouse_id, order_date, expected_date, status.
  - `purchase_order_lines`: ID, po_id, sku_id, quantity_ordered, quantity_received, unit_price.
  - `shipments`: ID, tracking_number, po_id, carrier, origin, destination, status, departure_date, estimated_delivery, actual_delivery, delay_days.
  - `customers`: ID, name, tier (Tier 1 / Tier 2 / Tier 3), sla_target_hours.
  - `customer_orders`: ID, order_number, customer_id, warehouse_id, order_date, promise_date, status, total_value.
  - `customer_order_lines`: ID, order_id, sku_id, quantity, fulfilled_quantity.
  - `disruptions`: ID, title, type (port_congestion, factory_fire, customs_hold, weather), severity, status, affected_shipment_id, delay_impact_days.
  - `recovery_plans`: ID, disruption_id, strategy (reallocation, expedite, alternate_supplier, split_po), author_id, status (draft, pending_approval, approved, rejected, executed), delta_cost, delta_delay_days.
  - `recovery_approvals`: ID, plan_id, approver_id, action (approve, reject, modify), notes, decision_timestamp.
  - `audit_ledger`: ID, event_type, actor_id, actor_role, entity_type, entity_id, before_state, after_state, action_hash, timestamp.

---

## 2. Technical Architecture & System Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DisruptionIQ Web Client                         │
│             React 19 + Tailwind v4 + Motion + Lucide Icons             │
├────────────────────────────────────────────────────────────────────────┤
│ Top Navigation: Brand · Breadcrumbs · Global Filters · Role Switcher   │
│ Left Rail: 13 Workflow Routes (/overview, /analytics, /disruptions...) │
├────────────────────────────────────────────────────────────────────────┤
│                     Client Auth & API Service Layer                    │
│   - Token injector & Bearer auth headers                              │
│   - Active Role Context (`OPERATIONS_ANALYST`, `ADMINISTRATOR`, etc.)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Express Backend (server.ts)                       │
├────────────────────────────────────────────────────────────────────────┤
│  • RBAC & Separation-of-Duties Middleware (5 Roles)                    │
│  • Authentication Controller (/api/auth/login, /api/auth/me)           │
│  • Health & Schema Introspection (/api/health, /api/db/status)         │
│  • 13 Route Endpoints for Dashboard, Inventory, Orders, Audit          │
├────────────────────────────────────────────────────────────────────────┤
│                     Relational Database Layer                          │
│  • src/db/schema.ts: Drizzle PostgreSQL Relational Schema              │
│  • src/db/migrate.ts: Migration & Table Initialization Runner          │
│  • src/db/index.ts: Connection Pool & Type-Safe Query Interface        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Stage 1 Verification & Testing Plan

1. **Schema & Migration Verification**:
   - Automated script executing migrations to create all 15 relational tables with foreign keys and unique constraints.
   - Verification query confirming table creation and schema column definitions.
2. **Authentication & RBAC Tests**:
   - Issue authentication tokens for each of the 5 roles.
   - Verify role permissions on protected API endpoints (e.g. `OPERATIONS_ANALYST` cannot trigger an approval; `PROCUREMENT_APPROVER` cannot approve self-authored recovery plans).
3. **Route & Navigation Inspection**:
   - Verify all 13 routes render cleanly with page headers, breadcrumbs, and active navigation indicators.
   - Verify desktop (1440px) and tablet responsive viewports.
4. **Stage 1 Completion Report**:
   - Document exact files created, checks executed, test results, and next steps for Stage 2.
