import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePlcStore } from '../store/plcStore';
import { PlcElementSvg } from './PlcElementSvg';
import type { PlcElement, ElementType } from '../types/plc';

interface DropData {
  type: ElementType;
  variable: string;
  value?: number;
}

export const LadderEditor: React.FC = () => {
  const cellSize = 80;
  const gridCols = 20;

  const { program, selectedElementId, ioState, addElement, setSelectedElement } =
    usePlcStore();

  const [dragOverRung, setDragOverRung] = useState<number | null>(null);

  const svgWidth = gridCols * cellSize;
  const svgHeight = program.rungs.length * cellSize * 1.5;

  const getVariableState = (variable: string): boolean => {
    const match = variable.match(/^([XYMTC])(\d+)$/i);
    if (!match) return false;

    const kindChar = match[1].toUpperCase();
    const index = parseInt(match[2], 10);

    switch (kindChar) {
      case 'X':
        return ioState.inputs[index] ?? false;
      case 'Y':
        return ioState.outputs[index] ?? false;
      case 'M':
        return ioState.relays[index] ?? false;
      case 'T':
        return ioState.timers[index]?.done ?? false;
      case 'C':
        return ioState.counters[index]?.done ?? false;
      default:
        return false;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.effectAllowed = 'copy';
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const rungIdx = Math.floor((e.clientY - rect.top) / (cellSize * 1.5));
    setDragOverRung(rungIdx >= 0 && rungIdx < program.rungs.length ? rungIdx : null);
  };

  const handleDragLeave = () => {
    setDragOverRung(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverRung(null);

    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const dropData: DropData = JSON.parse(data);
      const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / cellSize);
      const clampedX = Math.max(1, Math.min(gridCols - 2, x));
      const rungIdx = Math.floor((e.clientY - rect.top) / (cellSize * 1.5));
      const clampedRungIdx = Math.max(0, Math.min(program.rungs.length - 1, rungIdx));

      const newElement: PlcElement = {
        id: uuidv4(),
        type: dropData.type,
        variable: dropData.variable,
        value: dropData.value,
        x: clampedX,
        y: 0,
        state: false,
      };

      const rungId = program.rungs[clampedRungIdx].id;
      addElement(rungId, newElement);
    } catch (error) {
      console.error('Failed to parse drop data:', error);
    }
  };

  const handleCanvasClick = () => {
    setSelectedElement(null);
  };

  const handleElementClick = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setSelectedElement(elementId);
  };

  const renderGridLines = () => {
    const lines = [];

    for (let col = 0; col <= gridCols; col++) {
      lines.push(
        <line
          key={`v-${col}`}
          x1={col * cellSize}
          y1={0}
          x2={col * cellSize}
          y2={svgHeight}
          stroke="#e5e7eb"
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      );
    }

    for (let rungIdx = 0; rungIdx < program.rungs.length; rungIdx++) {
      const rungY = rungIdx * cellSize * 1.5 + cellSize * 0.75;
      lines.push(
        <line
          key={`h-${rungIdx}`}
          x1={0}
          y1={rungY}
          x2={svgWidth}
          y2={rungY}
          stroke="#e5e7eb"
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      );
    }

    return lines;
  };

  const renderRung = (rungIndex: number) => {
    const rung = program.rungs[rungIndex];
    const rungY = rungIndex * cellSize * 1.5 + cellSize * 0.75;
    const rightBusX = (gridCols - 1) * cellSize;

    return (
      <g key={rung.id}>
        <line
          x1={0}
          y1={rungY}
          x2={rightBusX}
          y2={rungY}
          stroke="#374151"
          strokeWidth={2}
        />

        <rect
          x={0}
          y={rungY - cellSize * 0.6}
          width={cellSize * 0.3}
          height={cellSize * 1.2}
          fill="#1f2937"
          rx={2}
        />
        <line
          x1={cellSize * 0.15}
          y1={rungY - cellSize * 0.5}
          x2={cellSize * 0.15}
          y2={rungY + cellSize * 0.5}
          stroke="#fbbf24"
          strokeWidth={3}
        />

        <rect
          x={rightBusX - cellSize * 0.3}
          y={rungY - cellSize * 0.6}
          width={cellSize * 0.3}
          height={cellSize * 1.2}
          fill="#1f2937"
          rx={2}
        />
        <line
          x1={rightBusX - cellSize * 0.15}
          y1={rungY - cellSize * 0.5}
          x2={rightBusX - cellSize * 0.15}
          y2={rungY + cellSize * 0.5}
          stroke="#fbbf24"
          strokeWidth={3}
        />

        <text
          x={cellSize * 0.15}
          y={rungY - cellSize * 0.7}
          textAnchor="middle"
          fontSize="12"
          fill="#6b7280"
          fontWeight="bold"
        >
          {rungIndex + 1}
        </text>

        {dragOverRung === rungIndex && (
          <rect
            x={0}
            y={rungIndex * cellSize * 1.5}
            width={svgWidth}
            height={cellSize * 1.5}
            fill="#3b82f6"
            fillOpacity={0.1}
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        )}
      </g>
    );
  };

  const renderVerticalConnections = useMemo(() => {
    const connections: React.ReactNode[] = [];

    for (let rungIdx = 0; rungIdx < program.rungs.length; rungIdx++) {
      const rung = program.rungs[rungIdx];
      const byX = new Map<number, number[]>();

      for (const element of rung.elements) {
        if (!byX.has(element.x)) {
          byX.set(element.x, []);
        }
        byX.get(element.x)!.push(element.y);
      }

      for (const [x, yPositions] of byX.entries()) {
        if (yPositions.length > 1) {
          const sortedYs = [...yPositions].sort((a, b) => a - b);
          const minY = sortedYs[0];
          const maxY = sortedYs[sortedYs.length - 1];

          const xPos = x * cellSize + cellSize / 2;
          const yStart = rungIdx * cellSize * 1.5 + minY * cellSize + cellSize * 0.75;
          const yEnd = rungIdx * cellSize * 1.5 + maxY * cellSize + cellSize * 0.75;

          connections.push(
            <line
              key={`vc-${rungIdx}-${x}`}
              x1={xPos}
              y1={yStart}
              x2={xPos}
              y2={yEnd}
              stroke="#374151"
              strokeWidth={2}
            />
          );
        }
      }
    }

    return connections;
  }, [program.rungs, cellSize]);

  const renderElements = () => {
    const elements: React.ReactNode[] = [];

    for (let rungIdx = 0; rungIdx < program.rungs.length; rungIdx++) {
      const rung = program.rungs[rungIdx];

      for (const element of rung.elements) {
        const elementWithState: PlcElement = {
          ...element,
          y: element.y + rungIdx,
          state: getVariableState(element.variable),
        };

        elements.push(
          <PlcElementSvg
            key={element.id}
            element={elementWithState}
            cellSize={cellSize}
            isSelected={selectedElementId === element.id}
            onClick={(e) => handleElementClick(e, element.id)}
          />
        );
      }
    }

    return elements;
  };

  return (
    <div className="ladder-editor" style={{ overflow: 'auto', position: 'relative' }}>
      <svg
        width={svgWidth}
        height={svgHeight}
        onClick={handleCanvasClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ background: '#ffffff', display: 'block' }}
      >
        {renderGridLines()}
        {program.rungs.map((_, idx) => renderRung(idx))}
        {renderVerticalConnections}
        {renderElements()}
      </svg>
    </div>
  );
};
