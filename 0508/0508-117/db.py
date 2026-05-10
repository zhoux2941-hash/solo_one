import sqlite3
import os
from datetime import datetime, timedelta

DB_NAME = "running_plans.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            goal TEXT NOT NULL,
            current_weekly_distance REAL NOT NULL,
            training_days INTEGER NOT NULL,
            start_date TEXT NOT NULL,
            created_at TEXT NOT NULL,
            max_heart_rate INTEGER DEFAULT 0
        )
    ''')
    
    try:
        cursor.execute('ALTER TABLE plans ADD COLUMN max_heart_rate INTEGER DEFAULT 0')
    except sqlite3.OperationalError:
        pass
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS training_days (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_id INTEGER NOT NULL,
            week_number INTEGER NOT NULL,
            day_of_week INTEGER NOT NULL,
            date TEXT NOT NULL,
            distance REAL NOT NULL,
            pace_type TEXT NOT NULL,
            notes TEXT,
            FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()

def create_plan(name, goal, current_weekly_distance, training_days, start_date, training_days_data, max_heart_rate=0):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO plans (name, goal, current_weekly_distance, training_days, start_date, created_at, max_heart_rate)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (name, goal, current_weekly_distance, training_days, start_date, datetime.now().isoformat(), max_heart_rate))
    
    plan_id = cursor.lastrowid
    
    for day in training_days_data:
        cursor.execute('''
            INSERT INTO training_days (plan_id, week_number, day_of_week, date, distance, pace_type, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (plan_id, day['week_number'], day['day_of_week'], day['date'], day['distance'], day['pace_type'], day.get('notes', '')))
    
    conn.commit()
    conn.close()
    
    return plan_id

def get_all_plans():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM plans ORDER BY created_at DESC')
    plans = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return plans

def get_plan(plan_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM plans WHERE id = ?', (plan_id,))
    plan = cursor.fetchone()
    
    if plan:
        plan = dict(plan)
        cursor.execute('SELECT * FROM training_days WHERE plan_id = ? ORDER BY week_number, day_of_week', (plan_id,))
        plan['training_days'] = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return plan

def update_training_day(day_id, distance, pace_type, notes=''):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE training_days
        SET distance = ?, pace_type = ?, notes = ?
        WHERE id = ?
    ''', (distance, pace_type, notes, day_id))
    
    conn.commit()
    conn.close()

def update_all_training_days(plan_id, training_days_data):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for day in training_days_data:
        cursor.execute('''
            UPDATE training_days
            SET distance = ?, pace_type = ?, notes = ?
            WHERE plan_id = ? AND week_number = ? AND day_of_week = ?
        ''', (day['distance'], day['pace_type'], day.get('notes', ''), plan_id, day['week_number'], day['day_of_week']))
    
    conn.commit()
    conn.close()

def delete_plan(plan_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM training_days WHERE plan_id = ?', (plan_id,))
    cursor.execute('DELETE FROM plans WHERE id = ?', (plan_id,))
    
    conn.commit()
    conn.close()
