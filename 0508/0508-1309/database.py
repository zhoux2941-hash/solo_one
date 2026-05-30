import sqlite3
import json
import os
import numpy as np
from datetime import datetime

DB_PATH = 'eeg_templates.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            template_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            detection_id TEXT,
            sample_idx INTEGER,
            channel_idx INTEGER,
            time_point REAL,
            correlation REAL,
            amplitude REAL,
            morphology_type TEXT,
            user_label INTEGER,
            eeg_mode TEXT,
            threshold_used REAL,
            waveform_snippet TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS optimal_thresholds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            template_type TEXT UNIQUE,
            optimal_threshold REAL,
            precision_score REAL,
            recall_score REAL,
            f1_score REAL,
            total_samples INTEGER,
            true_positives INTEGER,
            false_positives INTEGER,
            false_negatives INTEGER,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS detection_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            eeg_mode TEXT,
            channel_idx INTEGER,
            threshold_used REAL,
            num_detections INTEGER,
            user_feedback_count INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    cursor.execute('SELECT COUNT(*) FROM templates')
    count = cursor.fetchone()[0]
    if count == 0:
        _insert_default_templates(conn)
    cursor.execute('SELECT COUNT(*) FROM optimal_thresholds')
    threshold_count = cursor.fetchone()[0]
    if threshold_count == 0:
        _insert_default_thresholds(conn)
    conn.close()

def _insert_default_templates(conn):
    cursor = conn.cursor()
    sr = 256
    spike_len = int(sr * 0.07)
    t_spike = np.linspace(0, 0.07, spike_len)
    default_spike = 100 * np.exp(-((t_spike - 0.035) ** 2) / (2 * 0.012 ** 2))
    sharp_len = int(sr * 0.15)
    t_sharp = np.linspace(0, 0.15, sharp_len)
    default_sharp = 80 * np.sin(2 * np.pi * 3.5 * t_sharp) * np.exp(-((t_sharp - 0.075) ** 2) / (2 * 0.05 ** 2))
    swc_len = int(sr * 0.3)
    t_swc = np.linspace(0, 0.3, swc_len)
    spike = 150 * np.exp(-((t_swc - 0.05) ** 2) / (2 * 0.02 ** 2))
    wave = 90 * np.sin(2 * np.pi * 3 * (t_swc - 0.08)) * np.exp(-((t_swc - 0.15) ** 2) / (2 * 0.1 ** 2))
    default_swc = spike + wave
    templates = [
        ('标准棘波', 'spike', default_spike.tolist()),
        ('标准尖波', 'sharp', default_sharp.tolist()),
        ('棘慢复合波', 'spike_wave', default_swc.tolist()),
    ]
    for name, template_type, data in templates:
        cursor.execute('''
            INSERT INTO templates (name, type, template_data)
            VALUES (?, ?, ?)
        ''', (name, template_type, json.dumps(data)))
    conn.commit()

def _insert_default_thresholds(conn):
    cursor = conn.cursor()
    default_thresholds = [
        ('spike', 0.85, 0.85, 0.80, 0.82, 0, 0, 0, 0),
        ('sharp', 0.82, 0.82, 0.78, 0.80, 0, 0, 0, 0),
        ('spike_wave', 0.80, 0.80, 0.75, 0.77, 0, 0, 0, 0),
    ]
    for threshold_data in default_thresholds:
        cursor.execute('''
            INSERT INTO optimal_thresholds 
            (template_type, optimal_threshold, precision_score, recall_score, 
             f1_score, total_samples, true_positives, false_positives, false_negatives)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', threshold_data)
    conn.commit()

def get_templates():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, type, template_data FROM templates')
    rows = cursor.fetchall()
    conn.close()
    templates = []
    for row in rows:
        templates.append({
            'id': row[0],
            'name': row[1],
            'type': row[2],
            'data': json.loads(row[3])
        })
    return templates

def add_template(name, template_type, template_data):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO templates (name, type, template_data)
        VALUES (?, ?, ?)
    ''', (name, template_type, json.dumps(template_data)))
    conn.commit()
    conn.close()

