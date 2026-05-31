import { useState } from 'react';
import { MessageSquare, BarChart3, Cloud, AlertCircle, Info } from 'lucide-react';
import BvInput from '../components/BvInput';
import TimeChart from '../components/TimeChart';
import WordCloudComponent from '../components/WordCloud';
import TopWords from '../components/TopWords';
import { fetchDanmakuByBv } from '../services/bilibiliApi';
import { calculateTimeDistribution } from '../utils/timeDistribution';
import { calculateWordFrequency, getTopWords } from '../utils/wordFrequency';
import type { AnalysisStatus, Danmaku, TimeDistribution, WordCount } from '../types';

export default function Home() {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [error, setError] = useState<string>('');
  const [danmakuList, setDanmakuList] = useState<Danmaku[]>([]);
  const [timeDistribution, setTimeDistribution] = useState<TimeDistribution[]>([]);
  const [wordFrequency, setWordFrequency] = useState<WordCount[]>([]);
  const [topWords, setTopWords] = useState<WordCount[]>([]);
  const [videoInfo, setVideoInfo] = useState<{ title: string; owner: string } | null>(null);

  const handleAnalyze = async (bv: string) => {
    setStatus('loading');
    setError('');

    try {
      const result = await fetchDanmakuByBv(bv);

      if (!result) {
        setStatus('error');
        setError('获取视频信息失败，请检查BV号是否正确');
        return;
      }

      if (result.danmakuList.length === 0) {
        setStatus('error');
        setError('未获取到弹幕数据，该视频可能没有弹幕');
        return;
      }

      setDanmakuList(result.danmakuList);
      setVideoInfo(result.videoInfo);

      const timeData = calculateTimeDistribution(result.danmakuList);
      setTimeDistribution(timeData);

      const wordData = await calculateWordFrequency(result.danmakuList, 100);
      setWordFrequency(wordData);
      setTopWords(getTopWords(wordData, 20));

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError('分析过程中发生错误，请稍后重试');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <header className="py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
              B站弹幕分析器
            </h1>
          </div>
          <p className="text-gray-500 text-lg mb-8">
            输入BV号，一键获取弹幕数据，可视化分析弹幕热点
          </p>

          <BvInput onSubmit={handleAnalyze} loading={status === 'loading'} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16">
        {status === 'loading' && (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">正在获取并分析弹幕数据...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-600 font-medium mb-2">分析失败</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        )}

        {status === 'success' && (
          <>
            {videoInfo && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Info className="w-6 h-6 text-pink-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-1">
                      {videoInfo.title}
                    </h2>
                    <p className="text-gray-500">UP主: {videoInfo.owner}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-pink-500">
                        {danmakuList.length}
                      </p>
                      <p className="text-xs text-gray-400">弹幕总数</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-500">
                        {wordFrequency.length}
                      </p>
                      <p className="text-xs text-gray-400">有效词汇</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8">
              <TimeChart data={timeDistribution} />
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <WordCloudComponent words={wordFrequency.slice(0, 50)} />
              <TopWords words={topWords} />
            </div>
          </>
        )}

        {status === 'idle' && (
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-pink-500" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">弹幕抓取</h3>
              <p className="text-sm text-gray-500">
                通过B站公开API获取视频弹幕数据，支持所有公开视频
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">时间分析</h3>
              <p className="text-sm text-gray-500">
                统计弹幕发送时间分布，直观展示高能时刻
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Cloud className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">词频统计</h3>
              <p className="text-sm text-gray-500">
                中文分词智能分析，生成词云展示高频热词
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-gray-400 text-sm">
        <p>数据来源于B站公开API · 仅供学习交流使用</p>
      </footer>
    </div>
  );
}
