import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { ForceVector } from '../../shared/types'

interface ForceArrowsProps {
  vectors: ForceVector[]
}

function ForceArrow({ vector }: { vector: ForceVector }) {
  const groupRef = useRef<THREE.Group>(null)

  const color = useMemo(() => {
    if (vector.magnitude > 500) return '#C73E1A'
    if (vector.magnitude > 200) return '#B87333'
    return '#4A7C59'
  }, [vector.magnitude])

  const direction = useMemo(() => {
    const dir = new THREE.Vector3(-vector.x, -vector.y, -vector.z).normalize()
    return dir
  }, [vector.x, vector.y, vector.z])

  const quaternion = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0)
    const q = new THREE.Quaternion().setFromUnitVectors(up, direction)
    return q
  }, [direction])

  const shaftHeight = Math.max(vector.magnitude * 0.01, 0.1)

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime
      const pulse = 1 + Math.sin(t * 3) * 0.05
      groupRef.current.scale.set(pulse, pulse, pulse)
    }
  })

  return (
    <group ref={groupRef} position={[vector.x, vector.y, vector.z]}>
      <group quaternion={quaternion}>
        <mesh position={[0, shaftHeight / 2, 0]}>
          <cylinderGeometry args={[0.02, 0.02, shaftHeight, 8]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, shaftHeight + 0.075, 0]}>
          <coneGeometry args={[0.05, 0.15, 8]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
        </mesh>
      </group>
      <Text
        position={[0, shaftHeight + 0.35, 0]}
        fontSize={0.12}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {`${vector.label}: ${vector.magnitude.toFixed(0)}N`}
      </Text>
    </group>
  )
}

const ForceArrows = React.memo(function ForceArrows({ vectors }: ForceArrowsProps) {
  return (
    <group>
      {vectors.map((v, i) => (
        <ForceArrow key={i} vector={v} />
      ))}
    </group>
  )
})

export default ForceArrows
