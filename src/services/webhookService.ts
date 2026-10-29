import crypto from 'crypto';
import { dbContext } from '../db/index.ts';

export interface CarrierWebhookPayload {
  idempotency_key?: string;
  event_id?: string;
  tracking_number: string;
  carrier: string;
  status: 'BOOKED' | 'DEPARTED' | 'IN_TRANSIT' | 'CUSTOMS_HOLD' | 'DELAYED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  location: string;
  timestamp: string;
  delay_days?: number;
  reason?: string;
  temperature_celsius?: number;
}

export interface WebhookProcessResult {
  success: boolean;
  httpStatus: number;
  processingStatus: 'ACCEPTED' | 'DUPLICATE_IDEMPOTENT' | 'PAYLOAD_CONFLICT' | 'STALE_REJECTED' | 'INVALID_TRANSITION' | 'SHIPMENT_NOT_FOUND';
  message: string;
  eventId: string;
  trackingNumber: string;
  updatedShipment?: any;
}

// State transition validation matrix: fromState -> allowedToStates
const VALID_TRANSITIONS: Record<string, string[]> = {
  BOOKED: ['DEPARTED', 'IN_TRANSIT', 'DELAYED'],
  DEPARTED: ['IN_TRANSIT', 'CUSTOMS_HOLD', 'DELAYED'],
  IN_TRANSIT: ['CUSTOMS_HOLD', 'DELAYED', 'OUT_FOR_DELIVERY', 'DELIVERED'],
  CUSTOMS_HOLD: ['IN_TRANSIT', 'DELAYED', 'OUT_FOR_DELIVERY', 'DELIVERED'],
  DELAYED: ['IN_TRANSIT', 'CUSTOMS_HOLD', 'OUT_FOR_DELIVERY', 'DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELAYED'],
  DELIVERED: [], // Terminal state: cannot regress to transit
};

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const sigBuffer = Buffer.from(signature.replace(/^sha256=/, ''), 'hex');
    const expBuffer = Buffer.from(expected, 'hex');
    if (sigBuffer.length !== expBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuffer, expBuffer);
  } catch {
    return false;
  }
}

