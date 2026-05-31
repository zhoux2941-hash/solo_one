import React from 'react';
import {
  MousePointer2,
  Plus,
  Link,
  Trash2,
  Radio,
  Target,
  Play,
  RotateCcw,
  Layout,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useNetworkStore } from '../store/networkStore';
import { ToolMode } from '../types/network';

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  variant?: 'default' | 'success' | 'warning';
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, label, active, onClick, variant = 'default' }) => {
  const baseClasses = 'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200';
  const activeClasses = active
    ? 'bg-accent-500/20 border border-accent-500 text-accent-500 shadow-lg shadow-accent-500/20'
    : 'bg-dark-800 border border-dark-700 hover:border-dark-500 text-dark-200 hover:text-white';
  
  const variantClasses = {
    default: '',
    success: active ? 'bg-green-500/20 border-green-500 text-green-500 shadow-green-500/20' : '',
    warning: active ? 'bg-red-500/20 border-red-500 text-red-500 shadow-red-500/20' : '',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${activeClasses} ${variant ? variantClasses[variant] : ''}`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

export const Toolbar: React.FC = () => {
  const {
    toolMode,
    showCoverage,
    setToolMode,
    runSimulation,
    clearSimulation,
    autoLayout,
    toggleCoverage,
    clearAll,
  } = useNetworkStore();

  const tools: { mode: ToolMode; icon: React.ReactNode; label: string; variant?: 'default' | 'success' | 'warning' }[] = [
    { mode: 'select', icon: <MousePointer2 size={18} />, label: '选择/移动' },
    { mode: 'addNode', icon: <Plus size={18} />, label: '添加节点' },
    { mode: 'connect', icon: <Link size={18} />, label: '连接节点' },
    { mode: 'delete', icon: <Trash2 size={18} />, label: '删除节点/连线' },
    { mode: 'setSource', icon: <Radio size={18} />, label: '设为源节点', variant: 'success' },
    { mode: 'setTarget', icon: <Target size={18} />, label: '设为目标节点', variant: 'warning' },
  ];

  return (
    <div className="w-56 bg-dark-900 border-r border-dark-700 p-4 flex flex-col gap-2 h-full">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-white mb-1 text-shadow-glow">工具栏</h2>
        <p className="text-xs text-dark-400">选择操作模式</p>
      </div>

      <div className="flex flex-col gap-2">
        {tools.map((tool) => (
          <ToolButton
            key={tool.mode}
            icon={tool.icon}
            label={tool.label}
            active={toolMode === tool.mode}
            onClick={() => setToolMode(tool.mode)}
            variant={tool.variant}
          />
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <div className="border-t border-dark-700 pt-4 flex flex-col gap-2">
          <button
            onClick={runSimulation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-primary-500/20"
          >
            <Play size={18} />
            开始模拟
          </button>

          <button
            onClick={clearSimulation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 hover:border-dark-500 text-dark-200 rounded-lg transition-all duration-200"
          >
            <RotateCcw size={16} />
            清除模拟结果
          </button>
        </div>

        <div className="border-t border-dark-700 pt-4 flex flex-col gap-2">
          <button
            onClick={autoLayout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 hover:border-accent-500 text-dark-200 hover:text-accent-500 rounded-lg transition-all duration-200"
          >
            <Layout size={16} />
            自动布局
          </button>

          <button
            onClick={toggleCoverage}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 hover:border-accent-500 text-dark-200 hover:text-accent-500 rounded-lg transition-all duration-200"
          >
            {showCoverage ? <EyeOff size={16} /> : <Eye size={16} />}
            {showCoverage ? '隐藏覆盖范围' : '显示覆盖范围'}
          </button>
        </div>

        <button
          onClick={clearAll}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-900/30 border border-red-900/50 hover:border-red-500 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200"
        >
          <Trash2 size={16} />
          清空画布
        </button>
      </div>
    </div>
  );
};
