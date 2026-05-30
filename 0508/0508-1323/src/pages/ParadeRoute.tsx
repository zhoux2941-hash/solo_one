import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { MeritDisplay } from '../components/MeritDisplay';
import { RouteMap } from '../components/RouteMap';
import { useGameStore } from '../store/useGameStore';
import { temples } from '../data/temples';
import { tasks } from '../data/tasks';
import { badges } from '../data/badges';
import { endings } from '../data/endings';
import { exportRouteMap } from '../utils/export';
import { Award, RotateCcw, Download, CheckCircle, MapPin } from 'lucide-react';

export default function ParadeRoute() {
  const navigate = useNavigate();
  const currentRole = useGameStore((state) => state.currentRole);
  const merit = useGameStore((state) => state.merit);
  const completedTemples = useGameStore((state) => state.completedTemples);
  const completedTasks = useGameStore((state) => state.completedTasks);
  const currentTempleIndex = useGameStore((state) => state.currentTempleIndex);
  const unlockedBadges = useGameStore((state) => state.unlockedBadges);
  const resetGame = useGameStore((state) => state.resetGame);
  const setEnding = useGameStore((state) => state.setEnding);

  const progress = useMemo(() => {
    return Math.round((completedTemples.length / temples.length) * 100);
  }, [completedTemples.length]);

  const nextBadge = useMemo(() => {
    return badges.find((badge) => !unlockedBadges.includes(badge.id));
  }, [unlockedBadges]);

  const allTemplesCompleted = completedTemples.length >= temples.length;

  const totalTasksForRole = useMemo(() => {
    if (!currentRole) return 0;
    return tasks.filter((t) => t.roleId === currentRole.id).length;
  }, [currentRole]);

  const allTasksCompleted = completedTasks.length >= totalTasksForRole && totalTasksForRole > 0;

  useEffect(() => {
    if (!currentRole) {
      navigate('/');
    }
  }, [currentRole, navigate]);

  useEffect(() => {
    if (allTemplesCompleted) {
      const ending = endings.find((e) => {
        const meritMatch = merit >= e.minMerit && merit <= e.maxMerit;
        
        if (e.type === 'perfect') {
          return meritMatch && allTasksCompleted;
        }
        
        if (e.type === 'regret') {
          return meritMatch && !allTasksCompleted;
        }
        
        return meritMatch;
      });
      
      if (ending) {
        setEnding(ending);
        setTimeout(() => {
          navigate('/ending');
        }, 1500);
      }
    }
  }, [allTemplesCompleted, allTasksCompleted, merit, navigate, setEnding]);

  const handleNavigate = (route: 'map' | 'badges') => {
    if (route === 'badges') {
      navigate('/badges');
    }
  };

  const handleViewBadges = () => {
    navigate('/badges');
  };

  const handleReset = () => {
    if (window.confirm('确定要重置游戏吗？所有进度将会丢失。')) {
      resetGame();
      navigate('/');
    }
  };

  const handleExport = async () => {
    try {
      await exportRouteMap('route-map-container', '绕三灵路线图.png');
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出路线图失败，请重试');
    }
  };

  if (!currentRole) {
    return null;
  }

  return (
    <div className="min-h-screen bg-batik-pattern">
      <Navbar
        currentRole={currentRole}
        merit={merit}
        onNavigate={handleNavigate}
        activeRoute="map"
      />

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-ivory to-white rounded-2xl p-5 shadow-batik border-2 border-gold/30">
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
                  style={{
                    background: `radial-gradient(circle, ${currentRole.color}33 0%, ${currentRole.color}11 70%, transparent 100%)`,
                    border: `3px solid ${currentRole.color}`,
                  }}
                >
                  {currentRole.avatar}
                </div>
                <div>
                  <p className="font-baicalligraphy text-xl text-indigo-batik">
                    {currentRole.name}
                  </p>
                  <p className="text-xs text-indigo-batik/60">当前角色</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-indigo-batik/70 flex items-center">
                    <MapPin className="w-4 h-4 mr-1.5 text-embroidery-red" />
                    当前位置
                  </span>
                  <span className="font-medium text-indigo-batik">
                    第 {Math.min(currentTempleIndex + 1, temples.length)} 站
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-indigo-batik/70 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1.5 text-cangshan-green" />
                      完成进度
                    </span>
                    <span className="font-bold text-gold">{progress}%</span>
                  </div>
                  <div className="h-3 bg-ivory rounded-full overflow-hidden border border-gold/30">
                    <div
                      className="h-full bg-gradient-to-r from-cangshan-green via-gold to-embroidery-red rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-indigo-batik/50 mt-1 text-right">
                    {completedTemples.length} / {temples.length} 座庙宇
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <MeritDisplay
              currentMerit={merit}
              nextBadge={nextBadge}
              showAnimation={true}
            />
          </div>
        </div>

        <div id="route-map-container" className="mb-6 h-[500px] md:h-[600px]">
          <RouteMap />
        </div>

        <div className="bg-gradient-to-r from-ivory/80 via-white to-ivory/80 rounded-2xl p-4 md:p-6 shadow-batik border-2 border-gold/20">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={handleViewBadges}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-gold/20 to-embroidery-red/20 text-indigo-batik font-medium rounded-xl border-2 border-gold/30 hover:border-gold hover:shadow-lg transition-all duration-300"
            >
              <Award className="w-5 h-5 text-gold" />
              <span>查看徽章</span>
              {unlockedBadges.length > 0 && (
                <span className="bg-embroidery-red text-white text-xs px-2 py-0.5 rounded-full">
                  {unlockedBadges.length}
                </span>
              )}
            </button>

            <button
              onClick={handleReset}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-50 text-indigo-batik/70 font-medium rounded-xl border-2 border-gray-200 hover:border-embroidery-red hover:text-embroidery-red transition-all duration-300"
            >
              <RotateCcw className="w-5 h-5" />
              <span>重置游戏</span>
            </button>

            <button
              onClick={handleExport}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-batik to-erhai-blue text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Download className="w-5 h-5" />
              <span>导出路线图</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
