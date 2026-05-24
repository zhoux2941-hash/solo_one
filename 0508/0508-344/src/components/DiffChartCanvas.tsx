import React, { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Rect, Group, Text } from 'react-konva';
import Konva from 'konva';
import { ChartBackground } from './ChartBackground';
import { DraggableLayerElement } from './DraggableLayerElement';
import type { LayerElement, MainRoute, KeyPoint } from '../../shared/types';
import type { ElementDiff, ChangeType } from '../utils/diffDetector';
import { changeTypeColors } from '../utils/diffDetector';

interface DiffChartCanvasProps {
  width: number;
  height: number;
  elements: LayerElement[];
  mainRoutes: MainRoute[];
  keyPoints: KeyPoint[];
  diffs?: ElementDiff[];
  diffSide?: 'old' | 'new';
  readOnly?: boolean;
  highlightedChangeType?: ChangeType | null;
  onElementSelect?: (id: string | null) => void;
  selectedElementId?: string | null;
}

export interface DiffChartCanvasRef {
  getStage: () => Konva.Stage | null;
  focusOnElement: (id: string) => void;
}

export const DiffChartCanvas = forwardRef<DiffChartCanvasRef, DiffChartCanvasProps>(
  (
    {
      width,
      height,
      elements,
      mainRoutes,
      keyPoints,
      diffs = [],
      diffSide = 'new',
      readOnly = true,
      highlightedChangeType,
      onElementSelect,
      selectedElementId,
    },
    ref
  ) => {
    const stageRef = useRef<Konva.Stage>(null);

    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
      focusOnElement: (id: string) => {
        const element = elements.find((el) => el.id === id);
        if (element && stageRef.current) {
          const stage = stageRef.current;
          const scale = stage.scaleX();
          stage.position({
            x: width / 2 - (element.x + element.width / 2) * scale,
            y: height / 2 - (element.y + element.height / 2) * scale,
          });
          stage.batchDraw();
        }
      },
    }));

    const diffMap = useMemo(() => {
      const map = new Map<string, ElementDiff>();
      diffs.forEach((diff) => map.set(diff.id, diff));
      return map;
    }, [diffs]);

    const getElementDiffColor = (element: LayerElement) => {
      const diff = diffMap.get(element.id);
      if (!diff) return null;

      if (highlightedChangeType && diff.type !== highlightedChangeType) {
        return null;
      }

      return changeTypeColors[diff.type];
    };

    const sortedElements = useMemo(
      () => [...elements].sort((a, b) => a.zIndex - b.zIndex),
      [elements]
    );

    const changeHighlightRects = useMemo(() => {
      if (!diffs.length) return [];

      return diffs
        .filter((diff) => {
          if (highlightedChangeType && diff.type !== highlightedChangeType) return false;
          if (diffSide === 'old' && diff.type === 'added') return false;
          if (diffSide === 'new' && diff.type === 'removed') return false;
          return diff.type !== 'unchanged';
        })
        .map((diff) => {
          const element = diffSide === 'old' ? diff.oldElement : diff.newElement;
          if (!element) return null;

          const colors = changeTypeColors[diff.type];
          return {
            id: diff.id,
            x: element.x - 5,
            y: element.y - 5,
            width: element.width + 10,
            height: element.height + 10,
            colors,
            type: diff.type,
          };
        })
        .filter(Boolean) as {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        colors: { fill: string; stroke: string };
        type: ChangeType;
      }[];
    }, [diffs, diffSide, highlightedChangeType]);

    return (
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        style={{ background: '#0F172A' }}
        draggable={!readOnly}
      >
        <Layer>
          <ChartBackground width={width} height={height} mainRoutes={mainRoutes} keyPoints={keyPoints} />
        </Layer>
        <Layer>
          {changeHighlightRects.map((rect) => (
            <Rect
              key={`highlight-${rect.id}`}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={rect.colors.fill}
              stroke={rect.colors.stroke}
              strokeWidth={2}
              cornerRadius={6}
              dash={rect.type === 'modified' ? [6, 4] : undefined}
            />
          ))}
        </Layer>
        <Layer>
          {sortedElements.map((element) => {
            if (!element.visible) return null;

            const diffColors = getElementDiffColor(element);
            const hasDiff = diffColors && diffColors.stroke !== 'transparent';

            return (
              <Group key={element.id}>
                {!readOnly ? (
                  <DraggableLayerElement
                    element={element}
                    isSelected={selectedElementId === element.id}
                    hasCollision={false}
                    onSelect={() => onElementSelect?.(element.id)}
                    onDragEnd={() => {}}
                  />
                ) : (
                  <Group x={element.x} y={element.y}>
                    <Rect
                      width={element.width}
                      height={element.height}
                      fill={
                        hasDiff
                          ? diffColors!.fill
                          : element.type === 'channel_note'
                          ? 'rgba(59, 130, 246, 0.15)'
                          : element.type === 'warning_zone'
                          ? 'rgba(239, 68, 68, 0.2)'
                          : element.type === 'anchorage'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)'
                      }
                      stroke={
                        hasDiff
                          ? diffColors!.stroke
                          : element.type === 'channel_note'
                          ? '#3B82F6'
                          : element.type === 'warning_zone'
                          ? '#EF4444'
                          : element.type === 'anchorage'
                          ? '#10B981'
                          : '#F59E0B'
                      }
                      strokeWidth={hasDiff ? 3 : 2}
                      cornerRadius={4}
                      shadowColor={hasDiff ? diffColors!.stroke : 'rgba(0,0,0,0.3)'}
                      shadowBlur={hasDiff ? 10 : 5}
                      shadowOffset={{ x: 0, y: 2 }}
                      shadowOpacity={0.5}
                    />
                    {element.text.split('\n').map((line, index) => (
                      <Text
                        key={index}
                        x={8}
                        y={element.height / 2 - (element.text.split('\n').length * 18) / 2 + 8 + index * 18}
                        width={element.width - 16}
                        height={18}
                        text={line}
                        align="center"
                        verticalAlign="middle"
                        fontSize={12}
                        fontFamily="Roboto Mono, monospace"
                        fill={hasDiff ? diffColors!.stroke : '#E8E8E8'}
                        fontStyle="bold"
                      />
                    ))}
                  </Group>
                )}
              </Group>
            );
          })}
        </Layer>
      </Stage>
    );
  }
);

DiffChartCanvas.displayName = 'DiffChartCanvas';
