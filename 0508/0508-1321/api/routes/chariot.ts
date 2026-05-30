import { Router, type Request, type Response } from 'express'
import {
  getChariotTypes,
  getHarnessParts,
  getHarnessTypes,
  getTerrainTypes,
  getChariotTypeById,
  getHarnessTypeById,
  getTerrainTypeById,
} from '../db.js'

const router = Router()

router.get('/chariot-types', (_req: Request, res: Response): void => {
  res.json(getChariotTypes())
})

router.get('/harness-parts', (_req: Request, res: Response): void => {
  res.json(getHarnessParts())
})

router.get('/harness-types', (_req: Request, res: Response): void => {
  res.json(getHarnessTypes())
})

router.get('/terrain-types', (_req: Request, res: Response): void => {
  res.json(getTerrainTypes())
})

router.post('/calculate', (req: Request, res: Response): void => {
  const { chariotType, horseCount, harnessType, terrainType, placements } = req.body as {
    chariotType: string
    horseCount: number
    harnessType: string
    terrainType: string
    placements: Array<{ partId: string; correct: boolean }>
  }

  const correctPlacements = placements.filter(p => p.correct).length
  const chariot = getChariotTypeById(chariotType)
  if (!chariot) {
    res.status(400).json({ success: false, error: 'Invalid chariot type' })
    return
  }

  const harnessTypeRow = getHarnessTypeById(harnessType)
  if (!harnessTypeRow) {
    res.status(400).json({ success: false, error: 'Invalid harness type' })
    return
  }

  const terrain = getTerrainTypeById(terrainType || 'flat')
  if (!terrain) {
    res.status(400).json({ success: false, error: 'Invalid terrain type' })
    return
  }

  const totalWeight = chariot.weight + chariot.crewCount * 70
  const placementRatio = correctPlacements / 4

  const totalPullForce = harnessTypeRow.pullForcePerHorse * horseCount
  const harnessEfficiency = harnessTypeRow.efficiencyCoeff
  const breathEfficiency = harnessTypeRow.breathCoeff
  const overallEfficiency = harnessEfficiency * breathEfficiency * placementRatio
  const effectivePullForce = totalPullForce * overallEfficiency
  const rollingResistance = totalWeight * terrain.resistanceCoeff
  const netPullForce = Math.max(effectivePullForce - rollingResistance, 0)
  const terrainFlexPenalty = terrain.resistanceCoeff < 0.1 ? 1.0 : terrain.resistanceCoeff < 0.2 ? 0.85 : 0.65
  const turnFlexScore = harnessTypeRow.turnFlexBase * (horseCount === 2 ? 1.2 : 0.8) * placementRatio * terrainFlexPenalty

  const forceVectors = []
  const horsePositions = horseCount === 2
    ? [[-0.4, 0, -2.5], [0.4, 0, -2.5]]
    : [[-0.8, 0, -2.5], [-0.4, 0, -2.5], [0.4, 0, -2.5], [0.8, 0, -2.5]]

  for (let i = 0; i < horseCount; i++) {
    const pos = horsePositions[i]
    const force = netPullForce / horseCount
    forceVectors.push({
      x: pos[0],
      y: pos[1] + 1.2,
      z: pos[2] + 1.0,
      magnitude: force,
      label: `马${i + 1}`,
    })
  }

  if (rollingResistance > 0) {
    forceVectors.push({
      x: 0,
      y: 0.4,
      z: 0,
      magnitude: rollingResistance,
      label: '地形阻力',
    })
  }

  res.json({
    totalPullForce,
    effectivePullForce,
    rollingResistance,
    netPullForce,
    harnessEfficiency,
    breathEfficiency,
    overallEfficiency,
    turnFlexScore,
    forceVectors,
  })
})

export default router
