import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getOrbitPoints } from '@/core/passes';
import { parseTLE } from '@/data/tle';
import { createSatRecord, getEpochDate } from '@/core/sgp4';
import type { SatelliteInfo } from '@/types';
import { useAppStore } from '@/store/appStore';

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

interface OrbitLineProps {
  satellite: SatelliteInfo;
  isSelected: boolean;
}

export function OrbitLine({ satellite, isSelected }: OrbitLineProps) {
  const meshRef = useRef<THREE.Line>(null);
  const simulatedTime = useAppStore((s) => s.simulatedTime);

  const { satrec, epochDate, color } = useMemo(() => {
    const tle = parseTLE(satellite.tle1, satellite.tle2);
    const satrec = createSatRecord(tle);
    const epochDate = getEpochDate(tle);
    return { satrec, epochDate, color: SATELLITE_COLORS[satellite.id] || '#00d4ff' };
  }, [satellite]);

  const positions = useMemo(() => {
    const points = getOrbitPoints(satrec, epochDate, simulatedTime, 100);
    const arr = new Float32Array(points.length * 3);
    points.forEach((p, i) => {
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.z;
      arr[i * 3 + 2] = -p.y;
    });
    return arr;
  }, [satrec, epochDate, simulatedTime]);

  useFrame(() => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.material.opacity = 0.9 + Math.sin(Date.now() * 0.003) * 0.1;
      }
    }
  });

  return (
    <line ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={isSelected ? 0.8 : 0.25}
        linewidth={isSelected ? 2 : 1}
      />
    </line>
  );
}

export function AllOrbits() {
  const satellites = useAppStore((s) => s.satellites);
  const selectedSatellite = useAppStore((s) => s.selectedSatellite);
  const showAllOrbits = useAppStore((s) => s.showAllOrbits);

  if (!showAllOrbits && selectedSatellite) {
    return <OrbitLine satellite={selectedSatellite} isSelected={true} />;
  }

  return (
    <group>
      {satellites.map((sat) => (
        <OrbitLine
          key={sat.id}
          satellite={sat}
          isSelected={selectedSatellite?.id === sat.id}
        />
      ))}
    </group>
  );
}
