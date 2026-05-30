import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '@/store/appStore';

export function Earth() {
  const groupRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const simulatedTime = useAppStore((s) => s.simulatedTime);

  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#0a1628');
    gradient.addColorStop(0.3, '#0d2137');
    gradient.addColorStop(0.5, '#0f2842');
    gradient.addColorStop(0.7, '#0d2137');
    gradient.addColorStop(1, '#0a1628');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);

    ctx.fillStyle = '#0a5c3d';
    drawContinent(ctx, northAmerica(), 0.35);
    drawContinent(ctx, southAmerica(), 0.3);
    drawContinent(ctx, europe(), 0.4);
    drawContinent(ctx, asia(), 0.4);
    drawContinent(ctx, africa(), 0.35);
    drawContinent(ctx, australia(), 0.25);

    ctx.fillStyle = '#1a7a56';
    drawContinent(ctx, northAmerica(), 0.25);
    drawContinent(ctx, asia(), 0.3);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const r = Math.random() * 8 + 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  const rotation = useMemo(() => {
    const jd = (simulatedTime.getTime() - new Date(Date.UTC(2000, 0, 1, 12, 0, 0)).getTime()) / 86400000;
    return (280.46061837 + 360.98564736629 * jd) * (Math.PI / 180);
  }, [simulatedTime]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0005;
    }
    if (atmosphereRef.current) {
      const scale = 1.05 + Math.sin(Date.now() * 0.001) * 0.005;
      atmosphereRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      <group ref={groupRef} rotation={[0, rotation, 0]}>
        <mesh receiveShadow castShadow>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial
            map={earthTexture}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>

        <mesh ref={atmosphereRef} scale={[1.05, 1.05, 1.05]}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial
            color="#00d4ff"
            transparent
            opacity={0.12}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <mesh rotation={[0, 0, Math.PI / 2]}>
          <sphereGeometry args={[1.001, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.01]} />
          <meshBasicMaterial
            color="#00ff88"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

function drawContinent(ctx: CanvasRenderingContext2D, points: [number, number][], alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  points.forEach(([lat, lon], i) => {
    const x = ((lon + 180) / 360) * 1024;
    const y = ((90 - lat) / 180) * 512;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function northAmerica(): [number, number][] {
  return [[71, -156], [71, -78], [50, -55], [48, -63], [45, -60], [42, -70], [30, -81], [25, -80], [20, -97], [15, -105], [18, -108], [32, -117], [38, -123], [49, -124], [55, -130], [60, -138], [65, -145], [71, -156]];
}
function southAmerica(): [number, number][] {
  return [[12, -71], [12, -61], [0, -50], [-5, -35], [-15, -38], [-35, -56], [-54, -68], [-54, -74], [-40, -75], [-20, -70], [-5, -80], [5, -78], [12, -71]];
}
function europe(): [number, number][] {
  return [[71, 18], [71, 31], [60, 30], [55, 40], [45, 35], [40, 28], [38, 18], [35, -5], [43, -1], [50, -5], [60, 5], [71, 18]];
}
function asia(): [number, number][] {
  return [[70, 32], [75, 100], [75, 140], [55, 142], [45, 132], [40, 125], [35, 125], [30, 121], [25, 120], [20, 110], [10, 105], [8, 95], [15, 75], [25, 65], [25, 55], [30, 45], [38, 40], [40, 28], [50, 30], [60, 30], [70, 32]];
}
function africa(): [number, number][] {
  return [[35, -6], [35, 12], [30, 30], [20, 35], [10, 42], [10, 50], [-5, 40], [-30, 18], [-35, 18], [-35, 15], [-20, 10], [-5, 8], [-15, -8], [0, -15], [10, -17], [20, -17], [25, -15], [35, -6]];
}
function australia(): [number, number][] {
  return [[-10, 142], [-10, 152], [-25, 153], [-35, 150], [-38, 144], [-35, 137], [-25, 113], [-20, 116], [-15, 124], [-12, 130], [-10, 142]];
}
