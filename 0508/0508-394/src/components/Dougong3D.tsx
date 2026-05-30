import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { useDougongStore } from '@/store/useDougongStore';
import { 
  calculateSectionElements, 
  recalculateMortisesOnZoom,
  getLodLevel,
  LOD_DISTANCES,
} from '@/lib/calculator';
import type { SectionElement, MortiseTenon, LodLevel } from '@/lib/calculator';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

function getDepthScale(type: SectionElement['type']): number {
  switch (type) {
    case '斗': return 3;
    case '拱': return 2;
    case '昂': return 2;
    case '枋': return 2;
    default: return 2;
  }
}

function MortiseTenonMesh({ 
  mt, 
  scale, 
  parentPosition,
  parentRotation,
}: { 
  mt: MortiseTenon; 
  scale: number;
  parentPosition: [number, number, number];
  parentRotation: [number, number, number];
}) {
  const position: [number, number, number] = [
    parentPosition[0] + (mt.x + mt.w / 2) * scale,
    parentPosition[1] + (mt.y + mt.h / 2) * scale,
    parentPosition[2] + mt.z * scale,
  ];

  const color = mt.type === 'mortise' ? '#3E2723' : '#8D6E63';

  return (
    <mesh
      position={position}
      rotation={parentRotation}
      castShadow={mt.type === 'tenon'}
      receiveShadow
    >
      <boxGeometry args={[mt.w * scale, mt.h * scale, mt.d * scale]} />
      <meshStandardMaterial
        color={color}
        roughness={0.8}
        metalness={0.05}
      />
    </mesh>
  );
}

function ElementMeshLOD({ 
  el, 
  fenMm,
  lodLevel,
}: { 
  el: SectionElement; 
  fenMm: number;
  lodLevel: LodLevel;
}) {
  const scale = fenMm / 10;
  const depthScale = getDepthScale(el.type);

  const lodConfig = el.lod?.[lodLevel];
  if (!lodConfig?.visible) return null;

  const simplifyFactor = lodConfig.simplify;

  let position: [number, number, number];
  let boxScale: [number, number, number];
  let rotation: [number, number, number] = [0, 0, 0];
  let length = 0;

  if (el.isAng && el.angEnd) {
    const centerX = (el.x + el.angEnd.x) / 2;
    const centerY = (el.y + el.angEnd.y) / 2;
    const dx = el.angEnd.x - el.x;
    const dy = el.angEnd.y - el.y;
    length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    position = [centerX * scale, centerY * scale, 0];
    boxScale = [
      length * scale * simplifyFactor,
      el.h * scale * simplifyFactor,
      (el.depth / depthScale) * scale * simplifyFactor,
    ];
    rotation = [0, 0, angle];
  } else {
    position = [
      (el.x + el.w / 2) * scale,
      (el.y + el.h / 2) * scale,
      0,
    ];
    boxScale = [
      el.w * scale * simplifyFactor,
      el.h * scale * simplifyFactor,
      (el.depth / depthScale) * scale * simplifyFactor,
    ];
  }

  const showMortises = lodLevel === 'high' && simplifyFactor >= 0.9;

  return (
    <group key={`${el.label}-${lodLevel}`}>
      <mesh 
        position={position} 
        rotation={rotation} 
        scale={boxScale} 
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={el.color}
          roughness={0.75}
          metalness={0.08}
          envMapIntensity={0.6}
        />
      </mesh>

      {showMortises && (
        <>
          {el.mortises?.map((mt, i) => (
            <MortiseTenonMesh
              key={`mortise-${i}`}
              mt={mt}
              scale={scale}
              parentPosition={position}
              parentRotation={rotation}
            />
          ))}
          {el.tenons?.map((mt, i) => (
            <MortiseTenonMesh
              key={`tenon-${i}`}
              mt={mt}
              scale={scale}
              parentPosition={position}
              parentRotation={rotation}
            />
          ))}
        </>
      )}
    </group>
  );
}

