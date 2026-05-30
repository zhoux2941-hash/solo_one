import type { Dynasty } from '@/types'

export const dynasties: Dynasty[] = [
  { id: 'han', name: '汉', period: '西汉', yearRange: [-202, 220], color: '#8B4513' },
  { id: 'tang', name: '唐', period: '唐', yearRange: [618, 907], color: '#C73E3A' },
  { id: 'song', name: '宋', period: '北宋', yearRange: [960, 1279], color: '#2B5B84' },
  { id: 'yuan', name: '元', period: '元', yearRange: [1271, 1368], color: '#4A7C59' },
  { id: 'ming', name: '明', period: '明', yearRange: [1368, 1644], color: '#8B6914' },
  { id: 'qing', name: '清', period: '清', yearRange: [1644, 1912], color: '#5B3A6B' },
]

export const dynastyMap = Object.fromEntries(dynasties.map(d => [d.id, d]))
