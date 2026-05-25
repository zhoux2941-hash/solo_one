import { useState, useEffect } from 'react'
import type { Challenge, LeaderboardEntry, UserStats, SignWord } from '../types'
import { getUserChallenges, getGlobalLeaderboard, getLeaderboard, getUserStats, acceptChallenge, resignChallenge } from '../services/api'
import { ChallengeCard } from './ChallengeCard'
import { Leaderboard } from './Leaderboard'
import { UserStatsCard } from './UserStatsCard'
import { AcceptChallengeModal } from './AcceptChallengeModal'
import { Zap, Trophy, Users, RefreshCw, Filter } from 'lucide-react'

interface CommunityPageProps {
  currentUserId: number | null
  signWords: SignWord[]
  onStartPractice?: (word: SignWord, challengeCode?: string) => void
}

type TabType = 'challenges' | 'leaderboard'
type ChallengeFilter = 'all' | 'pending' | 'accepted' | 'completed'

export function CommunityPage({ currentUserId, signWords, onStartPractice }: CommunityPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('challenges')
  const [challengeFilter, setChallengeFilter] = useState<ChallengeFilter>('all')
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([])
  const [wordLeaderboard, setWordLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [selectedWordId, setSelectedWordId] = useState<string>('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = async () => {
    if (!currentUserId) return

    setIsLoading(true)
    try {
      const [challengesData, leaderboardData, statsData] = await Promise.all([
        getUserChallenges(currentUserId),
        getGlobalLeaderboard(20),
        getUserStats(currentUserId)
      ])

      setChallenges(challengesData)
      setGlobalLeaderboard(leaderboardData)
      setUserStats(statsData)
    } catch (err) {
      console.error('加载社区数据失败:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentUserId])

  useEffect(() => {
    if (selectedWordId) {
      getLeaderboard(selectedWordId, 20).then(setWordLeaderboard).catch(console.error)
    }
  }, [selectedWordId])

  const handleAcceptChallenge = async (challengeCode: string) => {
    if (!currentUserId) return

    setActionLoading('accept')
    try {
      const challenge = await acceptChallenge(challengeCode, currentUserId)

      const wordId = signWords.find(w => w.word === challenge.word)?.id
      if (wordId && onStartPractice) {
        setShowAcceptModal(false)
        setActionLoading(null)
        onStartPractice(signWords.find(w => w.id === wordId)!, challengeCode)
      } else {
        await loadData()
        setShowAcceptModal(false)
      }
    } catch (err: any) {
      alert(err.message || '接受挑战失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResign = async (challengeCode: string) => {
    if (!currentUserId) return
    if (!confirm('确定要认输吗？这将直接判负。')) return

    setActionLoading(`resign-${challengeCode}`)
    try {
      await resignChallenge(challengeCode, currentUserId)
      await loadData()
    } catch (err: any) {
      alert(err.message || '操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAccept = (challenge: Challenge) => {
    const wordId = signWords.find(w => w.word === challenge.word)?.id
    if (wordId && onStartPractice) {
      onStartPractice(signWords.find(w => w.id === wordId)!, challenge.challenge_code)
    }
  }

  const filteredChallenges = challenges.filter(c => {
    if (challengeFilter === 'all') return true
    return c.status === challengeFilter
  })

  const pendingCount = challenges.filter(c => c.status === 'pending').length
  const acceptedCount = challenges.filter(c => c.status === 'accepted').length
  const completedCount = challenges.filter(c => c.status === 'completed').length

  return (
    <div className="space-y-5">
      <UserStatsCard stats={userStats} isLoading={isLoading && !userStats} />

      <div className="flex items-center gap-2">
        <div className="flex bg-slate-100 rounded-lg p-1 flex-1">
          <button
            onClick={() => setActiveTab('challenges')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'challenges'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            我的挑战
            {pendingCount + acceptedCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {pendingCount + acceptedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'leaderboard'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            排行榜
          </button>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          title="刷新"
        >
          <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => setShowAcceptModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          输入挑战码
        </button>
      </div>

      {activeTab === 'challenges' && (
        <>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {(['all', 'pending', 'accepted', 'completed'] as ChallengeFilter[]).map(filter => (
              <button
                key={filter}
                onClick={() => setChallengeFilter(filter)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  challengeFilter === filter
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter === 'all' && `全部 (${challenges.length})`}
                {filter === 'pending' && `待接受 (${pendingCount})`}
                {filter === 'accepted' && `进行中 (${acceptedCount})`}
                {filter === 'completed' && `已完成 (${completedCount})`}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : filteredChallenges.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">暂无挑战记录</p>
              <p className="text-sm text-slate-400 mt-1">发起挑战或输入朋友的挑战码开始对战吧！</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredChallenges.map(challenge => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  currentUserId={currentUserId}
                  onAccept={() => handleAccept(challenge)}
                  onResign={() => handleResign(challenge.challenge_code)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedWordId('')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                !selectedWordId
                  ? 'bg-yellow-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🏆 总榜
            </button>
            {signWords.slice(0, 10).map(word => (
              <button
                key={word.id}
                onClick={() => setSelectedWordId(word.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedWordId === word.id
                    ? 'bg-yellow-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {word.word}
              </button>
            ))}
          </div>

          {selectedWordId ? (
            <Leaderboard
              entries={wordLeaderboard}
              title={`${signWords.find(w => w.id === selectedWordId)?.word} - 排行榜`}
              showWord={false}
              currentUserId={currentUserId}
            />
          ) : (
            <Leaderboard
              entries={globalLeaderboard}
              title="全球排行榜"
              showWord={true}
              currentUserId={currentUserId}
            />
          )}
        </div>
      )}

      <AcceptChallengeModal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        onAccept={handleAcceptChallenge}
        isLoading={actionLoading === 'accept'}
      />
    </div>
  )
}
