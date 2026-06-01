import { useState } from 'react';
import type { ChangeEvent } from '@/types';
import { AlertTriangle, Settings, Rocket, RotateCw, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import dayjs from 'dayjs';

const EVENT_STYLES: Record<string, { color: string; icon: React.ReactNode; bg: string }> = {
  error_rate_spike: { color: 'text-cyber-danger', icon: <AlertTriangle size={14} />, bg: 'bg-cyber-danger/20' },
  config_change: { color: 'text-blue-400', icon: <Settings size={14} />, bg: 'bg-blue-400/20' },
  version_release: { color: 'text-purple-400', icon: <Rocket size={14} />, bg: 'bg-purple-400/20' },
  pod_restart: { color: 'text-orange-400', icon: <RotateCw size={14} />, bg: 'bg-orange-400/20' },
  traffic_change: { color: 'text-cyber-cyan', icon: <TrendingUp size={14} />, bg: 'bg-cyber-cyan/20' },
};

const EVENT_LABELS: Record<string, string> = {
  error_rate_spike: '错误率突增',
  config_change: '配置变更',
  version_release: '版本发布',
  pod_restart: 'Pod重启',
  traffic_change: '流量变化',
};

interface Props {
  events: ChangeEvent[];
  loading?: boolean;
}

export default function EventTimeline({ events, loading }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-cyber-muted text-sm">
        暂无事件数据
      </div>
    );
  }

  return (
    <div className="relative p-4 space-y-0">
      <div className="absolute left-[27px] top-4 bottom-4 w-px bg-cyber-border" />
      {events.map((event, index) => {
        const style = EVENT_STYLES[event.event_type] || EVENT_STYLES.error_rate_spike;
        const label = EVENT_LABELS[event.event_type] || event.event_type;
        const isExpanded = expandedId === `${event.service_name}-${index}`;

        return (
          <div
            key={`${event.service_name}-${index}`}
            className="relative pl-10 pb-4 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`absolute left-5 top-1 w-5 h-5 rounded-full flex items-center justify-center ${style.bg} ${style.color} z-10`}>
              {style.icon}
            </div>
            <div className="bg-cyber-bg rounded-lg p-3 border border-cyber-border hover:border-cyber-cyan/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${style.color}`}>{label}</span>
                  <span className="text-xs text-cyber-muted">{event.service_name}</span>
                </div>
                <span className="text-xs text-cyber-muted">
                  {dayjs(event.timestamp).format('HH:mm:ss')}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 line-clamp-1">{typeof event.details === 'string' ? event.details : Object.values(event.details).join(', ')}</p>
              <button
                onClick={() => setExpandedId(isExpanded ? null : `${event.service_name}-${index}`)}
                className="flex items-center gap-1 text-xs text-cyber-cyan mt-1 hover:underline"
              >
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {isExpanded ? '收起' : '展开详情'}
              </button>
              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-cyber-border text-xs text-cyber-muted space-y-1 animate-fade-in">
                  <div>来源: {event.source}</div>
                  <div>时间: {dayjs(event.timestamp).format('YYYY-MM-DD HH:mm:ss')}</div>
                  <div>详情: {typeof event.details === 'string' ? event.details : JSON.stringify(event.details)}</div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
