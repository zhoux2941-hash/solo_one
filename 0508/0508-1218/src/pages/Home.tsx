import { SceneContainer } from '@/components/Scene/SceneContainer';
import { SatelliteSelector } from '@/components/Panels/SatelliteSelector';
import { PositionInfo } from '@/components/Panels/PositionInfo';
import { PassPrediction } from '@/components/Panels/PassPrediction';
import { TimeControl } from '@/components/Controls/TimeControl';
import { useTimeControl } from '@/hooks/useTimeControl';
import { Satellite } from 'lucide-react';

export default function Home() {
  useTimeControl();

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#050810] relative">
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.3)]">
              <Satellite size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                卫星轨道模拟器
              </h1>
              <p className="text-xs text-white/40">Satellite Orbit Simulator</p>
            </div>
          </div>
          <div className="text-right pointer-events-auto">
            <div className="text-xs text-white/40">SGP4 / TEME / WGS84</div>
            <div className="text-xs text-white/30">3D 可视化 · 过境预测</div>
          </div>
        </div>
      </div>

      <SceneContainer />
      <SatelliteSelector />
      <PositionInfo />
      <PassPrediction />
      <TimeControl />

      <div className="absolute bottom-3 left-6 text-[10px] text-white/30 z-20">
        基于 SGP4 简化模型 · 数据仅供参考
      </div>
    </div>
  );
}
