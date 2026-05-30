import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { BadgeCard } from '../components/BadgeCard';
import { MeritDisplay } from '../components/MeritDisplay';
import { useGameStore } from '../store/useGameStore';
import { badges } from '../data/badges';
import { Sparkles, Award, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function BadgeCollection() {
  const navigate = useNavigate();
  const currentRole = useGameStore((state) => state.currentRole);
  const merit = useGameStore((state) => state.merit);
  const unlockedBadges = useGameStore((state) => state.unlockedBadges);

  const sortedBadges = useMemo(() => {
    return [...badges].sort((a, b) => a.requiredMerit - b.requiredMerit);
  }, []);

  const nextBadge = useMemo(() => {
    return badges.find((badge) => !unlockedBadges.includes(badge.id));
  }, [unlockedBadges]);

  const stats = useMemo(() => {
    const unlocked = unlockedBadges.length;
    const total = badges.length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    return { unlocked, total, percentage };
  }, [unlockedBadges.length]);

  useEffect(() => {
    if (!currentRole) {
      navigate('/');
    }
  }, [currentRole, navigate]);

  const handleNavigate = (route: 'map' | 'badges') => {
    if (route === 'map') {
      navigate('/parade');
    }
  };

  if (!currentRole) {
    return (
      <div className="min-h-screen bg-batik-pattern flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-batik text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-embroidery-red/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-embroidery-red" />
          </div>
          <h2 className="font-baicalligraphy text-2xl text-indigo-batik mb-3">
            请先选择角色
          </h2>
          <p className="text-indigo-batik/60 mb-6">
            您需要先选择一个角色，才能开始收集徽章。请返回首页选择您的角色。
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gradient-to-r from-indigo-batik to-embroidery-red text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300"
          >
            返回首页选择角色
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-batik-pattern">
      <Navbar
        currentRole={currentRole}
        merit={merit}
        onNavigate={handleNavigate}
        activeRoute="badges"
      />

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-gold/10 px-4 py-2 rounded-full border border-gold/30 mb-4">
            <Award className="w-5 h-5 text-gold" />
            <span className="text-gold font-medium">徽章收藏馆</span>
          </div>
          <h1 className="font-baicalligraphy text-4xl md:text-5xl text-indigo-batik mb-3">
            我的徽章收藏
          </h1>
          <p className="text-indigo-batik/60 max-w-2xl mx-auto">
            完成绕三灵的各项任务，解锁珍贵徽章，记录您的文化之旅
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-ivory to-white rounded-3xl p-6 shadow-batik border-2 border-gold/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-embroidery-red flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-baicalligraphy text-2xl text-indigo-batik">
                      收藏进度
                    </h3>
                    <p className="text-sm text-indigo-batik/60">
                      已解锁 {stats.unlocked} / {stats.total} 枚徽章
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-baicalligraphy text-4xl text-gold font-bold">
                    {stats.percentage}%
                  </span>
                </div>
              </div>

              <div className="relative h-6 bg-ivory rounded-full overflow-hidden border-2 border-gold/30">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cangshan-green via-gold to-embroidery-red rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${stats.percentage}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-batik-pattern" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-batik/70 drop-shadow-sm">
                    {stats.unlocked} / {stats.total}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-3 bg-gold/5 rounded-xl border border-gold/20">
                  <p className="font-baicalligraphy text-2xl text-gold">
                    {stats.unlocked}
                  </p>
                  <p className="text-xs text-indigo-batik/60">已解锁</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="font-baicalligraphy text-2xl text-gray-400">
                    {stats.total - stats.unlocked}
                  </p>
                  <p className="text-xs text-indigo-batik/60">待解锁</p>
                </div>
                <div className="text-center p-3 bg-cangshan-green/5 rounded-xl border border-cangshan-green/20">
                  <p className="font-baicalligraphy text-2xl text-cangshan-green">
                    {merit}
                  </p>
                  <p className="text-xs text-indigo-batik/60">当前功德</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <MeritDisplay
              currentMerit={merit}
              nextBadge={nextBadge}
              showAnimation={false}
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="font-baicalligraphy text-2xl text-indigo-batik mb-6 flex items-center">
            <span className="w-1 h-8 bg-gradient-to-b from-embroidery-red to-gold rounded-full mr-3" />
            全部徽章
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedBadges.map((badge, index) => (
              <div
                key={badge.id}
                className={cn(
                  "animate-fade-in-up",
                  `animate-delay-${(index + 1) * 100}`
                )}
              >
                <BadgeCard
                  badge={badge}
                  isUnlocked={unlockedBadges.includes(badge.id)}
                  currentMerit={merit}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
