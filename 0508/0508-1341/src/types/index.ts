export type DynastyName = '周' | '秦' | '汉' | '唐' | '宋' | '明' | '清'

export type UnitCategory = 'length' | 'capacity' | 'weight'

export type LengthUnit = '尺' | '寸' | '丈'
export type CapacityUnit = '升' | '斗' | '斛'
export type WeightUnit = '斤' | '两' | '铢'
export type AncientUnit = LengthUnit | CapacityUnit | WeightUnit

export interface DynastyMeasureData {
  dynasty: DynastyName
  period: string
  chiToCm: number
  shengToMl: number
  jinToG: number
}

export interface UnitRatio {
  toBase: number
  label: string
  modernUnit: string
}

export interface ArtifactDimension {
  label: string
  min: number
  max: number
  unit: string
}

export interface Artifact {
  id: string
  name: string
  dynasty: string
  category: string
  dimensions: ArtifactDimension[]
}

export interface ConversionInput {
  value: number
  unit: AncientUnit
  dynasty: DynastyName
}

export interface ConversionTarget {
  dynasty: DynastyName
  value: number
  unit: AncientUnit
}

export interface ConversionResult {
  input: ConversionInput
  modernValue: number
  modernUnit: string
  targets: ConversionTarget[]
}

export interface ArtifactEstimation {
  artifactId: string
  artifactName: string
  adjustedDimensions: { label: string; value: number; unit: string }[]
  dynastyValues: {
    dynasty: DynastyName
    dimensions: { label: string; chiValue: number; unit: string }[]
  }[]
}

export interface FavoriteItem {
  id: string
  type: 'conversion' | 'artifact'
  data: ConversionResult | ArtifactEstimation
  createdAt: number
}

export const DYNASTY_ORDER: DynastyName[] = ['周', '秦', '汉', '唐', '宋', '明', '清']

export const DYNASTY_PERIODS: Record<DynastyName, string> = {
  '周': '约前1046-前256年',
  '秦': '前221-前207年',
  '汉': '前202-220年',
  '唐': '618-907年',
  '宋': '960-1279年',
  '明': '1368-1644年',
  '清': '1644-1912年',
}

export const UNIT_RATIOS: Record<AncientUnit, UnitRatio> = {
  '丈': { toBase: 10, label: '1丈=10尺', modernUnit: 'cm' },
  '尺': { toBase: 1, label: '基本单位', modernUnit: 'cm' },
  '寸': { toBase: 0.1, label: '1尺=10寸', modernUnit: 'cm' },
  '斛': { toBase: 100, label: '1斛=100升', modernUnit: 'ml' },
  '斗': { toBase: 10, label: '1斗=10升', modernUnit: 'ml' },
  '升': { toBase: 1, label: '基本单位', modernUnit: 'ml' },
  '斤': { toBase: 1, label: '基本单位', modernUnit: 'g' },
  '两': { toBase: 1 / 16, label: '1斤=16两', modernUnit: 'g' },
  '铢': { toBase: 1 / 384, label: '1斤=384铢', modernUnit: 'g' },
}

export const UNIT_LABELS: Record<UnitCategory, { units: AncientUnit[]; modernUnit: string; baseUnit: AncientUnit }> = {
  length: { units: ['丈', '尺', '寸'], modernUnit: 'cm', baseUnit: '尺' },
  capacity: { units: ['斛', '斗', '升'], modernUnit: 'ml', baseUnit: '升' },
  weight: { units: ['斤', '两', '铢'], modernUnit: 'g', baseUnit: '斤' },
}

export function getCategoryForUnit(unit: AncientUnit): UnitCategory {
  if (['丈', '尺', '寸'].includes(unit)) return 'length'
  if (['斛', '斗', '升'].includes(unit)) return 'capacity'
  return 'weight'
}

export function getBaseUnitForCategory(category: UnitCategory): AncientUnit {
  return UNIT_LABELS[category].baseUnit
}
