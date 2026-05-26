import sqlite3
import os
from datetime import datetime, date

DB_PATH = os.path.join(os.path.dirname(__file__), 'gacha.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            free_draws INTEGER DEFAULT 10,
            last_free_reset TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS pools (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            pity_threshold INTEGER DEFAULT 90,
            is_active INTEGER DEFAULT 1,
            version TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(name, version)
        );

        CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pool_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            rarity TEXT NOT NULL,
            probability REAL NOT NULL,
            image_url TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS draw_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            pool_id INTEGER NOT NULL,
            card_id INTEGER NOT NULL,
            is_pity INTEGER DEFAULT 0,
            is_soft_pity INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (pool_id) REFERENCES pools(id),
            FOREIGN KEY (card_id) REFERENCES cards(id)
        );

        CREATE TABLE IF NOT EXISTS pity_counters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            pool_id INTEGER NOT NULL,
            counter INTEGER DEFAULT 0,
            last_updated TEXT NOT NULL,
            UNIQUE(user_id, pool_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (pool_id) REFERENCES pools(id)
        );
    ''')

    conn.commit()

    cursor.execute("PRAGMA table_info(draw_records)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'is_soft_pity' not in columns:
        cursor.execute("ALTER TABLE draw_records ADD COLUMN is_soft_pity INTEGER DEFAULT 0")
        print("Added is_soft_pity column to draw_records table.")

    conn.close()
    print("Database initialized successfully.")


def seed_data():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        today = date.today().isoformat()
        cursor.execute(
            "INSERT INTO users (username, free_draws, last_free_reset, created_at) VALUES (?, ?, ?, ?)",
            ('player', 10, today, datetime.now().isoformat())
        )

    cursor.execute("SELECT COUNT(*) FROM pools")
    if cursor.fetchone()[0] == 0:
        pool_data = [
            ('新手卡池', '新手专属卡池', 90, 1, 'v1.0'),
            ('限定卡池', '限时活动卡池', 80, 1, 'v1.0'),
            ('常驻卡池', '常规抽卡卡池', 90, 1, 'v1.0'),
        ]
        for name, desc, pity, active, version in pool_data:
            cursor.execute(
                "INSERT INTO pools (name, description, pity_threshold, is_active, version, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (name, desc, pity, active, version, datetime.now().isoformat())
            )

    cursor.execute("SELECT COUNT(*) FROM cards")
    if cursor.fetchone()[0] == 0:
        cards_data = [
            (1, '初始剑士', 'SSR', 0.02, 'https://picsum.photos/seed/sword1/200/300'),
            (1, '勇敢弓手', 'SR', 0.08, 'https://picsum.photos/seed/archer1/200/300'),
            (1, '普通村民', 'R', 0.30, 'https://picsum.photos/seed/villager1/200/300'),
            (1, '路过的猫', 'N', 0.60, 'https://picsum.photos/seed/cat1/200/300'),

            (2, '限定剑士·破晓', 'SSR', 0.015, 'https://picsum.photos/seed/sword2/200/300'),
            (2, '限定魔法师', 'SSR', 0.015, 'https://picsum.photos/seed/mage2/200/300'),
            (2, '精英刺客', 'SR', 0.10, 'https://picsum.photos/seed/assassin2/200/300'),
            (2, '见习牧师', 'R', 0.35, 'https://picsum.photos/seed/priest2/200/300'),
            (2, '史莱姆', 'N', 0.52, 'https://picsum.photos/seed/slime2/200/300'),

            (3, '传说骑士', 'SSR', 0.02, 'https://picsum.photos/seed/knight3/200/300'),
            (3, '资深战士', 'SR', 0.10, 'https://picsum.photos/seed/warrior3/200/300'),
            (3, '新手猎人', 'R', 0.38, 'https://picsum.photos/seed/hunter3/200/300'),
            (3, '装备商人', 'N', 0.50, 'https://picsum.photos/seed/merchant3/200/300'),
        ]
        for pool_id, name, rarity, prob, img in cards_data:
            cursor.execute(
                "INSERT INTO cards (pool_id, name, rarity, probability, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (pool_id, name, rarity, prob, img, datetime.now().isoformat())
            )

    conn.commit()
    conn.close()
    print("Seed data inserted successfully.")


if __name__ == '__main__':
    init_db()
    seed_data()
