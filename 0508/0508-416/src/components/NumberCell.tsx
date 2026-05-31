import React, { useEffect, useState } from 'react';
import { NumberItem } from '@/types';

interface NumberCellProps {
  item: NumberItem;
  cellSize: string;
  fontSize: string;
  index: number;
}

export const NumberCell: React.FC<NumberCellProps> = ({ item, cellSize, fontSize, index }) => {
  const [animateIn, setAnimateIn] = useState(false);
  const [animateStrike, setAnimateStrike] = useState(false);
  const [animatePrime, setAnimatePrime] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateIn(true);
    }, index * 5);
    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    if (item.showStrike) {
      setAnimateStrike(true);
    }
  }, [item.showStrike]);

  useEffect(() => {
    if (item.status === 'prime') {
      setAnimatePrime(true);
      const timer = setTimeout(() => setAnimatePrime(false), 800);
      return () => clearTimeout(timer);
    }
  }, [item.status]);

  return (
    <div
      className={`number-cell ${item.status} ${animateIn ? 'animate-fade-in' : 'opacity-0'} ${
        animatePrime ? 'animate-scale-pulse' : ''
      }`}
      style={{
        width: cellSize,
        height: cellSize,
        fontSize,
        animationDelay: `${index * 2}ms`,
        opacity: animateIn ? 1 : 0,
        transform: animateIn ? 'translateY(0)' : 'translateY(5px)',
        transition: 'all 0.3s ease-out',
        contain: 'strict',
      }}
    >
      {item.value}
      {item.showStrike && (
        <span
          className="strike-line"
          style={{
            width: animateStrike ? '100%' : '0%',
            transition: 'width 0.4s ease-out',
          }}
        />
      )}
    </div>
  );
};
