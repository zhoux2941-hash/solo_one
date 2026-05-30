import React, { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { useChariotStore } from '../store/useChariotStore'
import ChariotModel from './ChariotModel'
import HorseModel from './HorseModel'
import ForceArrows from './ForceArrows'

function SceneContent() {
  const selectedChariotType = useChariotStore((s) => s.selectedChariotType)
  const horseCount = useChariotStore((s) => s.horseCount)
  const selectedTerrainType = useChariotStore((s) => s.selectedTerrainType)
  const terrainTypes = useChariotStore((s) => s.terrainTypes)
  const calculationResult = useChariotStore((s) => s.calculationResult)

  const terrainColors: Record<string, { grid: string; ground: string }> = {
    flat: { grid: '#4A5A3A', ground: '#3A4A2A' },
    slope: { grid: '#5A4A3A', ground: '#4A3A2A' },
    mud: { grid: '#3A3A2A', ground: '#2A2A1A' },
  }

  const terrainColor = terrainColors[selectedTerrainType] || terrainColors.flat

  const horsePositions = useMemo(() => {
    if (horseCount === 4) {
      return [
        [-0.8, 0, -2.5] as [number, number, number],
        [-0.4, 0, -2.5] as [number, number, number],
        [0.4, 0, -2.5] as [number, number, number],
        [0.8, 0, -2.5] as [number, number, number],
      ]
    }
    return [
      [-0.4, 0, -2.5] as [number, number, number],
      [0.4, 0, -2.5] as [number, number, number],
    ]
  }, [horseCount])

  const chariotType = selectedChariotType === 'heavy' ? 'heavy' : 'light'

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} color="#FFF5E1" />

      <Grid
        position={[0, -0.01, 0]}
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor={terrainColor.grid}
        sectionSize={2}
        sectionThickness={1}
        sectionColor={terrainColor.ground}
        fadeDistance={15}
        fadeStrength={1}
        infiniteGrid
      />

      <ChariotModel type={chariotType} />

      {horsePositions.map((pos, i) => (
        <HorseModel key={i} position={pos} index={i} />
      ))}

      {calculationResult?.forceVectors && calculationResult.forceVectors.length > 0 && (
        <ForceArrows vectors={calculationResult.forceVectors} />
      )}

      <OrbitControls />
    </>
  )
}

const ChariotScene = React.memo(function ChariotScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [3, 3, 5], fov: 50 }}
        style={{ background: '#1A1A2E' }}
      >
        <SceneContent />
      </Canvas>
    </div>
  )
})

export default ChariotScene
