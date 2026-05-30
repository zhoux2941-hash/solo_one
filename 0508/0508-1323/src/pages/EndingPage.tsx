import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { temples } from '../data/temples';
import { tasks } from '../data/tasks';
import { badges } from '../data/badges';
import { generateExportData, downloadExportData } from '../utils/export';
import { RotateCcw, Download, Award, MapPin, Sparkles, CheckSquare } from 'lucide-react';
import { cn } from '../lib/utils';

interface FloatingLeaf {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  emoji: string;
}

export default function EndingPage() {
  const navigate = useNavigate();
  const currentEnding = useGameStore((state) => state.currentEnding);
  const currentRole = useGameStore((state) => state.currentRole);
  const merit = useGameStore((state) => state.merit);
  const completedTemples = useGameStore((state) => state.completedTemples);
  const completedTasks = useGameStore((state) => state.completedTasks);
  const unlockedBadges = useGameStore((state) => state.unlockedBadges);
  const resetGame = useGameStore((state) => state.resetGame);

  const [showContent, setShowContent] = useState(false);

  const floatingLeaves = useMemo((): FloatingLeaf[] => {
    const leafEmojis = ['🌸', '🍃', '🌺', '🍂', '🌼', '✨', '💮'];
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 8,
      size: 16 + Math.random() * 24,
      emoji: leafEmojis[Math.floor(Math.random() * leafEmojis.length)],
    }));
  }, []);

  const totalTasksForRole = useMemo(() => {
    if (!currentRole) return 0;
    return tasks.filter((t) => t.roleId === currentRole.id).length;
  }, [currentRole]);

  const stats = useMemo(() => {
    return {
      totalMerit: merit,
      completedTemples: completedTemples.length,
      totalTemples: temples.length,
      completedTasks: completedTasks.length,
      totalTasks: totalTasksForRole,
      unlockedBadges: unlockedBadges.length,
      totalBadges: badges.length,
    };
  }, [merit, completedTemples.length, completedTasks.length, totalTasksForRole, unlockedBadges.length]);

  const backgroundGradient = useMemo(() => {
    if (!currentEnding) return 'from-gray-600 via-gray-700 to-gray-800';
    switch (currentEnding.id) {
      case 'ending-perfect':
        return 'from-gold via-embroidery-red to-indigo-batik';
      case 'ending-regret':
        return 'from-erhai-blue via-indigo-batik to-cangshan-green';
      case 'ending-accident':
        return 'from-gray-500 via-indigo-batik to-gray-700';
      default:
        return 'from-indigo-batik via-embroidery-red to-gold';
    }
  }, [currentEnding]);

  useEffect(() => {
    if (!currentEnding) {
      navigate('/');
    }
  }, [currentEnding, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleRestart = () => {
    if (window.confirm('确定要重新开始吗？当前结局和进度将被重置。')) {
      resetGame();
      navigate('/');
    }
  };

  const handleExport = () => {
    try {
      const exportData = generateExportData(
        currentRole,
        merit,
        completedTemples,
        completedTasks,
        unlockedBadges,
        currentEnding
      );
      downloadExportData(exportData, '绕三灵游戏记录.json');
      alert('游戏记录已导出成功！\n如需导出路线图，请前往巡游路线页面。');
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  if (!currentEnding) {
    return null;
  }

  return (
    <div className={cn(
      "min-h-screen relative overflow-hidden",
      `bg-gradient-to-br ${backgroundGradient}`
    )}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingLeaves.map((leaf) => (
          <div
            key={leaf.id}
            className="absolute animate-float"
            style={{
              left: `${leaf.x}%`,
              top: '-50px',
              fontSize: `${leaf.size}px`,
              animationDelay: `${leaf.delay}s`,
              animationDuration: `${leaf.duration}s`,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'linear',
            }}
          >
            <span
              className="inline-block opacity-70"
              style={{
                animation: `fall ${leaf.duration}s linear infinite`,
                animationDelay: `${leaf.delay}s`,
              }}
            >
              {leaf.emoji}
            </span>
          </div>
        ))}
      </div>

      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="ending-pattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="8" fill="none" stroke="#F5F0E1" strokeWidth="0.5" />
              <path d="M15 5 L15 25 M5 15 L25 15" stroke="#D4AF37" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ending-pattern)" />
        </svg>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className={cn(
          "max-w-4xl w-full text-center transition-all duration-1000",
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}>
          <div className="mb-8 animate-fade-in">
            <div className="inline-flex items-center space-x-2 bg-ivory/10 backdrop-blur-sm px-6 py-2 rounded-full border border-gold/30 mb-6">
              <Sparkles className="w-5 h-5 text-gold animate-pulse" />
              <span className="text-ivory/90">绕三灵之旅圆满结束</span>
              <Sparkles className="w-5 h-5 text-gold animate-pulse" />
            </div>
          </div>

          <h1 className="font-baicalligraphy text-5xl md:text-7xl text-ivory mb-4 tracking-wider animate-fade-in-up">
            {currentEnding.title}
          </h1>

          <div className="relative bg-ivory/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-gold/30 mb-8 animate-fade-in-up animate-delay-200">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gold rounded-full">
              <span className="text-indigo-batik font-bold text-sm">✦ 诗句 ✦</span>
            </div>
            <p className="font-baicalligraphy text-xl md:text-2xl text-ivory leading-loose whitespace-pre-line">
              {currentEnding.poem}
            </p>
          </div>

          <div className="bg-ivory/95 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-2xl mb-8 animate-fade-in-up animate-delay-300">
            <h2 className="font-baicalligraphy text-3xl text-indigo-batik mb-4">
              结局详述
            </h2>
            <p className="text-indigo-batik/80 leading-relaxed text-lg">
              {currentEnding.description}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 animate-fade-in-up animate-delay-500">
            <div className="bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl p-4 md:p-6 border-2 border-gold/30">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-gold to-embroidery-red flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="font-baicalligraphy text-3xl md:text-4xl text-gold font-bold mb-1">
                {stats.totalMerit}
              </p>
              <p className="text-indigo-batik/60 text-sm">总功德值</p>
            </div>

            <div className="bg-gradient-to-br from-cangshan-green/20 to-cangshan-green/5 rounded-2xl p-4 md:p-6 border-2 border-cangshan-green/30">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-cangshan-green to-erhai-blue flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <p className="font-baicalligraphy text-3xl md:text-4xl text-cangshan-green font-bold mb-1">
                {stats.completedTemples}/{stats.totalTemples}
              </p>
              <p className="text-indigo-batik/60 text-sm">完成庙宇</p>
            </div>

            <div className="bg-gradient-to-br from-erhai-blue/20 to-erhai-blue/5 rounded-2xl p-4 md:p-6 border-2 border-erhai-blue/30">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-erhai-blue to-indigo-batik flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <p className="font-baicalligraphy text-3xl md:text-4xl text-erhai-blue font-bold mb-1">
                {stats.completedTasks}/{stats.totalTasks}
              </p>
              <p className="text-indigo-batik/60 text-sm">完成任务</p>
            </div>

            <div className="bg-gradient-to-br from-embroidery-red/20 to-embroidery-red/5 rounded-2xl p-4 md:p-6 border-2 border-embroidery-red/30">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-embroidery-red to-gold flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <p className="font-baicalligraphy text-3xl md:text-4xl text-embroidery-red font-bold mb-1">
                {stats.unlockedBadges}/{stats.totalBadges}
              </p>
              <p className="text-indigo-batik/60 text-sm">解锁徽章</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animate-delay-700">
            <button
              onClick={handleRestart}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-ivory to-white text-indigo-batik font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-gold"
            >
              <RotateCcw className="w-5 h-5" />
              <span>重新开始</span>
            </button>

            <button
              onClick={handleExport}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-gold via-yellow-400 to-gold text-indigo-batik font-bold text-lg rounded-2xl shadow-xl hover:shadow-gold/50 transition-all duration-300 hover:scale-105"
            >
              <Download className="w-5 h-5" />
              <span>导出路线图</span>
            </button>
          </div>
        </div>

        <div className="mt-12 text-center text-ivory/60 text-sm animate-fade-in animate-delay-700">
          <p>感谢您体验白族绕三灵文化之旅</p>
          <p className="mt-1">国家级非物质文化遗产 · 传承千年的白族文化</p>
        </div>
      </div>

      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
