import { useMemo } from 'react'
import type { CompareResult } from '../types'
import { Heatmap } from './Heatmap'

interface ScoreDisplayProps {
  result: CompareResult | null
  isLoading: boolean
}

export function ScoreDisplay({ result, isLoading }: ScoreDisplayProps) {
  const scoreColor = useMemo(() => {
    if (!result) return '#94a3b8'
    if (result.score >= 80) return '#22c55e'
    if (result.score >= 60) return '#f59e0b'
    return '#ef4444'
  }, [result])

  const scoreLabel = useMemo(() => {
    if (!result) return ''
    if (result.score >= 90) return '优秀'
    if (result.score >= 80) return '良好'
    if (result.score >= 60) return '及格'
    return '需要练习'
  }, [result])

  const circumference = 2 * Math.PI * 55
  const strokeDashoffset = result
    ? circumference - (result.score / 100) * circumference
    : circumference

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500">正在分析视频...</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <p className="text-lg">完成录制后将显示评分结果</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <div className="score-circle">
          <svg width="150" height="150">
            <circle
              className="circle-bg"
              cx="75"
              cy="75"
              r="55"
            />
            <circle
              className="circle-progress"
              cx="75"
              cy="75"
              r="55"
              stroke={scoreColor}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="score-text">
            <div className="score-value" style={{ color: scoreColor }}>
              {result.score}
            </div>
            <div className="score-label">{scoreLabel}</div>
          </div>
        </div>
        <p className="mt-4 text-lg font-medium text-slate-700">
          词汇：{result.word}
        </p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <h3 className="text-sm font-medium text-slate-600 mb-4">关键点偏差热力图</h3>
        <Heatmap deviations={result.landmark_deviations} />
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <h3 className="text-sm font-medium text-slate-600 mb-3">详细分析</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">有效帧数</span>
            <span className="font-medium">{result.frame_count}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">平均偏差</span>
            <span className="font-medium">
              {(result.landmark_deviations.reduce((sum, d) => sum + d.average_deviation, 0) / result.landmark_deviations.length).toFixed(4)}
            </span>
          </div>
          {result.path_metrics && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">时间伸缩因子</span>
                <span className={`font-medium ${
                  result.path_metrics.time_stretch_factor > 2.0 || result.path_metrics.time_stretch_factor < 0.5
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}>
                  {result.path_metrics.time_stretch_factor.toFixed(2)}x
                  {result.path_metrics.time_stretch_factor > 2.0 && ' (较快)'}
                  {result.path_metrics.time_stretch_factor < 0.5 && ' (较慢)'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">对齐连续性</span>
                <span className="font-medium text-green-600">
                  {(result.path_metrics.continuity * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">归一化帧数</span>
                <span className="font-medium">{result.path_metrics.normalized_frames}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">原始帧数</span>
                <span className="font-medium">
                  模板 {result.path_metrics.original_template_frames} / 输入 {result.path_metrics.original_input_frames}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="mt-4">
          <h4 className="text-xs text-slate-500 mb-2">偏差最大的关键点</h4>
          <div className="space-y-1">
            {[...result.landmark_deviations]
              .sort((a, b) => b.average_deviation - a.average_deviation)
              .slice(0, 5)
              .map((deviation) => (
                <div key={deviation.landmark_index} className="flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded text-xs font-medium">
                    {deviation.landmark_index}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.min(deviation.average_deviation * 500, 100)}%`,
                        backgroundColor: deviation.average_deviation > 0.15 ? '#ef4444' : deviation.average_deviation > 0.08 ? '#f59e0b' : '#22c55e'
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-500 w-16 text-right">
                    {deviation.average_deviation.toFixed(4)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
