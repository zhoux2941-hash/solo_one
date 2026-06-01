const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');

class MetricsDatabase {
  constructor() {
    this.dbPath = config.paths.db;
    this.db = null;
    this._init();
  }

  _init() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');

    this._createTables();
    logger.info('Database initialized', { path: this.dbPath });
  }

  _createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS streams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stream_id TEXT UNIQUE NOT NULL,
        source_type TEXT,
        source_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        resolution_in TEXT,
        resolution_out TEXT,
        initial_scale INTEGER
      );

      CREATE TABLE IF NOT EXISTS quality_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stream_id TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        psnr REAL,
        ssim REAL,
        scale_factor INTEGER,
        fps REAL,
        processing_time_ms REAL,
        end_to_end_delay_ms REAL,
        FOREIGN KEY (stream_id) REFERENCES streams(stream_id)
      );

      CREATE TABLE IF NOT EXISTS system_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        gpu_utilization REAL,
        gpu_memory_gb REAL,
        cpu_usage REAL,
        memory_usage_percent REAL,
        active_streams INTEGER
      );

      CREATE TABLE IF NOT EXISTS recordings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stream_id TEXT NOT NULL,
        recording_id TEXT UNIQUE NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        input_path TEXT,
        output_path TEXT,
        duration_sec REAL,
        status TEXT DEFAULT 'recording',
        scale_factor INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_quality_stream ON quality_metrics(stream_id);
      CREATE INDEX IF NOT EXISTS idx_quality_timestamp ON quality_metrics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_system_timestamp ON system_metrics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_recordings_stream ON recordings(stream_id);
    `);
  }

  addStream(streamId, sourceType, sourceId, resolutionIn, initialScale) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO streams 
      (stream_id, source_type, source_id, resolution_in, initial_scale, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(streamId, sourceType, sourceId, resolutionIn, initialScale);
  }

  endStream(streamId, resolutionOut) {
    const stmt = this.db.prepare(`
      UPDATE streams SET ended_at = CURRENT_TIMESTAMP, resolution_out = ?
      WHERE stream_id = ?
    `);
    return stmt.run(resolutionOut, streamId);
  }

  addQualityMetrics(streamId, metrics) {
    const stmt = this.db.prepare(`
      INSERT INTO quality_metrics 
      (stream_id, psnr, ssim, scale_factor, fps, processing_time_ms, end_to_end_delay_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      streamId,
      metrics.psnr || 0,
      metrics.ssim || 0,
      metrics.scale || 0,
      metrics.fps || 0,
      metrics.processingTimeMs || 0,
      metrics.endToEndDelayMs || 0
    );
  }

  addSystemMetrics(metrics) {
    const stmt = this.db.prepare(`
      INSERT INTO system_metrics 
      (gpu_utilization, gpu_memory_gb, cpu_usage, memory_usage_percent, active_streams)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(
      metrics.gpuUtilization || 0,
      metrics.gpuMemoryGb || 0,
      metrics.cpuUsage || 0,
      metrics.memoryUsagePercent || 0,
      metrics.activeStreams || 0
    );
  }

  addRecording(streamId, recordingId, inputPath, outputPath, scale) {
    const stmt = this.db.prepare(`
      INSERT INTO recordings 
      (stream_id, recording_id, start_time, input_path, output_path, scale_factor)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
    `);
    return stmt.run(streamId, recordingId, inputPath, outputPath, scale);
  }

  endRecording(recordingId, durationSec) {
    const stmt = this.db.prepare(`
      UPDATE recordings SET end_time = CURRENT_TIMESTAMP, duration_sec = ?, status = 'completed'
      WHERE recording_id = ?
    `);
    return stmt.run(durationSec, recordingId);
  }

  getQualityMetrics(streamId, startTime, endTime) {
    let sql = 'SELECT * FROM quality_metrics WHERE stream_id = ?';
    const params = [streamId];

    if (startTime) {
      sql += ' AND timestamp >= ?';
      params.push(startTime);
    }
    if (endTime) {
      sql += ' AND timestamp <= ?';
      params.push(endTime);
    }
    sql += ' ORDER BY timestamp ASC';

    return this.db.prepare(sql).all(...params);
  }

  getRecordings(streamId = null) {
    let sql = 'SELECT * FROM recordings';
    const params = [];

    if (streamId) {
      sql += ' WHERE stream_id = ?';
      params.push(streamId);
    }
    sql += ' ORDER BY start_time DESC';

    return this.db.prepare(sql).all(...params);
  }

  getRecording(recordingId) {
    return this.db.prepare('SELECT * FROM recordings WHERE recording_id = ?').get(recordingId);
  }

  getActiveStreams() {
    return this.db.prepare('SELECT * FROM streams WHERE ended_at IS NULL').all();
  }

  getSystemMetrics(limit = 100) {
    return this.db.prepare('SELECT * FROM system_metrics ORDER BY timestamp DESC LIMIT ?').all(limit);
  }

  close() {
    if (this.db) {
      this.db.close();
      logger.info('Database closed');
    }
  }
}

const db = new MetricsDatabase();
module.exports = db;
