import sqlite3
import os
from datetime import datetime


class DatabaseManager:
    def __init__(self, db_path=None):
        if db_path is None:
            db_path = os.path.join(os.path.dirname(__file__), 'paper.db')
        self.db_path = db_path
        self._init_database()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_database(self):
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS papers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                fiber_types TEXT NOT NULL,
                thickness REAL NOT NULL,
                ph_value REAL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS fiber_compositions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                paper_id INTEGER NOT NULL,
                fiber_type TEXT NOT NULL,
                percentage REAL NOT NULL,
                FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS repair_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                book_title TEXT NOT NULL,
                original_fiber_types TEXT,
                original_thickness REAL,
                original_ph REAL,
                paper_id INTEGER,
                paper_name TEXT,
                repair_date TEXT NOT NULL,
                notes TEXT,
                FOREIGN KEY (paper_id) REFERENCES papers(id)
            )
        ''')
        
        conn.commit()
        conn.close()

    def add_paper(self, name, fiber_compositions, thickness, ph_value=None):
        conn = self._get_connection()
        cursor = conn.cursor()
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        fiber_types = ','.join([fc['fiber_type'] for fc in fiber_compositions])
        
        cursor.execute('''
            INSERT INTO papers (name, fiber_types, thickness, ph_value, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (name, fiber_types, thickness, ph_value, now, now))
        
        paper_id = cursor.lastrowid
        
        for fc in fiber_compositions:
            cursor.execute('''
                INSERT INTO fiber_compositions (paper_id, fiber_type, percentage)
                VALUES (?, ?, ?)
            ''', (paper_id, fc['fiber_type'], fc['percentage']))
        
        conn.commit()
        conn.close()
        return paper_id

    def update_paper(self, paper_id, name, fiber_compositions, thickness, ph_value=None):
        conn = self._get_connection()
        cursor = conn.cursor()
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        fiber_types = ','.join([fc['fiber_type'] for fc in fiber_compositions])
        
        cursor.execute('''
            UPDATE papers 
            SET name=?, fiber_types=?, thickness=?, ph_value=?, updated_at=?
            WHERE id=?
        ''', (name, fiber_types, thickness, ph_value, now, paper_id))
        
        cursor.execute('DELETE FROM fiber_compositions WHERE paper_id=?', (paper_id,))
        
        for fc in fiber_compositions:
            cursor.execute('''
                INSERT INTO fiber_compositions (paper_id, fiber_type, percentage)
                VALUES (?, ?, ?)
            ''', (paper_id, fc['fiber_type'], fc['percentage']))
        
        conn.commit()
        conn.close()

    def delete_paper(self, paper_id):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM fiber_compositions WHERE paper_id=?', (paper_id,))
        cursor.execute('DELETE FROM papers WHERE id=?', (paper_id,))
        conn.commit()
        conn.close()

    def get_all_papers(self):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM papers ORDER BY name')
        papers = cursor.fetchall()
        result = []
        for paper in papers:
            p = dict(paper)
            cursor.execute('SELECT * FROM fiber_compositions WHERE paper_id=?', (paper['id'],))
            p['fiber_compositions'] = [dict(fc) for fc in cursor.fetchall()]
            result.append(p)
        conn.close()
        return result

    def get_paper(self, paper_id):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM papers WHERE id=?', (paper_id,))
        paper = cursor.fetchone()
        if paper:
            p = dict(paper)
            cursor.execute('SELECT * FROM fiber_compositions WHERE paper_id=?', (paper_id,))
            p['fiber_compositions'] = [dict(fc) for fc in cursor.fetchall()]
            conn.close()
            return p
        conn.close()
        return None

    def add_repair_record(self, book_title, original_fiber_types, original_thickness, 
                          original_ph, paper_id, paper_name, notes=''):
        conn = self._get_connection()
        cursor = conn.cursor()
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.execute('''
            INSERT INTO repair_records 
            (book_title, original_fiber_types, original_thickness, original_ph,
             paper_id, paper_name, repair_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (book_title, original_fiber_types, original_thickness, original_ph,
              paper_id, paper_name, now, notes))
        
        record_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return record_id

    def get_all_repair_records(self):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM repair_records ORDER BY repair_date DESC')
        records = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return records

    def get_paper_by_name(self, name):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM papers WHERE name=?', (name,))
        paper = cursor.fetchone()
        if paper:
            p = dict(paper)
            cursor.execute('SELECT * FROM fiber_compositions WHERE paper_id=?', (paper['id'],))
            p['fiber_compositions'] = [dict(fc) for fc in cursor.fetchall()]
            conn.close()
            return p
        conn.close()
        return None
