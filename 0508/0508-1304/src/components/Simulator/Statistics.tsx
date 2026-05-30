import { SimulationStats } from '../../engine/types';
import { Flame, TreeDeciduous, AreaChart, Clock, Target, Shield } from 'lucide-react';

interface StatisticsProps {
  stats: SimulationStats;
}

export function Statistics({ stats }: StatisticsProps) {
  const statItems = [
    {
      icon: Target,
      label: '初始树木',
      value: stats.totalTrees.toLocaleString(),
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
    },
    {
      icon: Flame,
      label: '正在燃烧',
      value: stats.burningTrees.toLocaleString(),
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
    },
    {
      icon: TreeDeciduous,
      label: '已烧毁',
      value: stats.burnedTrees.toLocaleString(),
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
    },
    {
      icon: AreaChart,
      label: '过火面积',
      value: `${stats.burnedArea.toLocaleString()} 格`,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
    },
    {
      icon: Shield,
      label: '灭火队',
      value: stats.firefighterCount.toString(),
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
    },
    {
      icon: TreeDeciduous,
      label: '存活率',
      value: `${stats.survivalRate.toFixed(1)}%`,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      icon: Clock,
      label: '模拟步数',
      value: stats.timeStep.toString(),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-5 shadow-xl border border-slate-700/50">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <AreaChart className="w-5 h-5 text-emerald-400" />
        实时统计
      </h3>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {statItems.map((item, index) => (
          <div
            key={index}
            className={`${item.bgColor} rounded-lg p-3 transition-all duration-300 hover:scale-105`}
          >
            <div className="flex items-center gap-2 mb-1">
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-xs text-slate-400">{item.label}</span>
            </div>
            <div className={`text-xl font-bold ${item.color} font-mono`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
