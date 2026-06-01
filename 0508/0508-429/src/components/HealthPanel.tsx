import { useStore } from '@/store/useStore';
import { Heart, AlertTriangle, Activity } from 'lucide-react';
import { useMemo } from 'react';

export default function HealthPanel() {
  const nodes = useStore((s) => s.topology?.nodes ?? []);

  const stats = useMemo(() => {
    const healthy = nodes.filter((n) => n.status === 'healthy').length;
    const warning = nodes.filter((n) => n.status === 'warning').length;
    const error = nodes.filter((n) => n.status === 'error').length;
    const unhealthy = nodes
      .filter((n) => n.status !== 'healthy')
      .sort((a, b) => {
        const order = { error: 0, warning: 1, healthy: 2 };
        return order[a.status] - order[b.status];
      })
      .slice(0, 5);
    return { healthy, warning, error, unhealthy, total: nodes.length };
  }, [nodes]);

  if (nodes.length === 0) return null;

  return (
    <div className="w-[280px] h-full bg-cyber-panel border-l border-cyber-border overflow-y-auto">
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-cyber-muted uppercase tracking-wider">
          健康概览
        </h3>

        <div className="bg-cyber-bg rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Heart size={14} className="text-cyber-cyan" />
              <span>服务总数</span>
            </div>
            <span className="text-lg font-bold text-white">{stats.total}</span>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-cyber-success" />
              {stats.healthy}
            </span>
            <span className="flex items-center gap-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-cyber-warning" />
              {stats.warning}
            </span>
            <span className="flex items-center gap-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-cyber-danger" />
              {stats.error}
            </span>
          </div>
        </div>

        <div className="bg-cyber-bg rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle size={14} className="text-cyber-danger" />
              <span>活跃告警</span>
            </div>
            <span className={`text-lg font-bold ${stats.error > 0 ? 'text-cyber-danger' : 'text-cyber-success'}`}>
              {stats.error}
            </span>
          </div>
        </div>

        {stats.unhealthy.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-cyber-muted uppercase tracking-wider">
              异常服务
            </h4>
            {stats.unhealthy.map((node) => (
              <div
                key={node.id}
                className="flex items-center gap-2 bg-cyber-bg rounded-lg p-2.5"
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    node.status === 'error'
                      ? 'bg-cyber-danger glow-danger'
                      : 'bg-cyber-warning glow-warning'
                  }`}
                />
                <span className="text-sm text-white truncate flex-1">{node.name}</span>
                {node.metrics && (
                  <div className="flex items-center gap-1 text-xs text-cyber-muted">
                    <Activity size={10} />
                    {node.metrics.error_rate}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
