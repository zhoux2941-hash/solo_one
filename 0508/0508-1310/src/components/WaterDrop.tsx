import React, { useEffect, useState } from 'react';
import { COLORS } from '../utils/constants';

interface WaterDropProps {
  isDropping: boolean;
  apertureX: number;
  apertureY: number;
  dropInterval?: number;
}

interface Drop {
  id: number;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  speed: number;
}

export const WaterDrop: React.FC<WaterDropProps> = ({
  isDropping,
  apertureX,
  apertureY,
  dropInterval = 200,
}) => {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [dropIdCounter, setDropIdCounter] = useState(0);

  useEffect(() => {
    if (!isDropping) {
      setDrops([]);
      return;
    }

    const spawnInterval = setInterval(() => {
      const newDrop: Drop = {
        id: dropIdCounter,
        x: apertureX + (Math.random() - 0.5) * 8,
        y: apertureY,
        opacity: 1,
        scale: 0.5 + Math.random() * 0.5,
        speed: 2 + Math.random() * 2,
      };

      setDrops((prev) => [...prev, newDrop]);
      setDropIdCounter((prev) => prev + 1);
    }, dropInterval);

    return () => clearInterval(spawnInterval);
  }, [isDropping, apertureX, apertureY, dropInterval, dropIdCounter]);

  useEffect(() => {
    if (drops.length === 0) return;

    const animationFrame = setInterval(() => {
      setDrops((prev) =>
        prev
          .map((drop) => ({
            ...drop,
            y: drop.y + drop.speed,
            speed: drop.speed + 0.15,
            opacity: Math.max(0, drop.opacity - 0.008),
            scale: drop.scale + 0.005,
          }))
          .filter((drop) => drop.opacity > 0 && drop.y < 500)
      );
    }, 16);

    return () => clearInterval(animationFrame);
  }, [drops.length]);

  return (
    <g>
      {drops.map((drop) => (
        <g key={drop.id}>
          <ellipse
            cx={drop.x}
            cy={drop.y}
            rx={4 * drop.scale}
            ry={6 * drop.scale}
            fill={COLORS.water}
            opacity={drop.opacity * 0.8}
          />
          <ellipse
            cx={drop.x - 1 * drop.scale}
            cy={drop.y - 2 * drop.scale}
            rx={1.5 * drop.scale}
            ry={2 * drop.scale}
            fill="white"
            opacity={drop.opacity * 0.6}
          />
        </g>
      ))}
    </g>
  );
};

export default WaterDrop;
