import Database from 'better-sqlite3';
type DatabaseInstance = any;
import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron';
import type {
  HIDDevice,
  HIDInputEvent,
  DetectionAlert,
  AttackSignature,
  VirusTotalScanResult,
  AppSettings,
  QueryFilter,
  Severity,
  CompiledPayload,
} from '@shared/types';

interface DeviceRow {
  id: number;
  vendor_id: string;
  product_id: string;
  manufacturer: string | null;
  product_name: string | null;
  serial_number: string | null;
  device_path: string;
  first_seen: string;
  last_seen: string;
  is_blocked: number;
  trust_score: number;
}

interface EventRow {
  id: number;
  device_id: number | null;
  alert_id: number | null;
  timestamp: string;
  event_type: string;
  key_code: number | null;
  key_name: string | null;
  modifiers: string | null;
  mouse_x: number | null;
  mouse_y: number | null;
  raw_data: string | null;
  processing_time_ms: number | null;
}

interface AlertRow {
  id: number;
  device_id: number | null;
  timestamp: string;
  severity: string;
  reason: string;
  risk_score: number;
  input_sequence_hash: string | null;
  is_reviewed: number;
  review_notes: string | null;
  reviewed_at: string | null;
}

interface SignatureRow {
  id: number;
  signature_id: string;
  name: string;
  description: string | null;
  severity: string;
  pattern_yaml: string;
  created_at: string;
  updated_at: string;
  source: string;
}

interface VTScanRow {
  id: number;
  payload_id: number | null;
  scan_id: string;
  permalink: string | null;
  positives: number;
  total: number;
  detection_rate: number;
  scans_json: string | null;
  scan_date: string | null;
}

interface PayloadRow {
  id: number;
  original_script: string | null;
  target_device: string;
  output_path: string | null;
  file_hash: string | null;
  compiled_at: string;
  params_json: string | null;
}

interface SettingsRow {
  id: number;
  settings_json: string;
  updated_at: string;
}

class DatabaseManager {
  private db: DatabaseInstance | null = null;
  private dbPath: string;

  constructor() {
    const userData = app ? app.getPath('userData') : path.join(process.cwd(), 'data');
    fs.ensureDirSync(userData);
    this.dbPath = path.join(userData, 'hid-framework.db');
  }

