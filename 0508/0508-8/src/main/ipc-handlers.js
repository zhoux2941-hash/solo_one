const { ipcMain, dialog, shell } = require('electron')
const databaseService = require('../services/database-service')
const fileService = require('../services/file-service')

function registerAllHandlers() {
  ipcMain.handle('select-files', async (event, options) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: options?.filters || [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'] },
        { name: 'Audio', extensions: ['mp3', 'wav', 'flac', 'aac', 'ogg'] },
        { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'] }
      ]
    })
    return result.canceled ? [] : result.filePaths
  })

  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('import-materials', async (event, files) => {
    console.log('Starting import of', files.length, 'files')
    
    const imported = []
    const failed = []
    
    if (!Array.isArray(files)) {
      console.error('Invalid files array:', files)
      return { imported: [], failed: [{ path: 'invalid_input', error: 'Invalid files format' }] }
    }
    
    for (let i = 0; i < files.length; i++) {
      const filePath = files[i]
      try {
        console.log(`Processing ${i + 1}/${files.length}:`, filePath)
        
        if (!filePath || typeof filePath !== 'string') {
          console.warn('Invalid file path at index', i, filePath)
          failed.push({ path: String(filePath || 'unknown'), error: 'Invalid file path' })
          continue
        }
        
        const material = await fileService.importMaterial(filePath)
        if (material) {
          imported.push(material)
        } else {
          failed.push({ path: filePath, error: 'Import failed' })
        }
      } catch (error) {
        console.error('Failed to import:', filePath, error)
        failed.push({ path: filePath, error: error.message || 'Unknown error' })
      }
    }
    
    console.log(`Import complete: ${imported.length} successful, ${failed.length} failed`)
    
    return {
      imported,
      failed,
      success: imported.length,
      total: files.length
    }
  })

  ipcMain.handle('get-all-materials', async (event, filters) => {
    return databaseService.getAllMaterials(filters)
  })

  ipcMain.handle('search-materials', async (event, query) => {
    return databaseService.searchMaterials(query)
  })

  ipcMain.handle('update-material-note', async (event, id, note) => {
    return databaseService.updateMaterialNote(id, note)
  })

  ipcMain.handle('delete-material', async (event, id) => {
    const material = databaseService.getMaterialById(id)
    if (material) {
      fileService.deleteThumbnail(material.thumbnail_path)
    }
    return databaseService.deleteMaterial(id)
  })

  ipcMain.handle('get-material-thumbnail', async (event, id) => {
    return databaseService.getMaterialThumbnail(id)
  })

  ipcMain.handle('open-material-file', async (event, id) => {
    const material = databaseService.getMaterialById(id)
    if (material && material.file_path) {
      await shell.openPath(material.file_path)
      return true
    }
    return false
  })

  ipcMain.handle('rename-material', async (event, id, newFileName) => {
    console.log('Renaming material:', id, 'to', newFileName)
    return await fileService.renameMaterial(id, newFileName)
  })

  ipcMain.handle('batch-rename-materials', async (event, materialIds, options) => {
    console.log('Batch renaming', materialIds.length, 'materials with pattern:', options?.pattern)
    return await fileService.batchRenameMaterials(materialIds, options)
  })

  ipcMain.handle('preview-rename', async (event, materials, options) => {
    if (!Array.isArray(materials) || materials.length === 0) {
      return []
    }
    
    const preview = []
    for (let i = 0; i < materials.length; i++) {
      const material = materials[i]
      const index = options.startIndex ? (parseInt(options.startIndex) + i) : (i + 1)
      
      const newFileName = fileService.generateNewFileName(
        options.pattern,
        index,
        material.file_name,
        materials.length
      )
      
      preview.push({
        id: material.id,
        oldName: material.file_name,
        newName: newFileName
      })
    }
    
    return preview
  })

  ipcMain.handle('get-all-categories', async () => {
    return databaseService.getAllCategories()
  })

  ipcMain.handle('create-category', async (event, category) => {
    return databaseService.createCategory(category)
  })

  ipcMain.handle('update-category', async (event, id, category) => {
    return databaseService.updateCategory(id, category)
  })

  ipcMain.handle('delete-category', async (event, id) => {
    return databaseService.deleteCategory(id)
  })

  ipcMain.handle('get-all-tags', async () => {
    return databaseService.getAllTags()
  })

  ipcMain.handle('create-tag', async (event, tag) => {
    return databaseService.createTag(tag)
  })

  ipcMain.handle('update-tag', async (event, id, tag) => {
    return databaseService.updateTag(id, tag)
  })

  ipcMain.handle('delete-tag', async (event, id) => {
    return databaseService.deleteTag(id)
  })

  ipcMain.handle('add-tags-to-material', async (event, materialId, tagIds) => {
    return databaseService.addTagsToMaterial(materialId, tagIds)
  })

  ipcMain.handle('remove-tag-from-material', async (event, materialId, tagId) => {
    return databaseService.removeTagFromMaterial(materialId, tagId)
  })

  ipcMain.handle('get-material-tags', async (event, materialId) => {
    return databaseService.getMaterialTags(materialId)
  })

  ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url)
    return true
  })
}

module.exports = {
  registerAllHandlers
}
