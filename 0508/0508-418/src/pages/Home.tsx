import { useEffect, useState } from 'react';
import { Info, Waves } from 'lucide-react';
import { VowelSelector } from '@/components/VowelSelector';
import { GenderToggle } from '@/components/GenderToggle';
import { VowelInfoCard } from '@/components/VowelInfoCard';
import { F1F2Chart } from '@/components/F1F2Chart';
import { MicControl } from '@/components/MicControl';
import { useAudioAnalysis } from '@/hooks/useAudioAnalysis';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const audioAnalysis = useAudioAnalysis();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23334155%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-10 max-w-7xl">
        <header
          className={`text-center mb-12 transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-4">
            <Waves size={16} />
            <span>语音声学可视化</span>
          </div>
          <h1
            className="text-5xl font-bold mb-3 bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400 text-transparent bg-clip-text"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            元音声学特性可视化工具
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            探索元音的第一共振峰(F1)和第二共振峰(F2)在二维声学空间中的分布
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div
            className={`lg:col-span-1 space-y-6 transition-all duration-1000 delay-200 ${
              isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <VowelSelector />
            </div>

            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <GenderToggle />
            </div>

            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <MicControl
                isActive={audioAnalysis.isActive}
                isRecording={audioAnalysis.isRecording}
                error={audioAnalysis.error}
                currentFormant={audioAnalysis.currentFormant}
                onToggle={audioAnalysis.toggleRecording}
              />
            </div>

            <VowelInfoCard />

            <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-2xl p-5 border border-violet-500/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Info className="text-violet-400" size={20} />
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">关于元音四边形</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    元音四边形图是语音学中用来表示元音舌位关系的标准图形。
                    F1与舌位高低相关（值越大舌位越低），F2与舌位前后相关（值越大舌位越前）。
                  </p>
                  <p className="text-xs text-slate-500">
                    数据基于 Ladefoged (2006) 标准值
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`lg:col-span-2 transition-all duration-1000 delay-400 ${
              isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
          >
            <F1F2Chart
              realTimeFormant={audioAnalysis.currentFormant}
              formantHistory={audioAnalysis.formantHistory}
              isAudioActive={audioAnalysis.isActive}
            />

            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  F1 — 第一共振峰
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  第一共振峰频率与元音舌位的高低成反相关关系。
                  舌位越高，F1值越小；舌位越低，F1值越大。
                  图表中纵轴从上到下F1值递增，对应舌位从高到低。
                </p>
              </div>
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  F2 — 第二共振峰
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  第二共振峰频率与元音舌位的前后成正相关关系。
                  舌位越前，F2值越大；舌位越后，F2值越小。
                  图表中横轴从左到右F2值递减，对应舌位从前到后。
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer
          className={`mt-16 text-center text-slate-500 text-sm transition-all duration-1000 delay-700 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p>点击图表中的元音点可快速选择 · 悬停查看详细信息</p>
        </footer>
      </div>
    </div>
  );
}
