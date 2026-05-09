const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: (options) => ipcRenderer.invoke('select-files', options),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  importMaterials: (files) => ipcRenderer.invoke('import-materials', files),
  getAllMaterials: (filters) => ipcRenderer.invoke('get-all-materials', filters),
  searchMaterials: (query) => ipcRenderer.invoke('search-materials', query),
  updateMaterialNote: (id, note) => ipcRenderer.invoke('update-material-note', id, note),
  deleteMaterial: (id) => ipcRenderer.invoke('delete-material', id),
  getMaterialThumbnail: (id) => ipcRenderer.invoke('get-material-thumbnail', id),
  openMaterialFile: (id) => ipcRenderer.invoke('open-material-file', id),
  renameMaterial: (id, newFileName) => ipcRenderer.invoke('rename-material', id, newFileName),
  batchRenameMaterials: (materialIds, options) => ipcRenderer.invoke('batch-rename-materials', materialIds, options),
  previewRename: (materials, options) => ipcRenderer.invoke('preview-rename', materials, options),
  
  getAllCategories: () => ipcRenderer.invoke('get-all-categories'),
  createCategory: (category) => ipcRenderer.invoke('create-category', category),
  updateCategory: (id, category) => ipcRenderer.invoke('update-category', id, category),
  deleteCategory: (id) => ipcRenderer.invoke('delete-category', id),
  
  getAllTags: () => ipcRenderer.invoke('get-all-tags'),
  createTag: (tag) => ipcRenderer.invoke('create-tag', tag),
  updateTag: (id, tag) => ipcRenderer.invoke('update-tag', id, tag),
  deleteTag: (id) => ipcRenderer.invoke('delete-tag', id),
  
  addTagsToMaterial: (materialId, tagIds) => ipcRenderer.invoke('add-tags-to-material', materialId, tagIds),
  removeTagFromMaterial: (materialId, tagId) => ipcRenderer.invoke('remove-tag-from-material', materialId, tagId),
  getMaterialTags: (materialId) => ipcRenderer.invoke('get-material-tags', materialId),
  
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
})
