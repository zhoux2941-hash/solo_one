import ECGCanvas from '@/components/ECGCanvas'
import RhythmSelector from '@/components/RhythmSelector'
import PlaybackControls from '@/components/PlaybackControls'
import StatsPanel from '@/components/StatsPanel'
import Tooltip from '@/components/Tooltip'
import ImportExport from '@/components/ImportExport'
import { Activity } from 'lucide-react'
import { useECGStore } from '@/store/ecgStore'
import { RHYTHM_PRESETS } from '@/types/ecg'

export default function Home() {
  const { config, isExternalMode } = useECGStore()
  const preset = RHYTHM_PRESETS[config.rhythmType]

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0e17]">
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">ECG 心电图模拟器</h1>
            <p className="text-xs text-slate-400">交互式医学波形模拟工具</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isExternalMode ? (
            <div className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
              <span className="text-sm text-purple-300">外部数据模式</span>
            </div>
          ) : (
            <div
              className="px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: `${preset.color}15`,
                borderColor: `${preset.color}40`,
              }}
            >
              <span className="text-sm font-medium" style={{ color: preset.color }}>
                {preset.label}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 flex-shrink-0 bg-slate-900/50 border-r border-slate-700/50 overflow-y-auto p-4 space-y-6">
          <RhythmSelector />
          <div className="h-px bg-slate-700/50" />
          <PlaybackControls />
          <div className="h-px bg-slate-700/50" />
          <ImportExport />
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-4 overflow-hidden">
            <div className="w-full h-full rounded-lg overflow-hidden border border-slate-700/50 shadow-2xl">
              <ECGCanvas />
            </div>
          </div>
          <StatsPanel />
        </main>
      </div>

      <Tooltip />
    </div>
  )
}
