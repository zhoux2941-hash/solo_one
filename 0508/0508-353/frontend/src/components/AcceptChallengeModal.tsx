import { useState } from 'react'
import { X, Key, ArrowRight, Search } from 'lucide-react'

interface AcceptChallengeModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: (code: string) => void
  isLoading?: boolean
}

export function AcceptChallengeModal({
  isOpen,
  onClose,
  onAccept,
  isLoading
}: AcceptChallengeModalProps) {
  const [challengeCode, setChallengeCode] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = () => {
    const trimmedCode = challengeCode.trim().toUpperCase()
    if (!trimmedCode) {
      setError('请输入挑战码')
      return
    }
    if (!/^SL-[A-F0-9]{8}$/.test(trimmedCode) && !/^[A-F0-9]{8}$/.test(trimmedCode) && !/^SL-[A-Z0-9]{8}$/.test(trimmedCode)) {
      if (trimmedCode.length >= 8) {
        const formattedCode = trimmedCode.startsWith('SL-') ? trimmedCode : `SL-${trimmedCode.slice(-8)}`
        onAccept(formattedCode)
        return
      }
      setError('挑战码格式不正确')
      return
    }
    setError('')
    onAccept(trimmedCode)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setChallengeCode(text.trim().toUpperCase())
    } catch (err) {
      console.error('粘贴失败:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-500" />
            接受挑战
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
              输入挑战码
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={challengeCode}
                  onChange={(e) => {
                    setChallengeCode(e.target.value.toUpperCase())
                    setError('')
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="例如: SL-ABC12345"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg font-mono text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={11}
                  autoFocus
                />
              </div>
              <button
                onClick={handlePaste}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm"
              >
                粘贴
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-700 mb-2">使用说明</h4>
            <ol className="text-xs text-blue-600 space-y-1">
              <li>1. 向好友索要挑战码</li>
              <li>2. 输入挑战码，点击接受挑战</li>
              <li>3. 完成相应词汇的手语视频录制</li>
              <li>4. 系统自动比对双方分数，判定胜负</li>
            </ol>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">
              挑战码格式: SL-XXXXXXXX (8位字母数字组合，系统自动生成)
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
            disabled={isLoading || !challengeCode.trim()}
            className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                验证中...
              </>
            ) : (
              <>
                接受挑战
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
