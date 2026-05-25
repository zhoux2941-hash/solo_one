import type { UserStats } from '../types'
import { Trophy, Target, Calendar, Award, Zap, TrendingUp } from 'lucide-react'

interface UserStatsCardProps {
  stats: UserStats | null
  isLoading?: boolean
}

export function UserStatsCard({ stats, isLoading }: UserStatsCardProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-white/20 rounded w-1/3"></div>
          <div className="h-12 bg-white/20 rounded w-1/2"></div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-16 bg-white/20 rounded"></div>
            <div className="h-16 bg-white/20 rounded"></div>
            <div className="h-16 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-sm text-slate-500 text-center">暂无统计数据</p>
      </div>
    )
  }

  const getRankBadge = (rank: number | null) => {
    if (!rank) return <span className="text-slate-400">未上榜</span>
    if (rank === 1) return <span className="text-yellow-300 font-bold">🥇 第1名</span>
    if (rank === 2) return <span className="text-gray-300 font-bold">🥈 第2名</span>
    if (rank === 3) return <span className="text-amber-300 font-bold">🥉 第3名</span>
    if (rank <= 10) return <span className="text-blue-200">🏆 第{rank}名</span>
    return <span className="text-blue-100">第{rank}名</span>
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            {stats.username}
          </h3>
          <div className="text-blue-100 text-sm">
            {getRankBadge(stats.rank)} · 共挑战 {stats.challenges_created} 场
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{stats.best_overall_score}</div>
          <div className="text-xs text-blue-200">历史最高分</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-200" />
            <span className="text-xs text-blue-200">总练习次数</span>
          </div>
          <div className="text-2xl font-bold">{stats.total_attempts}</div>
        </div>

        <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-200" />
            <span className="text-xs text-blue-200">平均分数</span>
          </div>
          <div className="text-2xl font-bold">{stats.average_score.toFixed(1)}</div>
        </div>

        <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-blue-200" />
            <span className="text-xs text-blue-200">已学词汇</span>
          </div>
          <div className="text-2xl font-bold">{stats.words_attempted}/20</div>
        </div>

        <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-blue-200" />
            <span className="text-xs text-blue-200">挑战获胜</span>
          </div>
          <div className="text-2xl font-bold">{stats.challenges_won}</div>
        </div>
      </div>
    </div>
  )
}
