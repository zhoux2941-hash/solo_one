import { useECGStore } from '@/store/ecgStore'

export default function Tooltip() {
  const { showTooltip, tooltipPosition, tooltipData } = useECGStore()

  if (!showTooltip || !tooltipPosition || !tooltipData) {
    return null
  }

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: tooltipPosition.x + 16,
        top: tooltipPosition.y + 16,
      }}
    >
      <div className="bg-slate-900/95 backdrop-blur border border-slate-600/50 rounded-lg p-3 shadow-xl min-w-[200px]">
        <div className="space-y-2">
          <div className="flex justify-between items-center border-b border-slate-700/50 pb-2 mb-2">
            <span className="text-xs text-slate-400">时间</span>
            <span className="text-sm font-mono text-white">{tooltipData.time.toFixed(3)}s</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">电压</span>
            <span className="text-sm font-mono text-emerald-400">
              {tooltipData.voltage.toFixed(3)}mV
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">PR间期</span>
            <span className="text-sm font-mono text-cyan-400">
              {tooltipData.prInterval > 0 ? `${tooltipData.prInterval}ms` : '--'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">QRS时限</span>
            <span className="text-sm font-mono text-orange-400">{tooltipData.qrsDuration}ms</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">QT间期</span>
            <span className="text-sm font-mono text-blue-400">
              {tooltipData.qtInterval > 0 ? `${tooltipData.qtInterval}ms` : '--'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
