import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useDrumTowerStore } from '@/hooks/useDrumTowerStore'
import { getStrikeAngle } from '@/hooks/useAnimationStateMachine'

function Platform() {
  return (
    <group position={[0, -0.05, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[6, 6.5, 0.1, 32]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[5.5, 5.8, 0.05, 32]} />
        <meshStandardMaterial color="#6B5B45" roughness={0.8} />
      </mesh>
    </group>
  )
}

function Pillar(props: { position: [number, number, number] }) {
  return (
    <mesh position={props.position} castShadow>
      <cylinderGeometry args={[0.15, 0.18, 4, 8]} />
      <meshStandardMaterial color="#8B4513" roughness={0.7} />
    </mesh>
  )
}

function DrumModel({ side }: { side: 'left' | 'right' }) {
  const drumRef = useRef<THREE.Group>(null)
  const stickRef = useRef<THREE.Mesh>(null)
  const animation = useDrumTowerStore((s) => s.animation)

  const isActive = animation.isActive && animation.type === 'drum'
  const angle = isActive ? getStrikeAngle(animation.state, animation.progress, 0.5) : 0

  useFrame(() => {
    if (stickRef.current) {
      stickRef.current.rotation.x = side === 'left' ? -angle : angle
    }
  })

  const xPos = side === 'left' ? -1.2 : 1.2

  return (
    <group ref={drumRef} position={[xPos, 2.2, -1.5]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.6, 0.6, 1.0, 24]} />
        <meshStandardMaterial color="#8B0000" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.51]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.58, 24]} />
        <meshStandardMaterial color="#D4A574" roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, -0.51]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.58, 24]} />
        <meshStandardMaterial color="#D4A574" roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={stickRef} position={[0, 0.8, 0.8]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
        <meshStandardMaterial color="#5C4033" roughness={0.8} />
      </mesh>
    </group>
  )
}

function BellModel() {
  const bellRef = useRef<THREE.Group>(null)
  const clapperRef = useRef<THREE.Mesh>(null)
  const animation = useDrumTowerStore((s) => s.animation)

  const isActive = animation.isActive && animation.type === 'bell'
  const angle = isActive ? getStrikeAngle(animation.state, animation.progress, 0.4) : 0

  useFrame(() => {
    if (clapperRef.current) {
      clapperRef.current.rotation.z = angle
    }
  })

  return (
    <group ref={bellRef} position={[0, 3.5, -2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.2, 0.8, 1.5, 16, 1, true]} />
        <meshStandardMaterial color="#B8860B" roughness={0.3} metalness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.76, 0]}>
        <cylinderGeometry args={[0.3, 0.22, 0.08, 16]} />
        <meshStandardMaterial color="#DAA520" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.8, 16]} />
        <meshStandardMaterial color="#B8860B" roughness={0.3} metalness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={clapperRef} position={[0, -0.3, 0]} castShadow>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#8B6914" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.6, 6]} />
        <meshStandardMaterial color="#5C4033" roughness={0.8} />
      </mesh>
    </group>
  )
}

function Roof({ y }: { y: number }) {
  const roofShape = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-4.2, 0)
    shape.lineTo(0, 1.5)
    shape.lineTo(4.2, 0)
    shape.lineTo(-4.2, 0)
    return shape
  }, [])

  return (
    <group position={[0, y, 0]}>
      <mesh castShadow>
        <extrudeGeometry args={[roofShape, { depth: 5, bevelEnabled: false }]} />
        <meshStandardMaterial color="#2C1810" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.45, 2.5]} castShadow>
        <cylinderGeometry args={[0.08, 0.15, 0.6, 6]} />
        <meshStandardMaterial color="#DAA520" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0, 2.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8.4, 5]} />
        <meshStandardMaterial color="#2C1810" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Lantern({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#FF4500" emissive="#FF6600" emissiveIntensity={2} />
      </mesh>
      <pointLight color="#FF8C00" intensity={0.5} distance={3} />
    </group>
  )
}

function CityWall() {
  return (
    <group position={[0, -0.5, -8]}>
      <mesh>
        <boxGeometry args={[20, 3, 0.5]} />
        <meshStandardMaterial color="#696969" roughness={0.9} />
      </mesh>
      {[-8, -4, 0, 4, 8].map((x, i) => (
        <mesh key={i} position={[x, 1.5, 0]}>
          <boxGeometry args={[0.8, 0.6, 0.6]} />
          <meshStandardMaterial color="#555555" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#3C3022" roughness={1} />
    </mesh>
  )
}

export default function DrumTowerScene() {
  const updateAnimationProgress = useDrumTowerStore((s) => s.updateAnimationProgress)

  useFrame((_, delta) => {
    updateAnimationProgress(delta)
  })

  return (
    <group>
      <Ground />
      <Platform />
      <Pillar position={[-2.5, 2, -2.2]} />
      <Pillar position={[2.5, 2, -2.2]} />
      <Pillar position={[-2.5, 2, 2.2]} />
      <Pillar position={[2.5, 2, 2.2]} />
      <Pillar position={[-2.5, 2, 0]} />
      <Pillar position={[2.5, 2, 0]} />

      <mesh position={[0, 4.05, 0]}>
        <boxGeometry args={[6, 0.15, 5]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[5.5, 0.15, 4.5]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>

      <mesh position={[0, 2, -2.4]}>
        <boxGeometry args={[5.8, 3.8, 0.1]} />
        <meshStandardMaterial color="#5C3317" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2, 2.4]}>
        <boxGeometry args={[5.8, 3.8, 0.1]} />
        <meshStandardMaterial color="#5C3317" roughness={0.9} />
      </mesh>

      <DrumModel side="left" />
      <DrumModel side="right" />
      <BellModel />

      <Roof y={4.1} />

      <CityWall />

      <group position={[0, 1.5, 2.45]}>
        <mesh>
          <boxGeometry args={[3, 3, 0.15]} />
          <meshStandardMaterial color="#3C1810" roughness={0.9} />
        </mesh>
      </group>

      <Lantern position={[-3, 3.5, -2]} />
      <Lantern position={[3, 3.5, -2]} />
      <Lantern position={[-3, 3.5, 2.5]} />
      <Lantern position={[3, 3.5, 2.5]} />
    </group>
  )
}
