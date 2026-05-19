import request from '@/utils/request'

export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/files/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const batchUploadFiles = (files) => {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })
  return request({
    url: '/files/batch-upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const deleteFile = (fileUrl) => {
  return request({
    url: '/files/delete',
    method: 'delete',
    params: { fileUrl }
  })
}

export const getProductList = () => {
  return request({
    url: '/products',
    method: 'get'
  })
}

export const getProductDetail = (id) => {
  return request({
    url: `/products/${id}`,
    method: 'get'
  })
}

export const createProduct = (data) => {
  return request({
    url: '/products',
    method: 'post',
    data
  })
}

export const updateProduct = (id, data) => {
  return request({
    url: `/products/${id}`,
    method: 'put',
    data
  })
}

export const deleteProduct = (id) => {
  return request({
    url: `/products/${id}`,
    method: 'delete'
  })
}

export const batchImportProducts = (data) => {
  return request({
    url: '/products/batch-import',
    method: 'post',
    data
  })
}

export const getCategoryList = () => {
  return request({
    url: '/categories',
    method: 'get'
  })
}

export const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  if (url.startsWith('/uploads/')) {
    return url
  }
  return `/api${url}`
}
