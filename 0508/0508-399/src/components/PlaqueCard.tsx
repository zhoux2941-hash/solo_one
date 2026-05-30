import React from 'react';
import { Heart } from 'lucide-react';
import type { Plaque } from '../types';

interface PlaqueCardProps {
  plaque: Plaque;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  index?: number;
}

export function PlaqueCard({ plaque, isFavorite, onToggleFavorite, index = 0 }: PlaqueCardProps) {
  return (
    <div 
      className="group relative bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="relative h-56 overflow-hidden">
        <img 
          src={plaque.imageUrl} 
          alt={plaque.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`absolute top-4 right-4 p-3 rounded-full transition-all duration-300 ${
            isFavorite 
              ? 'bg-red-500 text-white scale-110' 
              : 'bg-white/80 text-stone-600 hover:bg-white hover:scale-110'
          }`}
        >
          <Heart 
            size={20} 
            fill={isFavorite ? 'currentColor' : 'none'}
            className={`transition-transform duration-300 ${isFavorite ? 'animate-pulse' : ''}`}
          />
        </button>
        
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-white drop-shadow-lg" style={{ fontFamily: 'serif' }}>
            {plaque.name}
          </h3>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
              {plaque.dynasty}
            </span>
            <span className="px-3 py-1 bg-stone-100 text-stone-700 text-sm font-medium rounded-full">
              {plaque.fontType}
            </span>
          </div>
          {plaque.calligrapher && (
            <span className="text-sm text-stone-500">
              书：{plaque.calligrapher}
            </span>
          )}
        </div>
        
        <div className="mb-3">
          <span className="text-stone-600 font-medium">{plaque.shopName}</span>
        </div>
        
        <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed">
          {plaque.description}
        </p>
      </div>
      
      <div className="absolute inset-0 border-2 border-amber-500/0 rounded-xl transition-all duration-500 group-hover:border-amber-500/50 pointer-events-none" />
    </div>
  );
}
