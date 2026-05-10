import sqlite3
import os
from datetime import datetime


class FileDatabase:
    def __init__(self, db_path='file_scan.db'):
        self.db_path = db_path
        self.connection = None
        self._connect()
        self._migrate_schema()

    def _connect(self):
        self.connection = sqlite3.connect(self.db_path)
        self.connection.execute('PRAGMA journal_mode = WAL')
        self.connection.execute('PRAGMA synchronous = NORMAL')
        self.connection.execute('PRAGMA temp_store = MEMORY')
        self.connection.execute('PRAGMA mmap_size = 30000000000')
        self.connection.execute('PRAGMA cache_size = -20000')
        self.connection.execute('PRAGMA page_size = 4096')

    def _migrate_schema(self):
        cursor = self.connection.cursor()

        cursor.execute("PRAGMA table_info(files)")
        columns = [col[1] for col in cursor.fetchall()]

        if not columns:
            cursor.execute('''
                CREATE TABLE files (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    path TEXT NOT NULL UNIQUE,
                    size INTEGER NOT NULL,
                    created_time REAL NOT NULL,
                    md5 TEXT,
                    dhash TEXT,
                    scan_time REAL NOT NULL
                )
            ''')
        else:
            if 'dhash' not in columns:
                cursor.execute('ALTER TABLE files ADD COLUMN dhash TEXT')

        cursor.execute('CREATE INDEX IF NOT EXISTS idx_md5 ON files(md5)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_size ON files(size)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_path ON files(path)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_dhash ON files(dhash)')
        self.connection.commit()

    def insert_file(self, path, size, created_time, md5=None, dhash=None, scan_time=None):
        if scan_time is None:
            scan_time = datetime.now().timestamp()
        cursor = self.connection.cursor()
        try:
            cursor.execute('''
                INSERT OR REPLACE INTO files (path, size, created_time, md5, dhash, scan_time)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (path, size, created_time, md5, dhash, scan_time))
            self.connection.commit()
        except sqlite3.Error:
            self.connection.rollback()
            raise

    def update_md5(self, file_id, md5):
        cursor = self.connection.cursor()
        cursor.execute('UPDATE files SET md5 = ? WHERE id = ?', (md5, file_id))
        self.connection.commit()

    def update_dhash(self, path, dhash):
        cursor = self.connection.cursor()
        cursor.execute('UPDATE files SET dhash = ? WHERE path = ?', (dhash, path))
        self.connection.commit()

    def batch_insert_files(self, files_data):
        if not files_data:
            return
        cursor = self.connection.cursor()
        scan_time = datetime.now().timestamp()
        try:
            cursor.executemany('''
                INSERT OR REPLACE INTO files (path, size, created_time, md5, dhash, scan_time)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', [(
                f['path'],
                f['size'],
                f['created_time'],
                f.get('md5'),
                f.get('dhash'),
                scan_time
            ) for f in files_data])
            self.connection.commit()
        except sqlite3.Error:
            self.connection.rollback()
            raise

    def get_duplicates(self):
        cursor = self.connection.cursor()
        cursor.execute('''
            SELECT md5, GROUP_CONCAT(path, '|||'), COUNT(*) as cnt
            FROM files
            WHERE md5 IS NOT NULL
            GROUP BY md5
            HAVING cnt > 1
            ORDER BY cnt DESC
        ''')
        return cursor.fetchall()

    def get_duplicate_groups(self):
        cursor = self.connection.cursor()
        cursor.execute('''
            SELECT f1.md5, f1.path, f1.size, f1.created_time
            FROM files f1
            INNER JOIN (
                SELECT md5
                FROM files
                WHERE md5 IS NOT NULL
                GROUP BY md5
                HAVING COUNT(*) > 1
            ) f2 ON f1.md5 = f2.md5
            ORDER BY f1.md5, f1.created_time ASC
        ''')
        return cursor.fetchall()

    def get_all_images_with_dhash(self):
        cursor = self.connection.cursor()
        cursor.execute('''
            SELECT path, size, created_time, dhash
            FROM files
            WHERE dhash IS NOT NULL
            ORDER BY dhash
        ''')
        return cursor.fetchall()

    def delete_file_record(self, path):
        cursor = self.connection.cursor()
        cursor.execute('DELETE FROM files WHERE path = ?', (path,))
        self.connection.commit()

    def clear_all(self):
        cursor = self.connection.cursor()
        cursor.execute('DELETE FROM files')
        self.connection.commit()

    def get_file_count(self):
        cursor = self.connection.cursor()
        cursor.execute('SELECT COUNT(*) FROM files')
        return cursor.fetchone()[0]

    def close(self):
        if self.connection:
            self.connection.close()
