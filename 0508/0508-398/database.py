import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'rockery.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stone_prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stone_type TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            price_per_cubic REAL NOT NULL,
            porosity REAL NOT NULL,
            density REAL NOT NULL,
            description TEXT
        )
    ''')
    
    stones = [
        ('hushi', '湖石', 2800.0, 0.65, 2.2, '太湖石，又名窟窿石，以造型取胜，具有瘦、皱、漏、透的特点'),
        ('huangshi', '黄石', 1800.0, 0.45, 2.6, '黄石，质地坚硬，棱角分明，色泽沉稳，多用于大型假山'),
        ('qingshi', '青石', 2200.0, 0.40, 2.7, '青石，质地细腻，色泽青灰，常用于园林叠山和步道')
    ]
    
    for stone_type, name, price, porosity, density, desc in stones:
        cursor.execute('''
            INSERT OR REPLACE INTO stone_prices 
            (stone_type, name, price_per_cubic, porosity, density, description)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (stone_type, name, price, porosity, density, desc))
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS water_sound_params (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            flow_rate_min REAL NOT NULL,
            flow_rate_max REAL NOT NULL,
            height_min REAL NOT NULL,
            height_max REAL NOT NULL,
            base_freq REAL NOT NULL,
            low_freq_factor REAL NOT NULL
        )
    ''')
    
    cursor.execute('SELECT COUNT(*) FROM water_sound_params')
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO water_sound_params 
            (flow_rate_min, flow_rate_max, height_min, height_max, base_freq, low_freq_factor)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (0.5, 20.0, 1.0, 10.0, 120.0, 0.7))
    
    conn.commit()
    conn.close()
    print("数据库初始化完成")

def get_stone_price(stone_type):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM stone_prices WHERE stone_type = ?', (stone_type,))
    result = cursor.fetchone()
    conn.close()
    if result:
        return {
            'id': result[0],
            'stone_type': result[1],
            'name': result[2],
            'price_per_cubic': result[3],
            'porosity': result[4],
            'density': result[5],
            'description': result[6]
        }
    return None

def get_all_stones():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM stone_prices')
    results = cursor.fetchall()
    conn.close()
    stones = []
    for r in results:
        stones.append({
            'id': r[0],
            'stone_type': r[1],
            'name': r[2],
            'price_per_cubic': r[3],
            'porosity': r[4],
            'density': r[5],
            'description': r[6]
        })
    return stones

if __name__ == '__main__':
    init_db()
