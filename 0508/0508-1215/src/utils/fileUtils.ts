export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function getFilenameWithoutExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '')
}

export function formatDate(date: Date, format: string): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export function generateFilename(
  originalFilename: string,
  template: string,
  sequence: number,
  sequencePadding: number
): string {
  const name = getFilenameWithoutExtension(originalFilename)
  const ext = getFileExtension(originalFilename)
  const now = new Date()

  const paddedSequence = String(sequence).padStart(sequencePadding, '0')

  let newName = template
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{ext\}\}/g, ext)
    .replace(/\{\{seq\}\}/g, paddedSequence)
    .replace(/\{\{date(?:\|([^}]+))?\}\}/g, (_, format = 'YYYYMMDD') => formatDate(now, format))
    .replace(/\{\{time(?:\|([^}]+))?\}\}/g, (_, format = 'HHmmss') => formatDate(now, format))
    .replace(/\{\{datetime(?:\|([^}]+))?\}\}/g, (_, format = 'YYYYMMDD_HHmmss') => formatDate(now, format))

  if (!newName.includes('.')) {
    newName += '.' + ext
  }

  return newName
}

export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/png', 'image/jpeg', 'image/webp']
  return validTypes.includes(file.type)
}

export const templateVariables = [
  { key: '{{name}}', description: '原文件名（不含扩展名）' },
  { key: '{{ext}}', description: '原文件扩展名' },
  { key: '{{seq}}', description: '序号' },
  { key: '{{date}}', description: '日期 (YYYYMMDD)' },
  { key: '{{date|YYYY-MM-DD}}', description: '日期（自定义格式）' },
  { key: '{{time}}', description: '时间 (HHmmss)' },
  { key: '{{datetime}}', description: '日期时间 (YYYYMMDD_HHmmss)' }
]
