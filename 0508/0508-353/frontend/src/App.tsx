import { useState, useEffect } from 'react'
import { VideoRecorder } from './components/VideoRecorder'
import { ScoreDisplay } from './components/ScoreDisplay'
import { HistoryChart } from './components/HistoryChart'
import { WordSelector } from './components/WordSelector'
import { CommunityPage } from './components/CommunityPage'
import { CreateChallengeModal } from './components/CreateChallengeModal'
import {
  getSignWords,
  createUser,
  compareSign,
  compareSignForChallenge,
  getPracticeHistory,
  getPracticeRecords,
  createChallenge
} from './services/api'
import type { SignWord, CompareResult, PracticeHistory, PracticeRecord } from './types'
import { BookOpen, History, User, Users, Zap, Trophy } from 'lucide-react'

type TabType = 'practice' | 'history' | 'community'

function App() {
  const [words, setWords] = useState<SignWord[]>([])
  const [selectedWord, setSelectedWord] = useState<SignWord | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [username, setUsername] = useState('')
  const [showUsernameModal, setShowUsernameModal] = useState(true)

  const [compareResult, setCompareResult] = useState<CompareResult | null>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [practiceHistory, setPracticeHistory] = useState<PracticeHistory[]>([])
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('practice')

  const [activeChallengeCode, setActiveChallengeCode] = useState<string | null>(null)
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false)
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false)

  useEffect(() => {
    const savedUserId = localStorage.getItem('sign_language_user_id')
    const savedUsername = localStorage.getItem('sign_language_username')

    if (savedUserId && savedUsername) {
      setUserId(parseInt(savedUserId))
      setUsername(savedUsername)
      setShowUsernameModal(false)
    }

    loadWords()
  }, [])

  useEffect(() => {
    if (userId) {
      loadHistory()
    }
  }, [userId])

  const loadWords = async () => {
    try {
      const data = await getSignWords()
      setWords(data)
      if (data.length > 0 && !selectedWord) {
        setSelectedWord(data[0])
      }
    } catch (err) {
      setError('加载词汇列表失败')
    }
  }

  const loadHistory = async () => {
    if (!userId) return
    try {
      const [history, records] = await Promise.all([
        getPracticeHistory(userId),
        getPracticeRecords(userId)
      ])
      setPracticeHistory(history)
      setPracticeRecords(records)
    } catch (err) {
      console.error('加载历史记录失败:', err)
    }
  }

  const handleCreateUser = async () => {
    if (!username.trim()) return

    try {
      const user = await createUser(username.trim())
      setUserId(user.id)
      setUsername(user.username)
      localStorage.setItem('sign_language_user_id', String(user.id))
      localStorage.setItem('sign_language_username', user.username)
      setShowUsernameModal(false)
    } catch (err) {
      setError('创建用户失败')
    }
  }

  const getCurrentWordBestScore = () => {
    if (!selectedWord) return undefined
    const wordHistory = practiceHistory.find(h => h.word === selectedWord.word)
    return wordHistory?.best_score
  }

  const handleCreateChallenge = async (data: { word: string; target_score?: number; expires_in_hours: number }) => {
    if (!userId) return

    setIsCreatingChallenge(true)
    try {
      const challenge = await createChallenge(userId, data)
      alert(`挑战已创建！\n挑战码：${challenge.challenge_code}\n目标分数：${challenge.target_score}分\n将挑战码分享给朋友即可开始对战！`)
      setShowCreateChallengeModal(false)

      const wordId = data.word
      const word = words.find(w => w.id === wordId)
      if (word) {
        handleStartPractice(word, challenge.challenge_code)
      }
    } catch (err: any) {
      alert(err.message || '创建挑战失败')
    } finally {
      setIsCreatingChallenge(false)
    }
  }

  const handleStartPractice = (word: SignWord, challengeCode?: string) => {
    setSelectedWord(word)
    setCompareResult(null)
    setError(null)
    if (challengeCode) {
      setActiveChallengeCode(challengeCode)
    }
    setActiveTab('practice')
  }

  const handleRecordingComplete = async (videoBlob: Blob) => {
    if (!selectedWord || !userId) {
      setError('请先选择词汇并登录')
      return
    }

    setIsComparing(true)
    setError(null)
    setCompareResult(null)

    try {
      const videoFile = new File([videoBlob], 'recording.webm', {
        type: 'video/webm'
      })

      let result: CompareResult
      if (activeChallengeCode) {
        result = await compareSignForChallenge(selectedWord.id, activeChallengeCode, userId, videoFile)
        alert(`挑战提交成功！\n挑战码：${activeChallengeCode}\n您的分数：${result.score.toFixed(1)}分\n等待对手完成后系统将自动判定胜负。`)
        setActiveChallengeCode(null)
      } else {
        result = await compareSign(selectedWord.id, userId, videoFile)
      }

      setCompareResult(result)
      await loadHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : '比对失败')
    } finally {
      setIsComparing(false)
    }
  }

  const handleReset = () => {
    setCompareResult(null)
    setError(null)
    setActiveChallengeCode(null)
  }

  const currentWordBest = getCurrentWordBestScore()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">手语教学系统</h1>
                <p className="text-xs text-slate-500">AI辅助手语学习平台 · 支持挑战对战</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700">{username}</span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('sign_language_user_id')
                  localStorage.removeItem('sign_language_username')
                  setUserId(null)
                  setUsername('')
                  setShowUsernameModal(true)
                }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                切换用户
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('practice')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'practice'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            练习
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            历史记录
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'community'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            社区挑战
          </button>
        </div>

        {activeTab === 'practice' && (
          <>
            {activeChallengeCode && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <div>
                    <span className="text-sm font-medium text-yellow-700">挑战模式</span>
                    <span className="ml-2 text-sm text-yellow-600">挑战码：<code className="font-mono font-bold">{activeChallengeCode}</code></span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveChallengeCode(null)}
                  className="text-sm text-yellow-600 hover:text-yellow-700"
                >
                  退出挑战
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <WordSelector
                      words={words}
                      selectedWord={selectedWord}
                      onSelectWord={(word) => {
                        setSelectedWord(word)
                        handleReset()
                      }}
                    />
                  </div>
                  {selectedWord && !activeChallengeCode && (
                    <button
                      onClick={() => setShowCreateChallengeModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-500 hover:to-orange-600 transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Trophy className="w-4 h-4" />
                      发起挑战
                    </button>
                  )}
                </div>

                {selectedWord && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-600 mb-2">当前选择</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-600">
                          {selectedWord.word}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{selectedWord.word}</p>
                        <p className="text-sm text-slate-500">{selectedWord.description}</p>
                        {currentWordBest !== undefined && currentWordBest > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            历史最高: {currentWordBest.toFixed(1)}分
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                  <h3 className="text-sm font-medium text-slate-600 mb-4">
                    {activeChallengeCode ? '录制挑战视频' : '录制手语视频'}
                  </h3>
                  <VideoRecorder
                    onRecordingComplete={handleRecordingComplete}
                    disabled={isComparing || !selectedWord}
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-600">评分结果</h3>
                    {compareResult && (
                      <button
                        onClick={handleReset}
                        className="text-sm text-blue-500 hover:text-blue-600"
                      >
                        清除结果
                      </button>
                    )}
                  </div>
                  <ScoreDisplay result={compareResult} isLoading={isComparing} />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <HistoryChart history={practiceHistory} />

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-medium text-slate-600">最近练习记录</h3>
              </div>
              {practiceRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  暂无练习记录
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {practiceRecords.slice(0, 10).map((record) => (
                    <div
                      key={record.id}
                      className="p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="font-bold text-blue-600 text-sm">
                            {record.word.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{record.word}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(record.created_at).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          record.score >= 80
                            ? 'bg-green-100 text-green-700'
                            : record.score >= 60
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {record.score.toFixed(1)}分
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <CommunityPage
            currentUserId={userId}
            signWords={words}
            onStartPractice={handleStartPractice}
          />
        )}
      </main>

      {showUsernameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">欢迎使用手语教学系统</h2>
            <p className="text-slate-600 mb-6">请输入您的用户名开始学习</p>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateUser()}
            />
            <button
              onClick={handleCreateUser}
              disabled={!username.trim()}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              开始学习
            </button>
          </div>
        </div>
      )}

      <CreateChallengeModal
        isOpen={showCreateChallengeModal}
        onClose={() => setShowCreateChallengeModal(false)}
        words={words}
        selectedWord={selectedWord}
        onCreate={handleCreateChallenge}
        isLoading={isCreatingChallenge}
        currentBestScore={currentWordBest}
      />
    </div>
  )
}

export default App