function CameraDistanceTracker({ onDistanceChange }: { onDistanceChange: (distance: number, level: LodLevel) => void }) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const lastDistanceRef = useRef(0);

  useFrame(() => {
    const distance = camera.position.length();
    const lodLevel = getLodLevel(distance);
    
    if (Math.abs(distance - lastDistanceRef.current) > 2) {
      lastDistanceRef.current = distance;
      onDistanceChange(distance, lodLevel);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={25}
      maxDistance={180}
      maxPolarAngle={Math.PI / 2.1}
    />
  );
}

function SunLight() {
  const { scene } = useThree();

  useMemo(() => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.receiveShadow) {
        obj.customDepthMaterial = new THREE.MeshDepthMaterial({
          depthPacking: THREE.BasicDepthPacking,
        });
      }
    });
  }, [scene]);

  return (
    <>
      <hemisphereLight
        color="#FFE4B5"
        groundColor="#3E2723"
        intensity={0.45}
      />
      <ambientLight intensity={0.25} color="#FFF8E1" />
      <directionalLight
        position={[45, 80, 35]}
        intensity={1.4}
        color="#FFF5E6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-camera-near={0.5}
        shadow-camera-far={300}
        shadow-bias={-0.0005}
      />
      <directionalLight
        position={[-30, 20, -25]}
        intensity={0.35}
        color="#FFCC80"
      />
      <pointLight
        position={[0, 60, 0]}
        intensity={0.3}
        color="#FFD700"
        distance={200}
      />
      <pointLight
        position={[-40, 10, 40]}
        intensity={0.15}
        color="#8B4513"
        distance={150}
      />
    </>
  );
}

function DougongModel() {
  const dynasty = useDougongStore((s) => s.dynasty);
  const jumps = useDougongStore((s) => s.jumps);
  const moduleData = useDougongStore((s) => s.moduleData);
  const [lodLevel, setLodLevel] = useState<LodLevel>('medium');
  const [cameraDistance, setCameraDistance] = useState(70);
  const [elements, setElements] = useState<SectionElement[]>([]);

  const baseElements = useMemo(() => {
    if (!moduleData) return [];
    return calculateSectionElements(dynasty, jumps, moduleData);
  }, [dynasty, jumps, moduleData]);

  useEffect(() => {
    const zoomScale = Math.max(0.5, Math.min(2, 70 / cameraDistance));
    if (moduleData) {
      const recalculated = recalculateMortisesOnZoom(baseElements, zoomScale, moduleData.dancaiWidth);
      setElements(recalculated);
    }
  }, [baseElements, cameraDistance, moduleData]);

  const fenMm = moduleData?.fenMm ?? 10;

  const handleDistanceChange = (distance: number, level: LodLevel) => {
    setCameraDistance(distance);
    setLodLevel(level);
  };

  return (
    <>
      <group>
        {elements.map((el, i) => (
          <ElementMeshLOD 
            key={`${el.label}-${i}`} 
            el={el} 
            fenMm={fenMm} 
            lodLevel={lodLevel}
          />
        ))}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1, 0]}
          receiveShadow
        >
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial
            color="#1A1210"
            roughness={0.95}
            metalness={0}
          />
        </mesh>
        <ContactShadows
          position={[0, -0.99, 0]}
          opacity={0.6}
          scale={120}
          blur={3}
          far={60}
          color="#000000"
        />
      </group>
      <CameraDistanceTracker onDistanceChange={handleDistanceChange} />
      <group position={[65, 55, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 0.5, 18]} />
          <meshStandardMaterial color="#333" transparent opacity={0.7} />
        </mesh>
        <mesh position={[-8.5, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={lodLevel === 'low' ? '#C62828' : '#555'} emissive={lodLevel === 'low' ? '#C62828' : '#000'} emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={lodLevel === 'medium' ? '#D4A843' : '#555'} emissive={lodLevel === 'medium' ? '#D4A843' : '#000'} emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[8.5, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={lodLevel === 'high' ? '#4CAF50' : '#555'} emissive={lodLevel === 'high' ? '#4CAF50' : '#000'} emissiveIntensity={0.5} />
        </mesh>
      </group>
    </>
  );
}

export default function Dougong3D() {
  return (
    <div className="relative rounded-lg overflow-hidden shadow-lg h-full border border-[#5D4037]/30">
      <div className="absolute top-3 left-3 z-10 text-[#D4A843] font-serif text-sm pointer-events-none">
        三维视图
      </div>
      <div className="absolute top-3 right-3 z-10 text-[#D4A843] font-mono text-xs pointer-events-none bg-black/40 px-2 py-1 rounded">
        LOD: 距离 {'>='}{LOD_DISTANCES.low}=LOW | {'>='}{LOD_DISTANCES.medium}=MID | {'<'}HIGH
      </div>
      <Canvas
        camera={{ position: [55, 45, 55], fov: 35 }}
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <color attach="background" args={['#1A1210']} />
        <fog attach="fog" args={['#1A1210', 120, 280]} />
        <SunLight />
        <DougongModel />
      </Canvas>
    </div>
  );
}
