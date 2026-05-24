import React from 'react';
import { Line, Circle, Text, Rect, Group } from 'react-konva';
import type { MainRoute, KeyPoint } from '../../shared/types';

interface ChartBackgroundProps {
  width: number;
  height: number;
  mainRoutes: MainRoute[];
  keyPoints: KeyPoint[];
}

export const ChartBackground: React.FC<ChartBackgroundProps> = ({
  width,
  height,
  mainRoutes,
  keyPoints,
}) => {
  const gridSize = 50;

  const renderGrid = () => {
    const lines = [];
    for (let x = 0; x <= width; x += gridSize) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, height]}
          stroke="rgba(100, 150, 200, 0.1)"
          strokeWidth={1}
        />
      );
    }
    for (let y = 0; y <= height; y += gridSize) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[0, y, width, y]}
          stroke="rgba(100, 150, 200, 0.1)"
          strokeWidth={1}
        />
      );
    }
    return lines;
  };

  const renderMainRoutes = () => {
    return mainRoutes.map((route) => {
      const points: number[] = [];
      route.points.forEach((p) => {
        points.push(p.x, p.y);
      });

      return (
        <Group key={route.id}>
          <Line
            points={points}
            stroke="rgba(59, 130, 246, 0.6)"
            strokeWidth={route.width}
            lineCap="round"
            lineJoin="round"
            opacity={0.4}
          />
          <Line
            points={points}
            stroke="#3B82F6"
            strokeWidth={2}
            lineCap="round"
            lineJoin="round"
            dash={[10, 5]}
          />
          {route.points.length > 1 && (
            <Text
              x={route.points[0].x + 10}
              y={route.points[0].y - 20}
              text={route.name}
              fontSize={11}
              fontFamily="Roboto Mono, monospace"
              fill="#60A5FA"
              fontStyle="bold"
            />
          )}
        </Group>
      );
    });
  };

  const renderKeyPoints = () => {
    return keyPoints.map((point) => (
      <Group key={point.id}>
        <Circle
          x={point.x}
          y={point.y}
          radius={point.radius}
          fill="rgba(245, 158, 11, 0.1)"
          stroke="#F59E0B"
          strokeWidth={2}
          dash={[4, 4]}
        />
        <Circle
          x={point.x}
          y={point.y}
          radius={6}
          fill="#F59E0B"
          shadowColor="#F59E0B"
          shadowBlur={10}
        />
        <Text
          x={point.x + point.radius + 8}
          y={point.y - 6}
          text={point.name}
          fontSize={11}
          fontFamily="Roboto Mono, monospace"
          fill="#FCD34D"
          fontStyle="bold"
        />
      </Group>
    ));
  };

  const renderCompass = () => (
    <Group x={width - 60} y={50}>
      <Circle radius={25} fill="rgba(10, 36, 99, 0.8)" stroke="#3B82F6" strokeWidth={2} />
      <Text x={-4} y={-18} text="N" fontSize={12} fontFamily="Orbitron, sans-serif" fill="#E8E8E8" fontStyle="bold" />
      <Text x={-4} y={8} text="S" fontSize={10} fontFamily="Orbitron, sans-serif" fill="#9CA3AF" />
      <Text x={-18} y={-5} text="W" fontSize={10} fontFamily="Orbitron, sans-serif" fill="#9CA3AF" />
      <Text x={12} y={-5} text="E" fontSize={10} fontFamily="Orbitron, sans-serif" fill="#9CA3AF" />
      <Line points={[0, -12, 0, 12]} stroke="#3B82F6" strokeWidth={2} />
      <Line points={[-12, 0, 12, 0]} stroke="#3B82F6" strokeWidth={2} />
    </Group>
  );

  const renderScaleBar = () => (
    <Group x={30} y={height - 40}>
      <Rect width={100} height={4} fill="#4B5563" />
      <Rect width={50} height={4} fill="#E8E8E8" />
      <Text x={0} y={8} text="0" fontSize={10} fontFamily="Roboto Mono, monospace" fill="#9CA3AF" />
      <Text x={45} y={8} text="500m" fontSize={10} fontFamily="Roboto Mono, monospace" fill="#9CA3AF" />
      <Text x={95} y={8} text="1km" fontSize={10} fontFamily="Roboto Mono, monospace" fill="#9CA3AF" />
    </Group>
  );

  return (
    <>
      <Rect width={width} height={height} fill="#0F172A" />
      {renderGrid()}
      {renderMainRoutes()}
      {renderKeyPoints()}
      {renderCompass()}
      {renderScaleBar()}
    </>
  );
};
