import type { ECGDataPoint } from '@/types/ecg'

export function parseECGCSV(content: string): ECGDataPoint[] | null {
  try {
    const lines = content.trim().split('\n')
    if (lines.length < 2) {
      return null
    }

    const headerLine = lines[0]
    const headers = headerLine.split(',').map((h) => h.trim().toLowerCase())

    const timeIdx = headers.findIndex((h) => h.includes('time') || h.includes('时间'))
    const voltageIdx = headers.findIndex((h) => h.includes('voltage') || h.includes('电压') || h.includes('ecg'))

    if (timeIdx === -1 || voltageIdx === -1) {
      return null
    }

    const data: ECGDataPoint[] = []
    let baseTime = -1

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim())
      if (values.length < Math.max(timeIdx, voltageIdx) + 1) {
        continue
      }

      const time = parseFloat(values[timeIdx])
      const voltage = parseFloat(values[voltageIdx])

      if (isNaN(time) || isNaN(voltage)) {
        continue
      }

      if (baseTime === -1) {
        baseTime = time
      }

      data.push({
        time: time - baseTime,
        voltage,
      })
    }

    return data.length > 0 ? data : null
  } catch {
    return null
  }
}
