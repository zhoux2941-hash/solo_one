import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, BookOpen } from 'lucide-react';

export default function Home() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const hotKeywords = ['VPN配置', '报销流程', '入职手续', '年假申请', 'Git规范', '邮箱配置'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">知识库搜索</span>
          </div>
          <button
            onClick={() => navigate('/admin/login')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">管理后台</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            内部知识库
          </h1>
          <p className="text-gray-500 text-lg">
            搜索公司规章制度、操作指南和常见问题解答
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-12">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索 VPN配置、报销流程、入职手续..."
              className="w-full px-8 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-lg shadow-gray-100/50"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2 font-medium shadow-lg shadow-blue-500/25"
            >
              <Search className="w-5 h-5" />
              搜索
            </button>
          </div>
        </form>

        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
            热门搜索
          </h3>
          <div className="flex flex-wrap gap-3">
            {hotKeywords.map((keyword) => (
              <button
                key={keyword}
                onClick={() => navigate(`/search?q=${encodeURIComponent(keyword)}`)}
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-full text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm font-medium shadow-sm"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { title: 'IT支持', desc: 'VPN、邮箱、网络故障排查', icon: '💻' },
            { title: '人事行政', desc: '入职、离职、假期、社保', icon: '📋' },
            { title: '财务报销', desc: '差旅、日常费用报销流程', icon: '💰' }
          ].map((category) => (
            <div
              key={category.title}
              className="p-6 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate(`/search?q=${encodeURIComponent(category.title)}`)}
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{category.icon}</div>
              <h4 className="font-semibold text-gray-800 mb-1">{category.title}</h4>
              <p className="text-sm text-gray-500">{category.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-8 text-gray-400 text-sm">
        © 2026 内部知识库搜索平台 · 您的反馈帮助我们做得更好
      </footer>
    </div>
  );
}
