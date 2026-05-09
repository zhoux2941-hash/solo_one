import type { KLineData, TimeLineData } from '../types'

export function calculateMA(data: KLineData[], period: number): (number | null)[] {
  const result: (number | null)[] = []
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else {
      let sum = 0
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close
      }
      result.push(Number((sum / period).toFixed(2)))
    }
  }
  
  return result
}

export function formatNumber(num: number, decimals: number = 2): string {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿'
  } else if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万'
  }
  return num.toFixed(decimals)
}

export function formatVolume(volume: number): string {
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(2) + '亿股'
  } else if (volume >= 10000) {
    return (volume / 10000).toFixed(2) + '万股'
  }
  return volume.toFixed(0) + '股'
}

export function formatAmount(amount: number): string {
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿'
  } else if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
  return amount.toFixed(0)
}

export function getTimeLinePercent(data: TimeLineData[]): { time: string; percent: number; price: number }[] {
  if (data.length === 0) return []
  
  const preClose = data[0].preClose
  return data.map(d => ({
    time: d.time,
    percent: ((d.price - preClose) / preClose * 100),
    price: d.price
  }))
}

export function parseMarketCode(code: string): { code: string; market: string } {
  if (code.startsWith('sh') || code.startsWith('sz') || code.startsWith('hk') || code.startsWith('us')) {
    return {
      market: code.substring(0, 2),
      code: code.substring(2)
    }
  }
  
  if (code.startsWith('6')) {
    return { market: 'sh', code: 'sh' + code }
  }
  if (code.startsWith('0') || code.startsWith('3')) {
    return { market: 'sz', code: 'sz' + code }
  }
  
  return { market: 'sh', code: 'sh' + code }
}