export async function processCarrierWebhook(
  rawPayload: CarrierWebhookPayload | any
): Promise<WebhookProcessResult> {
  const query = dbContext.query;
  const payload = { ...rawPayload };

  const eventId = payload.event_id || payload.eventId || payload.idempotency_key || payload.idempotencyKey || `evt_${Date.now()}`;
  const idempotencyKey = payload.idempotency_key || payload.idempotencyKey || eventId;
  const trackingNumber = (payload.tracking_number || payload.trackingNumber || '').toString().trim();
  const timestamp = payload.timestamp || payload.eventTimestamp || new Date().toISOString();
  const delayDays = payload.delay_days !== undefined ? payload.delay_days : payload.delayDays || 0;
  const carrier = payload.carrier || 'UNKNOWN_CARRIER';
  const status = payload.status || 'IN_TRANSIT';
  const location = payload.location || 'Unknown Location';

  // Normalize back to standard fields
  payload.event_id = eventId;
  payload.idempotency_key = idempotencyKey;
  payload.tracking_number = trackingNumber;
  payload.timestamp = timestamp;
  payload.delay_days = delayDays;
  payload.carrier = carrier;
  payload.status = status;
  payload.location = location;

  if (!trackingNumber) {
    return {
      success: false,
      httpStatus: 400,
      processingStatus: 'PAYLOAD_CONFLICT',
      message: 'Missing tracking_number in carrier webhook payload',
      eventId,
      trackingNumber: '',
    };
  }

  // Calculate canonical payload hash for conflict detection
  const payloadHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');

  // 1. Idempotency & Deduplication Check
  const existingEventResult = await query(
    'SELECT * FROM carrier_webhook_events WHERE idempotency_key = $1 OR event_id = $2',
    [idempotencyKey, eventId]
  );

  if (existingEventResult.rows.length > 0) {
    const existing = existingEventResult.rows[0];

    // Case A: Exact duplicate payload
    if (existing.payload_hash === payloadHash) {
      return {
        success: true,
        httpStatus: 200,
        processingStatus: 'DUPLICATE_IDEMPOTENT',
        message: 'Duplicate event detected: returning cached idempotent response without reapplying side effects.',
        eventId,
        trackingNumber,
      };
    }

    // Case B: Conflicting payload with matching event ID
    await query(
      `INSERT INTO audit_ledger (id, event_type, actor_id, actor_role, entity_type, entity_id, after_state_json, action_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        `aud_conf_${Date.now()}`,
        'WEBHOOK_PAYLOAD_CONFLICT',
        payload.carrier || 'CARRIER_WEBHOOK',
        'SYSTEM',
        'SHIPMENT',
        trackingNumber,
        JSON.stringify({
          existingEventId: existing.event_id,
          existingHash: existing.payload_hash,
          newHash: payloadHash,
          attemptedStatus: payload.status,
        }),
        payloadHash,
      ]
    );

    return {
      success: false,
      httpStatus: 409,
      processingStatus: 'PAYLOAD_CONFLICT',
      message: `Payload Conflict: Event identity '${eventId}' was already recorded with different payload parameters.`,
      eventId,
      trackingNumber,
    };
  }

  // 2. Resolve target shipment
  const shipmentResult = await query('SELECT * FROM shipments WHERE tracking_number = $1', [trackingNumber]);

  if (shipmentResult.rows.length === 0) {
    return {
      success: false,
      httpStatus: 404,
      processingStatus: 'SHIPMENT_NOT_FOUND',
      message: `Shipment with tracking number '${trackingNumber}' was not found in operational database.`,
      eventId,
      trackingNumber,
    };
  }

  const shipment = shipmentResult.rows[0];

  // 3. Stale Timestamp / Monotonicity Protection
  const eventDate = new Date(payload.timestamp);
  const lastWebhookDate = new Date(shipment.last_webhook_timestamp);

  if (!isNaN(eventDate.getTime()) && !isNaN(lastWebhookDate.getTime())) {
    if (eventDate.getTime() < lastWebhookDate.getTime()) {
      // Record stale event
      await query(
        `INSERT INTO carrier_webhook_events (id, idempotency_key, event_id, carrier, shipment_id, tracking_number, event_type, location, status_transition, event_timestamp, payload_hash, raw_payload_json, processing_status, error_details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          `cwe_${Date.now()}`,
          idempotencyKey,
          eventId,
          payload.carrier,
          shipment.id,
          trackingNumber,
          payload.status,
          payload.location,
          `${shipment.status} -> ${payload.status}`,
          eventDate,
          payloadHash,
          JSON.stringify(payload),
          'STALE_REJECTED',
          `Event timestamp (${eventDate.toISOString()}) is older than shipment's last accepted update (${lastWebhookDate.toISOString()})`,
        ]
      );

      return {
        success: false,
        httpStatus: 422,
        processingStatus: 'STALE_REJECTED',
        message: `Stale event rejected: incoming timestamp (${eventDate.toISOString()}) is older than current shipment milestone (${lastWebhookDate.toISOString()}). Out-of-order overwrite prevented.`,
        eventId,
        trackingNumber,
      };
    }
  }

  // 4. State Transition Validation
  const currentStatus = shipment.status;
  const targetStatus = payload.status;
  const allowedNext = VALID_TRANSITIONS[currentStatus] || [];

  if (currentStatus !== targetStatus && !allowedNext.includes(targetStatus)) {
    await query(
      `INSERT INTO carrier_webhook_events (id, idempotency_key, event_id, carrier, shipment_id, tracking_number, event_type, location, status_transition, event_timestamp, payload_hash, raw_payload_json, processing_status, error_details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        `cwe_${Date.now()}`,
        idempotencyKey,
        eventId,
        payload.carrier,
        shipment.id,
        trackingNumber,
        targetStatus,
        payload.location,
        `${currentStatus} -> ${targetStatus}`,
        eventDate,
        payloadHash,
        JSON.stringify(payload),
        'INVALID_TRANSITION',
        `Illegal transition from '${currentStatus}' to '${targetStatus}'. Allowed: [${allowedNext.join(', ')}]`,
      ]
    );

    return {
      success: false,
      httpStatus: 422,
      processingStatus: 'INVALID_TRANSITION',
      message: `Invalid shipment state transition from '${currentStatus}' to '${targetStatus}'.`,
      eventId,
      trackingNumber,
    };
  }

  // 5. Apply State Update and Calculate Delivery Delay atomically
  const effectiveDelayDays = payload.delay_days !== undefined ? payload.delay_days : shipment.delay_days;
  const originalEta = new Date(shipment.estimated_delivery_date);
  const revisedEta = new Date(originalEta.getTime() + effectiveDelayDays * 86400000);

  try {
    await query('BEGIN');

    // 5a. Update shipment state
    await query(
      `UPDATE shipments
       SET status = $1, delay_days = $2, current_location = $3, revised_delivery_date = $4, last_webhook_timestamp = $5
       WHERE id = $6`,
      [targetStatus, effectiveDelayDays, payload.location, revisedEta, eventDate, shipment.id]
    );

    // 6. Record tracking event log
    await query(
      `INSERT INTO shipment_tracking_events (id, shipment_id, event_id, status, location, description, timestamp, is_anomaly)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        `ste_${Date.now()}`,
        shipment.id,
        eventId,
        targetStatus,
        payload.location,
        payload.reason || `Carrier status update: ${targetStatus}`,
        eventDate,
        effectiveDelayDays > 0,
      ]
    );

    // 7. Record in carrier webhook events table (enforces unique event_id and idempotency_key)
    await query(
      `INSERT INTO carrier_webhook_events (id, idempotency_key, event_id, carrier, shipment_id, tracking_number, event_type, location, status_transition, event_timestamp, payload_hash, raw_payload_json, processing_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        `cwe_${Date.now()}`,
        idempotencyKey,
        eventId,
        payload.carrier,
        shipment.id,
        trackingNumber,
        targetStatus,
        payload.location,
        `${currentStatus} -> ${targetStatus}`,
        eventDate,
        payloadHash,
        JSON.stringify(payload),
        'ACCEPTED',
      ]
    );

    // 8. Log verifiable audit record
    await query(
      `INSERT INTO audit_ledger (id, event_type, actor_id, actor_role, entity_type, entity_id, before_state_json, after_state_json, action_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        `aud_wh_${Date.now()}`,
        'CARRIER_WEBHOOK_ACCEPTED',
        payload.carrier,
        'CARRIER',
        'SHIPMENT',
        trackingNumber,
        JSON.stringify({ status: currentStatus, delay: shipment.delay_days }),
        JSON.stringify({ status: targetStatus, delay: effectiveDelayDays, location: payload.location }),
        payloadHash,
      ]
    );

    await query('COMMIT');

    return {
      success: true,
      httpStatus: 200,
      processingStatus: 'ACCEPTED',
      message: `Carrier webhook accepted for ${trackingNumber}: status '${targetStatus}', delay +${effectiveDelayDays}d.`,
      eventId,
      trackingNumber,
      updatedShipment: {
        trackingNumber,
        status: targetStatus,
        delayDays: effectiveDelayDays,
        currentLocation: payload.location,
        revisedDeliveryDate: revisedEta.toISOString(),
      },
    };
  } catch (err: any) {
    await query('ROLLBACK');

    // Concurrency collision handler: if unique constraint was violated by simultaneous thread
    if (
      err.code === '23505' ||
      err.message?.includes('unique') ||
      err.message?.includes('duplicate key')
    ) {
      const raceExisting = await query(
        'SELECT * FROM carrier_webhook_events WHERE idempotency_key = $1 OR event_id = $2',
        [idempotencyKey, eventId]
      );
      if (raceExisting.rows.length > 0) {
        const row = raceExisting.rows[0];
        if (row.payload_hash === payloadHash) {
          return {
            success: true,
            httpStatus: 200,
            processingStatus: 'DUPLICATE_IDEMPOTENT',
            message: 'Duplicate event resolved via database concurrency constraint: returning cached idempotent response.',
            eventId,
            trackingNumber,
          };
        } else {
          return {
            success: false,
            httpStatus: 409,
            processingStatus: 'PAYLOAD_CONFLICT',
            message: `Payload Conflict: Event identity '${eventId}' was recorded concurrently with conflicting parameters.`,
            eventId,
            trackingNumber,
          };
        }
      }
    }

    throw err;
  }
}
