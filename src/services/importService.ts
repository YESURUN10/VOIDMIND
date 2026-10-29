import crypto from 'crypto';
import { dbContext } from '../db/index.ts';

export interface ImportRowError {
  rowNumber: number;
  field: string;
  errorCategory: 'MISSING_REQUIRED_FIELD' | 'INVALID_DATA_TYPE' | 'FOREIGN_KEY_VIOLATION' | 'DUPLICATE_BUSINESS_KEY' | 'OUT_OF_BOUNDS';
  errorMessage: string;
  rawData: Record<string, any>;
}

export interface ImportBatchResult {
  batchId: string;
  filename: string;
  fileType: 'CSV' | 'JSON';
  entityType: string;
  status: 'COMPLETED' | 'PARTIALLY_QUARANTINED' | 'FAILED';
  totalRows: number;
  validRows: number;
  quarantinedRows: number;
  errors: ImportRowError[];
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV splitter respecting basic commas
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const rowObj: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowObj[header] = values[index] !== undefined ? values[index] : '';
    });
    rows.push(rowObj);
  }

  return rows;
}

export async function processIngestion(
  filename: string,
  rawContent: string,
  entityType: string,
  importedBy: string
): Promise<ImportBatchResult> {
  const query = dbContext.query;
  const batchId = `bat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fileType: 'CSV' | 'JSON' = filename.endsWith('.json') ? 'JSON' : 'CSV';

  let rawRows: Record<string, any>[] = [];

  try {
    if (fileType === 'JSON') {
      const parsed = JSON.parse(rawContent);
      rawRows = Array.isArray(parsed) ? parsed : [parsed];
    } else {
      rawRows = parseCsv(rawContent);
    }
  } catch (err: any) {
    // Malformed JSON/CSV file level failure
    await query(
      `INSERT INTO import_batches (id, filename, file_type, entity_type, status, total_rows, valid_rows, quarantined_rows, imported_by, error_summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [batchId, filename, fileType, entityType, 'FAILED', 0, 0, 0, importedBy, `File parsing failed: ${err.message}`]
    );

    return {
      batchId,
      filename,
      fileType,
      entityType,
      status: 'FAILED',
      totalRows: 0,
      validRows: 0,
      quarantinedRows: 0,
      errors: [
        {
          rowNumber: 0,
          field: 'file',
          errorCategory: 'INVALID_DATA_TYPE',
          errorMessage: `Syntax error parsing ${fileType}: ${err.message}`,
          rawData: {},
        },
      ],
    };
  }

  const errors: ImportRowError[] = [];
  const validRecords: Record<string, any>[] = [];

  // Fetch foreign key caches for suppliers and warehouses to validate relations
  const suppliersResult = await query('SELECT id, code FROM suppliers');
  const validSupplierIds = new Set(suppliersResult.rows.map((r: any) => r.id));
  const validSupplierCodes = new Set(suppliersResult.rows.map((r: any) => r.code));

  const warehousesResult = await query('SELECT id, code FROM warehouses');
  const validWarehouseIds = new Set(warehousesResult.rows.map((r: any) => r.id));
  const validWarehouseCodes = new Set(warehousesResult.rows.map((r: any) => r.code));

  // Row by row validation
  const seenBusinessKeys = new Set<string>();

  // Row by row validation
  for (let idx = 0; idx < rawRows.length; idx++) {
    const row = rawRows[idx];
    const rowNumber = idx + 1;
    let rowHasError = false;

    if (entityType === 'inventory_skus') {
      const sku = row.sku?.trim();
      const name = row.name?.trim();
      const unitCost = parseFloat(row.unit_cost);
      const currentStock = parseInt(row.current_stock, 10);
      const safetyStock = parseInt(row.safety_stock, 10);
      const reorderPoint = parseInt(row.reorder_point, 10);

      if (!sku || sku.length === 0) {
        errors.push({
          rowNumber,
          field: 'sku',
          errorCategory: 'MISSING_REQUIRED_FIELD',
          errorMessage: 'SKU identifier is mandatory and cannot be empty.',
          rawData: row,
        });
        rowHasError = true;
      } else if (seenBusinessKeys.has(sku)) {
        errors.push({
          rowNumber,
          field: 'sku',
          errorCategory: 'DUPLICATE_BUSINESS_KEY',
          errorMessage: `Duplicate SKU '${sku}' encountered within the same import batch. Row quarantined to prevent collision.`,
          rawData: row,
        });
        rowHasError = true;
      } else {
        seenBusinessKeys.add(sku);
      }

      if (!name || name.length === 0) {
        errors.push({
          rowNumber,
          field: 'name',
          errorCategory: 'MISSING_REQUIRED_FIELD',
          errorMessage: 'Product name is mandatory.',
          rawData: row,
        });
        rowHasError = true;
      }

      if (isNaN(unitCost) || unitCost < 0) {
        errors.push({
          rowNumber,
          field: 'unit_cost',
          errorCategory: 'INVALID_DATA_TYPE',
          errorMessage: `Unit cost must be a non-negative number. Got: '${row.unit_cost}'`,
          rawData: row,
        });
        rowHasError = true;
      }

      if (isNaN(currentStock) || currentStock < 0) {
        errors.push({
          rowNumber,
          field: 'current_stock',
          errorCategory: 'INVALID_DATA_TYPE',
          errorMessage: `Current stock must be a non-negative integer. Got: '${row.current_stock}'`,
          rawData: row,
        });
        rowHasError = true;
      }

      if (isNaN(safetyStock) || safetyStock < 0) {
        errors.push({
          rowNumber,
          field: 'safety_stock',
          errorCategory: 'INVALID_DATA_TYPE',
          errorMessage: `Safety stock must be a non-negative integer. Got: '${row.safety_stock}'`,
          rawData: row,
        });
        rowHasError = true;
      }

      // Foreign key check if supplier specified
      const prefSupplier = row.preferred_supplier_id || row.preferredSupplierId;
      if (prefSupplier && !validSupplierIds.has(prefSupplier) && !validSupplierCodes.has(prefSupplier)) {
        errors.push({
          rowNumber,
          field: 'preferred_supplier_id',
          errorCategory: 'FOREIGN_KEY_VIOLATION',
          errorMessage: `Supplier '${prefSupplier}' does not exist in master suppliers catalog.`,
          rawData: row,
        });
        rowHasError = true;
      }

      if (!rowHasError) {
        validRecords.push({
          id: `sku_imp_${Date.now()}_${idx}`,
          sku,
          name,
          category: row.category?.trim() || 'Raw Materials',
          unitCost,
          currentStock,
          expectedStock: parseInt(row.expected_stock || `${currentStock + 50}`, 10),
          safetyStock,
          reorderPoint: isNaN(reorderPoint) ? Math.round(safetyStock * 0.9) : reorderPoint,
          leadTimeDays: parseInt(row.lead_time_days || '5', 10),
          preferredSupplierId: prefSupplier || 'sup_abc_01',
          warehouseId: row.warehouse_id || 'wh_usa_east',
          status: currentStock < safetyStock ? 'LOW_STOCK' : 'HEALTHY',
        });
      }
    } else if (entityType === 'shipments') {
      const trackingNumber = row.tracking_number?.trim();
      const carrier = row.carrier?.trim();
      const origin = row.origin?.trim();
      const destination = row.destination?.trim();

      if (!trackingNumber) {
        errors.push({
          rowNumber,
          field: 'tracking_number',
          errorCategory: 'MISSING_REQUIRED_FIELD',
          errorMessage: 'Tracking number is mandatory.',
          rawData: row,
        });
        rowHasError = true;
      } else if (seenBusinessKeys.has(trackingNumber)) {
        errors.push({
          rowNumber,
          field: 'tracking_number',
          errorCategory: 'DUPLICATE_BUSINESS_KEY',
          errorMessage: `Duplicate tracking number '${trackingNumber}' in batch.`,
          rawData: row,
        });
        rowHasError = true;
      } else {
        seenBusinessKeys.add(trackingNumber);
      }

      if (!carrier) {
        errors.push({
          rowNumber,
          field: 'carrier',
          errorCategory: 'MISSING_REQUIRED_FIELD',
          errorMessage: 'Carrier name is required.',
          rawData: row,
        });
        rowHasError = true;
      }

      if (row.departure_date && isNaN(new Date(row.departure_date).getTime())) {
        errors.push({
          rowNumber,
          field: 'departure_date',
          errorCategory: 'INVALID_DATA_TYPE',
          errorMessage: `Invalid departure date: '${row.departure_date}'`,
          rawData: row,
        });
        rowHasError = true;
      }

      if (row.estimated_delivery_date && isNaN(new Date(row.estimated_delivery_date).getTime())) {
        errors.push({
          rowNumber,
          field: 'estimated_delivery_date',
          errorCategory: 'INVALID_DATA_TYPE',
          errorMessage: `Invalid estimated delivery date: '${row.estimated_delivery_date}'`,
          rawData: row,
        });
        rowHasError = true;
      }

      if (!rowHasError) {
        validRecords.push({
          id: `shp_imp_${Date.now()}_${idx}`,
          trackingNumber,
          poId: row.po_id || 'po_1001',
          carrier,
          origin: origin || 'Keelung Port',
          destination: destination || 'Chicago Hub',
          status: row.status || 'IN_TRANSIT',
          departureDate: row.departure_date ? new Date(row.departure_date).toISOString() : new Date().toISOString(),
          estimatedDeliveryDate: row.estimated_delivery_date ? new Date(row.estimated_delivery_date).toISOString() : new Date().toISOString(),
          delayDays: parseInt(row.delay_days || '0', 10),
          currentLocation: row.current_location || origin || 'En Route',
        });
      }
    } else {
      // Generic entity validation
      if (!row || Object.keys(row).length === 0) {
        errors.push({
          rowNumber,
          field: 'record',
          errorCategory: 'MISSING_REQUIRED_FIELD',
          errorMessage: 'Empty row record.',
          rawData: row,
        });
      } else {
        validRecords.push(row);
      }
    }
  }

  // 1. Record Import Batch
  const quarantinedRowIndices = new Set(errors.map((e) => e.rowNumber));
  const quarantinedRowsCount = quarantinedRowIndices.size;
  const batchStatus =
    quarantinedRowsCount === 0 ? 'COMPLETED' : validRecords.length > 0 ? 'PARTIALLY_QUARANTINED' : 'FAILED';

  await query(
    `INSERT INTO import_batches (id, filename, file_type, entity_type, status, total_rows, valid_rows, quarantined_rows, imported_by, error_summary)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      batchId,
      filename,
      fileType,
      entityType,
      batchStatus,
      rawRows.length,
      validRecords.length,
      quarantinedRowsCount,
      importedBy,
      errors.length > 0 ? `${errors.length} validation errors across ${quarantinedRowsCount} quarantined rows` : 'Batch validated successfully',
    ]
  );

  // 2. Persist Quarantined Rows (Grouped by Row Number)
  const errorsByRow = new Map<number, ImportRowError[]>();
  for (const err of errors) {
    const list = errorsByRow.get(err.rowNumber) || [];
    list.push(err);
    errorsByRow.set(err.rowNumber, list);
  }

  for (const [rowNum, rowErrors] of errorsByRow.entries()) {
    const qId = `qr_${Date.now()}_${rowNum}_${Math.random().toString(36).substring(2, 5)}`;
    const consolidatedCategory = rowErrors.map((e) => e.errorCategory).join(' | ');
    const consolidatedMessage = rowErrors.map((e) => `${e.field}: ${e.errorMessage}`).join('; ');
    const rawData = rowErrors[0]?.rawData || {};

    await query(
      `INSERT INTO quarantined_import_rows (id, batch_id, row_number, raw_data_json, error_category, error_message, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [qId, batchId, rowNum, JSON.stringify(rawData), consolidatedCategory, consolidatedMessage, 'PENDING_REVIEW']
    );
  }

  // 3. Persist Valid Rows (Atomic Transaction Boundaries)
  try {
    await query('BEGIN');
    if (entityType === 'inventory_skus') {
      for (const v of validRecords) {
        await query(
          `INSERT INTO inventory_skus (id, sku, name, category, unit_cost, current_stock, expected_stock, safety_stock, reorder_point, lead_time_days, preferred_supplier_id, warehouse_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (sku) DO UPDATE SET 
             name = $3, category = $4, unit_cost = $5, current_stock = $6, expected_stock = $7, 
             safety_stock = $8, reorder_point = $9, lead_time_days = $10, preferred_supplier_id = $11, 
             warehouse_id = $12, status = $13;`,
          [
            v.id,
            v.sku,
            v.name,
            v.category,
            v.unitCost,
            v.currentStock,
            v.expectedStock,
            v.safetyStock,
            v.reorderPoint,
            v.leadTimeDays,
            v.preferredSupplierId,
            v.warehouseId,
            v.status,
          ]
        );
      }
    } else if (entityType === 'shipments') {
      for (const s of validRecords) {
        await query(
          `INSERT INTO shipments (id, tracking_number, po_id, carrier, origin, destination, status, departure_date, estimated_delivery_date, delay_days, current_location)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (tracking_number) DO UPDATE SET 
             carrier = $4, origin = $5, destination = $6, status = $7, departure_date = $8, estimated_delivery_date = $9, delay_days = $10, current_location = $11;`,
          [
            s.id,
            s.trackingNumber,
            s.poId,
            s.carrier,
            s.origin,
            s.destination,
            s.status,
            s.departureDate,
            s.estimatedDeliveryDate,
            s.delayDays,
            s.currentLocation,
          ]
        );
      }
    }
    await query('COMMIT');
  } catch (dbErr: any) {
    await query('ROLLBACK');
    await query('UPDATE import_batches SET status = $1, error_summary = $2 WHERE id = $3', [
      'FAILED',
      `Transaction rolled back: ${dbErr.message}`,
      batchId,
    ]);
    return {
      batchId,
      filename,
      fileType,
      entityType,
      status: 'FAILED',
      totalRows: rawRows.length,
      validRows: 0,
      quarantinedRows: quarantinedRowsCount,
      errors: [
        ...errors,
        {
          rowNumber: 0,
          field: 'transaction',
          errorCategory: 'INVALID_DATA_TYPE',
          errorMessage: `Database transaction aborted: ${dbErr.message}`,
          rawData: {},
        },
      ],
    };
  }

  // 4. Log Immutable Audit Record
  const actionHash = crypto
    .createHash('sha256')
    .update(`${batchId}:${validRecords.length}:${errors.length}:${Date.now()}`)
    .digest('hex');

  await query(
    `INSERT INTO audit_ledger (id, event_type, actor_id, actor_role, entity_type, entity_id, after_state_json, action_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      `aud_imp_${Date.now()}`,
      'DATA_INGESTION_COMPLETED',
      importedBy,
      'OPERATOR',
      'IMPORT_BATCH',
      batchId,
      JSON.stringify({
        filename,
        total: rawRows.length,
        valid: validRecords.length,
        quarantined: errors.length,
      }),
      actionHash,
    ]
  );

  return {
    batchId,
    filename,
    fileType,
    entityType,
    status: batchStatus,
    totalRows: rawRows.length,
    validRows: validRecords.length,
    quarantinedRows: quarantinedRowsCount,
    errors,
  };
}
