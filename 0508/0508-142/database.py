import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bamboo_designs.db')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS designs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            opening_diameter REAL NOT NULL,
            bottom_diameter REAL NOT NULL,
            height REAL NOT NULL,
            strip_width REAL NOT NULL,
            pattern_type TEXT NOT NULL,
            warp_count INTEGER NOT NULL,
            weft_per_layer INTEGER NOT NULL,
            weft_layers INTEGER NOT NULL,
            strip_length_estimate REAL NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    
    try:
        cursor.execute('ALTER TABLE designs ADD COLUMN strip_thickness REAL')
    except sqlite3.OperationalError:
        pass
    
    conn.commit()
    conn.close()

def save_design(design_data):
    conn = get_connection()
    cursor = conn.cursor()
    
    strip_thickness = design_data.get('strip_thickness', None)
    if strip_thickness is None:
        strip_thickness = design_data['strip_width'] * 0.15
    
    cursor.execute('''
        INSERT INTO designs (
            name, opening_diameter, bottom_diameter, height, strip_width,
            pattern_type, warp_count, weft_per_layer, weft_layers,
            strip_length_estimate, strip_thickness, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        design_data['name'],
        design_data['opening_diameter'],
        design_data['bottom_diameter'],
        design_data['height'],
        design_data['strip_width'],
        design_data['pattern_type'],
        design_data['warp_count'],
        design_data['weft_per_layer'],
        design_data['weft_layers'],
        design_data['strip_length_estimate'],
        strip_thickness,
        datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    ))
    conn.commit()
    design_id = cursor.lastrowid
    conn.close()
    return design_id

def get_all_designs():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM designs ORDER BY created_at DESC')
    rows = cursor.fetchall()
    designs = []
    for row in rows:
        d = dict(row)
        if 'strip_thickness' not in d or d['strip_thickness'] is None:
            d['strip_thickness'] = d['strip_width'] * 0.15
        designs.append(d)
    conn.close()
    return designs

def get_design(design_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM designs WHERE id = ?', (design_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        d = dict(row)
        if 'strip_thickness' not in d or d['strip_thickness'] is None:
            d['strip_thickness'] = d['strip_width'] * 0.15
        return d
    return None

def delete_design(design_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM designs WHERE id = ?', (design_id,))
    conn.commit()
    conn.close()
