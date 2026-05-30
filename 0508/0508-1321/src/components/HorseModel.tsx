import React, { useMemo } from 'react'
import * as THREE from 'three'

interface HorseModelProps {
  position: [number, number, number]
  index: number
}

const HorseModel = React.memo(function HorseModel({ position, index }: HorseModelProps) {
  const bodyMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#8B4513', metalness: 0.1, roughness: 0.9 }),
    [],
  )
  const darkMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#6B3410', metalness: 0.1, roughness: 0.9 }),
    [],
  )
  const maneMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#2C1810', metalness: 0.1, roughness: 0.9 }),
    [],
  )

  const flipX = index % 2 === 0 ? 1 : -1

  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} material={bodyMaterial}>
        <boxGeometry args={[0.3, 0.4, 0.8]} />
      </mesh>

      <mesh position={[0, 0.95, -0.3]} rotation={[-0.4, 0, 0]} material={darkMaterial}>
        <boxGeometry args={[0.15, 0.15, 0.3]} />
      </mesh>

      <mesh position={[0, 0.85, -0.18]} rotation={[-0.3, 0, 0]} material={bodyMaterial}>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
      </mesh>

      <mesh position={[-0.08, 0.2, 0.2]} material={darkMaterial}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 6]} />
      </mesh>
      <mesh position={[0.08, 0.2, 0.2]} material={darkMaterial}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 6]} />
      </mesh>
      <mesh position={[-0.08, 0.2, -0.2]} material={darkMaterial}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 6]} />
      </mesh>
      <mesh position={[0.08, 0.2, -0.2]} material={darkMaterial}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 6]} />
      </mesh>

      <mesh position={[0, 0.5, 0.45]} rotation={[0.3, 0, 0]} material={maneMaterial}>
        <boxGeometry args={[0.04, 0.3, 0.06]} />
      </mesh>

      <mesh position={[0, 0.95, -0.22]} rotation={[-0.3, 0, 0]} material={maneMaterial}>
        <boxGeometry args={[0.06, 0.25, 0.04]} />
      </mesh>
    </group>
  )
})

export default HorseModel
