import { useDrumTowerStore } from '@/hooks/useDrumTowerStore'

export default function LogPanel() {
  const logs = useDrumTowerStore((s) => s.logs)

  return (
    <div className="flex flex-col h-full">
      <h3
        className="text-sm font-bold mb-2 pb-2 border-b"
        style={{
          color: '#C5A55A',
          borderColor: '#3C2F2F',
          fontFamily: '"Noto Serif SC", serif',
        }}
      >
        📜 报时日志
      </h3>
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" style={{ maxHeight: 280 }}>
        {logs.length === 0 && (
          <div className="text-xs text-center py-4" style={{ color: '#6B7B8D' }}>
            暂无报时记录
          </div>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-2 rounded text-xs"
            style={{
              backgroundColor: 'rgba(44,24,16,0.6)',
              borderLeft: '3px solid #8B7355',
            }}
          >
            <div className="flex justify-between items-center">
              <span style={{ color: '#DAA520' }}>{log.shichen}</span>
              <span style={{ color: '#6B7B8D', fontSize: 10 }}>
                {log.timestamp?.replace('T', ' ').slice(0, 19) || ''}
              </span>
            </div>
            <div className="mt-0.5" style={{ color: '#8B9DAF' }}>
              {log.action}
            </div>
            {(log.bell_count > 0 || log.drum_count > 0) && (
              <div className="mt-0.5 flex gap-2">
                {log.bell_count > 0 && (
                  <span style={{ color: '#B8860B' }}>🔔 钟{log.bell_count}响</span>
                )}
                {log.drum_count > 0 && (
                  <span style={{ color: '#8B0000' }}>🪘 鼓{log.drum_count}响</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
