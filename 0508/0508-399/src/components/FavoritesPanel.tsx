import React from 'react';
import { X, Heart, Trash2 } from 'lucide-react';
import type { Plaque } from '../types';

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  favoritePlaques: Plaque[];
  onRemoveFavorite: (plaqueId: string) => void;
}

export function FavoritesPanel({ 
  isOpen, 
  onClose, 
  favoritePlaques, 
  onRemoveFavorite 
}: FavoritesPanelProps) {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Heart size={20} className="text-red-500" fill="currentColor" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-800">我的收藏</h2>
                <p className="text-sm text-stone-500">{favoritePlaques.length} 块匾额</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X size={24} className="text-stone-600" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {favoritePlaques.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                  <Heart size={40} className="text-stone-300" />
                </div>
                <h3 className="text-lg font-medium text-stone-700 mb-2">暂无收藏</h3>
                <p className="text-stone-500">点击匾额卡片上的爱心按钮，收藏你喜欢的匾额</p>
              </div>
            ) : (
              <div className="space-y-4">
                {favoritePlaques.map((plaque) => (
                  <div 
                    key={plaque.id}
                    className="flex gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100 group"
                  >
                    <img 
                      src={plaque.imageUrl}
                      alt={plaque.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-stone-800 truncate">{plaque.name}</h4>
                      <p className="text-sm text-stone-600 truncate">{plaque.shopName}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                        {plaque.fontType}
                      </span>
                    </div>
                    <button
                      onClick={() => onRemoveFavorite(plaque.id)}
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="取消收藏"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