  init(): void {
    if (this.db) return;

    this.db = new (Database as any)(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    this.db.exec(schema);
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private getDb(): DatabaseInstance {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  private mapDevice(row: DeviceRow): HIDDevice {
    return {
      id: row.id,
      vendorId: parseInt(row.vendor_id, 16),
      productId: parseInt(row.product_id, 16),
      manufacturer: row.manufacturer || '',
      productName: row.product_name || '',
      serialNumber: row.serial_number || '',
      devicePath: row.device_path,
      firstSeen: new Date(row.first_seen),
      lastSeen: new Date(row.last_seen),
      isBlocked: row.is_blocked === 1,
      trustScore: row.trust_score,
    };
  }

  private mapEvent(row: EventRow, device?: HIDDevice): HIDInputEvent {
    return {
      id: row.id.toString(),
      timestamp: new Date(row.timestamp),
      devicePath: '',
      device,
      type: row.event_type as 'keyboard' | 'mouse' | 'other',
      keyCode: row.key_code ?? undefined,
      keyName: row.key_name ?? undefined,
      modifiers: row.modifiers ? JSON.parse(row.modifiers) : undefined,
      mouseX: row.mouse_x ?? undefined,
      mouseY: row.mouse_y ?? undefined,
      rawData: row.raw_data ? JSON.parse(row.raw_data) : [],
      processingTimeMs: row.processing_time_ms ?? undefined,
    };
  }

  private mapAlert(
    row: AlertRow,
    device: HIDDevice,
    matchedSignatures: string[],
    inputSequence: HIDInputEvent[]
  ): DetectionAlert {
    return {
      id: row.id.toString(),
      timestamp: new Date(row.timestamp),
      device,
      deviceId: row.device_id ?? undefined,
      severity: row.severity as Severity,
      reason: row.reason,
      matchedSignatures,
      inputSequence,
      riskScore: row.risk_score,
      inputSequenceHash: row.input_sequence_hash ?? undefined,
      isReviewed: row.is_reviewed === 1,
      reviewNotes: row.review_notes ?? undefined,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
    };
  }

  private mapSignature(row: SignatureRow): AttackSignature {
    return {
      id: row.id.toString(),
      signatureId: row.signature_id,
      name: row.name,
      description: row.description || '',
      severity: row.severity as Severity,
      pattern: {} as any,
      patternYaml: row.pattern_yaml,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      source: row.source as 'local' | 'remote',
    };
  }

  private mapVTScan(row: VTScanRow): VirusTotalScanResult {
    return {
      id: row.id,
      payloadId: row.payload_id ?? undefined,
      scanId: row.scan_id,
      permalink: row.permalink || '',
      positives: row.positives,
      total: row.total,
      detectionRate: row.detection_rate,
      scans: row.scans_json ? JSON.parse(row.scans_json) : {},
      scanDate: row.scan_date ? new Date(row.scan_date) : new Date(),
    };
  }

  private mapPayload(row: PayloadRow): CompiledPayload {
    return {
      id: row.id,
      originalScript: row.original_script || '',
      targetDevice: row.target_device as any,
      outputPath: row.output_path ?? undefined,
      fileHash: row.file_hash ?? undefined,
      compiledAt: new Date(row.compiled_at),
      paramsJson: row.params_json || '',
    };
  }

  addDevice(device: Omit<HIDDevice, 'id'>): number {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO detected_devices 
      (vendor_id, product_id, manufacturer, product_name, serial_number, device_path, first_seen, last_seen, is_blocked, trust_score)
      VALUES (@vendorId, @productId, @manufacturer, @productName, @serialNumber, @devicePath, @firstSeen, @lastSeen, @isBlocked, @trustScore)
    `);

    const result = stmt.run({
      vendorId: '0x' + device.vendorId.toString(16).padStart(4, '0'),
      productId: '0x' + device.productId.toString(16).padStart(4, '0'),
      manufacturer: device.manufacturer,
      productName: device.productName,
      serialNumber: device.serialNumber,
      devicePath: device.devicePath,
      firstSeen: device.firstSeen instanceof Date ? device.firstSeen.toISOString() : device.firstSeen,
      lastSeen: device.lastSeen ? (device.lastSeen instanceof Date ? device.lastSeen.toISOString() : device.lastSeen) : new Date().toISOString(),
      isBlocked: device.isBlocked ? 1 : 0,
      trustScore: device.trustScore ?? 50,
    });

    return result.lastInsertRowid as number;
  }

  updateDeviceLastSeen(devicePath: string): void {
    const db = this.getDb();
    const stmt = db.prepare(`
      UPDATE detected_devices 
      SET last_seen = @lastSeen 
      WHERE device_path = @devicePath
    `);
    stmt.run({
      lastSeen: new Date().toISOString(),
      devicePath,
    });
  }

  getDeviceById(id: number): HIDDevice | null {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM detected_devices WHERE id = @id');
    const row = stmt.get({ id }) as DeviceRow | undefined;
    return row ? this.mapDevice(row) : null;
  }

  getDeviceByPath(devicePath: string): HIDDevice | null {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM detected_devices WHERE device_path = @devicePath');
    const row = stmt.get({ devicePath }) as DeviceRow | undefined;
    return row ? this.mapDevice(row) : null;
  }

  getAllDevices(): HIDDevice[] {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM detected_devices ORDER BY last_seen DESC');
    const rows = stmt.all() as DeviceRow[];
    return rows.map(row => this.mapDevice(row));
  }

  updateDeviceTrustScore(id: number, trustScore: number): void {
    const db = this.getDb();
    const stmt = db.prepare(`
      UPDATE detected_devices 
      SET trust_score = @trustScore 
      WHERE id = @id
    `);
    stmt.run({ id, trustScore });
  }

  setDeviceBlocked(id: number, isBlocked: boolean): void {
    const db = this.getDb();
    const stmt = db.prepare(`
      UPDATE detected_devices 
      SET is_blocked = @isBlocked 
      WHERE id = @id
    `);
    stmt.run({ id, isBlocked: isBlocked ? 1 : 0 });
  }

  deleteDevice(id: number): void {
    const db = this.getDb();
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM input_events WHERE device_id = @id').run({ id });
      db.prepare('DELETE FROM detection_alerts WHERE device_id = @id').run({ id });
      db.prepare('DELETE FROM detected_devices WHERE id = @id').run({ id });
    });
    tx();
  }

  addEvent(event: Omit<HIDInputEvent, 'id'> & { deviceId?: number; alertId?: number }): number {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT INTO input_events 
      (device_id, alert_id, timestamp, event_type, key_code, key_name, modifiers, mouse_x, mouse_y, raw_data, processing_time_ms)
      VALUES (@deviceId, @alertId, @timestamp, @eventType, @keyCode, @keyName, @modifiers, @mouseX, @mouseY, @rawData, @processingTimeMs)
    `);

    const result = stmt.run({
      deviceId: event.deviceId ?? null,
      alertId: event.alertId ?? null,
      timestamp: event.timestamp instanceof Date ? event.timestamp.toISOString() : event.timestamp,
      eventType: event.type,
      keyCode: event.keyCode ?? null,
      keyName: event.keyName ?? null,
      modifiers: event.modifiers ? JSON.stringify(event.modifiers) : null,
      mouseX: event.mouseX ?? null,
      mouseY: event.mouseY ?? null,
      rawData: JSON.stringify(event.rawData),
      processingTimeMs: event.processingTimeMs ?? null,
    });

    return result.lastInsertRowid as number;
  }

  getEventById(id: number): (HIDInputEvent & { device?: HIDDevice }) | null {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT e.*, d.* as device_data
      FROM input_events e
      LEFT JOIN detected_devices d ON e.device_id = d.id
      WHERE e.id = @id
    `);
    const row = stmt.get({ id }) as any;
    if (!row) return null;

    const eventRow: EventRow = {
      id: row.id,
      device_id: row.device_id,
      alert_id: row.alert_id,
      timestamp: row.timestamp,
      event_type: row.event_type,
      key_code: row.key_code,
      key_name: row.key_name,
      modifiers: row.modifiers,
      mouse_x: row.mouse_x,
      mouse_y: row.mouse_y,
      raw_data: row.raw_data,
      processing_time_ms: row.processing_time_ms,
    };

    let device: HIDDevice | undefined;
    if (row.device_id) {
      const deviceRow: DeviceRow = {
        id: row.device_id,
        vendor_id: row.vendor_id,
        product_id: row.product_id,
        manufacturer: row.manufacturer,
        product_name: row.product_name,
        serial_number: row.serial_number,
        device_path: row.device_path,
        first_seen: row.first_seen,
        last_seen: row.last_seen,
        is_blocked: row.is_blocked,
        trust_score: row.trust_score,
      };
      device = this.mapDevice(deviceRow);
    }

    return this.mapEvent(eventRow, device);
  }

  getEventsByDeviceId(deviceId: number, limit: number = 100): (HIDInputEvent & { device?: HIDDevice })[] {
    const db = this.getDb();
    const device = this.getDeviceById(deviceId);
    if (!device) return [];

    const stmt = db.prepare(`
      SELECT * FROM input_events 
      WHERE device_id = @deviceId 
      ORDER BY timestamp DESC 
      LIMIT @limit
    `);
    const rows = stmt.all({ deviceId, limit }) as EventRow[];
    return rows.map(row => this.mapEvent(row, device));
  }

  getEventsByAlertId(alertId: number): (HIDInputEvent & { device?: HIDDevice })[] {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT e.*, d.*
      FROM input_events e
      LEFT JOIN detected_devices d ON e.device_id = d.id
      WHERE e.alert_id = @alertId 
      ORDER BY e.timestamp ASC
    `);
    const rows = stmt.all({ alertId }) as any[];

    return rows.map(row => {
      const eventRow: EventRow = {
        id: row.id,
        device_id: row.device_id,
        alert_id: row.alert_id,
        timestamp: row.timestamp,
        event_type: row.event_type,
        key_code: row.key_code,
        key_name: row.key_name,
        modifiers: row.modifiers,
        mouse_x: row.mouse_x,
        mouse_y: row.mouse_y,
        raw_data: row.raw_data,
        processing_time_ms: row.processing_time_ms,
      };

      let device: HIDDevice | undefined;
      if (row.device_id) {
        const deviceRow: DeviceRow = {
          id: row.device_id,
          vendor_id: row.vendor_id,
          product_id: row.product_id,
          manufacturer: row.manufacturer,
          product_name: row.product_name,
          serial_number: row.serial_number,
          device_path: row.device_path,
          first_seen: row.first_seen,
          last_seen: row.last_seen,
          is_blocked: row.is_blocked,
          trust_score: row.trust_score,
        };
        device = this.mapDevice(deviceRow);
      }

      return this.mapEvent(eventRow, device);
    });
  }

  queryEvents(filter: QueryFilter): (HIDInputEvent & { device?: HIDDevice })[] {
    const db = this.getDb();
    const conditions: string[] = [];
    const params: Record<string, any> = {};

    if (filter.startDate) {
      conditions.push('e.timestamp >= @startDate');
      params.startDate = filter.startDate.toISOString();
    }
    if (filter.endDate) {
      conditions.push('e.timestamp <= @endDate');
      params.endDate = filter.endDate.toISOString();
    }
    if (filter.devicePath) {
      conditions.push('d.device_path = @devicePath');
      params.devicePath = filter.devicePath;
    }

    let sql = `
      SELECT e.*, d.*
      FROM input_events e
      LEFT JOIN detected_devices d ON e.device_id = d.id
    `;

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY e.timestamp DESC';

    if (filter.limit) {
      sql += ' LIMIT @limit';
      params.limit = filter.limit;
    }
    if (filter.offset) {
      sql += ' OFFSET @offset';
      params.offset = filter.offset;
    }

    const stmt = db.prepare(sql);
    const rows = stmt.all(params) as any[];

    return rows.map(row => {
      const eventRow: EventRow = {
        id: row.id,
        device_id: row.device_id,
        alert_id: row.alert_id,
        timestamp: row.timestamp,
        event_type: row.event_type,
        key_code: row.key_code,
        key_name: row.key_name,
        modifiers: row.modifiers,
        mouse_x: row.mouse_x,
        mouse_y: row.mouse_y,
        raw_data: row.raw_data,
        processing_time_ms: row.processing_time_ms,
      };

      let device: HIDDevice | undefined;
      if (row.device_id) {
        const deviceRow: DeviceRow = {
          id: row.device_id,
          vendor_id: row.vendor_id,
          product_id: row.product_id,
          manufacturer: row.manufacturer,
          product_name: row.product_name,
          serial_number: row.serial_number,
          device_path: row.device_path,
          first_seen: row.first_seen,
          last_seen: row.last_seen,
          is_blocked: row.is_blocked,
          trust_score: row.trust_score,
        };
        device = this.mapDevice(deviceRow);
      }

      return this.mapEvent(eventRow, device);
    });
  }

  deleteEvent(id: number): void {
    const db = this.getDb();
    const stmt = db.prepare('DELETE FROM input_events WHERE id = @id');
    stmt.run({ id });
  }

  addAlert(
    alert: Omit<DetectionAlert, 'id'> & { deviceId?: number }
  ): number {
    const db = this.getDb();
    const tx = db.transaction(() => {
      const alertStmt = db.prepare(`
        INSERT INTO detection_alerts 
        (device_id, timestamp, severity, reason, risk_score, input_sequence_hash, is_reviewed, review_notes, reviewed_at)
        VALUES (@deviceId, @timestamp, @severity, @reason, @riskScore, @inputSequenceHash, @isReviewed, @reviewNotes, @reviewedAt)
      `);

      const result = alertStmt.run({
        deviceId: alert.deviceId ?? null,
        timestamp: alert.timestamp instanceof Date ? alert.timestamp.toISOString() : alert.timestamp,
        severity: alert.severity,
        reason: alert.reason,
        riskScore: alert.riskScore,
        inputSequenceHash: alert.inputSequenceHash ?? null,
        isReviewed: alert.isReviewed ? 1 : 0,
        reviewNotes: alert.reviewNotes ?? null,
        reviewedAt: alert.reviewedAt ? (alert.reviewedAt instanceof Date ? alert.reviewedAt.toISOString() : alert.reviewedAt) : null,
      });

      const alertId = result.lastInsertRowid as number;

      if (alert.matchedSignatures && alert.matchedSignatures.length > 0) {
        const sigStmt = db.prepare(`
          INSERT INTO alert_signatures (alert_id, signature_id, matched_at)
          VALUES (@alertId, (SELECT id FROM attack_signatures WHERE signature_id = @signatureId), @matchedAt)
        `);

        for (const sigId of alert.matchedSignatures) {
          sigStmt.run({
            alertId,
            signatureId: sigId,
            matchedAt: new Date().toISOString(),
          });
        }
      }

      if (alert.inputSequence && alert.inputSequence.length > 0) {
        const eventStmt = db.prepare(`
          INSERT INTO input_events 
          (device_id, alert_id, timestamp, event_type, key_code, key_name, modifiers, mouse_x, mouse_y, raw_data, processing_time_ms)
          VALUES (@deviceId, @alertId, @timestamp, @eventType, @keyCode, @keyName, @modifiers, @mouseX, @mouseY, @rawData, @processingTimeMs)
        `);

        for (const event of alert.inputSequence) {
          eventStmt.run({
            deviceId: alert.deviceId ?? null,
            alertId,
            timestamp: event.timestamp instanceof Date ? event.timestamp.toISOString() : event.timestamp,
            eventType: event.type,
            keyCode: event.keyCode ?? null,
            keyName: event.keyName ?? null,
            modifiers: event.modifiers ? JSON.stringify(event.modifiers) : null,
            mouseX: event.mouseX ?? null,
            mouseY: event.mouseY ?? null,
            rawData: JSON.stringify(event.rawData),
            processingTimeMs: event.processingTimeMs ?? null,
          });
        }
      }

      return alertId;
    });

    return tx();
  }

  getAlertById(id: number): DetectionAlert | null {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT a.*, d.*
      FROM detection_alerts a
      LEFT JOIN detected_devices d ON a.device_id = d.id
      WHERE a.id = @id
    `);
    const row = stmt.get({ id }) as any;
    if (!row) return null;

    const alertRow: AlertRow = {
      id: row.id,
      device_id: row.device_id,
      timestamp: row.timestamp,
      severity: row.severity,
      reason: row.reason,
      risk_score: row.risk_score,
      input_sequence_hash: row.input_sequence_hash,
      is_reviewed: row.is_reviewed,
      review_notes: row.review_notes,
      reviewed_at: row.reviewed_at,
    };

    let device: HIDDevice;
    if (row.device_id) {
      const deviceRow: DeviceRow = {
        id: row.device_id,
        vendor_id: row.vendor_id,
        product_id: row.product_id,
        manufacturer: row.manufacturer,
        product_name: row.product_name,
        serial_number: row.serial_number,
        device_path: row.device_path,
        first_seen: row.first_seen,
        last_seen: row.last_seen,
        is_blocked: row.is_blocked,
        trust_score: row.trust_score,
      };
      device = this.mapDevice(deviceRow);
    } else {
      device = {} as HIDDevice;
    }

    const sigStmt = db.prepare(`
      SELECT s.signature_id
      FROM alert_signatures als
      JOIN attack_signatures s ON als.signature_id = s.id
      WHERE als.alert_id = @alertId
    `);
    const sigRows = sigStmt.all({ alertId: id }) as { signature_id: string }[];
    const matchedSignatures = sigRows.map(r => r.signature_id);

    const inputSequence = this.getEventsByAlertId(id);

    return this.mapAlert(alertRow, device, matchedSignatures, inputSequence);
  }

  queryAlerts(filter: QueryFilter): DetectionAlert[] {
    const db = this.getDb();
    const conditions: string[] = [];
    const params: Record<string, any> = {};

    if (filter.severity && filter.severity.length > 0) {
      conditions.push(`a.severity IN (${filter.severity.map((_, i) => `@severity${i}`).join(', ')})`);
      filter.severity.forEach((s, i) => {
        params[`severity${i}`] = s;
      });
    }
    if (filter.startDate) {
      conditions.push('a.timestamp >= @startDate');
      params.startDate = filter.startDate.toISOString();
    }
    if (filter.endDate) {
      conditions.push('a.timestamp <= @endDate');
      params.endDate = filter.endDate.toISOString();
    }
    if (filter.devicePath) {
      conditions.push('d.device_path = @devicePath');
      params.devicePath = filter.devicePath;
    }
    if (filter.reviewed !== undefined) {
      conditions.push('a.is_reviewed = @isReviewed');
      params.isReviewed = filter.reviewed ? 1 : 0;
    }

    let sql = `
      SELECT a.*, d.*
      FROM detection_alerts a
      LEFT JOIN detected_devices d ON a.device_id = d.id
    `;

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY a.timestamp DESC';

    if (filter.limit) {
      sql += ' LIMIT @limit';
      params.limit = filter.limit;
    }
    if (filter.offset) {
      sql += ' OFFSET @offset';
      params.offset = filter.offset;
    }

    const stmt = db.prepare(sql);
    const rows = stmt.all(params) as any[];

    return rows.map(row => {
      const alertRow: AlertRow = {
        id: row.id,
        device_id: row.device_id,
        timestamp: row.timestamp,
        severity: row.severity,
        reason: row.reason,
        risk_score: row.risk_score,
        input_sequence_hash: row.input_sequence_hash,
        is_reviewed: row.is_reviewed,
        review_notes: row.review_notes,
        reviewed_at: row.reviewed_at,
      };

      let device: HIDDevice;
      if (row.device_id) {
        const deviceRow: DeviceRow = {
          id: row.device_id,
          vendor_id: row.vendor_id,
          product_id: row.product_id,
          manufacturer: row.manufacturer,
          product_name: row.product_name,
          serial_number: row.serial_number,
          device_path: row.device_path,
          first_seen: row.first_seen,
          last_seen: row.last_seen,
          is_blocked: row.is_blocked,
          trust_score: row.trust_score,
        };
        device = this.mapDevice(deviceRow);
      } else {
        device = {} as HIDDevice;
      }

      const sigStmt = db.prepare(`
        SELECT s.signature_id
        FROM alert_signatures als
        JOIN attack_signatures s ON als.signature_id = s.id
        WHERE als.alert_id = @alertId
      `);
      const sigRows = sigStmt.all({ alertId: row.id }) as { signature_id: string }[];
      const matchedSignatures = sigRows.map(r => r.signature_id);

      const inputSequence = this.getEventsByAlertId(row.id);

      return this.mapAlert(alertRow, device, matchedSignatures, inputSequence);
    });
  }

  markAlertAsReviewed(id: number, reviewNotes?: string): void {
    const db = this.getDb();
    const stmt = db.prepare(`
      UPDATE detection_alerts 
      SET is_reviewed = 1, review_notes = @reviewNotes, reviewed_at = @reviewedAt
      WHERE id = @id
    `);
    stmt.run({
      id,
      reviewNotes: reviewNotes ?? null,
      reviewedAt: new Date().toISOString(),
    });
  }

  deleteAlert(id: number): void {
    const db = this.getDb();
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM alert_signatures WHERE alert_id = @id').run({ id });
      db.prepare('DELETE FROM input_events WHERE alert_id = @id').run({ id });
      db.prepare('DELETE FROM detection_alerts WHERE id = @id').run({ id });
    });
    tx();
  }

  addSignature(signature: Omit<AttackSignature, 'id'>): number {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO attack_signatures 
      (signature_id, name, description, severity, pattern_yaml, created_at, updated_at, source)
      VALUES (@signatureId, @name, @description, @severity, @patternYaml, @createdAt, @updatedAt, @source)
    `);

    const result = stmt.run({
      signatureId: signature.signatureId,
      name: signature.name,
      description: signature.description || null,
      severity: signature.severity,
      patternYaml: signature.patternYaml,
      createdAt: signature.createdAt instanceof Date ? signature.createdAt.toISOString() : signature.createdAt,
      updatedAt: signature.updatedAt instanceof Date ? signature.updatedAt.toISOString() : signature.updatedAt,
      source: signature.source,
    });

    return result.lastInsertRowid as number;
  }

