const api = window.electronAPI || {}

export const fileApi = {
  selectFiles: (options) => api.selectFiles?.(options) || Promise.resolve([]),
  selectDirectory: () => api.selectDirectory?.() || Promise.resolve(null)
}

export const materialApi = {
  importMaterials: (files) => api.importMaterials?.(files) || Promise.resolve([]),
  getAllMaterials: (filters) => api.getAllMaterials?.(filters) || Promise.resolve([]),
  searchMaterials: (query) => api.searchMaterials?.(query) || Promise.resolve([]),
  updateMaterialNote: (id, note) => api.updateMaterialNote?.(id, note) || Promise.resolve(null),
  deleteMaterial: (id) => api.deleteMaterial?.(id) || Promise.resolve(null),
  getMaterialThumbnail: (id) => api.getMaterialThumbnail?.(id) || Promise.resolve(null),
  openMaterialFile: (id) => api.openMaterialFile?.(id) || Promise.resolve(false),
  renameMaterial: (id, newFileName) => api.renameMaterial?.(id, newFileName) || Promise.resolve({ success: false, error: 'API not available' }),
  batchRenameMaterials: (materialIds, options) => api.batchRenameMaterials?.(materialIds, options) || Promise.resolve({ success: [], failed: [], count: 0 }),
  previewRename: (materials, options) => api.previewRename?.(materials, options) || Promise.resolve([])
}

export const categoryApi = {
  getAll: () => api.getAllCategories?.() || Promise.resolve([]),
  create: (category) => api.createCategory?.(category) || Promise.resolve(null),
  update: (id, category) => api.updateCategory?.(id, category) || Promise.resolve(null),
  delete: (id) => api.deleteCategory?.(id) || Promise.resolve(null)
}

export const tagApi = {
  getAll: () => api.getAllTags?.() || Promise.resolve([]),
  create: (tag) => api.createTag?.(tag) || Promise.resolve(null),
  update: (id, tag) => api.updateTag?.(id, tag) || Promise.resolve(null),
  delete: (id) => api.deleteTag?.(id) || Promise.resolve(null)
}

export const materialTagApi = {
  addTags: (materialId, tagIds) => api.addTagsToMaterial?.(materialId, tagIds) || Promise.resolve([]),
  removeTag: (materialId, tagId) => api.removeTagFromMaterial?.(materialId, tagId) || Promise.resolve(null),
  getByMaterial: (materialId) => api.getMaterialTags?.(materialId) || Promise.resolve([])
}

export const openExternal = (url) => api.openExternal?.(url) || Promise.resolve(false)

export default {
  fileApi,
  materialApi,
  categoryApi,
  tagApi,
  materialTagApi,
  openExternal
}
