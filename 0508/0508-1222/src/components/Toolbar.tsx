import { useSimulationStore } from '@/store/useSimulationStore';
import {
  Play,
  Pause,
  Trash2,
  MousePointer2,
  PlusCircle,
  MinusCircle,
  Sparkles,
  Circle,
} from 'lucide-react';

export function Toolbar() {
  const {
    currentTool,
    setCurrentTool,
    simulationState,
    setRunning,
    clearAll,
    clearParticles,
  } = useSimulationStore();

  return (
    <div className="h-14 bg-slate-900 border-b border-slate-700 flex items-center px-4 gap-2">
      <div className="flex items-center gap-1 pr-4 border-r border-slate-700">
        <span className="text-slate-400 text-sm mr-2">工具:</span>
        <ToolButton
          active={currentTool === 'select'}
          onClick={() => setCurrentTool('select')}
          title="选择/移动"
        >
          <MousePointer2 size={18} />
        </ToolButton>
        <ToolButton
          active={currentTool === 'positive'}
          onClick={() => setCurrentTool('positive')}
          title="放置正电荷"
          color="cyan"
        >
          <PlusCircle size={18} />
        </ToolButton>
        <ToolButton
          active={currentTool === 'negative'}
          onClick={() => setCurrentTool('negative')}
          title="放置负电荷"
          color="red"
        >
          <MinusCircle size={18} />
        </ToolButton>
        <ToolButton
          active={currentTool === 'particle'}
          onClick={() => setCurrentTool('particle')}
          title="发射粒子"
          color="orange"
        >
          <Sparkles size={18} />
        </ToolButton>
        <ToolButton
          active={currentTool === 'conductor'}
          onClick={() => setCurrentTool('conductor')}
          title="放置导体球"
          color="blue"
        >
          <Circle size={18} />
        </ToolButton>
      </div>

      <div className="flex items-center gap-2 px-4 border-r border-slate-700">
        <button
          onClick={() => setRunning(!simulationState.running)}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-all ${
            simulationState.running
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {simulationState.running ? <Pause size={16} /> : <Play size={16} />}
          {simulationState.running ? '暂停' : '开始'}
        </button>
      </div>

      <div className="flex items-center gap-2 px-4">
        <button
          onClick={clearParticles}
          className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all"
        >
          清除粒子
        </button>
        <button
          onClick={clearAll}
          className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium bg-red-900/50 hover:bg-red-800/50 text-red-300 transition-all"
        >
          <Trash2 size={16} />
          全部清除
        </button>
      </div>

      <div className="ml-auto text-slate-400 text-sm">
        时间: <span className="text-cyan-400 font-mono">{simulationState.time.toFixed(2)}s</span>
      </div>
    </div>
  );
}

interface ToolButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
  color?: 'cyan' | 'red' | 'orange' | 'blue';
}

function ToolButton({ active, onClick, children, title, color }: ToolButtonProps) {
  const colorClasses = {
    cyan: active
      ? 'bg-cyan-600/30 text-cyan-400 border-cyan-500'
      : 'hover:bg-slate-700 text-slate-400 border-transparent',
    red: active
      ? 'bg-red-600/30 text-red-400 border-red-500'
      : 'hover:bg-slate-700 text-slate-400 border-transparent',
    orange: active
      ? 'bg-orange-600/30 text-orange-400 border-orange-500'
      : 'hover:bg-slate-700 text-slate-400 border-transparent',
    blue: active
      ? 'bg-blue-600/30 text-blue-400 border-blue-500'
      : 'hover:bg-slate-700 text-slate-400 border-transparent',
  };

  const defaultClass = active
    ? 'bg-slate-600 text-white border-slate-500'
    : 'hover:bg-slate-700 text-slate-400 border-transparent';

  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg border transition-all ${color ? colorClasses[color] : defaultClass}`}
    >
      {children}
    </button>
  );
}