  getSignatureById(id: number): AttackSignature | null {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM attack_signatures WHERE id = @id');
    const row = stmt.get({ id }) as SignatureRow | undefined;
    return row ? this.mapSignature(row) : null;
  }

  getSignatureBySignatureId(signatureId: string): AttackSignature | null {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM attack_signatures WHERE signature_id = @signatureId');
    const row = stmt.get({ signatureId }) as SignatureRow | undefined;
    return row ? this.mapSignature(row) : null;
  }

  getAllSignatures(): AttackSignature[] {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM attack_signatures ORDER BY created_at DESC');
    const rows = stmt.all() as SignatureRow[];
    return rows.map(row => this.mapSignature(row));
  }

  updateSignature(id: number, updates: Partial<Omit<AttackSignature, 'id' | 'signatureId'>>): void {
    const db = this.getDb();
    const fields: string[] = [];
    const params: Record<string, any> = { id };

    if (updates.name !== undefined) {
      fields.push('name = @name');
      params.name = updates.name;
    }
    if (updates.description !== undefined) {
      fields.push('description = @description');
      params.description = updates.description || null;
    }
    if (updates.severity !== undefined) {
      fields.push('severity = @severity');
      params.severity = updates.severity;
    }
    if (updates.patternYaml !== undefined) {
      fields.push('pattern_yaml = @patternYaml');
      params.patternYaml = updates.patternYaml;
    }
    if (updates.source !== undefined) {
      fields.push('source = @source');
      params.source = updates.source;
    }
    fields.push('updated_at = @updatedAt');
    params.updatedAt = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE attack_signatures 
      SET ${fields.join(', ')}
      WHERE id = @id
    `);
    stmt.run(params);
  }

  deleteSignature(id: number): void {
    const db = this.getDb();
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM alert_signatures WHERE signature_id = @id').run({ id });
      db.prepare('DELETE FROM attack_signatures WHERE id = @id').run({ id });
    });
    tx();
  }

  addVTScan(scan: Omit<VirusTotalScanResult, 'id'>): number {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO virustotal_scans 
      (payload_id, scan_id, permalink, positives, total, detection_rate, scans_json, scan_date)
      VALUES (@payloadId, @scanId, @permalink, @positives, @total, @detectionRate, @scansJson, @scanDate)
    `);

