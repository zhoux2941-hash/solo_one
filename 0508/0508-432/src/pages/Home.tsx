import { useSimulationStore, SimulationMode } from '@/store/simulationStore';
import ControlPanel from '@/components/ControlPanel';
import CollisionCanvas from '@/components/CollisionCanvas';
import DataPanel from '@/components/DataPanel';
import NewtonCradle from '@/components/NewtonCradle';
import SeparatedAxis from '@/components/SeparatedAxis';
import { Atom, BarChart3, GitBranch, Timer } from 'lucide-react';

const MODES: { key: SimulationMode; label: string; icon: React.ReactNode }[] = [
  { key: 'collision', label: '碰撞模拟', icon: <Atom size={14} /> },
  { key: 'newton-cradle', label: '牛顿摆', icon: <Timer size={14} /> },
  { key: 'separated-axis', label: '分离轴', icon: <BarChart3 size={14} /> },
];

export default function Home() {
  const { mode, setMode } = useSimulationStore();

  return (
    <div className="min-h-screen bg-[#070a14] text-white">
      <header className="border-b border-cyan-900/20 bg-[#0a0e1a]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.3)]">
              <GitBranch size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide text-white">碰撞恢复系数测量模拟</h1>
              <p className="text-[10px] text-zinc-500">Coefficient of Restitution Simulator</p>
            </div>
          </div>
          <nav className="flex gap-1 bg-zinc-800/50 p-1 rounded-xl">
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                  ${mode === m.key
                    ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                    : 'text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6">
        {mode === 'collision' && (
          <div className="grid grid-cols-[280px_1fr_280px] gap-5 h-[calc(100vh-100px)]">
            <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              <ControlPanel />
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex-1">
                <CollisionCanvas />
              </div>
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              <DataPanel />
            </div>
          </div>
        )}

        {mode === 'newton-cradle' && (
          <div className="h-[calc(100vh-100px)]">
            <NewtonCradle />
          </div>
        )}

        {mode === 'separated-axis' && (
          <div className="grid grid-cols-[280px_1fr] gap-5 h-[calc(100vh-100px)]">
            <div className="overflow-y-auto custom-scrollbar">
              <ControlPanel />
            </div>
            <div className="flex flex-col gap-4">
              <SeparatedAxis />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