def delete_template(template_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM templates WHERE id = ?', (template_id,))
    conn.commit()
    conn.close()

def add_user_feedback(detection_data, user_label, eeg_mode, threshold_used, waveform_snippet=None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    detection_id = f"{detection_data.get('sample', 0)}_{detection_data.get('channel', 0)}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    cursor.execute('''
        INSERT INTO user_feedback 
        (detection_id, sample_idx, channel_idx, time_point, correlation, 
         amplitude, morphology_type, user_label, eeg_mode, threshold_used, waveform_snippet)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        detection_id,
        detection_data.get('sample', 0),
        detection_data.get('channel', 0),
        detection_data.get('time', 0),
        detection_data.get('correlation', 0),
        detection_data.get('amplitude', 0),
        detection_data.get('morphology_type', ''),
        user_label,
        eeg_mode,
        threshold_used,
        json.dumps(waveform_snippet) if waveform_snippet else None
    ))
    conn.commit()
    conn.close()
    return detection_id

def get_user_feedback(limit=1000, template_type=None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if template_type:
        cursor.execute('''
            SELECT id, sample_idx, channel_idx, time_point, correlation, 
                   amplitude, morphology_type, user_label, eeg_mode, threshold_used, created_at
            FROM user_feedback
            WHERE morphology_type = ?
            ORDER BY created_at DESC
            LIMIT ?
        ''', (template_type, limit))
    else:
        cursor.execute('''
            SELECT id, sample_idx, channel_idx, time_point, correlation, 
                   amplitude, morphology_type, user_label, eeg_mode, threshold_used, created_at
            FROM user_feedback
            ORDER BY created_at DESC
            LIMIT ?
        ''', (limit,))
    rows = cursor.fetchall()
    conn.close()
    feedback_list = []
    for row in rows:
        feedback_list.append({
            'id': row[0],
            'sample_idx': row[1],
            'channel_idx': row[2],
            'time_point': row[3],
            'correlation': row[4],
            'amplitude': row[5],
            'morphology_type': row[6],
            'user_label': row[7],
            'eeg_mode': row[8],
            'threshold_used': row[9],
            'created_at': row[10]
        })
    return feedback_list

def get_optimal_thresholds():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT template_type, optimal_threshold, precision_score, recall_score, 
               f1_score, total_samples, true_positives, false_positives, false_negatives, last_updated
        FROM optimal_thresholds
    ''')
    rows = cursor.fetchall()
    conn.close()
    thresholds = {}
    for row in rows:
        thresholds[row[0]] = {
            'template_type': row[0],
            'optimal_threshold': row[1],
            'precision_score': row[2],
            'recall_score': row[3],
            'f1_score': row[4],
            'total_samples': row[5],
            'true_positives': row[6],
            'false_positives': row[7],
            'false_negatives': row[8],
            'last_updated': row[9]
        }
    return thresholds

def get_optimal_threshold(template_type='spike'):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT optimal_threshold FROM optimal_thresholds
        WHERE template_type = ?
    ''', (template_type,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return row[0]
    return 0.85

def update_optimal_threshold(template_type, threshold, metrics):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE optimal_thresholds
        SET optimal_threshold = ?, precision_score = ?, recall_score = ?, 
            f1_score = ?, total_samples = ?, true_positives = ?, 
            false_positives = ?, false_negatives = ?, last_updated = CURRENT_TIMESTAMP
        WHERE template_type = ?
    ''', (
        threshold,
        metrics.get('precision', 0),
        metrics.get('recall', 0),
        metrics.get('f1', 0),
        metrics.get('total', 0),
        metrics.get('tp', 0),
        metrics.get('fp', 0),
        metrics.get('fn', 0),
        template_type
    ))
    conn.commit()
    conn.close()

def add_detection_stats(eeg_mode, channel_idx, threshold, num_detections, feedback_count=0):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO detection_stats (eeg_mode, channel_idx, threshold_used, num_detections, user_feedback_count)
        VALUES (?, ?, ?, ?, ?)
    ''', (eeg_mode, channel_idx, threshold, num_detections, feedback_count))
    conn.commit()
    conn.close()

def get_feedback_statistics():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM user_feedback')
    total = cursor.fetchone()[0]
    cursor.execute('SELECT COUNT(*) FROM user_feedback WHERE user_label = 1')
    tp = cursor.fetchone()[0]
    cursor.execute('SELECT COUNT(*) FROM user_feedback WHERE user_label = 0')
    fp = cursor.fetchone()[0]
    conn.close()
    return {
        'total_feedback': total,
        'true_positives': tp,
        'false_positives': fp,
        'user_precision': tp / (tp + fp) if (tp + fp) > 0 else 0
    }
