import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { Timeline } from '@/components/Timeline';
import { PlaqueList } from '@/components/PlaqueList';
import { FontDescription } from '@/components/FontDescription';
import { PeriodNavButtons } from '@/components/PeriodNavButtons';
import { FavoritesPanel } from '@/components/FavoritesPanel';
import { useFavorites } from '@/hooks/useFavorites';
import { fetchPeriods, fetchPlaques } from '@/data/mockData';
import type { Period, Plaque } from '@/types';

export default function Home() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [plaques, setPlaques] = useState<Plaque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState(0);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [periodsData, plaquesData] = await Promise.all([
          fetchPeriods(),
          fetchPlaques()
        ]);
        setPeriods(periodsData);
        setPlaques(plaquesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '数据加载失败');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-stone-600">数据加载中...</p>
        </div>
      </div>
    );
  }

  if (error || periods.length === 0 || plaques.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error || '数据加载失败'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  const currentPeriod = periods[currentPeriodIndex];
  const currentPlaques = plaques.filter(p => p.periodId === currentPeriod.id);
  const favoritePlaques = plaques.filter(p => favoriteIds.includes(p.id));

  const handlePeriodChange = (periodId: string) => {
    const index = periods.findIndex(p => p.id === periodId);
    if (index !== -1) {
      setCurrentPeriodIndex(index);
    }
  };

  const handlePrevPeriod = () => {
    if (currentPeriodIndex > 0) {
      setCurrentPeriodIndex(prev => prev - 1);
    }
  };

  const handleNextPeriod = () => {
    if (currentPeriodIndex < periods.length - 1) {
      setCurrentPeriodIndex(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-100">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800 opacity-95" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 
              className="text-4xl md:text-5xl font-bold text-amber-100 mb-4 tracking-wider"
              style={{ fontFamily: 'serif' }}
            >
              中华老字号匾额
            </h1>
            <p className="text-xl text-amber-200 mb-2 font-light">
              字体演变时间轴
            </p>
            <p className="text-stone-400 max-w-2xl mx-auto">
              穿越千年时光，探寻中国传统匾额书法艺术的演变历程
            </p>
          </div>
          
          <button
            onClick={() => setIsFavoritesOpen(true)}
            className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-sm"
          >
            <Heart size={20} fill={favoriteIds.length > 0 ? 'currentColor' : 'none'} className={favoriteIds.length > 0 ? 'text-red-400' : ''} />
            <span>我的收藏</span>
            {favoriteIds.length > 0 && (
              <span className="w-6 h-6 bg-red-500 rounded-full text-sm flex items-center justify-center">
                {favoriteIds.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="mb-8">
          <Timeline
            periods={periods}
            currentPeriodId={currentPeriod.id}
            onPeriodChange={handlePeriodChange}
          />
        </section>

        <PeriodNavButtons
          canGoBack={currentPeriodIndex > 0}
          canGoForward={currentPeriodIndex < periods.length - 1}
          onPrev={handlePrevPeriod}
          onNext={handleNextPeriod}
          currentPeriodName={currentPeriod.name}
        />

        <section className="mb-10">
          <FontDescription period={currentPeriod} />
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-amber-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-stone-800" style={{ fontFamily: 'serif' }}>
              {currentPeriod.name}著名匾额
            </h2>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
              {currentPlaques.length} 块
            </span>
          </div>
          
          <PlaqueList
            plaques={currentPlaques}
            isFavorite={isFavorite}
            toggleFavorite={toggleFavorite}
          />
        </section>
      </main>

      <footer className="bg-stone-800 text-stone-400 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-2">中华老字号匾额字体演变时间轴</p>
          <p className="text-sm text-stone-500">传承中华书法艺术 · 弘扬老字号文化</p>
        </div>
      </footer>

      <FavoritesPanel
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favoritePlaques={favoritePlaques}
        onRemoveFavorite={toggleFavorite}
      />
    </div>
  );
}
