import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, ThumbsUp, ThumbsDown, Clock, Pin, BookOpen, Settings } from 'lucide-react';
import { searchApi } from '../utils/api.js';
import { Article, SearchResult } from '../../shared/index.js';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackStates, setFeedbackStates] = useState<Record<string, 'useful' | 'useless' | null>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (query) {
      doSearch(query);
    }
  }, [query]);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const data = await searchApi.search(q);
      setResult(data);
      setFeedbackStates({});
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleFeedback = async (article: Article, feedbackType: 'useful' | 'useless') => {
    if (feedbackStates[article.id]) return;
    
    try {
      await searchApi.submitFeedback({
        query,
        articleId: article.id,
        articleTitle: article.title,
        feedbackType
      });
      
      setFeedbackStates(prev => ({ ...prev, [article.id]: feedbackType }));
      setToast(feedbackType === 'useful' ? '感谢您的评价！我们会持续优化搜索结果' : '感谢您的反馈！我们会努力改进');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('提交反馈失败:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">返回首页</span>
            </button>
            
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-800 hidden sm:inline">知识库</span>
            </div>
            
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索知识库内容..."
                  className="w-full px-5 py-2.5 pl-12 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </form>
            
            <button
              onClick={() => navigate('/admin/login')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">管理</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {result && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              找到 <span className="font-semibold text-blue-600">{result.total}</span> 条结果
              {result.algorithm && (
                <span className="ml-2 text-xs text-gray-400">算法 {result.algorithm}</span>
              )}
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : result && result.articles.length > 0 ? (
          <div className="space-y-4">
            {result.articles.map((article, index) => {
              const isPinned = result.pinnedArticle?.id === article.id;
              const feedbackState = feedbackStates[article.id];
              
              return (
                <div
                  key={article.id}
                  className={`bg-white rounded-xl p-6 border transition-all hover:shadow-lg ${
                    isPinned 
                      ? 'border-amber-300 bg-amber-50/30' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-semibold text-sm">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {isPinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                            <Pin className="w-3 h-3" />
                            置顶
                          </span>
                        )}
                        <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 cursor-pointer truncate">
                          {article.title}
                        </h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                        {article.contentSnippet}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(article.publishTime)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleFeedback(article, 'useful')}
                            disabled={!!feedbackState}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              feedbackState === 'useful'
                                ? 'bg-green-100 text-green-700 cursor-default'
                                : feedbackState
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'hover:bg-green-50 text-gray-600 hover:text-green-600'
                            }`}
                          >
                            <ThumbsUp className={`w-4 h-4 ${feedbackState === 'useful' ? 'fill-current' : ''}`} />
                            有用
                          </button>
                          <button
                            onClick={() => handleFeedback(article, 'useless')}
                            disabled={!!feedbackState}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              feedbackState === 'useless'
                                ? 'bg-orange-100 text-orange-700 cursor-default'
                                : feedbackState
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'hover:bg-orange-50 text-gray-600 hover:text-orange-600'
                            }`}
                          >
                            <ThumbsDown className={`w-4 h-4 ${feedbackState === 'useless' ? 'fill-current' : ''}`} />
                            无用
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : result ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">未找到相关结果</h3>
            <p className="text-gray-500">尝试使用其他关键词搜索，或检查拼写是否正确</p>
          </div>
        ) : null}
      </main>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-800 text-white rounded-xl shadow-lg animate-bounce z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
