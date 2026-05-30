export interface ChariotType {
  id: string
  name: string
  wheelDiameter: number
  axleDistance: number
  carriageWidth: number
  weight: number
  crewCount: number
}

export interface HarnessPart {
  id: string
  name: string
  description: string
  targetType: string
  position: { x: number; y: number; z: number }
}

export interface HarnessType {
  id: string
  name: string
  pullForcePerHorse: number
  efficiencyCoeff: number
  breathCoeff: number
  turnFlexBase: number
}

export interface TerrainType {
  id: string
  name: string
  resistanceCoeff: number
  description: string
  groundColor: string
}

const chariotTypes: ChariotType[] = [
  { id: 'light', name: '轻战车', wheelDiameter: 1.4, axleDistance: 2.0, carriageWidth: 1.0, weight: 60, crewCount: 3 },
  { id: 'heavy', name: '重战车', wheelDiameter: 1.6, axleDistance: 2.4, carriageWidth: 1.3, weight: 90, crewCount: 3 },
]

const harnessParts: HarnessPart[] = [
  { id: 'belt', name: '皮带', description: '连接马颈/胸部至车辕，传递拉力', targetType: 'neck', position: { x: 0.0, y: 1.2, z: -1.5 } },
  { id: 'yoke', name: '轭', description: '置于马颈/肩部，连接靷绳，分散受力', targetType: 'shoulder', position: { x: 0.0, y: 1.4, z: -1.2 } },
  { id: 'trace', name: '靷', description: '从轭两侧至车轴，提供主力牵引', targetType: 'flank', position: { x: 0.8, y: 0.8, z: -0.5 } },
  { id: 'bridle', name: '勒', description: '套于马头部，用于控制方向', targetType: 'head', position: { x: 0.0, y: 1.8, z: -2.0 } },
]

const harnessTypes: HarnessType[] = [
  { id: 'neckband', name: '颈带式', pullForcePerHorse: 45, efficiencyCoeff: 0.7, breathCoeff: 0.65, turnFlexBase: 5 },
  { id: 'chestband', name: '胸带式', pullForcePerHorse: 70, efficiencyCoeff: 0.85, breathCoeff: 0.9, turnFlexBase: 7 },
]

const terrainTypes: TerrainType[] = [
  { id: 'flat', name: '平地', resistanceCoeff: 0.05, description: '坚实平地，车轮滚动阻力最小', groundColor: '#4A5A3A' },
  { id: 'slope', name: '坡地', resistanceCoeff: 0.15, description: '上坡地形，需克服重力沿坡分量', groundColor: '#5A4A3A' },
  { id: 'mud', name: '泥地', resistanceCoeff: 0.25, description: '松软泥地，车轮下陷阻力极大', groundColor: '#3A3A2A' },
]

export function getChariotTypes(): ChariotType[] {
  return chariotTypes
}

export function getHarnessParts(): HarnessPart[] {
  return harnessParts
}

export function getHarnessTypes(): HarnessType[] {
  return harnessTypes
}

export function getTerrainTypes(): TerrainType[] {
  return terrainTypes
}

export function getChariotTypeById(id: string): ChariotType | undefined {
  return chariotTypes.find(c => c.id === id)
}

export function getHarnessTypeById(id: string): HarnessType | undefined {
  return harnessTypes.find(h => h.id === id)
}

export function getTerrainTypeById(id: string): TerrainType | undefined {
  return terrainTypes.find(t => t.id === id)
}

export async function initDB() {
  console.log('In-memory database initialized')
}

