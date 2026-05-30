import { useState, useMemo } from 'react';
import ChinaMap from '../components/ChinaMap';
import FilterBar from '../components/FilterBar';
import DetailPanel from '../components/DetailPanel';
import { NianhuaLocation, ThemeType } from '../types';
import { getNianhuaLocations } from '../config';
import { ScrollText } from 'lucide-react';

export default function Home() {
  const nianhuaLocations = useMemo(() => getNianhuaLocations(), []);
  const [selectedLocation, setSelectedLocation] = useState<NianhuaLocation | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('all');

  const handleLocationSelect = (location: NianhuaLocation) => {
    setSelectedLocation(location);
  };

  const handleThemeChange = (theme: ThemeType) => {
    setSelectedTheme(theme);
    if (theme !== 'all' && selectedLocation) {
      const hasTheme = selectedLocation.representativeWorks.some(
        (work) => work.theme === theme
      );
      if (!hasTheme) {
        const firstMatching = nianhuaLocations.find((loc) =>
          loc.representativeWorks.some((work) => work.theme === theme)
        );
        setSelectedLocation(firstMatching || null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 to-amber-50">
      <header className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 text-white py-5 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
              <ScrollText className="text-red-900" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wide">中国年画地图</h1>
              <p className="text-red-200 text-sm">探索八大年画产地的艺术魅力</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-red-100">
            <span>🏮 传承千年文化</span>
            <span>🎨 八大艺术流派</span>
            <span>🖼️ 30+经典作品</span>
          </div>
        </div>
      </header>

      <FilterBar selectedTheme={selectedTheme} onThemeChange={handleThemeChange} />

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
          <div className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden">
            <ChinaMap
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
              selectedTheme={selectedTheme}
            />
          </div>

          <div className="w-full lg:w-96 bg-white rounded-xl shadow-lg overflow-hidden">
            <DetailPanel location={selectedLocation} />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {nianhuaLocations.slice(0, 4).map((location) => (
            <button
              key={location.id}
              onClick={() => handleLocationSelect(location)}
              className={`p-4 rounded-lg text-left transition-all duration-300 ${
                selectedLocation?.id === location.id
                  ? 'bg-red-100 border-2 border-red-500 shadow-md'
                  : 'bg-white hover:bg-amber-50 border-2 border-transparent hover:border-amber-300'
              }`}
            >
              <div className="font-semibold text-gray-800">{location.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {location.styleFeatures.slice(0, 2).join(' · ')}
              </div>
            </button>
          ))}
        </div>
      </main>

      <footer className="bg-stone-800 text-stone-400 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm">
          <p>中国年画艺术 · 传承千年文化瑰宝</p>
          <p className="mt-2 text-stone-500">
            天津杨柳青 · 苏州桃花坞 · 山东杨家埠 · 河南朱仙镇 · 河北武强 · 陕西凤翔 · 四川绵竹 · 广东佛山
          </p>
        </div>
      </footer>
    </div>
  );
}
