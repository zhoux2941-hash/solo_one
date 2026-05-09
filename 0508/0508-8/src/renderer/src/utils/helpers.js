export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getFileIcon(fileType) {
  const icons = {
    image: '🖼️',
    audio: '🎵',
    document: '📄',
    other: '📁'
  }
  return icons[fileType] || icons.other
}

export function getFileTypeLabel(fileType) {
  const labels = {
    image: '图片',
    audio: '音频',
    document: '文档',
    other: '其他'
  }
  return labels[fileType] || '其他'
}

export function pathToFileURL(filePath) {
  if (!filePath) return ''
  
  const normalizedPath = filePath.replace(/\\/g, '/')
  const pathParts = normalizedPath.split('/')
  const encodedParts = pathParts.map((part, index) => {
    if (index === 0 && part.includes(':')) {
      return part
    }
    return encodeURIComponent(part).replace(/%2F/g, '/').replace(/%5C/g, '/')
  })
  
  const encodedPath = encodedParts.join('/')
  return `file:///${encodedPath}`
}

export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
