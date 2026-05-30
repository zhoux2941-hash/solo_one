import { useCallback, useEffect, useRef } from 'react'
import { useDrumTowerStore } from '@/hooks/useDrumTowerStore'
import { SHICHEN_NAMES } from '../../shared/types'
import { postLog } from '@/utils/api'

export default function ShichenControl() {
  const currentShichenIndex = useDrumTowerStore((s) => s.currentShichenIndex)
  const setShichenIndex = useDrumTowerStore((s) => s.setShichenIndex)
  const isAutoPlaying = useDrumTowerStore((s) => s.isAutoPlaying)
  const setAutoPlaying = useDrumTowerStore((s) => s.setAutoPlaying)
  const animation = useDrumTowerStore((s) => s.animation)
  const dispatchAnimation = useDrumTowerStore((s) => s.dispatchAnimation)
  const rules = useDrumTowerStore((s) => s.rules)
  const selectedCity = useDrumTowerStore((s) => s.selectedCity)
  const addLog = useDrumTowerStore((s) => s.addLog)
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isAnimatingRef = useRef(false)

  isAnimatingRef.current = animation.isActive

  const triggerTimekeeping = useCallback(
    (index: number) => {
      if (isAnimatingRef.current) return
      const rule = rules[index]
      if (!rule) return

      const hasBell = rule.bell_count > 0
      const hasDrum = rule.drum_count > 0

      if (!hasBell && !hasDrum) {
        if (selectedCity) {
          postLog({
            city_id: selectedCity.id,
            shichen: rule.shichen,
            bell_count: 0,
            drum_count: 0,
            action: `切换至${rule.shichen}（无钟鼓）`,
          }).then((log) => addLog(log))
        }
        return
      }

      const instrument = hasBell ? 'bell' : 'drum'
      const count = hasBell ? rule.bell_count : rule.drum_count
      const maxCount = Math.min(count, 10)

      dispatchAnimation({ type: 'TRIGGER', instrument, count: maxCount })

      if (selectedCity) {
        postLog({
          city_id: selectedCity.id,
          shichen: rule.shichen,
          bell_count: rule.bell_count,
          drum_count: rule.drum_count,
          action: `${hasBell ? '钟' : '鼓'}声报时：${rule.shichen}，${hasBell ? `钟${rule.bell_count}响` : `鼓${rule.drum_count}响`}`,
        }).then((log) => addLog(log))
      }
    },
    [rules, selectedCity, dispatchAnimation, addLog]
  )

  const handleShichenChange = useCallback(
    (index: number) => {
      setShichenIndex(index)
      triggerTimekeeping(index)
    },
    [setShichenIndex, triggerTimekeeping]
  )

  useEffect(() => {
    if (isAutoPlaying) {
      autoTimerRef.current = setInterval(() => {
        if (isAnimatingRef.current) return
        const nextIndex = (currentShichenIndex + 1) % 12
        handleShichenChange(nextIndex)
      }, 5000)
    }
    return () => {
      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current)
        autoTimerRef.current = null
      }
    }
  }, [isAutoPlaying, currentShichenIndex, handleShichenChange])

  const currentRule = rules[currentShichenIndex]
  const angle = (currentShichenIndex / 12) * 360 - 90
  const isAnimating = animation.isActive

  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
        <svg width="240" height="240" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r="105" fill="none" stroke="#8B7355" strokeWidth="2" />
          <circle cx="120" cy="120" r="90" fill="none" stroke="#5C4033" strokeWidth="1" opacity="0.5" />
          {SHICHEN_NAMES.map((name, i) => {
            const a = (i / 12) * 360 - 90
            const rad = (a * Math.PI) / 180
            const tx = 120 + Math.cos(rad) * 78
            const ty = 120 + Math.sin(rad) * 78
            const isActive = i === currentShichenIndex
            return (
              <g key={name}>
                <circle
                  cx={120 + Math.cos(rad) * 95}
                  cy={120 + Math.sin(rad) * 95}
                  r={3}
                  fill={isActive ? '#DAA520' : '#8B7355'}
                />
                <text
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isActive ? 13 : 10}
                  fontWeight={isActive ? 'bold' : 'normal'}
                  fill={isActive ? '#DAA520' : '#8B9DAF'}
                  style={{ cursor: 'pointer', fontFamily: '"Noto Serif SC", serif' }}
                  onClick={() => handleShichenChange(i)}
                >
                  {name.replace('时', '')}
                </text>
              </g>
            )
          })}
          <line
            x1="120"
            y1="120"
            x2={120 + Math.cos((angle * Math.PI) / 180) * 60}
            y2={120 + Math.sin((angle * Math.PI) / 180) * 60}
            stroke="#C23616"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="120" cy="120" r="6" fill="#C23616" />
        </svg>
      </div>

      <div className="flex items-center gap-2 justify-center">
        <button
          onClick={() => setAutoPlaying(!isAutoPlaying)}
          disabled={isAnimating}
          className="px-4 py-2 rounded border transition-all duration-200"
          style={{
            borderColor: isAutoPlaying ? '#DAA520' : '#8B7355',
            color: isAutoPlaying ? '#DAA520' : '#8B9DAF',
            backgroundColor: isAutoPlaying ? 'rgba(218,165,32,0.1)' : 'transparent',
          }}
        >
          {isAutoPlaying ? '⏸ 暂停' : '▶ 自动流逝'}
        </button>
        <button
          onClick={() => handleShichenChange(currentShichenIndex)}
          disabled={isAnimating}
          className="px-4 py-2 rounded border transition-all duration-200"
          style={{
            borderColor: '#C23616',
            color: '#C23616',
            backgroundColor: 'rgba(194,54,22,0.1)',
          }}
        >
          🔔 报时
        </button>
      </div>

      {currentRule && (
        <div
          className="text-center p-3 rounded-lg border"
          style={{
            borderColor: '#8B7355',
            backgroundColor: 'rgba(139,115,85,0.1)',
          }}
        >
          <div className="text-lg font-bold" style={{ color: '#DAA520', fontFamily: '"Noto Serif SC", serif' }}>
            {currentRule.shichen} · {currentRule.modern_time}
          </div>
          <div className="text-sm mt-1" style={{ color: '#8B9DAF' }}>
            {currentRule.bell_count > 0 && `钟 ${currentRule.bell_count} 响`}
            {currentRule.bell_count > 0 && currentRule.drum_count > 0 && ' · '}
            {currentRule.drum_count > 0 && `鼓 ${currentRule.drum_count} 响`}
            {currentRule.bell_count === 0 && currentRule.drum_count === 0 && '无钟鼓'}
          </div>
          <div className="text-xs mt-1" style={{ color: '#6B7B8D' }}>
            {currentRule.description}
          </div>
        </div>
      )}
    </div>
  )
}
