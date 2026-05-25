import { useMemo } from 'react'
import type { LeaderboardEntry } from '../types'
import { Trophy, Medal, Award, TrendingUp, User } from 'lucide-react'

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  title?: string
  showWord?: boolean
  currentUserId?: number | null
}

export function Leaderboard({ entries, title = '排行榜', showWord = true, currentUserId }: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />
    return <span className="w-5 text-center text-sm font-bold text-slate-400">{rank}</span>
  }

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-blue-50 border-blue-200'
    if (rank === 1) return 'bg-yellow-50 border-yellow-200'
    if (rank === 2) return 'bg-gray-50 border-gray-200'
    if (rank === 3) return 'bg-amber-50 border-amber-200'
    return 'bg-white border-slate-200'
  }

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.best_score - a.best_score)
  }, [entries])

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-slate-400" />
          <h3 className="font-medium text-slate-700">{title}</h3>
        </div>
        <div className="text-center py-8 text-slate-400">
          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">暂无排名数据</p>
          <p className="text-xs mt-1">完成练习后将显示排行榜</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-yellow-50 to-orange-50">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <h3 className="font-bold text-slate-800">{title}</h3>
          {sortedEntries.length > 0 && (
            <span className="ml-auto text-xs text-slate-500">
              共 {sortedEntries.length} 人
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {sortedEntries.slice(0, 20).map((entry, index) => {
          const rank = index + 1
          const isCurrentUser = currentUserId === entry.user_id

          return (
            <div
              key={`${entry.user_id}-${entry.word}`}
              className={`p-3 flex items-center gap-3 border-l-2 transition-colors ${getRankBg(rank, isCurrentUser)}`}
            >
              <div className="w-8 flex justify-center">
                {getRankIcon(rank)}
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                <User className="w-4 h-4 text-slate-500" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium truncate ${isCurrentUser ? 'text-blue-700' : 'text-slate-800'}`}>
                    {entry.username}
                    {isCurrentUser && <span className="text-xs text-blue-500">(我)</span>}
                  </span>
                </div>
                {showWord && (
                  <div className="text-xs text-slate-500">
                    词汇: {entry.word}
                  </div>
                )}
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  {entry.total_attempts} 次练习 · 平均 {entry.average_score.toFixed(0)}分
                </div>
              </div>

              <div className="text-right">
                <div className={`text-xl font-bold ${
                  rank === 1 ? 'text-yellow-600' :
                  rank === 2 ? 'text-gray-500' :
                  rank === 3 ? 'text-amber-600' :
                  'text-slate-700'
                }`}>
                  {entry.best_score.toFixed(1)}
                </div>
                <div className="text-xs text-slate-400">最高分</div>
              </div>
            </div>
          )
        })}
      </div>

      {sortedEntries.length > 20 && (
        <div className="p-3 text-center text-xs text-slate-400 border-t border-slate-100">
          还有 {sortedEntries.length - 20} 位用户
        </div>
      )}
    </div>
  )
}
