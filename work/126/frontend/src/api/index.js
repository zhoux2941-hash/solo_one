import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const pointCloudApi = {
  upload: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/pointcloud/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  initChunkedUpload: (fileName, fileSize, chunkSize = 50 * 1024 * 1024) => {
    const formData = new FormData()
    formData.append('file_name', fileName)
    formData.append('file_size', fileSize.toString())
    formData.append('chunk_size', chunkSize.toString())
    return api.post('/pointcloud/chunked/init', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  uploadChunk: (uploadId, chunkIndex, chunkData, chunkHash = null) => {
    const formData = new FormData()
    formData.append('upload_id', uploadId)
    formData.append('chunk_index', chunkIndex.toString())
    formData.append('chunk_data', chunkData)
    if (chunkHash) {
      formData.append('chunk_hash', chunkHash)
    }
    return api.post('/pointcloud/chunked/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  getChunkedUploadStatus: (uploadId) => 
    api.get(`/pointcloud/chunked/status/${uploadId}`),
  
  completeChunkedUpload: (uploadId) => 
    api.post(`/pointcloud/chunked/complete/${uploadId}`),
  
  cancelChunkedUpload: (uploadId) => 
    api.post(`/pointcloud/chunked/cancel/${uploadId}`),
  
  getInfo: (id) => api.get(`/pointcloud/${id}`),
  
  getLodLevels: (id) => api.get(`/pointcloud/${id}/lod`),
  
  downloadLod: (id, lodLevel) => api.get(`/pointcloud/${id}/lod/${lodLevel}`, {
    responseType: 'blob'
  }),
  
  download: (id) => api.get(`/pointcloud/${id}/download`, {
    responseType: 'blob'
  }),
  
  detectHoles: (id, threshold = 0.3, useOptimized = true) => 
    api.get(`/pointcloud/${id}/detect-holes`, {
      params: { threshold, use_optimized: useOptimized }
    }),
  
  generateLod: (id) => 
    api.post(`/pointcloud/${id}/generate-lod`),
  
  list: (skip = 0, limit = 100) => 
    api.get('/pointcloud/list', { params: { skip, limit } })
}

export const ballisticApi = {
  analyze: (data) => api.post('/ballistic/analyze', data),
  
  calculateAirDensity: (envParams) => 
    api.post('/ballistic/calculate-air-density', envParams),
  
  getAnalysis: (id) => api.get(`/ballistic/${id}`),
  
  list: (skip = 0, limit = 100) => 
    api.get('/ballistic/list', { params: { skip, limit } }),
  
  delete: (id) => api.delete(`/ballistic/${id}`)
}

export const reportApi = {
  generate: (data) => api.post('/reports/generate', data),
  
  download: (id) => api.get(`/reports/${id}`, {
    responseType: 'blob'
  }),
  
  getByAnalysis: (analysisId) => 
    api.get(`/reports/analysis/${analysisId}`),
  
  delete: (id) => api.delete(`/reports/${id}`)
}

export const fileUtils = {
  calculateMD5: async (file) => {
    return null
  },
  
  readFileAsBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  },
  
  getFileBlob: (file, start, end) => {
    return file.slice(start, end)
  }
}

export const cartridgeApi = {
  createSample: (data) => api.post('/cartridge/samples', data),
  
  getSamples: (skip = 0, limit = 100) => 
    api.get('/cartridge/samples', { params: { skip, limit } }),
  
  getSample: (id) => api.get(`/cartridge/samples/${id}`),
  
  updateSample: (id, data) => api.put(`/cartridge/samples/${id}`, data),
  
  deleteSample: (id) => api.delete(`/cartridge/samples/${id}`),
  
  uploadSampleImage: (sampleId, file, imageType = 'primer') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('image_type', imageType)
    return api.post(`/cartridge/samples/${sampleId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  getSampleImages: (sampleId) => api.get(`/cartridge/samples/${sampleId}/images`),
  
  uploadQueryImage: (file, imageType = 'primer') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('image_type', imageType)
    return api.post('/cartridge/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  getImage: (imageId, thumbnail = false) => 
    api.get(`/cartridge/images/${imageId}`, {
      params: { thumbnail },
      responseType: 'blob'
    }),
  
  getImageFeatures: (imageId) => api.get(`/cartridge/images/${imageId}/features`),
  
  deleteImage: (imageId) => api.delete(`/cartridge/images/${imageId}`),
  
  compareWithDatabase: (imageId, topN = 5, sampleId = null) => 
    api.post(`/cartridge/compare/${imageId}`, null, {
      params: { top_n: topN, sample_id: sampleId }
    }),
  
  getComparison: (comparisonId) => api.get(`/cartridge/comparisons/${comparisonId}`),
  
  compareDirect: (image1Id, image2Id) => 
    api.post('/cartridge/compare/direct', null, {
      params: { image1_id: image1Id, image2_id: image2Id }
    })
}

export default api
