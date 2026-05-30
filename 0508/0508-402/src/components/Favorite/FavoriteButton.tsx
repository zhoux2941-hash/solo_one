import React, { useState } from 'react';
import { Heart, X, Bookmark, MapPin } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getCityById, CITIES } from '../../data/cities';
import { cn } from '../../utils';

interface FavoriteButtonProps {
  cityId: string;
  className?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ cityId, className = '' }) => {
  const { favorites, toggleFavorite } = useAppStore();
  const isFavorite = favorites.includes(cityId);

  return (
    <button
      onClick={() => toggleFavorite(cityId)}
      className={cn(
        'p-2 rounded-full transition-all duration-300',
        'hover:scale-110',
        isFavorite
          ? 'text-red-500 bg-red-50'
          : 'text-slategray-400 hover:text-red-400 hover:bg-red-50',
        className
      )}
      aria-label={isFavorite ? '取消收藏' : '收藏'}
    >
      <Heart
        size={20}
        className={cn('transition-all duration-300', isFavorite && 'fill-current')}
      />
    </button>
  );
};

interface FavoriteListProps {
  onSelectCity?: (cityId: string) => void;
}

export const FavoriteList: React.FC<FavoriteListProps> = ({ onSelectCity }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { favorites, setSelectedCity, toggleCompareMode, toggleFavorite } = useAppStore();

  const favoriteCities = favorites
    .map(id => getCityById(id))
    .filter(Boolean);

  const handleCityClick = (cityId: string) => {
    setSelectedCity(cityId);
    setIsOpen(false);
    onSelectCity?.(cityId);
  };

  const handleCompareClick = () => {
    toggleCompareMode();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 px-4 py-2 bg-ochre-100 text-ochre-700 rounded-lg hover:bg-ochre-200 transition-colors"
      >
        <Bookmark size={18} />
        <span className="font-medium">我的收藏</span>
        {favorites.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {favorites.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-cream-50 border border-ochre-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-scroll-reveal">
            <div className="px-4 py-3 bg-gradient-to-r from-ochre-500 to-ochre-600 text-white flex items-center justify-between">
              <h4 className="font-serif font-bold">收藏的城池</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {favoriteCities.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex p-3 bg-ochre-100 rounded-full mb-3">
                  <Bookmark size={24} className="text-ochre-400" />
                </div>
                <p className="text-slategray-500 text-sm">暂无收藏的城池</p>
                <p className="text-slategray-400 text-xs mt-1">点击城池卡片上的心形按钮收藏</p>
              </div>
            ) : (
              <>
                <div className="max-h-80 overflow-y-auto">
                  {favoriteCities.map((city) => city && (
                    <div
                      key={city.id}
                      className="px-4 py-3 border-b border-ochre-100 hover:bg-ochre-50 cursor-pointer transition-colors group"
                      onClick={() => handleCityClick(city.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-ochre-100 rounded-lg flex items-center justify-center text-ochre-600 font-serif font-bold">
                            {city.name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-ochre-700 group-hover:text-ochre-800">
                              {city.name}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-slategray-500">
                              <MapPin size={10} />
                              {city.dynasty}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(city.id);
                          }}
                          className="p-1.5 rounded-full text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {favoriteCities.length >= 2 && (
                  <div className="p-4 border-t border-ochre-200 bg-cream-100/50">
                    <button
                      onClick={handleCompareClick}
                      className="w-full py-2 bg-navy-500 text-white rounded-lg hover:bg-navy-600 transition-colors font-medium text-sm"
                    >
                      使用收藏城池进行对比
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
