import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sword_guardian.db')

class Database:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        self.init_db()
    
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_db(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS swords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                material TEXT NOT NULL,
                blade_length REAL,
                production_year INTEGER,
                current_status TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS maintenance_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sword_id INTEGER NOT NULL,
                maintenance_date TEXT NOT NULL,
                oil_used TEXT,
                cleaning_method TEXT,
                rust_removed INTEGER DEFAULT 0,
                humidity REAL,
                notes TEXT,
                before_photo_path TEXT,
                after_photo_path TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sword_id) REFERENCES swords(id) ON DELETE CASCADE
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def add_sword(self, name, material, blade_length, production_year, current_status):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO swords (name, material, blade_length, production_year, current_status)
            VALUES (?, ?, ?, ?, ?)
        ''', (name, material, blade_length, production_year, current_status))
        sword_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return sword_id
    
    def update_sword(self, sword_id, name, material, blade_length, production_year, current_status):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE swords 
            SET name=?, material=?, blade_length=?, production_year=?, current_status=?, updated_at=?
            WHERE id=?
        ''', (name, material, blade_length, production_year, current_status, 
              datetime.now().strftime('%Y-%m-%d %H:%M:%S'), sword_id))
        conn.commit()
        conn.close()
    
    def delete_sword(self, sword_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM maintenance_records WHERE sword_id=?', (sword_id,))
        cursor.execute('DELETE FROM swords WHERE id=?', (sword_id,))
        conn.commit()
        conn.close()
    
    def get_all_swords(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM swords ORDER BY updated_at DESC')
        swords = cursor.fetchall()
        conn.close()
        return [dict(sword) for sword in swords]
    
    def get_sword(self, sword_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM swords WHERE id=?', (sword_id,))
        sword = cursor.fetchone()
        conn.close()
        return dict(sword) if sword else None
    
    def add_maintenance_record(self, sword_id, maintenance_date, oil_used, cleaning_method, 
                                rust_removed, humidity, notes='', 
                                before_photo_path='', after_photo_path=''):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO maintenance_records 
            (sword_id, maintenance_date, oil_used, cleaning_method, rust_removed, humidity, 
             notes, before_photo_path, after_photo_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (sword_id, maintenance_date, oil_used, cleaning_method, 
              1 if rust_removed else 0, humidity, notes, 
              before_photo_path, after_photo_path))
        record_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return record_id
    
    def update_maintenance_record(self, record_id, maintenance_date, oil_used, cleaning_method,
                                   rust_removed, humidity, notes='',
                                   before_photo_path='', after_photo_path=''):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE maintenance_records 
            SET maintenance_date=?, oil_used=?, cleaning_method=?, rust_removed=?, humidity=?,
                notes=?, before_photo_path=?, after_photo_path=?
            WHERE id=?
        ''', (maintenance_date, oil_used, cleaning_method, 
              1 if rust_removed else 0, humidity, notes,
              before_photo_path, after_photo_path, record_id))
        conn.commit()
        conn.close()
    
    def delete_maintenance_record(self, record_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM maintenance_records WHERE id=?', (record_id,))
        conn.commit()
        conn.close()
    
    def get_maintenance_records(self, sword_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM maintenance_records 
            WHERE sword_id=? ORDER BY maintenance_date DESC
        ''', (sword_id,))
        records = cursor.fetchall()
        conn.close()
        return [dict(record) for record in records]
    
    def get_maintenance_record(self, record_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM maintenance_records WHERE id=?', (record_id,))
        record = cursor.fetchone()
        conn.close()
        return dict(record) if record else None
