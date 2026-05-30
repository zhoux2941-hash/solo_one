import type { CalculationResult, ChariotType, HarnessType, TerrainType, HarnessPlacement } from '../../shared/types'

export interface CsvReportData {
  chariotType: ChariotType
  harnessType: HarnessType
  terrainType: TerrainType
  horseCount: number
  placements: HarnessPlacement[]
  calculationResult: CalculationResult
}

export function generateCsvReport(data: CsvReportData): string {
  const { chariotType, harnessType, terrainType, horseCount, placements, calculationResult } = data
  const correctPlacements = placements.filter(p => p.correct).length

  const rows: string[] = []

  rows.push('古代战车挽具结构模拟 - 力学分析报告')
  rows.push(`生成日期,${new Date().toLocaleString('zh-CN')}`)
  rows.push('')
  rows.push('=== 基本配置 ===')
  rows.push('项目,数值,单位')
  rows.push(`战车类型,${chariotType.name},`)
  rows.push(`马匹数量,${horseCount},匹`)
  rows.push(`系驾方式,${harnessType.name},`)
  rows.push(`地形,${terrainType.name},`)
  rows.push('')

  rows.push('=== 战车参数 ===')
  rows.push('参数,数值,单位')
  rows.push(`轮径,${chariotType.wheelDiameter},米`)
  rows.push(`轴距,${chariotType.axleDistance},米`)
  rows.push(`车厢宽,${chariotType.carriageWidth},米`)
  rows.push(`车重,${chariotType.weight},公斤`)
  rows.push(`乘员数,${chariotType.crewCount},人`)
  rows.push(`总重量(含乘员),${(chariotType.weight + chariotType.crewCount * 70).toFixed(1)},公斤`)
  rows.push('')

  rows.push('=== 系驾方式参数 ===')
  rows.push('参数,数值,单位')
  rows.push(`单马标称拉力,${harnessType.pullForcePerHorse},公斤力`)
  rows.push(`系驾效率系数,${harnessType.efficiencyCoeff},`)
  rows.push(`呼吸系数,${harnessType.breathCoeff},`)
  rows.push(`转弯灵活性基准,${harnessType.turnFlexBase},/10`)
  rows.push('')

  rows.push('=== 地形参数 ===')
  rows.push('参数,数值,单位')
  rows.push(`地形名称,${terrainType.name},`)
  rows.push(`滚动阻力系数,${terrainType.resistanceCoeff},`)
  rows.push(`地形描述,${terrainType.description},`)
  rows.push('')

  rows.push('=== 挽具匹配 ===')
  rows.push('部件,目标位置,是否正确')
  const partNames: Record<string, string> = {
    belt: '皮带',
    yoke: '轭',
    trace: '靷',
    bridle: '勒',
  }
  const targetNames: Record<string, string> = {
    neck: '马颈/胸部',
    shoulder: '马肩部',
    flank: '轭两侧',
    head: '马头部',
  }
  placements.forEach(p => {
    rows.push(`${partNames[p.partId] || p.partId},${targetNames[p.partId] || '-'},${p.correct ? '是' : '否'}`)
  })
  rows.push(`正确匹配数,${correctPlacements}/4,`)
  rows.push(`匹配正确率,${((correctPlacements / 4) * 100).toFixed(0)}%,`)
  rows.push('')

  rows.push('=== 力学分析结果 ===')
  rows.push('指标,数值,单位')
  rows.push(`总拉力,${calculationResult.totalPullForce.toFixed(1)},公斤力`)
  rows.push(`有效拉力,${calculationResult.effectivePullForce.toFixed(1)},公斤力`)
  rows.push(`滚动阻力,${calculationResult.rollingResistance.toFixed(1)},公斤力`)
  rows.push(`净拉力,${calculationResult.netPullForce.toFixed(1)},公斤力`)
  rows.push(`系驾效率,${(calculationResult.harnessEfficiency * 100).toFixed(0)},%`)
  rows.push(`呼吸效率,${(calculationResult.breathEfficiency * 100).toFixed(0)},%`)
  rows.push(`综合效率,${(calculationResult.overallEfficiency * 100).toFixed(0)},%`)
  rows.push(`转弯灵活性评分,${calculationResult.turnFlexScore.toFixed(1)},/10`)
  rows.push('')

  rows.push('=== 受力向量详情 ===')
  rows.push('序号,受力点,X坐标,Y坐标,Z坐标,大小,标签')
  calculationResult.forceVectors.forEach((vec, idx) => {
    rows.push(`${idx + 1},${vec.label},${vec.x.toFixed(2)},${vec.y.toFixed(2)},${vec.z.toFixed(2)},${vec.magnitude.toFixed(2)},公斤力`)
  })
  rows.push('')

  rows.push('=== 效率分析 ===')
  rows.push('分析项,结果,说明')
  const canMove = calculationResult.netPullForce > 0
  const efficiencyRating = calculationResult.overallEfficiency >= 0.7 ? '优秀' : calculationResult.overallEfficiency >= 0.5 ? '良好' : calculationResult.overallEfficiency >= 0.3 ? '一般' : '较差'
  const turnRating = calculationResult.turnFlexScore >= 7 ? '优秀' : calculationResult.turnFlexScore >= 5 ? '良好' : calculationResult.turnFlexScore >= 3 ? '一般' : '较差'
  rows.push(`能否移动,${canMove ? '是' : '否'},${canMove ? '净拉力大于零，可正常行驶' : '净拉力小于等于零，无法移动'}`)
  rows.push(`综合效率评级,${efficiencyRating},`)
  rows.push(`转弯灵活性评级,${turnRating},`)
  rows.push(`系驾方式对比,${harnessType.id === 'chestband' ? '胸带式优势明显' : '颈带式效率较低'},`)
  rows.push(`地形影响等级,${terrainType.id === 'flat' ? '小' : terrainType.id === 'slope' ? '中' : '大'},`)
  rows.push('')

  rows.push('=== 数据来源 ===')
  rows.push('参考资料,《考工记》')
  rows.push('数据说明,本模拟基于考古研究资料，数值为估算值，仅供参考')
  rows.push('')

  return rows.join('\n')
}

export function downloadCsv(csvContent: string, filename: string = '战车力学分析报告.csv'): void {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
