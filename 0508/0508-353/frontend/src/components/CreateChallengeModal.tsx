import { useState } from 'react'
import type { SignWord } from '../types'
import { X, Target, Clock, Zap } from 'lucide-react'

interface CreateChallengeModalProps {
  isOpen: boolean
  onClose: () => void
  words: SignWord[]
  selectedWord: SignWord | null
  onCreate: (data: { word: string; target_score?: number; expires_in_hours: number }) => void
  isLoading?: boolean
  currentBestScore?: number
}

export function CreateChallengeModal({
  isOpen,
  onClose,
  words,
  selectedWord,
  onCreate,
  isLoading,
  currentBestScore
}: CreateChallengeModalProps) {
  const [targetScore, setTargetScore] = useState<number>(80)
  const [expiresInHours, setExpiresInHours] = useState<number>(24)

  if (!isOpen) return null

  const wordId = selectedWord?.id || words[0]?.id || ''
  const suggestedScore = currentBestScore ? Math.round(currentBestScore * 0.9) : 80

  const handleSubmit = () => {
    onCreate({
      word: wordId,
      target_score: targetScore,
      expires_in_hours: expiresInHours
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            发起挑战
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              挑战词汇
            </label>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-700">
                {selectedWord?.word || words[0]?.word}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {selectedWord?.description || words[0]?.description}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              目标分数
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="50"
                max="100"
                value={targetScore}
                onChange={(e) => setTargetScore(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={targetScore}
                  onChange={(e) => setTargetScore(Math.max(50, Math.min(100, parseInt(e.target.value) || 50)))}
                  className="w-24 px-3 py-1 border border-slate-300 rounded-lg text-center font-medium"
                />
                {currentBestScore !== undefined && (
                  <button
                    onClick={() => setTargetScore(suggestedScore)}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    建议: {suggestedScore}分 (历史最高的90%)
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              有效期
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 6, 24, 72].map((hours) => (
                <button
                  key={hours}
                  onClick={() => setExpiresInHours(hours)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    expiresInHours === hours
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {hours < 24 ? `${hours}小时` : `${hours / 24}天`}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-700">
              💡 发起挑战后，系统会生成唯一的挑战码。将挑战码分享给朋友，他们输入挑战码即可接受挑战。双方完成后系统自动判定胜负！
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !wordId}
            className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                生成中...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                生成挑战码
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
