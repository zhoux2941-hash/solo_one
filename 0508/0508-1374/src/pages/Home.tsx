import { useEffect } from 'react';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { ControlPanel } from '@/components/ControlPanel/ControlPanel';
import { StatsPanel } from '@/components/StatsPanel/StatsPanel';
import { SolutionBrowser } from '@/components/SolutionBrowser/SolutionBrowser';
import { useAnimation } from '@/hooks/useAnimation';
import { useAppStore } from '@/store/useAppStore';
import { Crown, Sparkles } from 'lucide-react';

export default function Home() {
  const { initializeSolver, isComplete } = useAppStore();
  useAnimation();

  useEffect(() => {
    initializeSolver();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="relative">
              <Crown className="w-12 h-12 text-yellow-400 animate-float" fill="currentColor" />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-300 animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              N皇后可视化求解器
            </h1>
          </div>
          <p className="text-slate-400 max-w-xl mx-auto">
            通过回溯法直观展示N皇后问题的求解过程，
            观察皇后放置、冲突检测和回溯的每一步
          </p>
        </header>

        <div className="grid lg:grid-cols-[280px_1fr_300px] gap-6 items-start">
          <div className="space-y-6">
            <ControlPanel />
          </div>

          <div className="space-y-6">
            <div className={isComplete ? 'animate-glow' : ''}>
              <ChessBoard />
            </div>
            <SolutionBrowser />
          </div>

          <div>
            <StatsPanel />
          </div>
        </div>

        <footer className="mt-12 text-center text-slate-500 text-sm">
          <p>使用回溯算法求解N皇后问题 · 支持4-12皇后</p>
        </footer>
      </div>
    </div>
  );
}
