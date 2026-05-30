import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Trophy } from 'lucide-react';
import { HeritageCard } from '@/components/HeritageCard';
import { useStore } from '@/store/useStore';
import { heritageContents } from '@/data/heritage';

export default function Heritage() {
  const navigate = useNavigate();
  const { userProgress } = useStore();

  const unlockedCount = userProgress.unlockedHeritageIds.length;
  const totalCount = heritageContents.length;

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

            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-yellow-500" />
              <span className="text-gray-600">
                已解锁 <span className="font-bold text-primary-600">{unlockedCount}</span>/{totalCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 py-16">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
        <div className="relative container mx-auto px-4 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6 backdrop-blur-sm">
            <BookOpen size={18} />
            <span className="text-sm">非物质文化遗产</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            侗族大歌背景介绍
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            每答对3题解锁一段新的非遗背景介绍，深入了解这一千年传唱的艺术瑰宝
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          {heritageContents.map((content, index) => (
            <div
              key={content.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <HeritageCard
                content={content}
                isUnlocked={userProgress.unlockedHeritageIds.includes(content.id)}
                currentScore={userProgress.score}
              />
            </div>
          ))}
        </div>

        {unlockedCount === 0 && (
          <div className="max-w-md mx-auto mt-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-100 flex items-center justify-center">
              <BookOpen size={40} className="text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              还没有解锁内容
            </h3>
            <p className="text-gray-500 mb-6">
              完成听辨训练，每答对3题即可解锁一段非遗背景介绍
            </p>
            <button
              onClick={() => navigate('/training/entry')}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              开始训练
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
