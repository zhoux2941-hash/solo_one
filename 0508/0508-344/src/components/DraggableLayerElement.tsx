import React, { useRef, useState, useEffect } from 'react';
import { Rect, Text, Group, Transformer } from 'react-konva';
import Konva from 'konva';
import type { LayerElement } from '../../shared/types';
import { layerTypeConfig } from '../data/mockData';

interface DraggableLayerElementProps {
  element: LayerElement;
  isSelected: boolean;
  hasCollision: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}

export const DraggableLayerElement: React.FC<DraggableLayerElementProps> = ({
  element,
  isSelected,
  hasCollision,
  onSelect,
  onDragEnd,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const config = layerTypeConfig[element.type];

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setIsDragging(false);
    onDragEnd(e.target.x(), e.target.y());
  };

  const handleTransformEnd = () => {
    if (groupRef.current) {
      const node = groupRef.current;
      onDragEnd(node.x(), node.y());
    }
  };

  const lines = element.text.split('\n');
  const lineHeight = 18;
  const textY = element.height / 2 - (lines.length * lineHeight) / 2 + 8;

  return (
    <>
      <Group
        ref={groupRef}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        opacity={element.opacity}
      >
        <Rect
          width={element.width}
          height={element.height}
          fill={hasCollision ? 'rgba(239, 68, 68, 0.3)' : config.bgColor}
          stroke={hasCollision ? '#EF4444' : config.borderColor}
          strokeWidth={isSelected ? 3 : 2}
          cornerRadius={4}
          shadowColor={hasCollision ? '#EF4444' : 'rgba(0,0,0,0.3)'}
          shadowBlur={hasCollision ? 15 : 5}
          shadowOffset={{ x: 0, y: 2 }}
          shadowOpacity={0.5}
        />
        {lines.map((line, index) => (
          <Text
            key={index}
            text={line}
            x={8}
            y={textY + index * lineHeight}
            width={element.width - 16}
            height={lineHeight}
            align="center"
            verticalAlign="middle"
            fontSize={12}
            fontFamily="Roboto Mono, monospace"
            fill={hasCollision ? '#EF4444' : '#E8E8E8'}
            fontStyle="bold"
            wrap="none"
            ellipsis={true}
          />
        ))}
        {hasCollision && !isDragging && (
          <Rect
            width={element.width}
            height={element.height}
            stroke="#EF4444"
            strokeWidth={2}
            cornerRadius={4}
            dash={[5, 5]}
          />
        )}
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 30 || newBox.height < 20) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={false}
          enabledAnchors={[]}
          borderStroke="#3B82F6"
          borderStrokeWidth={2}
          anchorStroke="#3B82F6"
          anchorFill="#1A1A2E"
          anchorSize={8}
          anchorCornerRadius={2}
        />
      )}
    </>
  );
};
