import { useState, useCallback, useEffect } from 'react';
import { Search, ArrowRightLeft, Sparkles, AlertCircle, Filter, ArrowUpDown, Layers } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getCharactersByChar, getCharactersByCodeAdvanced, getLevel1Shortcuts } from '@/data/wubiData';
import RadicalAnimation from '@/components/RadicalAnimation';
import Pagination from '@/components/Pagination';
import type { WubiCharacter, WubiVersion } from '@/types';

const PAGE_SIZE = 20;

const quickExamples = ['好', '你', '我', '是', '的', '有', '国', '学', '生', '天'];

export default function Home() {
  const { 
    activeTab, 
    setActiveTab, 
    queryResult, 
    reverseQueryResult,
    currentPage,
    setCurrentPage,
    searchInput,
    setSearchInput,
    loading,
    setLoading,
    setQueryResult,
    setReverseQueryResult,
    resetQuery
  } = useStore();

  const [localInput, setLocalInput] = useState(searchInput);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'frequency' | 'code'>('frequency');
  const [commonOnly, setCommonOnly] = useState(false);
  const [versionFilter, setVersionFilter] = useState<WubiVersion | 'all'>('all');

  useEffect(() => {
    setLocalInput(searchInput);
  }, [searchInput]);

  const validateCharInput = useCallback((input: string): boolean => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError('请输入要查询的汉字');
      return false;
    }
    if (trimmed.length !== 1) {
      setError('请输入单个汉字');
      return false;
    }
    const charCode = trimmed.charCodeAt(0);
    if (!(charCode >= 0x4e00 && charCode <= 0x9fff)) {
      setError('请输入有效的汉字');
      return false;
    }
    setError(null);
    return true;
  }, []);

  const validateCodeInput = useCallback((input: string): boolean => {
    const trimmed = input.trim().toUpperCase();
    if (!trimmed) {
      setError('请输入要查询的五笔编码');
      return false;
    }
    if (!/^[A-Z]{1,4}$/.test(trimmed)) {
      setError('请输入1-4个英文字母');
      return false;
    }
    setError(null);
    return true;
  }, []);

  const handleCharQuery = useCallback(() => {
    if (!validateCharInput(localInput)) return;
    
    setLoading(true);
    setTimeout(() => {
      const char = localInput.trim();
      const results = getCharactersByChar(char, versionFilter === 'all' ? undefined : versionFilter);
      
      if (results.length > 0) {
        setQueryResult({
          success: true,
          data: results,
        });
        setError(null);
      } else {
        setQueryResult({
          success: false,
          message: `未找到汉字「${char}」的五笔编码数据`,
        });
      }
      setLoading(false);
      setSearchInput(char);
    }, 300);
  }, [localInput, validateCharInput, setLoading, setQueryResult, setSearchInput, versionFilter]);

  const handleCodeQuery = useCallback((page: number = 1) => {
    if (!validateCodeInput(localInput)) return;
    
    setLoading(true);
    setTimeout(() => {
      const code = localInput.trim().toUpperCase();
      const results = getCharactersByCodeAdvanced({ code, sortBy, commonOnly, version: versionFilter });
      
      if (results.length > 0) {
        const totalPages = Math.ceil(results.length / PAGE_SIZE);
        const startIndex = (page - 1) * PAGE_SIZE;
        const pageData = results.slice(startIndex, startIndex + PAGE_SIZE);
        
        setReverseQueryResult({
          success: true,
          data: pageData,
          total: results.length,
          page,
          pageSize: PAGE_SIZE,
        });
        setCurrentPage(page);
        setError(null);
      } else {
        setReverseQueryResult({
          success: false,
          message: `未找到编码「${code}」对应的汉字`,
        });
      }
      setLoading(false);
      setSearchInput(code);
    }, 300);
  }, [localInput, validateCodeInput, setLoading, setReverseQueryResult, setCurrentPage, setSearchInput, sortBy, commonOnly, versionFilter]);

  const handleSortChange = useCallback(() => {
    const newSortBy = sortBy === 'frequency' ? 'code' : 'frequency';
    setSortBy(newSortBy);
    if (reverseQueryResult && activeTab === 'code-to-char' && searchInput) {
      handleCodeQuery(currentPage);
    }
  }, [sortBy, reverseQueryResult, activeTab, searchInput, handleCodeQuery, currentPage]);

  const handleCommonOnlyChange = useCallback(() => {
    const newCommonOnly = !commonOnly;
    setCommonOnly(newCommonOnly);
    if (reverseQueryResult && activeTab === 'code-to-char' && searchInput) {
      handleCodeQuery(1);
    }
  }, [commonOnly, reverseQueryResult, activeTab, searchInput, handleCodeQuery]);

  const handleVersionChange = useCallback((version: WubiVersion | 'all') => {
    setVersionFilter(version);
    if (activeTab === 'char-to-code' && queryResult && searchInput) {
      handleCharQuery();
    } else if (activeTab === 'code-to-char' && reverseQueryResult && searchInput) {
      handleCodeQuery(currentPage);
    }
  }, [activeTab, queryResult, reverseQueryResult, searchInput, currentPage, handleCharQuery, handleCodeQuery]);

  const getVersionLabel = (version: WubiVersion) => {
    switch (version) {
      case '86': return { text: '86版', color: 'bg-primary-500/20 text-primary-400 border-primary-500/30' };
      case '98': return { text: '98版', color: 'bg-accent-500/20 text-accent-400 border-accent-500/30' };
      case '新世纪': return { text: '新世纪版', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    }
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'char-to-code') {
      handleCharQuery();
    } else {
      handleCodeQuery(1);
    }
  }, [activeTab, handleCharQuery, handleCodeQuery]);

  const handleQuickExample = useCallback((char: string) => {
    setActiveTab('char-to-code');
    setLocalInput(char);
    setTimeout(() => {
      setSearchInput(char);
      const results = getCharactersByChar(char, versionFilter === 'all' ? undefined : versionFilter);
      if (results.length > 0) {
        setQueryResult({
          success: true,
          data: results,
        });
      }
    }, 50);
  }, [setActiveTab, setSearchInput, setQueryResult, versionFilter]);

  const handlePageChange = useCallback((page: number) => {
    handleCodeQuery(page);
  }, [handleCodeQuery]);

  const handleTabChange = useCallback((tab: 'char-to-code' | 'code-to-char') => {
    setActiveTab(tab);
    resetQuery();
    setLocalInput('');
    setError(null);
  }, [setActiveTab, resetQuery]);

  const handleReverseItemClick = useCallback((char: WubiCharacter) => {
    setActiveTab('char-to-code');
    setLocalInput(char.char);
    setSearchInput(char.char);
    const results = getCharactersByChar(char.char, versionFilter === 'all' ? undefined : versionFilter);
    setQueryResult({
      success: true,
      data: results.length > 0 ? results : [char],
    });
    setReverseQueryResult(null);
  }, [setActiveTab, setSearchInput, setQueryResult, setReverseQueryResult, versionFilter]);

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1: return { text: '一级简码', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
      case 2: return { text: '二级简码', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 3: return { text: '三级简码', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
      default: return { text: '全码', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    }
  };

  const level1Shortcuts = getLevel1Shortcuts();

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-12">
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
          <span className="text-gradient">五笔编码</span> 查询系统
        </h2>
        <p className="text-dark-300 text-lg max-w-2xl mx-auto">
          支持汉字查编码、编码反查汉字，字根拆解动画展示，帮助您快速掌握五笔输入法
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <div className="card p-6 sticky top-24">
            <div className="flex mb-6 bg-dark-900/50 p-1 rounded-xl">
              <button
                onClick={() => handleTabChange('char-to-code')}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300
                  ${activeTab === 'char-to-code'
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                    : 'text-dark-400 hover:text-white hover:bg-dark-700/50'}
                `}
              >
                <Search className="w-4 h-4" />
                汉字查编码
              </button>
              <button
                onClick={() => handleTabChange('code-to-char')}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300
                  ${activeTab === 'code-to-char'
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                    : 'text-dark-400 hover:text-white hover:bg-dark-700/50'}
                `}
              >
                <ArrowRightLeft className="w-4 h-4" />
                编码反查
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="relative mb-4">
                <input
                  type="text"
                  value={localInput}
                  onChange={(e) => {
                    setLocalInput(e.target.value);
                    setError(null);
                  }}
                  placeholder={
                    activeTab === 'char-to-code'
                      ? '请输入单个汉字，如：好'
                      : '请输入1-4位编码，如：VB'
                  }
                  className="input-field text-xl text-center font-serif tracking-wider"
                  maxLength={activeTab === 'char-to-code' ? 1 : 4}
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 text-sm">
                  {activeTab === 'char-to-code' ? '汉字' : '编码'}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="mb-4">
                <p className="text-dark-400 text-xs mb-2 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-accent-400" />
                  版本筛选
                </p>
                <div className="flex gap-1.5">
                  {(['all', '86', '98', '新世纪'] as const).map((version) => (
                    <button
                      key={version}
                      type="button"
                      onClick={() => handleVersionChange(version)}
                      className={`
                        flex-1 py-1.5 px-2 rounded-lg text-xs transition-all duration-200
                        ${versionFilter === version
                          ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md'
                          : 'bg-dark-800 text-dark-400 border border-dark-700 hover:border-accent-500/50 hover:text-white'}
                      `}
                    >
                      {version === 'all' ? '全部' : `${version}版`}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {loading ? '查询中...' : '立即查询'}
              </button>
            </form>

            {activeTab === 'char-to-code' && (
              <div className="mt-6">
                <p className="text-dark-400 text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent-400" />
                  快速查询示例
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickExamples.map((char) => (
                    <button
                      key={char}
                      onClick={() => handleQuickExample(char)}
                      className="
                        w-10 h-10 rounded-xl font-serif text-xl
                        bg-dark-700 hover:bg-dark-600
                        text-white hover:text-accent-400
                        border border-dark-600 hover:border-accent-500/50
                        transition-all duration-200
                      "
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'char-to-code' && (
              <div className="mt-6 pt-6 border-t border-dark-700">
                <p className="text-dark-400 text-sm mb-3">一级简码（25个高频字）</p>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(level1Shortcuts).map(([char, code]) => (
                    <button
                      key={char}
                      onClick={() => handleQuickExample(char)}
                      className="
                        p-2 rounded-lg text-center
                        bg-dark-700/50 hover:bg-dark-700
                        border border-dark-600/50 hover:border-green-500/50
                        transition-all duration-200 group
                      "
                    >
                      <div className="font-serif text-lg text-white group-hover:text-green-400">{char}</div>
                      <div className="text-xs text-dark-500 font-mono">{code}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'char-to-code' && queryResult && (
            <div className="animate-slide-up">
              {queryResult.success && queryResult.data && queryResult.data.length > 0 ? (
                <div className="card p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6 pb-6 border-b border-dark-700">
                    <div className="flex-shrink-0 w-32 h-32 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center border border-primary-500/30">
                      <span className="font-serif text-7xl text-white">{queryResult.data[0].char}</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-dark-300">拼音：</span>
                        <span className="text-accent-400 font-medium text-xl">{queryResult.data[0].pinyin}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-dark-300">五笔编码：</span>
                        <div className="flex flex-wrap gap-2">
                          {queryResult.data.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="font-mono text-3xl font-bold text-gradient tracking-widest">
                                {item.code}
                              </span>
                              <span className={`tag ${getVersionLabel(item.version).color} !text-xs !py-0.5`}>
                                {getVersionLabel(item.version).text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`tag ${getLevelLabel(queryResult.data[0].level).color}`}>
                          {getLevelLabel(queryResult.data[0].level).text}
                        </span>
                        <span className="tag bg-dark-700 text-dark-300 border-dark-600">
                          {queryResult.data[0].strokeCount} 画
                        </span>
                      </div>
                    </div>
                  </div>

                  {queryResult.data.length > 1 && (
                    <div className="mb-6 pb-6 border-b border-dark-700">
                      <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-accent-400" />
                        多版本编码对比
                      </h3>
                      <div className="overflow-x-auto scrollbar-thin">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-dark-700">
                              <th className="py-3 px-4 text-left text-dark-400 font-medium">版本</th>
                              <th className="py-3 px-4 text-left text-dark-400 font-medium">编码</th>
                              <th className="py-3 px-4 text-left text-dark-400 font-medium">字根</th>
                              <th className="py-3 px-4 text-left text-dark-400 font-medium">简码级别</th>
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.data.map((item, idx) => (
                              <tr key={idx} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                                <td className="py-3 px-4">
                                  <span className={`tag ${getVersionLabel(item.version).color}`}>
                                    {getVersionLabel(item.version).text}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="font-mono text-xl text-accent-400">{item.code}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex gap-1">
                                    {item.radicals.map((r, i) => (
                                      <span key={i} className="px-2 py-0.5 rounded bg-dark-700/50 text-dark-300 text-xs">
                                        {r}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`tag ${getLevelLabel(item.level).color}`}>
                                    {getLevelLabel(item.level).text}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent-400" />
                    字根拆解动画（{getVersionLabel(queryResult.data[0].version).text}）
                  </h3>
                  
                  <RadicalAnimation character={queryResult.data[0]} />
                </div>
              ) : (
                <div className="card p-12 text-center">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4 opacity-50" />
                  <p className="text-dark-300 text-lg">{queryResult.message}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'code-to-char' && reverseQueryResult && (
            <div className="animate-slide-up">
              {reverseQueryResult.success && reverseQueryResult.data ? (
                <div className="card p-6">
                  <div className="space-y-4 mb-6 pb-4 border-b border-dark-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-medium text-white">
                          编码 <span className="text-accent-400 font-mono">{searchInput}</span> 的查询结果
                        </h3>
                        <p className="text-dark-400 text-sm mt-1">
                          共找到 {reverseQueryResult.total} 个汉字
                          {commonOnly && <span className="text-green-400 ml-2">（仅常用字）</span>}
                          {versionFilter !== 'all' && (
                            <span className={`ml-2 ${getVersionLabel(versionFilter).color.replace('bg-', 'text-').replace('/20', '')}`}>
                              （{getVersionLabel(versionFilter).text}）
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleCommonOnlyChange}
                          className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                            transition-all duration-200
                            ${commonOnly 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-dark-700 text-dark-300 border border-dark-600 hover:border-accent-500/50 hover:text-white'}
                          `}
                        >
                          <Filter className="w-4 h-4" />
                          仅常用字
                        </button>
                        <button
                          onClick={handleSortChange}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-dark-700 text-dark-300 border border-dark-600 hover:border-accent-500/50 hover:text-white transition-all duration-200"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                          {sortBy === 'frequency' ? '按频率' : '按编码'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="text-dark-400 text-sm flex items-center gap-1">
                        <Layers className="w-4 h-4" />
                        版本筛选：
                      </span>
                      {(['all', '86', '98', '新世纪'] as const).map((version) => (
                        <button
                          key={version}
                          onClick={() => handleVersionChange(version)}
                          className={`
                            px-3 py-1.5 rounded-lg text-sm transition-all duration-200
                            ${versionFilter === version
                              ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/20'
                              : 'bg-dark-700 text-dark-300 border border-dark-600 hover:border-accent-500/50 hover:text-white'}
                          `}
                        >
                          {version === 'all' ? '全部' : `${version}版`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 gap-3">
                    {reverseQueryResult.data.map((item, index) => (
                      <button
                        key={`${item.char}-${item.code}-${index}`}
                        onClick={() => handleReverseItemClick(item)}
                        className="
                          p-4 rounded-xl text-center
                          bg-dark-700/50 hover:bg-dark-700
                          border border-dark-600/50 hover:border-accent-500/50
                          transition-all duration-200 group
                          hover:scale-105 hover:shadow-lg hover:shadow-accent-500/10
                        "
                      >
                        <div className="font-serif text-3xl text-white group-hover:text-accent-400 mb-2">
                          {item.char}
                        </div>
                        <div className="text-xs font-mono text-accent-400/70 group-hover:text-accent-400">
                          {item.code}
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="text-xs text-dark-500">
                            {item.pinyin}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${getVersionLabel(item.version).color}`}>
                            {item.version}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {reverseQueryResult.total !== undefined && reverseQueryResult.total > PAGE_SIZE && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(reverseQueryResult.total / PAGE_SIZE)}
                      onPageChange={handlePageChange}
                      totalItems={reverseQueryResult.total}
                      pageSize={PAGE_SIZE}
                    />
                  )}
                </div>
              ) : (
                <div className="card p-12 text-center">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4 opacity-50" />
                  <p className="text-dark-300 text-lg">{reverseQueryResult.message}</p>
                </div>
              )}
            </div>
          )}

          {!queryResult && !reverseQueryResult && (
            <div className="card p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                <Search className="w-12 h-12 text-accent-400" />
              </div>
              <h3 className="text-2xl font-serif text-white mb-3">开始查询</h3>
              <p className="text-dark-400 max-w-md mx-auto">
                {activeTab === 'char-to-code'
                  ? '在左侧输入框中输入单个汉字，点击查询按钮获取其86版五笔编码及字根拆解'
                  : '在左侧输入框中输入1-4位五笔编码，查询对应的汉字列表'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
