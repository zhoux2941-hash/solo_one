import React, { useMemo } from 'react';
import { NumberCell } from './NumberCell';
import { NumberItem } from '@/types';

interface NumberGridProps {
  numbers: NumberItem[];
  n: number;
}

export const NumberGrid: React.FC<NumberGridProps> = ({ numbers, n }) => {
  const { columns, cellSize, fontSize } = useMemo(() => {
    if (n <= 100) {
      return { columns: 10, cellSize: '48px', fontSize: '16px' };
    } else if (n <= 200) {
      return { columns: 15, cellSize: '40px', fontSize: '14px' };
    } else if (n <= 500) {
      return { columns: 20, cellSize: '32px', fontSize: '12px' };
    } else if (n <= 1000) {
      return { columns: 30, cellSize: '26px', fontSize: '11px' };
    } else if (n <= 2000) {
      return { columns: 40, cellSize: '22px', fontSize: '10px' };
    } else if (n <= 5000) {
      return { columns: 60, cellSize: '16px', fontSize: '9px' };
    } else {
      return { columns: 80, cellSize: '13px', fontSize: '8px' };
    }
  }, [n]);

  if (numbers.length === 0) {
    return (
      <div className="card min-h-[400px] flex items-center justify-center">
        <p className="text-slate-400 text-lg">请输入N值并生成数字网格</p>
      </div>
    );
  }

  return (
    <div className="card overflow-auto max-h-[60vh]">
      <div
        className="grid gap-1 justify-center"
        style={{
          gridTemplateColumns: `repeat(${columns}, ${cellSize})`,
        }}
      >
        {numbers.map((item, index) => (
          <NumberCell
            key={item.value}
            item={item}
            cellSize={cellSize}
            fontSize={fontSize}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};
