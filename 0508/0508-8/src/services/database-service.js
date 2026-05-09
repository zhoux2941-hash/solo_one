const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const { app } = require('electron')

const isPackaged = app && app.isPackaged ? app.isPackaged : false

function getDbPath() {
  if (isPackaged) {
    const userDataPath = app.getPath('userData')
    const dbDir = path.join(userDataPath, 'data')
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }
    return path.join(dbDir, 'materials.db')
  } else {
    const devDataDir = path.join(__dirname, '../../data')
    if (!fs.existsSync(devDataDir)) {
      fs.mkdirSync(devDataDir, { recursive: true })
    }
    return path.join(devDataDir, 'materials.db')
  }
}

let db = null

function initDatabase() {
  const dbPath = getDbPath()
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  createTables()
  insertDefaultData()
  return db
}

function getDb() {
  if (!db) {
    initDatabase()
  }
  return db
}

function createTables() {
  const sql = `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT DEFAULT '#3B82F6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#10B981',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_ext TEXT,
      file_type TEXT,
      file_size INTEGER,
      category_id INTEGER,
      thumbnail_path TEXT,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS material_tags (
      material_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (material_id, tag_id),
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category_id);
    CREATE INDEX IF NOT EXISTS idx_materials_file_name ON materials(file_name);
    CREATE INDEX IF NOT EXISTS idx_materials_note ON materials(note);
    CREATE INDEX IF NOT EXISTS idx_material_tags_tag ON material_tags(tag_id);
  `
  db.exec(sql)
}

function insertDefaultData() {
  const defaultCategories = [
    { name: '默认分类', description: '默认素材分类', color: '#3B82F6' },
    { name: '图片素材', description: '图片类素材归档', color: '#EC4899' },
    { name: '音频素材', description: '音频类素材归档', color: '#8B5CF6' },
    { name: '文档资料', description: '文档类素材归档', color: '#F59E0B' }
  ]

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name, description, color)
    VALUES (?, ?, ?)
  `)

  for (const cat of defaultCategories) {
    insertCategory.run(cat.name, cat.description, cat.color)
  }
}

function getAllCategories() {
  return db.prepare(`
    SELECT c.*, 
           (SELECT COUNT(*) FROM materials m WHERE m.category_id = c.id) as material_count
    FROM categories c
    ORDER BY c.created_at DESC
  `).all()
}

function createCategory(category) {
  const stmt = db.prepare(`
    INSERT INTO categories (name, description, color)
    VALUES (?, ?, ?)
  `)
  const result = stmt.run(category.name, category.description || '', category.color || '#3B82F6')
  return getCategoryById(result.lastInsertRowid)
}

function getCategoryById(id) {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id)
}

function updateCategory(id, category) {
  const stmt = db.prepare(`
    UPDATE categories 
    SET name = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  stmt.run(category.name, category.description || '', category.color || '#3B82F6', id)
  return getCategoryById(id)
}

function deleteCategory(id) {
  return db.prepare('DELETE FROM categories WHERE id = ?').run(id)
}

function getAllTags() {
  return db.prepare(`
    SELECT t.*, 
           (SELECT COUNT(*) FROM material_tags mt WHERE mt.tag_id = t.id) as material_count
    FROM tags t
    ORDER BY t.created_at DESC
  `).all()
}

function createTag(tag) {
  const existing = db.prepare('SELECT * FROM tags WHERE name = ?').get(tag.name)
  if (existing) return existing
  
  const stmt = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)')
  const result = stmt.run(tag.name, tag.color || '#10B981')
  return getTagById(result.lastInsertRowid)
}

function getTagById(id) {
  return db.prepare('SELECT * FROM tags WHERE id = ?').get(id)
}

function updateTag(id, tag) {
  const stmt = db.prepare('UPDATE tags SET name = ?, color = ? WHERE id = ?')
  stmt.run(tag.name, tag.color || '#10B981', id)
  return getTagById(id)
}

