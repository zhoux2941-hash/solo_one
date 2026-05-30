import { useECGStore } from '@/store/ecgStore'
import { RHYTHM_PRESETS, type RhythmType } from '@/types/ecg'
import { Heart, Zap, Turtle, Activity } from 'lucide-react'

const rhythmIcons: Record<RhythmType, React.ReactNode> = {
  normal: <Heart className="w-5 h-5" />,
  tachycardia: <Zap className="w-5 h-5" />,
  bradycardia: <Turtle className="w-5 h-5" />,
  atrial_fibrillation: <Activity className="w-5 h-5" />,
}

export default function RhythmSelector() {
  const { config, setRhythmType } = useECGStore()

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
        心律类型
      </h3>
      <div className="space-y-2">
        {(Object.keys(RHYTHM_PRESETS) as RhythmType[]).map((type) => {
          const preset = RHYTHM_PRESETS[type]
          const isSelected = config.rhythmType === type

          return (
            <button
              key={type}
              onClick={() => setRhythmType(type)}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all duration-200 text-left ${
                isSelected
                  ? 'bg-slate-800/80 border-2 shadow-lg'
                  : 'bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600'
              }`}
              style={{
                borderColor: isSelected ? preset.color : undefined,
                boxShadow: isSelected ? `0 0 15px ${preset.color}33` : undefined,
              }}
            >
              <div
                className="p-2 rounded-md"
                style={{
                  backgroundColor: `${preset.color}22`,
                  color: preset.color,
                }}
              >
                {rhythmIcons[type]}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-medium text-sm truncate"
                  style={{ color: isSelected ? preset.color : '#e2e8f0' }}
                >
                  {preset.label}
                </div>
                <div className="text-xs text-slate-400">
                  {type === 'atrial_fibrillation'
                    ? '不规则 (60-140 BPM)'
                    : `${preset.heartRate} BPM`}
                </div>
              </div>
              {isSelected && (
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: preset.color }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
