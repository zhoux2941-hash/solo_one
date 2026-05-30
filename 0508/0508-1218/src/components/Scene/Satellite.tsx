import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '@/store/appStore';
import { parseTLE } from '@/data/tle';
import { createSatRecord, getEpochDate, propagate } from '@/core/sgp4';
import { satPositionToLLA } from '@/core/coordinate';
import { Billboard, Text } from '@react-three/drei';
import { EARTH_RADIUS_KM } from '@/core/constants';

const SATELLITE_COLORS: Record<string, string> = {
  iss: '#00d4ff',
  hubble: '#a78bfa',
  beidou: '#f87171',
  tiangong: '#34d399',
  gps: '#60a5fa',
  glonass: '#fbbf24',
  starlink: '#94a3b8',
  noaa19: '#2dd4bf',
  landsat9: '#4ade80',
  jwst: '#a78bfa',
};

interface SatelliteProps {
  satellite: typeof import('@/types').SatelliteInfo;
  isSelected: boolean;
  onClick?: () => void;
}

function SingleSatellite({ satellite, isSelected, onClick }: SatelliteProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const simulatedTime = useAppStore((s) => s.simulatedTime);
  const tle = useMemo(() => parseTLE(satellite.tle1, satellite.tle2), [satellite]);
  const satrec = useMemo(() => createSatRecord(tle), [tle]);
  const epochDate = useMemo(() => getEpochDate(tle), [tle]);
  const color = SATELLITE_COLORS[satellite.id] || '#00d4ff';

  const position = useMemo(() => {
    const tsince = (simulatedTime.getTime() - epochDate.getTime()) / 60000;
    const pos = propagate(satrec, tsince);
    if (pos.x === 0 && pos.y === 0 && pos.z === 0) return null;
    const lla = satPositionToLLA(pos, simulatedTime);
    const r = (EARTH_RADIUS_KM + lla.alt) / EARTH_RADIUS_KM;
    const latRad = lla.lat * Math.PI / 180;
    const lonRad = lla.lon * Math.PI / 180;
    return {
      x: r * Math.cos(latRad) * Math.cos(lonRad),
      y: r * Math.sin(latRad),
      z: -r * Math.cos(latRad) * Math.sin(lonRad),
    };
  }, [satrec, epochDate, simulatedTime]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02;
      const s = isSelected ? 1 + Math.sin(Date.now() * 0.005) * 0.2 : 1;
      meshRef.current.scale.set(s, s, s);
    }
    if (lightRef.current && position) {
      lightRef.current.position.set(position.x, position.y, position.z);
      lightRef.current.intensity = isSelected ? 2 : 0.5;
    }
  });

  if (!position) return null;

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh ref={meshRef} onClick={onClick}>
        <sphereGeometry args={[isSelected ? 0.035 : 0.025, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      <mesh>
        <sphereGeometry args={[isSelected ? 0.08 : 0.05, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.3 : 0.15}
        />
      </mesh>

      {isSelected && (
        <>
          <pointLight
            ref={lightRef}
            color={color}
            intensity={2}
            distance={3}
            position={[position.x, position.y, position.z]}
          />
          <BillBoard position={[0, 0.12, 0]}>
            <Text
              fontSize={0.05}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.005}
              outlineColor="#000000"
            >
              {satellite.nameCn}
            </Text>
          </BillBoard>
        </>
      )}
    </group>
  );
}

export function Satellites() {
  const satellites = useAppStore((s) => s.satellites);
  const selectedSatellite = useAppStore((s) => s.selectedSatellite);
  const setSelectedSatellite = useAppStore((s) => s.setSelectedSatellite);
  const showAllOrbits = useAppStore((s) => s.showAllOrbits);

  const satsToShow = showAllOrbits ? satellites : (selectedSatellite ? [selectedSatellite] : []);

  return (
    <group>
      {satsToShow.map((sat) => (
        <SingleSatellite
          key={sat.id}
          satellite={sat}
          isSelected={selectedSatellite?.id === sat.id}
          onClick={() => setSelectedSatellite(sat)}
        />
      ))}
    </group>
  );
}
