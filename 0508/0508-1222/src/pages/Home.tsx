import { SimulatorCanvas } from '@/components/SimulatorCanvas';
import { Toolbar } from '@/components/Toolbar';
import { MagneticFieldPanel } from '@/components/MagneticFieldPanel';
import { ParticleLauncher } from '@/components/ParticleLauncher';
import { DisplaySettings } from '@/components/DisplaySettings';
import { ParticleDataPanel } from '@/components/ParticleDataPanel';
import { ConductorPanel } from '@/components/ConductorPanel';

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <SimulatorCanvas />
        <div className="w-80 bg-slate-900 border-l border-slate-700 overflow-y-auto p-4 space-y-4">
          <div className="bg-gradient-to-br from-cyan-900/30 to-purple-900/30 rounded-xl p-4 border border-cyan-500/20">
            <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              电磁场模拟器
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              放置点电荷，观察电场线，发射带电粒子探索洛伦兹力
            </p>
          </div>

          <MagneticFieldPanel />
          <ConductorPanel />
          <ParticleLauncher />
          <DisplaySettings />
          <ParticleDataPanel />

          <div className="bg-slate-800/30 rounded-xl p-4 text-xs text-slate-500">
            <p className="font-medium text-slate-400 mb-2">操作指南</p>
            <ul className="space-y-1">
              <li>• 选择工具后点击画布放置电荷/导体</li>
              <li>• 使用选择工具拖拽移动电荷/导体</li>
              <li>• Shift+点击可删除电荷/导体</li>
              <li>• 粒子工具支持拖拽设定发射方向</li>
              <li>• 点击粒子查看实时运动数据</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
