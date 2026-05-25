import { useState } from 'react'
import type { Challenge } from '../types'
import { Trophy, Clock, CheckCircle, XCircle, ArrowRight, Copy, Share2 } from 'lucide-react'

interface ChallengeCardProps {
  challenge: Challenge
  currentUserId: number | null
  onAccept?: () => void
  onResign?: () => void
}

export function ChallengeCard({ challenge, currentUserId, onAccept, onResign }: ChallengeCardProps) {
  const [copied, setCopied] = useState(false)

  const isChallenger = currentUserId === challenge.challenger_id
  const isChallengee = currentUserId === challenge.challengee_id
  const isParticipant = isChallenger || isChallengee

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    accepted: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    expired: 'bg-gray-100 text-gray-600 border-gray-200'
  }

  const statusLabels = {
    pending: '等待接受',
    accepted: '进行中',
    completed: '已完成',
    expired: '已过期'
  }

  const copyChallengeCode = async () => {
    try {
      await navigator.clipboard.writeText(challenge.challenge_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const shareChallenge = async () => {
    const shareText = `我向你发起了手语"${challenge.word}"的挑战，目标分数${challenge.target_score}分！挑战码：${challenge.challenge_code}\n快到手语教学系统中接受挑战吧！`

    if (navigator.share) {
      try {
        await navigator.share({
          title: '手语挑战',
          text: shareText,
          url: window.location.href
        })
      } catch (err) {
        console.error('分享失败:', err)
      }
    } else {
      copyChallengeCode()
    }
  }

  const expiresAt = new Date(challenge.expires_at)
  const createdAt = new Date(challenge.created_at)
  const isExpired = new Date() > expiresAt

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-medium text-slate-800">{challenge.word}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[challenge.status]}`}>
            {statusLabels[challenge.status]}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">挑战者</div>
            <div className="font-medium text-slate-800">
              {challenge.challenger?.username || '用户' + challenge.challenger_id}
            </div>
            {challenge.challenger_score !== null && (
              <div className="text-sm text-blue-600 font-medium">{challenge.challenger_score}分</div>
            )}
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1">
              <ArrowRight className="w-3 h-3" />
              接受者
            </div>
            <div className="font-medium text-slate-800">
              {challenge.challengee?.username || (challenge.challengee_id ? '用户' + challenge.challengee_id : '公开挑战')}
            </div>
            {challenge.challengee_score !== null && (
              <div className="text-sm text-green-600 font-medium">{challenge.challengee_score}分</div>
            )}
          </div>
        </div>

        {challenge.status === 'completed' && challenge.winner && (
          <div className="flex items-center justify-center gap-2 p-2 bg-yellow-50 rounded-lg mb-3">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-700">
              {challenge.winner.username} 获胜！
            </span>
          </div>
        )}

        <div className="space-y-2 text-xs text-slate-500 mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isExpired
                ? '已过期'
                : `有效期至 ${expiresAt.toLocaleDateString('zh-CN')} ${expiresAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            <span>目标分数: {challenge.target_score}分</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg mb-3">
          <span className="text-xs text-slate-600">挑战码:</span>
          <code className="flex-1 text-xs font-mono font-bold text-blue-600">
            {challenge.challenge_code}
          </code>
          <button
            onClick={copyChallengeCode}
            className="p-1 hover:bg-blue-100 rounded transition-colors"
            title="复制挑战码"
          >
            <Copy className="w-3.5 h-3.5 text-blue-500" />
          </button>
          {isChallenger && challenge.status === 'pending' && (
            <button
              onClick={shareChallenge}
              className="p-1 hover:bg-blue-100 rounded transition-colors"
              title="分享挑战"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-500" />
            </button>
          )}
        </div>

        {copied && (
          <div className="text-center text-xs text-green-600 mb-2">✓ 已复制挑战码</div>
        )}

        {isParticipant && challenge.status !== 'completed' && challenge.status !== 'expired' && (
          <div className="flex gap-2">
            {isChallengee && challenge.status === 'pending' && (
              <button
                onClick={onAccept}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                接受挑战
              </button>
            )}
            <button
              onClick={onResign}
              className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              认输
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