function deleteTag(id) {
  return db.prepare('DELETE FROM tags WHERE id = ?').run(id)
}

function createMaterial(material) {
  const stmt = db.prepare(`
    INSERT INTO materials 
    (file_name, original_name, file_path, file_ext, file_type, file_size, category_id, thumbnail_path, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    material.file_name,
    material.original_name,
    material.file_path,
    material.file_ext || '',
    material.file_type || 'other',
    material.file_size || 0,
    material.category_id || null,
    material.thumbnail_path || '',
    material.note || ''
  )
  return getMaterialById(result.lastInsertRowid)
}

function getMaterialById(id) {
  return db.prepare('SELECT * FROM materials WHERE id = ?').get(id)
}

function getMaterialThumbnail(id) {
  const material = getMaterialById(id)
  return material ? material.thumbnail_path : null
}

function getAllMaterials(filters = {}) {
  let sql = `
    SELECT m.*, c.name as category_name, c.color as category_color
    FROM materials m
    LEFT JOIN categories c ON m.category_id = c.id
    WHERE 1=1
  `
  const params = []

  if (filters.category_id) {
    sql += ' AND m.category_id = ?'
    params.push(filters.category_id)
  }

  if (filters.file_type) {
    sql += ' AND m.file_type = ?'
    params.push(filters.file_type)
  }

  sql += ' ORDER BY m.created_at DESC'

  return db.prepare(sql).all(...params)
}

function searchMaterials(query) {
  if (!query || query.trim() === '') {
    return getAllMaterials()
  }

  const searchTerm = `%${query.trim()}%`
  
  const sql = `
    SELECT DISTINCT m.*, c.name as category_name, c.color as category_color
    FROM materials m
    LEFT JOIN categories c ON m.category_id = c.id
    LEFT JOIN material_tags mt ON m.id = mt.material_id
    LEFT JOIN tags t ON mt.tag_id = t.id
    WHERE m.file_name LIKE ? 
       OR m.original_name LIKE ? 
       OR m.note LIKE ?
       OR t.name LIKE ?
    ORDER BY m.created_at DESC
  `

  return db.prepare(sql).all(searchTerm, searchTerm, searchTerm, searchTerm)
}

function updateMaterialNote(id, note) {
  const stmt = db.prepare(`
    UPDATE materials 
    SET note = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  stmt.run(note || '', id)
  return getMaterialById(id)
}

function updateMaterialFileName(id, fileName, filePath) {
  const stmt = db.prepare(`
    UPDATE materials 
    SET file_name = ?, file_path = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  stmt.run(fileName, filePath, id)
  return getMaterialById(id)
}

function deleteMaterial(id) {
  return db.prepare('DELETE FROM materials WHERE id = ?').run(id)
}

function addTagsToMaterial(materialId, tagIds) {
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO material_tags (material_id, tag_id)
    VALUES (?, ?)
  `)

  const transaction = db.transaction((ids) => {
    for (const tagId of ids) {
      insertStmt.run(materialId, tagId)
    }
  })

  transaction(tagIds)
  return getMaterialTags(materialId)
}

function removeTagFromMaterial(materialId, tagId) {
  return db.prepare(`
    DELETE FROM material_tags 
    WHERE material_id = ? AND tag_id = ?
  `).run(materialId, tagId)
}

function getMaterialTags(materialId) {
  return db.prepare(`
    SELECT t.*
    FROM tags t
    INNER JOIN material_tags mt ON t.id = mt.tag_id
    WHERE mt.material_id = ?
    ORDER BY t.name
  `).all(materialId)
}

module.exports = {
  initDatabase,
  getDb,
  getAllCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getAllTags,
  createTag,
  getTagById,
  updateTag,
  deleteTag,
  createMaterial,
  getMaterialById,
  getMaterialThumbnail,
  getAllMaterials,
  searchMaterials,
  updateMaterialNote,
  updateMaterialFileName,
  deleteMaterial,
  addTagsToMaterial,
  removeTagFromMaterial,
  getMaterialTags
}
