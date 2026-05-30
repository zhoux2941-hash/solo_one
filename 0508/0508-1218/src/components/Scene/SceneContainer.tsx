import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Earth } from './Earth';
import { StarField } from './StarField';
import { AllOrbits } from './OrbitLine';
import { Satellites } from './Satellite';
import { useAppStore } from '@/store/appStore';

function SunLight() {
  const ref = useRef<THREE.DirectionalLight>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime * 0.05;
      ref.current.position.set(Math.cos(t) * 10, 2, Math.sin(t) * 10);
    }
  });

  return (
    <directionalLight
      ref={ref}
      position={[10, 2, 10]}
      intensity={1.5}
      color="#fff8e7"
      castShadow
    />
  );
}

function SceneContent() {
  return (
    <>
      <color attach="background" args={['#050810']} />
      <ambientLight intensity={0.08} />
      <SunLight />
      <StarField />
      <Earth />
      <AllOrbits />
      <Satellites />
      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={8}
        autoRotate={false}
        autoRotateSpeed={0.3}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

export function SceneContainer() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 2, 3.5], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}
