import { useECGStore } from '@/store/ecgStore'
import { Heart, Activity, Clock, Timer } from 'lucide-react'
import { getWaveformParameters } from '@/utils/parameterCalculator'

export default function StatsPanel() {
  const { config, stats } = useECGStore()
  const params = getWaveformParameters(config.rhythmType)

  return (
    <div className="flex items-center gap-6 px-6 py-3 bg-slate-900/90 backdrop-blur border-t border-slate-700/50">
      <div className="flex items-center gap-3 pr-6 border-r border-slate-700/50">
        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
          <Heart className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-400">心率</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {stats.bpm || '--'}
            <span className="text-sm font-normal text-slate-500 ml-1">BPM</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pr-6 border-r border-slate-700/50">
        <div
          className={`p-2 rounded-lg ${
            stats.isRegular ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-400">节律</div>
          <div
            className={`text-lg font-semibold ${
              stats.isRegular ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {stats.isRegular ? '规整' : '不规整'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-xs text-slate-400">PR间期</div>
            <div className="text-sm font-mono text-cyan-400">
              {params.prInterval > 0 ? `${params.prInterval}ms` : '--'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-orange-400" />
          <div>
            <div className="text-xs text-slate-400">QRS时限</div>
            <div className="text-sm font-mono text-orange-400">{params.qrsDuration}ms</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-xs text-slate-400">QT间期</div>
            <div className="text-sm font-mono text-blue-400">
              {params.qtInterval > 0 ? `${params.qtInterval}ms` : '--'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-purple-400" />
          <div>
            <div className="text-xs text-slate-400">RR间期</div>
            <div className="text-sm font-mono text-purple-400">
              {params.rrInterval > 0 ? `${params.rrInterval}ms` : '--'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
