import { useState, useMemo } from 'react';
import { TreeDeciduous, Info } from 'lucide-react';
import { CityMap } from '@/components/Map/CityMap';
import { ParkDetail } from '@/components/ParkInfo/ParkDetail';
import { FavoriteList } from '@/components/ParkInfo/FavoriteList';
import { AddressSearch } from '@/components/Search/AddressSearch';
import { WalkabilityResult } from '@/components/Search/WalkabilityResult';
import { ParkTypeFilter } from '@/components/Filter/ParkTypeFilter';
import { districts } from '@/data/districts';
import { parks } from '@/data/parks';
import { presetAddresses } from '@/data/addresses';
import { useFavorites } from '@/hooks/useFavorites';
import { findNearestParks } from '@/utils/distance';
import { Park, ParkType, Address, WalkabilityResult as WalkabilityResultType } from '@/types';

export default function Home() {
  const [selectedPark, setSelectedPark] = useState<Park | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<ParkType[]>([
    'comprehensive',
    'community',
    'specialized',
    'garden',
  ]);
  const [searchAddress, setSearchAddress] = useState<Address | null>(null);
  const [walkabilityResults, setWalkabilityResults] = useState<WalkabilityResultType[]>([]);
  const [showFavorites, setShowFavorites] = useState(true);

  const { favorites, toggleFavorite, isFavorite, removeFavorite } = useFavorites();

  const filteredParks = useMemo(() => {
    return parks.filter((park) => selectedTypes.includes(park.type));
  }, [selectedTypes]);

  const favoriteParks = useMemo(() => {
    return parks.filter((park) => favorites.some((f) => f.parkId === park.id));
  }, [favorites]);

  const handleParkClick = (park: Park) => {
    setSelectedPark(park);
  };

  const handleParkClickById = (parkId: string) => {
    const park = parks.find((p) => p.id === parkId);
    if (park) {
      setSelectedPark(park);
    }
  };

  const handleTypeToggle = (type: ParkType) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleAddressSearch = (address: Address | null) => {
    setSearchAddress(address);
    if (address) {
      const results = findNearestParks(address.x, address.y, parks, 2);
      setWalkabilityResults(results);
    } else {
      setWalkabilityResults([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <TreeDeciduous className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">城市公园绿地分布</h1>
                <p className="text-xs text-gray-500">步行可达性分析系统</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Info className="w-4 h-4" />
              <span>共 {parks.length} 个公园 · 6 个行政区</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    地址搜索
                  </label>
                  <AddressSearch
                    addresses={presetAddresses}
                    onSearch={handleAddressSearch}
                    currentAddress={searchAddress}
                  />
                </div>
                <div className="md:w-80">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    公园类型筛选
                  </label>
                  <ParkTypeFilter
                    selectedTypes={selectedTypes}
                    onTypeToggle={handleTypeToggle}
                  />
                </div>
              </div>
            </div>

            {walkabilityResults.length > 0 && (
              <WalkabilityResult
                results={walkabilityResults}
                onParkClick={handleParkClickById}
              />
            )}

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h2 className="text-sm font-medium text-gray-700 mb-3">城市公园分布图</h2>
              <div className="aspect-video">
                <CityMap
                  districts={districts}
                  parks={filteredParks}
                  selectedPark={selectedPark}
                  onParkClick={handleParkClick}
                  searchLocation={searchAddress}
                  walkabilityResults={walkabilityResults}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-700"></span>
                  <span>综合公园</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span>社区公园</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                  <span>专类公园</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  <span>游园</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">●</span>
                  <span>圆点大小表示公园面积</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 min-h-96">
              <h2 className="text-sm font-medium text-gray-700 mb-3">公园详情</h2>
              <div className="h-80">
                <ParkDetail
                  park={selectedPark}
                  isFavorite={selectedPark ? isFavorite(selectedPark.id) : false}
                  onToggleFavorite={() => selectedPark && toggleFavorite(selectedPark.id)}
                  onClose={() => setSelectedPark(null)}
                />
              </div>
            </div>

            <FavoriteList
              parks={favoriteParks}
              onParkClick={handleParkClick}
              onRemove={removeFavorite}
              isExpanded={showFavorites}
              onToggle={() => setShowFavorites(!showFavorites)}
            />
          </div>
        </div>
      </main>

      <footer className="mt-12 py-6 border-t border-gray-100 bg-white">
        <div className="max-w-screen-2xl mx-auto px-6 text-center text-sm text-gray-500">
          <p>城市公园绿地分布与步行可达性分析系统 · 数据仅供参考</p>
        </div>
      </footer>
    </div>
  );
}
