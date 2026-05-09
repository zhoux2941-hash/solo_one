export interface Stock {
  code: string
  name: string
  market: 'sh' | 'sz' | 'hk' | 'us'
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  amount: number
  turnoverRate?: number
  pe?: number
  pb?: number
}

export interface KLineData {
  time: string
  open: number
  close: number
  high: number
  low: number
  volume: number
  amount?: number
}

export interface TimeLineData {
  time: string
  price: number
  avgPrice: number
  volume: number
  amount: number
  preClose: number
}

export interface User {
  id: number
  username: string
  email?: string
  createdAt: string
}

export interface WatchlistGroup {
  id: number
  name: string
  stocks: Stock[]
  userId: number
  createdAt: string
}

export interface PriceAlert {
  id: number
  stockCode: string
  stockName: string
  targetPrice: number
  type: 'above' | 'below'
  isTriggered: boolean
  userId: number
  createdAt: string
}

export interface MarketData {
  stocks: Stock[]
  timestamp: number
}

export type KLineType = 'day' | 'week' | 'month'

export type MovingAverage = 5 | 10 | 20 | 30

export interface ChartSettings {
  kLineType: KLineType
  maTypes: MovingAverage[]
  showVolume: boolean
}

export interface FilterCondition {
  field: string
  operator: string
  value: number
  value2?: number
}

export interface ScreenStrategy {
  id: number
  name: string
  description?: string
  conditions: FilterCondition[]
  isDefault: boolean
  userId: number
  createdAt: string
}

export interface ScreenResult {
  stock: Stock
  matchScore: number
  matched: string[]
}

export interface ScreenMetaField {
  value: string
  label: string
  unit: string
}

export interface ScreenMetaOperator {
  value: string
  label: string
  needTwoValues: boolean
}

export interface ScreenMetaMarket {
  value: string
  label: string
}

export interface ScreenPreset {
  name: string
  description: string
  conditions: FilterCondition[]
}

export interface ScreenMeta {
  fields: ScreenMetaField[]
  operators: ScreenMetaOperator[]
  markets: ScreenMetaMarket[]
  presets: ScreenPreset[]
}
