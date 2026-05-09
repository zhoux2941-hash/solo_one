const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { app } = require('electron')
const databaseService = require('./database-service')

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a']
const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx', '.md']

function getFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image'
  if (AUDIO_EXTENSIONS.includes(ext)) return 'audio'
  if (DOCUMENT_EXTENSIONS.includes(ext)) return 'document'
  
  return 'other'
}

function getThumbnailsDir() {
  let baseDir
  if (app && app.getPath) {
    baseDir = app.getPath('userData')
  } else {
    baseDir = path.join(__dirname, '../../data')
  }
  const thumbDir = path.join(baseDir, 'thumbnails')
  if (!fs.existsSync(thumbDir)) {
    fs.mkdirSync(thumbDir, { recursive: true })
  }
  return thumbDir
}

function generateFileHash(filePath) {
  const hash = crypto.createHash('md5')
  hash.update(filePath + Date.now())
  return hash.digest('hex')
}

async function createThumbnail(filePath, fileType) {
  try {
    const thumbDir = getThumbnailsDir()
    const fileHash = generateFileHash(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const thumbName = `${fileHash}${ext === '.svg' ? '.svg' : '.jpg'}`
    const thumbPath = path.join(thumbDir, thumbName)

    if (fileType === 'image') {
      if (ext === '.svg') {
        fs.copyFileSync(filePath, thumbPath)
        return thumbPath
      }
      
      try {
        const sharp = require('sharp')
        await sharp(filePath)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(thumbPath)
        return thumbPath
      } catch (err) {
        console.warn('Sharp not available, copying original image:', err.message)
        fs.copyFileSync(filePath, thumbPath)
        return thumbPath
      }
    }

    return null
  } catch (error) {
    console.error('Error creating thumbnail:', error)
    return null
  }
}

function normalizeFilePathForCompare(filePath) {
  if (!filePath) return ''
  return path.normalize(filePath).toLowerCase()
}

async function importMaterial(filePath) {
  try {
    if (!filePath || typeof filePath !== 'string') {
      console.warn('Invalid file path:', filePath)
      return null
    }

    if (!fs.existsSync(filePath)) {
      console.warn('File not found:', filePath)
      return null
    }

    let stats
    try {
      stats = fs.statSync(filePath)
    } catch (statError) {
      console.error('Failed to stat file:', filePath, statError)
      return null
    }

    if (!stats.isFile()) {
      console.warn('Not a file:', filePath)
      return null
    }

    const normalizedPath = path.normalize(filePath)
    const comparePath = normalizeFilePathForCompare(filePath)
    const originalName = path.basename(filePath)
    const ext = path.extname(filePath)
    const fileName = originalName
    const fileType = getFileType(filePath)

    const allMaterials = databaseService.getAllMaterials()
    const existing = allMaterials.find(m => 
      normalizeFilePathForCompare(m.file_path) === comparePath
    )

    if (existing) {
      console.log('Material already exists:', originalName)
      return existing
    }

    let thumbnailPath = null
    try {
      thumbnailPath = await createThumbnail(filePath, fileType)
    } catch (thumbError) {
      console.error('Failed to create thumbnail for:', originalName, thumbError)
    }

    const material = {
      file_name: fileName,
      original_name: originalName,
      file_path: normalizePath(normalizedPath),
      file_ext: ext.toLowerCase(),
      file_type: fileType,
      file_size: stats.size,
      category_id: null,
      thumbnail_path: thumbnailPath ? normalizePath(thumbnailPath) : null,
      note: ''
    }

    const result = databaseService.createMaterial(material)
    console.log('Successfully imported:', originalName)
    return result

  } catch (error) {
    console.error('Failed to import material:', filePath, error)
    return null
  }
}

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/')
}

function deleteThumbnail(thumbPath) {
  if (thumbPath && fs.existsSync(thumbPath)) {
    try {
      fs.unlinkSync(thumbPath)
    } catch (error) {
      console.error('Error deleting thumbnail:', error)
    }
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function isValidFileName(fileName) {
  if (!fileName || typeof fileName !== 'string') return false
  if (fileName.length > 255) return false
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/g
  if (invalidChars.test(fileName)) return false
  if (fileName.trim() === '') return false
  if (fileName === '.' || fileName === '..') return false
  return true
}

function sanitizeFileName(fileName) {
  if (!fileName) return ''
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/g
  let sanitized = fileName.replace(invalidChars, '_')
  sanitized = sanitized.trim()
  if (sanitized === '' || sanitized === '.' || sanitized === '..') {
    sanitized = 'unnamed'
  }
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255)
  }
  return sanitized
}

