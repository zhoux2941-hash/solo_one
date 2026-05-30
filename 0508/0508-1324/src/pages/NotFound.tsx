import { useNavigate } from 'react-router-dom';
import { Home, Music } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-heritage-bg flex items-center justify-center">
      <div className="text-center px-4">
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Music size={60} className="text-white opacity-50" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl font-display font-bold text-white drop-shadow-lg">404</span>
          </div>
        </div>

        <h1 className="text-3xl font-display font-bold text-primary-700 mb-4">
          页面未找到
        </h1>

        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          抱歉，您访问的页面不存在或已被移除。
          让我们带您回到侗族大歌的音乐世界。
        </p>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          <Home size={20} />
          <span>返回首页</span>
        </button>
      </div>
    </div>
  );
}
