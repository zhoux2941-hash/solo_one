import React from 'react';
import { PlaqueCard } from './PlaqueCard';
import type { Plaque } from '../types';

interface PlaqueListProps {
  plaques: Plaque[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
}

export function PlaqueList({ plaques, isFavorite, toggleFavorite }: PlaqueListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plaques.map((plaque, index) => (
        <PlaqueCard
          key={plaque.id}
          plaque={plaque}
          isFavorite={isFavorite(plaque.id)}
          onToggleFavorite={() => toggleFavorite(plaque.id)}
          index={index}
        />
      ))}
    </div>
  );
}
