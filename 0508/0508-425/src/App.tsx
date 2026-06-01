import { useEffect, useCallback } from 'react';
import { Github, Info } from 'lucide-react';
import { useFourierSeries } from './hooks/useFourierSeries';
import { useAudioSynthesizer } from './hooks/useAudioSynthesizer';
import { WaveformCanvas } from './components/WaveformCanvas';
import { ControlPanel } from './components/ControlPanel';
import { GibbsDisplay } from './components/GibbsDisplay';
import { AudioControls } from './components/AudioControls';
import { HarmonicList } from './components/HarmonicList';
import { getWaveformName } from './utils/fourierCalculations';

function App() {
  const {
    harmonicCount,
    setHarmonicCount,
    waveformType,
    setWaveformType,
    showIndividualHarmonics,
    setShowIndividualHarmonics,
    harmonics,
    waveformPoints,
    gibbsData,
    animationPhase,
    updateAnimationPhase,
  } = useFourierSeries();

  const {
    isPlaying,
    volume,
    setVolume,
    toggle,
    playHarmonics,
  } = useAudioSynthesizer(220);

  useEffect(() => {
    let animationId: number;
    let lastTime = 0;

    const animate = (time: number) => {
      if (time - lastTime > 16) {
        updateAnimationPhase(animationPhase + 0.02);
        lastTime = time;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [animationPhase, updateAnimationPhase]);

  useEffect(() => {
    if (isPlaying) {
      playHarmonics(harmonics);
    }
  }, [harmonics, isPlaying, playHarmonics]);

  const handleToggleAudio = useCallback(() => {
    toggle(harmonics);
  }, [toggle, harmonics]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#12121f] to-[#0a0a1a]">
      <header className="border-b border-cyan-500/20 bg-[#0a0a1a]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                傅里叶级数波形合成器
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                交互式探索傅里叶级数原理 · 当前波形: <span className="text-cyan-400 font-medium">{getWaveformName(waveformType)}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://en.wikipedia.org/wiki/Fourier_series"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                title="了解更多关于傅里叶级数"
              >
                <Info className="w-5 h-5" />
              </a>
              <div className="px-3 py-1 bg-cyan-500/20 rounded-full text-cyan-400 text-xs font-mono">
                {harmonicCount} 次谐波
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#12121f] rounded-xl p-6 border border-cyan-500/20 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">合成波形</h2>
              </div>
              <div className="h-[400px]">
                <WaveformCanvas
                  waveformPoints={waveformPoints}
                  harmonics={harmonics}
                  showIndividualHarmonics={showIndividualHarmonics}
                  animationPhase={animationPhase}
                  idealValue={gibbsData.idealValue}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GibbsDisplay gibbsData={gibbsData} harmonicCount={harmonicCount} />
              <HarmonicList harmonics={harmonics} />
            </div>
          </div>

          <div className="space-y-6">
            <ControlPanel
              harmonicCount={harmonicCount}
              setHarmonicCount={setHarmonicCount}
              waveformType={waveformType}
              setWaveformType={setWaveformType}
              showIndividualHarmonics={showIndividualHarmonics}
              setShowIndividualHarmonics={setShowIndividualHarmonics}
            />
            <AudioControls
              isPlaying={isPlaying}
              volume={volume}
              setVolume={setVolume}
              onToggle={handleToggleAudio}
              harmonics={harmonics}
            />
          </div>
        </div>

        <div className="mt-8 p-6 bg-[#12121f]/50 rounded-xl border border-gray-700/30">
          <h3 className="text-lg font-bold text-white mb-4">📚 什么是傅里叶级数？</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300">
            <div>
              <h4 className="text-cyan-400 font-semibold mb-2">基本原理</h4>
              <p className="leading-relaxed">
                任何周期函数都可以分解为一系列正弦波和余弦波的叠加。这些波被称为"谐波"，
                它们的频率是基波频率的整数倍。
              </p>
            </div>
            <div>
              <h4 className="text-pink-400 font-semibold mb-2">吉布斯现象</h4>
              <p className="leading-relaxed">
                当用有限项傅里叶级数逼近具有不连续点的函数时，在间断点附近会产生过冲，
                其幅度约为9%，且不会随谐波次数增加而消失。
              </p>
            </div>
            <div>
              <h4 className="text-yellow-400 font-semibold mb-2">实际应用</h4>
              <p className="leading-relaxed">
                傅里叶分析广泛应用于信号处理、图像处理、音频合成、通信系统等领域，
                是现代工程和科学的基础工具。
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>使用 Web Audio API + Canvas 构建的交互式数学可视化工具</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
