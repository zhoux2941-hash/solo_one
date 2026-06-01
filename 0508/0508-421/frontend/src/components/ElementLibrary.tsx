import React from 'react';
import type { ElementType } from '../types/plc';
import { NormallyOpen } from './elements/NormallyOpen';
import { NormallyClosed } from './elements/NormallyClosed';
import { Coil } from './elements/Coil';
import { TimerElement } from './elements/TimerElement';
import { CounterElement } from './elements/CounterElement';

interface PaletteItem {
  type: ElementType;
  label: string;
  variable: string;
  value?: number;
}

const paletteItems: PaletteItem[] = [
  { type: 'normally-open', label: '常开触点', variable: 'X0' },
  { type: 'normally-closed', label: '常闭触点', variable: 'X1' },
  { type: 'coil', label: '线圈', variable: 'Y0' },
  { type: 'timer', label: '定时器', variable: 'T0', value: 100 },
  { type: 'counter', label: '计数器', variable: 'C0', value: 10 },
];

const renderPreview = (item: PaletteItem) => {
  const cellSize = 60;
  const stroke = '#666666';

  switch (item.type) {
    case 'normally-open':
      return (
        <NormallyOpen cellSize={cellSize} stroke={stroke} variable={item.variable} />
      );
    case 'normally-closed':
      return (
        <NormallyClosed cellSize={cellSize} stroke={stroke} variable={item.variable} />
      );
    case 'coil':
      return <Coil cellSize={cellSize} stroke={stroke} variable={item.variable} />;
    case 'timer':
      return (
        <TimerElement
          cellSize={cellSize}
          stroke={stroke}
          variable={item.variable}
          value={item.value}
        />
      );
    case 'counter':
      return (
        <CounterElement
          cellSize={cellSize}
          stroke={stroke}
          variable={item.variable}
          value={item.value}
        />
      );
    default:
      return null;
  }
};

export const ElementLibrary: React.FC = () => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: PaletteItem) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: item.type,
        variable: item.variable,
        value: item.value,
      })
    );
  };

  return (
    <div
      style={{
        width: '200px',
        backgroundColor: '#f5f5f5',
        borderRight: '1px solid #ddd',
        height: '100%',
        overflowY: 'auto',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: '16px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#333',
        }}
      >
        元件库
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {paletteItems.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              cursor: 'grab',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e3f2fd';
              e.currentTarget.style.borderColor = '#2196f3';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.borderColor = '#e0e0e0';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="60" height="60" style={{ flexShrink: 0 }}>
              {renderPreview(item)}
            </svg>
            <span
              style={{
                fontSize: '14px',
                color: '#333',
                fontWeight: '500',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
