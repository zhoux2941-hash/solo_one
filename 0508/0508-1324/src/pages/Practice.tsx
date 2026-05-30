import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Music, Info } from 'lucide-react';
import { Recorder } from '@/components/Recorder';
import { useStore } from '@/store/useStore';
import { getDialectName } from '@/utils/audio';

export default function Practice() {
  const navigate = useNavigate();
  const { userProgress, getCurrentSong } = useStore();
  const currentSong = getCurrentSong();

  return (
    <div className="min-h-screen bg-heritage-bg">
      <div className="bg-white shadow-sm border-b border-wood-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>返回首页</span>
            </button>

            <div className="flex items-center gap-2 text-gray-600">
              <Music size={18} className="text-primary-600" />
              <span>
                当前方言：<span className="font-bold text-primary-600">{getDialectName(userProgress.currentDialect)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-wine-500 via-wine-600 to-wine-600 py-16">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
        <div className="relative container mx-auto px-4 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6 backdrop-blur-sm">
            <Mic size={18} />
            <span className="text-sm">录音练习</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            跟着唱一唱
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            录下您的声音，通过频谱对比观察与标准音高的差异，提升您的演唱技巧
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Recorder />

            {currentSong && (
              <div className="bg-white rounded-xl p-6 shadow-md border border-wood-200">
                <h3 className="text-lg font-display font-semibold text-primary-600 mb-4">
                  参考曲目：{currentSong.title}
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">侗语歌词</p>
                    <p className="text-lg font-medium text-primary-700 bg-primary-50 p-4 rounded-lg">
                      {currentSong.lyrics.dong}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">汉语翻译</p>
                    <p className="text-lg font-medium text-wood-600 bg-wood-100 p-4 rounded-lg">
                      {currentSong.lyrics.chinese}
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 mb-1">演唱提示</p>
                      <p className="text-sm text-blue-700">
                        {currentSong.questions.melody.correctAnswer === 'high'
                          ? '这首歌曲的主旋律在高音部，注意模仿其明亮高亢的音色特点。'
                          : '这首歌曲的主旋律在低音部，注意模仿其深沉浑厚的音色特点。'}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        高音部参考音高：{currentSong.audioConfig.highVoice.baseFrequency}Hz，
                        低音部参考音高：{currentSong.audioConfig.lowVoice.baseFrequency}Hz
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-wood-200">
              <h3 className="text-lg font-display font-semibold text-primary-600 mb-4">
                音高参考
              </h3>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary-50 border border-primary-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-primary-700">高音部</span>
                    <span className="text-sm font-mono text-primary-600">
                      {currentSong?.audioConfig.highVoice.baseFrequency || 880}Hz
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${((currentSong?.audioConfig.highVoice.baseFrequency || 880) / 1000) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-wood-100 border border-wood-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-wood-600">低音部</span>
                    <span className="text-sm font-mono text-wood-500">
                      {currentSong?.audioConfig.lowVoice.baseFrequency || 220}Hz
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-wood-500 rounded-full"
                      style={{ width: `${((currentSong?.audioConfig.lowVoice.baseFrequency || 220) / 1000) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-wood-200">
              <h3 className="text-lg font-display font-semibold text-primary-600 mb-4">
                练习技巧
              </h3>

              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                  <span>先完整聆听歌曲，熟悉旋律走向</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                  <span>使用音量调节功能单独听高音部或低音部</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                  <span>跟着哼唱，注意观察频谱图的变化</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                  <span>录制后回放对比，找出音高差异</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-6 text-white">
              <h3 className="font-bold mb-2">💡 小提示</h3>
              <p className="text-sm text-white/90">
                频谱图中，竖条越高表示该频率的声音越强。尝试让您的频谱峰值对准参考音高位置。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
