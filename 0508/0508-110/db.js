const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let db;
let SQL;

async function initDb() {
    const initSqlJs = require('sql.js');
    SQL = await initSqlJs();
    
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'worktracker.db');
    
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }
    
    db.run(`
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            budget REAL DEFAULT 0,
            hourly_rate REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS work_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            start_time TEXT,
            end_time TEXT,
            duration_minutes INTEGER NOT NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
    `);
    
    saveDb();
    return db;
}

function saveDb() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'worktracker.db');
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
}

function getDb() {
    if (!db) {
        throw new Error('数据库未初始化');
    }
    return db;
}

function query(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

function run(sql, params = []) {
    db.run(sql, params);
    saveDb();
    const lastId = query('SELECT last_insert_rowid() as id')[0].id;
    return { lastInsertRowid: lastId, changes: db.getRowsModified() };
}

function getProjects() {
    return query('SELECT * FROM projects ORDER BY created_at DESC');
}

function getProjectById(id) {
    const results = query('SELECT * FROM projects WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
}

function addProject(name, budget, hourlyRate) {
    const result = run(`
        INSERT INTO projects (name, budget, hourly_rate, created_at)
        VALUES (?, ?, ?, datetime('now'))
    `, [name, budget, hourlyRate]);
    return result.lastInsertRowid;
}

function updateProject(id, name, budget, hourlyRate) {
    run(`
        UPDATE projects SET name = ?, budget = ?, hourly_rate = ?
        WHERE id = ?
    `, [name, budget, hourlyRate, id]);
    return true;
}

function deleteProject(id) {
    run('DELETE FROM work_records WHERE project_id = ?', [id]);
    run('DELETE FROM projects WHERE id = ?', [id]);
    return true;
}

function addWorkRecord(projectId, date, startTime, endTime, durationMinutes, notes) {
    const result = run(`
        INSERT INTO work_records (project_id, date, start_time, end_time, duration_minutes, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [projectId, date, startTime, endTime, durationMinutes, notes]);
    return result.lastInsertRowid;
}

function updateWorkRecord(id, projectId, date, startTime, endTime, durationMinutes, notes) {
    run(`
        UPDATE work_records 
        SET project_id = ?, date = ?, start_time = ?, end_time = ?, duration_minutes = ?, notes = ?
        WHERE id = ?
    `, [projectId, date, startTime, endTime, durationMinutes, notes, id]);
    return true;
}

function deleteWorkRecord(id) {
    run('DELETE FROM work_records WHERE id = ?', [id]);
    return true;
}

function getWorkRecordsByDate(date) {
    return query(`
        SELECT wr.*, p.name as project_name, p.hourly_rate
        FROM work_records wr
        JOIN projects p ON wr.project_id = p.id
        WHERE wr.date = ?
        ORDER BY wr.start_time ASC
    `, [date]);
}

function getDailyTotalMinutes(date) {
    const results = query(`
        SELECT COALESCE(SUM(duration_minutes), 0) as total
        FROM work_records
        WHERE date = ?
    `, [date]);
    return results.length > 0 ? results[0].total : 0;
}

function getWorkRecordsByDateRange(startDate, endDate) {
    return query(`
        SELECT wr.*, p.name as project_name, p.hourly_rate
        FROM work_records wr
        JOIN projects p ON wr.project_id = p.id
        WHERE wr.date >= ? AND wr.date <= ?
        ORDER BY wr.date ASC, wr.start_time ASC
    `, [startDate, endDate]);
}

function getProjectSummary(startDate, endDate) {
    return query(`
        SELECT 
            p.id as project_id,
            p.name as project_name,
            p.hourly_rate,
            COALESCE(SUM(wr.duration_minutes), 0) as total_minutes,
            ROUND(COALESCE(SUM(wr.duration_minutes), 0) * p.hourly_rate / 60, 2) as total_income
        FROM projects p
        LEFT JOIN work_records wr ON p.id = wr.project_id 
            AND wr.date >= ? AND wr.date <= ?
        GROUP BY p.id, p.name, p.hourly_rate
        ORDER BY total_minutes DESC
    `, [startDate, endDate]);
}

module.exports = {
    initDb,
    getDb,
    getProjects,
    getProjectById,
    addProject,
    updateProject,
    deleteProject,
    addWorkRecord,
    updateWorkRecord,
    deleteWorkRecord,
    getWorkRecordsByDate,
    getDailyTotalMinutes,
    getWorkRecordsByDateRange,
    getProjectSummary
};
