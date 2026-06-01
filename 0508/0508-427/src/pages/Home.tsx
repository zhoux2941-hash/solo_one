import ControlPanel from '@/components/ControlPanel';
import RCCurve from '@/components/RCCurve';
import DataPanel from '@/components/DataPanel';
import PresetSelector from '@/components/PresetSelector';
import { Activity } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen grid-bg noise-bg">
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="relative">
              <Activity size={32} className="text-cyan-400" />
              <div className="absolute inset-0 animate-glow-pulse">
                <Activity size={32} className="text-cyan-400/30" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 glow-text font-display tracking-tight">
              RC 电路瞬态响应模拟器
            </h1>
          </div>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            调节电阻 R、电容 C 和电源电压 V₀，实时观察 RC 电路的充电与放电曲线变化
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <ControlPanel />
          </div>

          <div className="lg:col-span-8 space-y-6">
            <RCCurve />
            <PresetSelector />
          </div>
        </div>

        <div className="mt-6">
          <DataPanel />
        </div>

        <footer className="mt-8 text-center text-[10px] text-slate-600 pb-4">
          RC Circuit Transient Response Simulator — V(t) = V₀(1 − e⁻ᵗ/τ)
        </footer>
      </div>
    </div>
  );
}
