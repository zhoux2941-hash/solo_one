import React from 'react';
import type { PlcElement } from '../../types/plc';
import { NormallyOpen } from './NormallyOpen';
import { NormallyClosed } from './NormallyClosed';
import { Coil } from './Coil';
import { TimerElement } from './TimerElement';
import { CounterElement } from './CounterElement';
import { BusBar } from './BusBar';
import { HorizontalLine } from './HorizontalLine';
import { VerticalLine } from './VerticalLine';

interface PlcElementSvgProps {
  element: PlcElement;
  cellSize?: number;
  onDragStart?: (e: React.MouseEvent<SVGGElement>, element: PlcElement) => void;
  onClick?: (e: React.MouseEvent<SVGGElement>, element: PlcElement) => void;
}

export const PlcElementSvg: React.FC<PlcElementSvgProps> = ({
  element,
  cellSize = 80,
  onDragStart,
  onClick,
}) => {
  const stroke = element.state ? '#ff0000' : '#666666';

  const renderElement = () => {
    switch (element.type) {
      case 'normally-open':
        return <NormallyOpen cellSize={cellSize} stroke={stroke} variable={element.variable} />;
      case 'normally-closed':
        return <NormallyClosed cellSize={cellSize} stroke={stroke} variable={element.variable} />;
      case 'coil':
        return <Coil cellSize={cellSize} stroke={stroke} variable={element.variable} />;
      case 'timer':
        return (
          <TimerElement
            cellSize={cellSize}
            stroke={stroke}
            variable={element.variable}
            value={element.value}
          />
        );
      case 'counter':
        return (
          <CounterElement
            cellSize={cellSize}
            stroke={stroke}
            variable={element.variable}
            value={element.value}
          />
        );
      case 'left-bus':
        return <BusBar cellSize={cellSize} position="left" />;
      case 'right-bus':
        return <BusBar cellSize={cellSize} position="right" />;
      case 'horizontal-line':
        return <HorizontalLine cellSize={cellSize} stroke={stroke} />;
      case 'vertical-line':
        return <VerticalLine cellSize={cellSize} stroke={stroke} />;
      default:
        return null;
    }
  };

  const gProps = {
    transform: `translate(${element.x * cellSize}, ${element.y * cellSize})`,
    draggable: true,
    onDragStart: (e: React.DragEvent<SVGGElement>) => onDragStart?.(e, element),
    onClick: (e: React.MouseEvent<SVGGElement>) => onClick?.(e, element),
    style: { cursor: 'pointer' },
  } as React.SVGProps<SVGGElement>;

  return (
    <g {...gProps}>
      {renderElement()}
    </g>
  );
};
