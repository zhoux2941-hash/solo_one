import { useEffect, useState } from 'react';
import { Mic, Volume2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { lerp } from '@/utils/acoustics';

const AnimatedNumber = ({ value, duration = 500 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  useEffect(() => {
    if (prevValue === value) return;

    const startValue = prevValue;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(lerp(startValue, value, easeProgress)));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    setPrevValue(value);
  }, [value, prevValue, duration]);

  return <span>{displayValue}</span>;
};

export const VowelInfoCard = () => {
  const { getSelectedVowel, getF1, getF2, gender } = useAppStore();
  const vowel = getSelectedVowel();

  if (!vowel) return null;

  const f1 = getF1(vowel);
  const f2 = getF2(vowel);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-cyan-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-sky-500/25">
            <Volume2 className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">元音声学信息</h3>
            <p className="text-sm text-slate-400">
              {gender === 'male' ? '男声标准值' : '女声标准值'}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className="text-5xl text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-400"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              [{vowel.ipa}]
            </span>
          </div>
          <p className="text-slate-300">
            示例: <span className="text-white font-medium italic">{vowel.exampleWord}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <Mic size={14} />
              <span>F1 (第一共振峰)</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-3xl font-bold text-sky-400"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <AnimatedNumber value={f1} />
              </span>
              <span className="text-slate-500 text-sm">Hz</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">与舌位高低相关</p>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <Mic size={14} />
              <span>F2 (第二共振峰)</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-3xl font-bold text-cyan-400"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <AnimatedNumber value={f2} />
              </span>
              <span className="text-slate-500 text-sm">Hz</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">与舌位前后相关</p>
          </div>
        </div>
      </div>
    </div>
  );
};
