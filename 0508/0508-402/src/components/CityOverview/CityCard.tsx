import React from 'react';
import { Heart, MapPin, Calendar, Users } from 'lucide-react';
import { City } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { pointsToPath, cn } from '../../utils';

interface CityCardProps {
  city: City;
  index: number;
}

export const CityCard: React.FC<CityCardProps> = ({ city, index }) => {
  const {
    selectedCityId,
    compareMode,
    compareCityIds,
    favorites,
    setSelectedCity,
    addCompareCity,
    removeCompareCity,
    toggleFavorite,
  } = useAppStore();

  const isSelected = selectedCityId === city.id;
  const isInCompare = compareCityIds.includes(city.id);
  const isFavorite = favorites.includes(city.id);
  const isCompareFull = compareCityIds.length >= 2;

  const handleClick = () => {
    if (compareMode) {
      if (isInCompare) {
        removeCompareCity(city.id);
      } else if (!isCompareFull) {
        addCompareCity(city.id);
      }
    } else {
      setSelectedCity(city.id);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(city.id);
  };

  const outlinePath = pointsToPath(city.outline);

  return (
    <div
      className={cn(
        'relative ancient-border bg-cream-50 p-4 cursor-pointer city-card-hover',
        'scroll-reveal-item',
        isSelected && !compareMode && 'ring-2 ring-gold-500 shadow-lg shadow-gold-500/20',
        isInCompare && 'ring-2 ring-navy-500',
        compareMode && !isInCompare && isCompareFull && 'opacity-50 cursor-not-allowed'
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={handleClick}
    >
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-xl font-bold text-ochre-700 flex-shrink-0">{city.name}</h3>
          <span className="px-2 py-1 text-xs font-medium bg-ochre-100 text-ochre-600 rounded flex-shrink-0">
            {city.dynasty}
          </span>
          <div className="flex-1" />
          <button
            className={cn(
              'p-1.5 rounded-full transition-all duration-300 flex-shrink-0',
              'hover:scale-110',
              isFavorite ? 'text-red-500 bg-red-50' : 'text-slategray-400 hover:text-red-400 hover:bg-red-50'
            )}
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? '取消收藏' : '收藏'}
          >
            <Heart
              size={18}
              className={cn('transition-all duration-300', isFavorite && 'fill-current')}
            />
          </button>
        </div>
        <p className="text-sm text-slategray-500 mt-1">{city.era} · {city.year}</p>
      </div>

      <div className="relative bg-cream-100 rounded-lg overflow-hidden mb-3" style={{ height: '180px' }}>
        <svg viewBox="0 0 600 520" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id={`grid-${city.id}`} width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E8D5C4" strokeWidth="0.5" />
            </pattern>
          </defs>

          <rect width="600" height="520" fill={`url(#grid-${city.id})`} />

          <path
            d={outlinePath}
            className="city-wall"
            style={{
              filter: isSelected ? 'drop-shadow(0 0 8px rgba(218, 165, 32, 0.6))' : 'none',
            }}
          />

          {city.gates.map((gate, gateIndex) => (
            <g key={gate.name}>
              <rect
                x={gate.x - 12}
                y={gate.y - 8}
                width="24"
                height="16"
                rx="2"
                className="city-gate"
              />
              <text
                x={gate.x}
                y={gate.side === 'north' ? gate.y - 14 : gate.y + 28}
                textAnchor="middle"
                className="fill-ochre-700"
                style={{ fontSize: '10px', fontFamily: 'Noto Serif SC' }}
              >
                {gate.name}
              </text>
            </g>
          ))}

          <text
            x="300"
            y="280"
            textAnchor="middle"
            className="fill-ochre-600"
            style={{
              fontSize: '48px',
              fontFamily: 'Noto Serif SC',
              fontWeight: 600,
              opacity: 0.15,
            }}
          >
            {city.name}
          </text>
        </svg>

        {compareMode && isInCompare && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-navy-500 text-white text-xs font-bold rounded">
            对比 {compareCityIds.indexOf(city.id) + 1}
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-slategray-600">
          <MapPin size={14} className="text-ochre-500" />
          <span>面积：{city.area} 平方公里</span>
        </div>
        <div className="flex items-center gap-2 text-slategray-600">
          <Users size={14} className="text-ochre-500" />
          <span>人口：{city.population}</span>
        </div>
        <div className="flex items-center gap-2 text-slategray-600">
          <Calendar size={14} className="text-ochre-500" />
          <span>城门：{city.gates.length} 座</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-slategray-500 line-clamp-2 leading-relaxed">
        {city.description}
      </p>

      {compareMode && (
        <div className="mt-3 pt-3 border-t border-ochre-200">
          {isInCompare ? (
            <button
              className="w-full py-2 text-sm font-medium text-navy-600 bg-navy-50 rounded hover:bg-navy-100 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                removeCompareCity(city.id);
              }}
            >
              移出对比
            </button>
          ) : (
            <button
              className={cn(
                'w-full py-2 text-sm font-medium rounded transition-colors',
                isCompareFull
                  ? 'text-slategray-400 bg-slategray-100 cursor-not-allowed'
                  : 'text-navy-600 bg-navy-50 hover:bg-navy-100'
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (!isCompareFull) addCompareCity(city.id);
              }}
              disabled={isCompareFull}
            >
              {isCompareFull ? '对比已满' : '加入对比'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