function generateNewFileName(pattern, index, originalName, total) {
  const ext = path.extname(originalName)
  const baseName = path.basename(originalName, ext)
  
  let result = pattern
  result = result.replace(/\{n\}/g, String(index))
  result = result.replace(/\{nn\}/g, String(index).padStart(2, '0'))
  result = result.replace(/\{nnn\}/g, String(index).padStart(3, '0'))
  result = result.replace(/\{nnnn\}/g, String(index).padStart(4, '0'))
  result = result.replace(/\{name\}/g, baseName)
  result = result.replace(/\{ext\}/g, ext.substring(1))
  result = result.replace(/\{total\}/g, String(total))
  result = result.replace(/\{date\}/g, new Date().toISOString().split('T')[0])
  
  const newExt = path.extname(result)
  if (!newExt) {
    result = result + ext
  }
  
  return sanitizeFileName(result)
}

async function renameMaterial(materialId, newFileName) {
  try {
    const material = databaseService.getMaterialById(materialId)
    if (!material) {
      return { success: false, error: '素材不存在' }
    }

    if (!isValidFileName(newFileName)) {
      return { success: false, error: '无效的文件名' }
    }

    const oldPath = material.file_path.replace(/\//g, path.sep)
    const dirPath = path.dirname(oldPath)
    const ext = path.extname(material.file_name)
    const newExt = path.extname(newFileName)
    
    let finalNewName = newFileName
    if (!newExt) {
      finalNewName = newFileName + ext
    }
    
    const newPath = path.join(dirPath, finalNewName)
    
    if (oldPath === newPath) {
      return { success: true, material }
    }
    
    if (fs.existsSync(newPath)) {
      return { success: false, error: '目标文件名已存在' }
    }
    
    try {
      fs.renameSync(oldPath, newPath)
    } catch (renameError) {
      console.error('Failed to rename file:', renameError)
      return { success: false, error: '文件重命名失败：' + renameError.message }
    }
    
    const updatedMaterial = {
      file_name: finalNewName,
      file_path: normalizePath(newPath)
    }
    
    databaseService.updateMaterialFileName(materialId, updatedMaterial.file_name, updatedMaterial.file_path)
    
    const result = databaseService.getMaterialById(materialId)
    return { success: true, material: result }
    
  } catch (error) {
    console.error('Rename material error:', error)
    return { success: false, error: error.message || '未知错误' }
  }
}

async function batchRenameMaterials(materialIds, options) {
  const results = {
    success: [],
    failed: [],
    count: materialIds.length
  }
  
  if (!Array.isArray(materialIds) || materialIds.length === 0) {
    return { success: [], failed: [], count: 0, error: '没有选择任何素材' }
  }
  
  if (!options || !options.pattern) {
    return { success: [], failed: [], count: 0, error: '缺少重命名规则' }
  }
  
  const materials = materialIds
    .map(id => databaseService.getMaterialById(id))
    .filter(m => m !== undefined && m !== null)
  
  for (let i = 0; i < materials.length; i++) {
    const material = materials[i]
    const index = options.startIndex ? (parseInt(options.startIndex) + i) : (i + 1)
    
    const newFileName = generateNewFileName(
      options.pattern, 
      index, 
      material.file_name,
      materials.length
    )
    
    const result = await renameMaterial(material.id, newFileName)
    
    if (result.success) {
      results.success.push({
        id: material.id,
        oldName: material.file_name,
        newName: newFileName
      })
    } else {
      results.failed.push({
        id: material.id,
        name: material.file_name,
        error: result.error
      })
    }
  }
  
  return {
    ...results,
    successCount: results.success.length,
    failedCount: results.failed.length
  }
}

module.exports = {
  getFileType,
  getThumbnailsDir,
  createThumbnail,
  importMaterial,
  deleteThumbnail,
  normalizePath,
  formatFileSize,
  isValidFileName,
  sanitizeFileName,
  generateNewFileName,
  renameMaterial,
  batchRenameMaterials,
  IMAGE_EXTENSIONS,
  AUDIO_EXTENSIONS,
  DOCUMENT_EXTENSIONS
}
