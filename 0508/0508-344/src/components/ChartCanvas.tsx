import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { ChartBackground } from './ChartBackground';
import { DraggableLayerElement } from './DraggableLayerElement';
import { useChartStore } from '../store/useChartStore';

interface ChartCanvasProps {
  width: number;
  height: number;
}

export interface ChartCanvasRef {
  getStage: () => Konva.Stage | null;
}

export const ChartCanvas = forwardRef<ChartCanvasRef, ChartCanvasProps>(({ width, height }, ref) => {
  const stageRef = useRef<Konva.Stage>(null);

  useImperativeHandle(ref, () => ({
    getStage: () => stageRef.current,
  }));
  const {
    elements,
    mainRoutes,
    keyPoints,
    collisions,
    selectedElementId,
    setElementPosition,
    setSelectedElement,
    setStageTransform,
  } = useChartStore();

  useEffect(() => {
    useChartStore.getState().checkCollisions();
  }, []);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedElement(null);
    }
  };

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const scaleBy = 1.05;
    const delta = e.evt.deltaY > 0 ? 1 / scaleBy : scaleBy;
    const newScale = Math.max(0.5, Math.min(3, oldScale * delta));

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    stage.batchDraw();
    setStageTransform(newScale, newPos.x, newPos.y);
  }, [setStageTransform]);

  const collisionElementIds = new Set(collisions.map((c) => c.elementId));

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      onClick={handleStageClick}
      onWheel={handleWheel}
      draggable
      style={{ background: '#0F172A' }}
    >
      <Layer>
        <ChartBackground width={width} height={height} mainRoutes={mainRoutes} keyPoints={keyPoints} />
      </Layer>
      <Layer>
        {sortedElements.map((element) =>
          element.visible ? (
            <DraggableLayerElement
              key={element.id}
              element={element}
              isSelected={selectedElementId === element.id}
              hasCollision={collisionElementIds.has(element.id)}
              onSelect={() => setSelectedElement(element.id)}
              onDragEnd={(x, y) => setElementPosition(element.id, x, y)}
            />
          ) : null
        )}
      </Layer>
    </Stage>
  );
});

ChartCanvas.displayName = 'ChartCanvas';
