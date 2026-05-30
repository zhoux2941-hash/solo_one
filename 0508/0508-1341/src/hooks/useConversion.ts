import { dynastyMeasures } from '@/data/dynastyUnits'
import type { DynastyName, AncientUnit, UnitCategory, ConversionResult, ConversionTarget } from '@/types'
import { DYNASTY_ORDER, UNIT_RATIOS, getCategoryForUnit } from '@/types'

function getBaseModernValue(dynasty: DynastyName, category: UnitCategory): number {
  const data = dynastyMeasures.find(d => d.dynasty === dynasty)
  if (!data) return 0
  switch (category) {
    case 'length': return data.chiToCm
    case 'capacity': return data.shengToMl
    case 'weight': return data.jinToG
  }
}

function toModern(value: number, unit: AncientUnit, dynasty: DynastyName): number {
  const category = getCategoryForUnit(unit)
  const ratio = UNIT_RATIOS[unit]
  const baseValue = value * ratio.toBase
  const baseModern = getBaseModernValue(dynasty, category)
  return baseValue * baseModern
}

function fromModern(modernValue: number, unit: AncientUnit, dynasty: DynastyName): number {
  const category = getCategoryForUnit(unit)
  const baseModern = getBaseModernValue(dynasty, category)
  if (baseModern === 0) return 0
  const ratio = UNIT_RATIOS[unit]
  const baseValue = modernValue / baseModern
  return baseValue / ratio.toBase
}

export function convertUnit(
  value: number,
  unit: AncientUnit,
  sourceDynasty: DynastyName,
  targetDynasties?: DynastyName[]
): ConversionResult {
  const category = getCategoryForUnit(unit)
  const modernUnit = UNIT_RATIOS[unit].modernUnit
  const modernValue = toModern(value, unit, sourceDynasty)

  const targets: ConversionTarget[] = (targetDynasties || DYNASTY_ORDER.filter(d => d !== sourceDynasty)).map(dynasty => {
    const targetValue = fromModern(modernValue, unit, dynasty)
    return { dynasty, value: Math.round(targetValue * 100) / 100, unit }
  })

  return {
    input: { value, unit, dynasty: sourceDynasty },
    modernValue: Math.round(modernValue * 100) / 100,
    modernUnit,
    targets,
  }
}

export function cmToAncient(cm: number, dynasty: DynastyName): number {
  const baseModern = getBaseModernValue(dynasty, 'length')
  if (baseModern === 0) return 0
  return Math.round((cm / baseModern) * 100) / 100
}

export function mlToAncient(ml: number, dynasty: DynastyName): number {
  const baseModern = getBaseModernValue(dynasty, 'capacity')
  if (baseModern === 0) return 0
  return Math.round((ml / baseModern) * 100) / 100
}

export function gToAncient(g: number, dynasty: DynastyName): number {
  const baseModern = getBaseModernValue(dynasty, 'weight')
  if (baseModern === 0) return 0
  return Math.round((g / baseModern) * 100) / 100
}

export function getUnitModernValue(dynasty: DynastyName, unit: AncientUnit): number {
  return toModern(1, unit, dynasty)
}
