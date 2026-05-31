import React, { useState, useEffect } from 'react';
import { Hash, Percent, Trophy } from 'lucide-react';

interface StatisticsProps {
  primeCount: number;
  n: number;
  isCompleted: boolean;
}

export const Statistics: React.FC<StatisticsProps> = ({ primeCount, n, isCompleted }) => {
  const [displayCount, setDisplayCount] = useState(0);
  const [displayRatio, setDisplayRatio] = useState(0);

  const ratio = n > 0 ? (primeCount / n) * 100 : 0;

  useEffect(() => {
    if (!isCompleted) {
      setDisplayCount(0);
      setDisplayRatio(0);
      return;
    }

    const duration = 1500;
    const startTime = Date.now();
    const startCount = 0;
    const startRatio = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayCount(Math.round(startCount + (primeCount - startCount) * easeOut));
      setDisplayRatio(startRatio + (ratio - startRatio) * easeOut);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const timer = setTimeout(animate, 300);
    return () => clearTimeout(timer);
  }, [primeCount, ratio, isCompleted]);

  if (!isCompleted) {
    return null;
  }

  return (
    <div className="card animate-slide-up">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-amber-400" />
        筛选结果
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl p-6 border border-emerald-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-prime/20 flex items-center justify-center">
              <Hash className="w-6 h-6 text-prime" />
            </div>
            <div>
              <p className="text-sm text-slate-400">素数个数</p>
              <p className="text-xs text-slate-500 font-mono">π({n})</p>
            </div>
          </div>
          <p className="text-4xl font-mono font-bold text-prime">
            {displayCount.toLocaleString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl p-6 border border-amber-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Percent className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">素数占比</p>
              <p className="text-xs text-slate-500 font-mono">π({n}) / {n}</p>
            </div>
          </div>
          <p className="text-4xl font-mono font-bold text-amber-400">
            {displayRatio.toFixed(2)}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-sky-500/10 to-sky-500/5 rounded-xl p-6 border border-sky-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-sky-500/20 flex items-center justify-center">
              <span className="text-xl font-bold text-sky-400">1:</span>
            </div>
            <div>
              <p className="text-sm text-slate-400">近似比例</p>
              <p className="text-xs text-slate-500 font-mono">1 / ln({n})</p>
            </div>
          </div>
          <p className="text-4xl font-mono font-bold text-sky-400">
            {n > 2 ? (1 / Math.log(n)).toFixed(3) : 'N/A'}
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-surface-light/50 rounded-xl">
        <p className="text-sm text-slate-300 leading-relaxed">
          <span className="text-prime font-semibold">素数定理</span>：当 x 趋近于无穷大时，
          π(x) ~ x / ln(x)。也就是说，不超过 x 的素数个数近似等于 x 除以 x 的自然对数。
          在 N = {n} 时，理论近似值为 <span className="font-mono text-sky-400">{(n / Math.log(n)).toFixed(2)}</span>，
          实际值为 <span className="font-mono text-prime">{primeCount}</span>，
          误差为 <span className="font-mono text-amber-400">{Math.abs(primeCount - n / Math.log(n)).toFixed(2)}</span>。
        </p>
      </div>
    </div>
  );
};
