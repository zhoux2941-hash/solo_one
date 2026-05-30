import MapView from '@/components/MapView';
import LineLegend from '@/components/LineLegend';
import StationDetail from '@/components/StationDetail';
import SearchBar from '@/components/SearchBar';
import RouteResult from '@/components/RouteResult';
import FavoritesPanel from '@/components/FavoritesPanel';
import { useAppStore } from '@/store/useAppStore';
import { Star, Route, X } from 'lucide-react';

export default function Home() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const selectedStationId = useAppStore((s) => s.selectedStationId);

  return (
    <div className="w-screen h-screen bg-gray-950 overflow-hidden relative">
      <MapView />
      <LineLegend />
      <SearchBar />
      <RouteResult />

      <div className="absolute top-4 right-4 z-40 flex flex-col gap-2">
        <button
          onClick={() => {
            setActiveTab(activeTab === 'favorites' ? 'route' : 'favorites');
          }}
          className={`p-2.5 bg-slate-900/80 backdrop-blur rounded-lg transition-colors ${
            activeTab === 'favorites'
              ? 'text-amber-400'
              : 'text-slate-400 hover:text-amber-400'
          }`}
          title="收藏路线"
        >
          <Star className="w-5 h-5" />
        </button>
      </div>

      {activeTab === 'favorites' && !selectedStationId && (
        <div className="fixed top-16 right-4 z-40 w-80 bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700/50 flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Route className="w-4 h-4 text-amber-400" />
              收藏路线
            </div>
            <button
              onClick={() => setActiveTab('route')}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <FavoritesPanel />
          </div>
        </div>
      )}

      <StationDetail />

      <div className="absolute bottom-3 right-3 z-10 text-slate-600 text-xs">
        全国高铁线路图 · 仅供参考
      </div>
    </div>
  );
}
