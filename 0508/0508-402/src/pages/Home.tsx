import React from 'react';
import { Droplets, ScrollText } from 'lucide-react';
import { CityList } from '../components/CityOverview/CityList';
import { DrainageMap } from '../components/DrainageSystem/DrainageMap';
import { DrainageDescriptionSection } from '../components/Description/DrainageDescription';
import { CompareMode } from '../components/Compare/CompareMode';
import { FavoriteList } from '../components/Favorite/FavoriteButton';
import { useAppStore } from '../store/useAppStore';
import { getCityById } from '../data/cities';
import { cn } from '../utils';

export const Home: React.FC = () => {
  const { selectedCityId, compareMode, compareCityIds } = useAppStore();

  const selectedCity = selectedCityId ? getCityById(selectedCityId) : null;

  const showCompareView = compareMode && compareCityIds.length > 0;
  const showDetailView = !compareMode && selectedCity;

  return (
    <div className="min-h-screen bg-gradient-to-b from-ochre-50 via-cream-50 to-cream-100">
      <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-sm border-b border-ochre-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-ochre-500 to-ochre-600 rounded-xl shadow-lg shadow-ochre-500/30">
                <Droplets size={28} className="text-white" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-ochre-700 gold-gradient-text">
                  古代城池排水系统
                </h1>
                <p className="text-xs text-slategray-500">探索中国古代城市水利工程的智慧</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FavoriteList />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="text-center mb-12 scroll-reveal-item">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-ochre-100 text-ochre-600 rounded-full text-sm font-medium mb-4">
            <ScrollText size={16} />
            楚纪南城 · 汉长安城 · 唐洛阳城
          </div>
          <h2 className="font-serif text-4xl font-bold text-ochre-800 mb-3">
            古代城池排水系统设计对比
          </h2>
          <p className="text-slategray-600 max-w-2xl mx-auto leading-relaxed">
            穿越千年时光，领略中国古代城市建设的非凡智慧。通过交互式展示，深入了解不同朝代城池排水系统的设计理念、工程技术与文化内涵。
          </p>
        </div>

        <CityList />

        {showCompareView && (
          <div className="mt-8 scroll-reveal-item">
            <CompareMode />
          </div>
        )}

        {showDetailView && selectedCity && (
          <div className="space-y-8 mt-8">
            <div className="scroll-reveal-item">
              <DrainageMap city={selectedCity} />
            </div>
            <div className="scroll-reveal-item" style={{ animationDelay: '0.1s' }}>
              <DrainageDescriptionSection city={selectedCity} />
            </div>
          </div>
        )}

        {!showCompareView && !showDetailView && (
          <div className="mt-12 text-center py-16 bg-cream-100/50 rounded-2xl border-2 border-dashed border-ochre-200 scroll-reveal-item">
            <div className="inline-flex p-4 bg-ochre-100 rounded-full mb-4">
              <Droplets size={40} className="text-ochre-500" />
            </div>
            <h3 className="font-serif text-xl font-bold text-ochre-700 mb-2">选择一座城池开始探索</h3>
            <p className="text-slategray-500 mb-6">点击上方任意城池卡片，查看其详细的排水系统设计</p>
            <div className="flex items-center justify-center gap-4 text-sm text-slategray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-ochre-500" />
                查看排水系统结构图
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-navy-500" />
                对比两座城池差异
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                收藏感兴趣的城池
              </span>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-16 py-8 border-t border-ochre-200 bg-cream-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slategray-500">
              <Droplets size={18} className="text-ochre-500" />
              <span className="text-sm">古代城池排水系统设计对比平台</span>
            </div>
            <p className="text-xs text-slategray-400">
              基于考古研究成果整理 · 传承中国古代工程智慧
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
