import { useNavigate } from 'react-router-dom';
import { Music, BookOpen, Mic, Trophy, ArrowRight, RotateCcw } from 'lucide-react';
import { DialectSelector } from '@/components/DialectSelector';
import { useStore } from '@/store/useStore';
import { getDialectName } from '@/utils/audio';
import { heritageContents } from '@/data/heritage';
import type { Dialect, TrainingMode } from '@/types';

export default function Home() {
  const navigate = useNavigate();
  const { userProgress, setDialect, resetProgress, getAvailableSongs } = useStore();

  const availableSongs = getAvailableSongs();
  const unlockedCount = userProgress.unlockedHeritageIds.length;
  const totalHeritage = heritageContents.length;

  const handleStartTraining = (mode: TrainingMode) => {
    navigate(`/training/${mode}`);
  };

  return (
    <div className="min-h-screen bg-heritage-bg">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6 backdrop-blur-sm">
              <Music size={18} />
              <span className="text-sm">国家级非物质文化遗产</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 leading-tight">
              侗族大歌
              <span className="block text-wood-400 mt-2">声部听辨训练系统</span>
            </h1>

            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              通过多声部音乐听辨训练，掌握侗族大歌的声部特征，
              感受这一"天籁之音"的独特魅力。
            </p>

            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold text-wood-400">5</div>
                <div className="text-sm text-white/70">首预置曲目</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold text-wood-400">3</div>
                <div className="text-sm text-white/70">种方言版本</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold text-wood-400">{userProgress.score}</div>
                <div className="text-sm text-white/70">累计得分</div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-heritage-bg to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-wood-200">
              <DialectSelector
                selectedDialect={userProgress.currentDialect}
                onSelect={(dialect: Dialect) => setDialect(dialect)}
              />

              <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-200">
                <p className="text-primary-700">
                  当前方言：<span className="font-bold">{getDialectName(userProgress.currentDialect)}</span>
                  <span className="text-sm text-primary-600 ml-2">
                    （{availableSongs.length} 首曲目可用）
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-wood-200">
              <h3 className="text-xl font-display font-bold text-primary-600 mb-6">
                选择训练模式
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <button
                  onClick={() => handleStartTraining('entry')}
                  className="group relative overflow-hidden p-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-left shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-4">
                      <Music size={28} />
                    </div>
                    <h4 className="text-2xl font-bold mb-2">声部先进入</h4>
                    <p className="text-white/80 mb-4">
                      听辨录音，判断哪个声部先进入
                    </p>
                    <div className="flex items-center gap-2 text-white/90 group-hover:translate-x-2 transition-transform">
                      <span>开始训练</span>
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleStartTraining('melody')}
                  className="group relative overflow-hidden p-8 rounded-xl bg-gradient-to-br from-wood-400 to-wood-500 text-white text-left shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-4">
                      <Music size={28} />
                    </div>
                    <h4 className="text-2xl font-bold mb-2">主要旋律</h4>
                    <p className="text-white/80 mb-4">
                      听辨录音，判断哪个声部是主要旋律
                    </p>
                    <div className="flex items-center gap-2 text-white/90 group-hover:translate-x-2 transition-transform">
                      <span>开始训练</span>
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-wood-200">
              <h3 className="text-xl font-display font-bold text-primary-600 mb-6">
                更多功能
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/heritage')}
                  className="flex items-center gap-4 p-6 rounded-xl bg-heritage-bg border-2 border-wood-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
                >
                  <div className="p-3 rounded-xl bg-primary-100 text-primary-600">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h5 className="font-bold text-heritage-text">非遗背景介绍</h5>
                    <p className="text-sm text-gray-500">
                      已解锁 {unlockedCount}/{totalHeritage} 段
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/practice')}
                  className="flex items-center gap-4 p-6 rounded-xl bg-heritage-bg border-2 border-wood-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
                >
                  <div className="p-3 rounded-xl bg-wine-500 text-white">
                    <Mic size={24} />
                  </div>
                  <div>
                    <h5 className="font-bold text-heritage-text">录音练习</h5>
                    <p className="text-sm text-gray-500">
                      录下自己的声音与标准对比
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-wood-200 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-bold text-primary-600 flex items-center gap-2">
                  <Trophy size={20} className="text-yellow-500" />
                  学习进度
                </h3>
                <button
                  onClick={resetProgress}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="重置进度"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">累计得分</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {userProgress.score}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (userProgress.score / 15) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">累计答题</span>
                    <span className="text-lg font-semibold text-gray-700">
                      {userProgress.totalAnswered} 题
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">正确率</span>
                    <span className="text-lg font-semibold text-gray-700">
                      {userProgress.totalAnswered > 0
                        ? Math.round((userProgress.score / userProgress.totalAnswered) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">非遗解锁进度</span>
                    <span className="text-sm font-medium text-primary-600">
                      {unlockedCount}/{totalHeritage}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-wood-400 to-wood-500 rounded-full transition-all duration-500"
                      style={{ width: `${(unlockedCount / totalHeritage) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    每答对3题解锁一段非遗背景介绍
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