    const result = stmt.run({
      payloadId: scan.payloadId ?? null,
      scanId: scan.scanId,
      permalink: scan.permalink || null,
      positives: scan.positives,
      total: scan.total,
      detectionRate: scan.detectionRate,
      scansJson: JSON.stringify(scan.scans),
      scanDate: scan.scanDate instanceof Date ? scan.scanDate.toISOString() : scan.scanDate,
    });

    return result.lastInsertRowid as number;
  }

  getVTScanById(id: number): VirusTotalScanResult | null {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM virustotal_scans WHERE id = @id');
    const row = stmt.get({ id }) as VTScanRow | undefined;
    return row ? this.mapVTScan(row) : null;
  }

  getVTScanByScanId(scanId: string): VirusTotalScanResult | null {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM virustotal_scans WHERE scan_id = @scanId');
    const row = stmt.get({ scanId }) as VTScanRow | undefined;
    return row ? this.mapVTScan(row) : null;
  }

  getVTScanByPayloadId(payloadId: number): VirusTotalScanResult[] {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM virustotal_scans WHERE payload_id = @payloadId ORDER BY scan_date DESC');
    const rows = stmt.all({ payloadId }) as VTScanRow[];
    return rows.map(row => this.mapVTScan(row));
  }

  getAllVTScan(): VirusTotalScanResult[] {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM virustotal_scans ORDER BY scan_date DESC');
    const rows = stmt.all() as VTScanRow[];
    return rows.map(row => this.mapVTScan(row));
  }

  updateVTScan(id: number, updates: Partial<Omit<VirusTotalScanResult, 'id' | 'scanId'>>): void {
    const db = this.getDb();
    const fields: string[] = [];
    const params: Record<string, any> = { id };

    if (updates.payloadId !== undefined) {
      fields.push('payload_id = @payloadId');
      params.payloadId = updates.payloadId ?? null;
    }
    if (updates.permalink !== undefined) {
      fields.push('permalink = @permalink');
      params.permalink = updates.permalink || null;
    }
    if (updates.positives !== undefined) {
      fields.push('positives = @positives');
      params.positives = updates.positives;
    }
    if (updates.total !== undefined) {
      fields.push('total = @total');
      params.total = updates.total;
    }
    if (updates.detectionRate !== undefined) {
      fields.push('detection_rate = @detectionRate');
      params.detectionRate = updates.detectionRate;
    }
    if (updates.scans !== undefined) {
      fields.push('scans_json = @scansJson');
      params.scansJson = JSON.stringify(updates.scans);
    }
    if (updates.scanDate !== undefined) {
      fields.push('scan_date = @scanDate');
      params.scanDate = updates.scanDate instanceof Date ? updates.scanDate.toISOString() : updates.scanDate;
    }

    const stmt = db.prepare(`
      UPDATE virustotal_scans 
      SET ${fields.join(', ')}
      WHERE id = @id
    `);
    stmt.run(params);
  }

  deleteVTScan(id: number): void {
    const db = this.getDb();
    const stmt = db.prepare('DELETE FROM virustotal_scans WHERE id = @id');
    stmt.run({ id });
  }

  addPayload(payload: Omit<CompiledPayload, 'id'>): number {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT INTO compiled_payloads 
      (original_script, target_device, output_path, file_hash, compiled_at, params_json)
      VALUES (@originalScript, @targetDevice, @outputPath, @fileHash, @compiledAt, @paramsJson)
    `);

    const result = stmt.run({
      originalScript: payload.originalScript || null,
      targetDevice: payload.targetDevice,
      outputPath: payload.outputPath ?? null,
      fileHash: payload.fileHash ?? null,
      compiledAt: payload.compiledAt instanceof Date ? payload.compiledAt.toISOString() : payload.compiledAt,
      paramsJson: payload.paramsJson || null,
    });

    return result.lastInsertRowid as number;
  }

  getPayloadById(id: number): CompiledPayload | null {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM compiled_payloads WHERE id = @id');
    const row = stmt.get({ id }) as PayloadRow | undefined;
    return row ? this.mapPayload(row) : null;
  }

  getAllPayloads(): CompiledPayload[] {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM compiled_payloads ORDER BY compiled_at DESC');
    const rows = stmt.all() as PayloadRow[];
    return rows.map(row => this.mapPayload(row));
  }

  deletePayload(id: number): void {
    const db = this.getDb();
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM virustotal_scans WHERE payload_id = @id').run({ id });
      db.prepare('DELETE FROM compiled_payloads WHERE id = @id').run({ id });
    });
    tx();
  }

  getSettings(): AppSettings {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM app_settings WHERE id = 1');
    const row = stmt.get() as SettingsRow | undefined;

    if (!row) {
      throw new Error('Settings not found. Database may not be properly initialized.');
    }

    return JSON.parse(row.settings_json) as AppSettings;
  }

  updateSettings(settings: Partial<AppSettings>): void {
    const db = this.getDb();
    const currentSettings = this.getSettings();
    const mergedSettings: AppSettings = {
      ...currentSettings,
      ...settings,
      detection: {
        ...currentSettings.detection,
        ...settings.detection,
      },
      virustotal: {
        ...currentSettings.virustotal,
        ...settings.virustotal,
      },
      signatures: {
        ...currentSettings.signatures,
        ...settings.signatures,
      },
      service: {
        ...currentSettings.service,
        ...settings.service,
      },
    };

    const stmt = db.prepare(`
      UPDATE app_settings 
      SET settings_json = @settingsJson, updated_at = @updatedAt
      WHERE id = 1
    `);
    stmt.run({
      settingsJson: JSON.stringify(mergedSettings),
      updatedAt: new Date().toISOString(),
    });
  }

  setSettings(settings: AppSettings): void {
    const db = this.getDb();
    const stmt = db.prepare(`
      UPDATE app_settings 
      SET settings_json = @settingsJson, updated_at = @updatedAt
      WHERE id = 1
    `);
    stmt.run({
      settingsJson: JSON.stringify(settings),
      updatedAt: new Date().toISOString(),
    });
  }
}

export const db = new DatabaseManager();
export default DatabaseManager;
