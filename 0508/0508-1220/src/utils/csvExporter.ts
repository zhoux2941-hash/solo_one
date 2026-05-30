import type { ECGDataPoint } from '@/types/ecg'

export function exportToCSV(data: ECGDataPoint[]): string {
  const header = 'Time (s),Voltage (mV)'
  const rows = data.map((point) => `${point.time.toFixed(6)},${point.voltage.toFixed(6)}`)
  return [header, ...rows].join('\n')
}

export function downloadCSV(data: ECGDataPoint[], filename = 'ecg_data.csv'): void {
  const csvContent = exportToCSV(data)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
