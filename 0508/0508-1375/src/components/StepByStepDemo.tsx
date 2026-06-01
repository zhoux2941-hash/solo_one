import { useEffect, useRef } from 'react';
import { useHuffmanStore } from '@/hooks/useHuffmanStore';
import { SkipBack, SkipForward, Play, Pause, RotateCcw, GitMerge } from 'lucide-react';

export default function StepByStepDemo() {
  const steps = useHuffmanStore(s => s.steps);
  const currentStep = useHuffmanStore(s => s.currentStep);
  const isPlaying = useHuffmanStore(s => s.isPlaying);
  const nextStep = useHuffmanStore(s => s.nextStep);
  const prevStep = useHuffmanStore(s => s.prevStep);
  const resetStep = useHuffmanStore(s => s.resetStep);
  const setCurrentStep = useHuffmanStore(s => s.setCurrentStep);
  const setIsPlaying = useHuffmanStore(s => s.setIsPlaying);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        const { currentStep: cs, steps: st, nextStep: ns } = useHuffmanStore.getState();
        if (cs < st.length - 1) {
          ns();
        } else {
          useHuffmanStore.getState().setIsPlaying(false);
        }
      }, 1200);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  if (steps.length === 0) return null;

  const step = steps[currentStep];

  return (
    <div className="bg-[#0a1628] rounded-xl border border-zinc-800/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <GitMerge size={18} className="text-amber-400" />
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">逐步演示</h2>
        <span className="ml-auto text-xs font-mono text-zinc-500">
          {currentStep + 1} / {steps.length}
        </span>
      </div>

      <div className="mb-3 px-2 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800/30">
        <p className="text-xs text-zinc-300 leading-relaxed">
          {step?.description || '准备就绪'}
        </p>
      </div>

      <div className="mb-3">
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          value={currentStep}
          onChange={(e) => setCurrentStep(Number(e.target.value))}
          className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-amber-500"
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={resetStep}
          className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-all border border-zinc-700/30"
          title="重置"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-zinc-700/30"
          title="上一步"
        >
          <SkipBack size={16} />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 hover:text-amber-300 transition-all border border-amber-500/30 shadow-lg shadow-amber-500/10"
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          onClick={nextStep}
          disabled={currentStep === steps.length - 1}
          className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-zinc-700/30"
          title="下一步"
        >
          <SkipForward size={16} />
        </button>
        <button
          onClick={() => setCurrentStep(steps.length - 1)}
          className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-all border border-zinc-700/30"
          title="跳到最后"
        >
          <SkipForward size={16} className="scale-x-[-1]" />
        </button>
      </div>
    </div>
  );
}
