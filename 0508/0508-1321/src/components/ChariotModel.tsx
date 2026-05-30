import React, { useMemo } from 'react'
import * as THREE from 'three'

interface ChariotModelProps {
  type: 'light' | 'heavy'
}

const ChariotModel = React.memo(function ChariotModel({ type }: ChariotModelProps) {
  const config = useMemo(() => {
    if (type === 'heavy') {
      return {
        wheelRadius: 0.8,
        wheelPositions: [0.7, -0.7] as number[],
        wheelY: 0.8,
        axleLength: 1.4,
        carriageSize: [1.2, 0.35, 1.0] as [number, number, number],
        shaftLength: 3.0,
      }
    }
    return {
      wheelRadius: 0.7,
      wheelPositions: [0.55, -0.55] as number[],
      wheelY: 0.7,
      axleLength: 1.1,
      carriageSize: [1.0, 0.3, 0.8] as [number, number, number],
      shaftLength: 2.5,
    }
  }, [type])

  const woodMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#5C3A1E', metalness: 0.2, roughness: 0.8 }),
    [],
  )
  const carriageMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#8B6914', metalness: 0.2, roughness: 0.8 }),
    [],
  )
  const railingMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#6B4423', metalness: 0.2, roughness: 0.8 }),
    [],
  )
  const bronzeMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#B87333', metalness: 0.6, roughness: 0.4 }),
    [],
  )

  const spokeRotation = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => (Math.PI / 4) * i)
  }, [])

  const carriageY = config.wheelY + config.carriageSize[1] / 2
  const railingHeight = 0.25
  const railingY = carriageY + config.carriageSize[1] / 2 + railingHeight / 2

  return (
    <group>
      {config.wheelPositions.map((xPos, idx) => (
        <group key={idx} position={[xPos, config.wheelY, 0]}>
          <mesh material={bronzeMaterial}>
            <torusGeometry args={[config.wheelRadius, 0.04, 8, 32]} />
          </mesh>
          {spokeRotation.map((rot, si) => (
            <mesh
              key={si}
              position={[0, Math.cos(rot) * config.wheelRadius * 0.5, Math.sin(rot) * config.wheelRadius * 0.5]}
              rotation={[Math.PI / 2, 0, rot]}
              material={woodMaterial}
            >
              <cylinderGeometry args={[0.015, 0.015, config.wheelRadius * 0.9, 6]} />
            </mesh>
          ))}
          <mesh material={bronzeMaterial}>
            <cylinderGeometry args={[0.06, 0.06, 0.1, 12]} />
          </mesh>
        </group>
      ))}

      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, config.wheelY, 0]} material={woodMaterial}>
        <cylinderGeometry args={[0.04, 0.04, config.axleLength, 8]} />
      </mesh>

      <mesh position={[0, carriageY, 0]} material={carriageMaterial}>
        <boxGeometry args={config.carriageSize} />
      </mesh>

      <mesh
        position={[0, carriageY + config.carriageSize[1] / 2, -config.carriageSize[2] / 2]}
        material={railingMaterial}
      >
        <boxGeometry args={[config.carriageSize[0] + 0.05, railingHeight, 0.03]} />
      </mesh>
      <mesh
        position={[0, carriageY + config.carriageSize[1] / 2, config.carriageSize[2] / 2]}
        material={railingMaterial}
      >
        <boxGeometry args={[config.carriageSize[0] + 0.05, railingHeight, 0.03]} />
      </mesh>
      <mesh
        position={[-config.carriageSize[0] / 2, carriageY + config.carriageSize[1] / 2, 0]}
        material={railingMaterial}
      >
        <boxGeometry args={[0.03, railingHeight, config.carriageSize[2]]} />
      </mesh>
      <mesh
        position={[config.carriageSize[0] / 2, carriageY + config.carriageSize[1] / 2, 0]}
        material={railingMaterial}
      >
        <boxGeometry args={[0.03, railingHeight, config.carriageSize[2]]} />
      </mesh>

      <mesh
        position={[0, carriageY * 0.6, -config.shaftLength / 2 - config.carriageSize[2] / 2 + 0.1]}
        rotation={[-0.15, 0, 0]}
        material={woodMaterial}
      >
        <cylinderGeometry args={[0.035, 0.035, config.shaftLength, 8]} />
      </mesh>
    </group>
  )
})

export default ChariotModel
