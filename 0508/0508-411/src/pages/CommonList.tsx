import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, ArrowUpDown } from 'lucide-react';
import { getCharactersSortedByCode } from '@/data/wubiData';
import Pagination from '@/components/Pagination';
import type { WubiCharacter } from '@/types';

const PAGE_SIZE = 50;
const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function CommonList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'code' | 'char' | 'pinyin'>('code');

  const allCharacters = useMemo(() => getCharactersSortedByCode(), []);

  const filteredCharacters = useMemo(() => {
    let result = [...allCharacters];

    if (selectedLetter) {
      result = result.filter(char => char.code.startsWith(selectedLetter));
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(char =>
        char.char.includes(term) ||
        char.code.toLowerCase().includes(term) ||
        char.pinyin.toLowerCase().includes(term)
      );
    }

    if (sortBy === 'char') {
      result.sort((a, b) => a.char.localeCompare(b.char, 'zh-CN'));
    } else if (sortBy === 'pinyin') {
      result.sort((a, b) => a.pinyin.localeCompare(b.pinyin));
    }

    return result;
  }, [allCharacters, selectedLetter, searchTerm, sortBy]);

  const totalPages = Math.ceil(filteredCharacters.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageData = filteredCharacters.slice(startIndex, startIndex + PAGE_SIZE);

  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allCharacters.forEach(char => {
      const firstLetter = char.code[0];
      counts[firstLetter] = (counts[firstLetter] || 0) + 1;
    });
    return counts;
  }, [allCharacters]);

  const handleCharClick = (char: WubiCharacter) => {
    navigate('/', {
      state: { char: char.char }
    });
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1: return { text: '一级', class: 'bg-green-500/20 text-green-400' };
      case 2: return { text: '二级', class: 'bg-blue-500/20 text-blue-400' };
      case 3: return { text: '三级', class: 'bg-yellow-500/20 text-yellow-400' };
      default: return { text: '全码', class: 'bg-purple-500/20 text-purple-400' };
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="font-serif text-4xl font-bold text-white mb-3">
          <span className="text-gradient">常用字列表</span>
        </h2>
        <p className="text-dark-300 max-w-2xl mx-auto">
          按五笔编码字母顺序排列的常用汉字，支持拼音、汉字、编码搜索过滤
        </p>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="搜索汉字、拼音或五笔编码..."
              className="input-field pl-12"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as 'code' | 'char' | 'pinyin');
                setCurrentPage(1);
              }}
              className="input-field w-auto cursor-pointer"
            >
              <option value="code">按编码排序</option>
              <option value="char">按汉字排序</option>
              <option value="pinyin">按拼音排序</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedLetter(null);
                setCurrentPage(1);
              }}
              className="btn-secondary whitespace-nowrap"
            >
              重置筛选
            </button>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-dark-400 text-sm mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent-400" />
            按编码首字母筛选
          </p>
          <div className="flex flex-wrap gap-1">
            {ALPHABETS.map((letter) => {
              const count = letterCounts[letter] || 0;
              const isActive = selectedLetter === letter;
              const hasData = count > 0;

              return (
                <button
                  key={letter}
                  onClick={() => {
                    if (hasData) {
                      setSelectedLetter(isActive ? null : letter);
                      setCurrentPage(1);
                    }
                  }}
                  disabled={!hasData}
                  className={`
                    relative min-w-[2.5rem] h-10 px-2 rounded-lg font-mono font-medium
                    transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/30'
                      : hasData
                        ? 'bg-dark-700 hover:bg-dark-600 text-dark-200 hover:text-white border border-dark-600 hover:border-accent-500/50'
                        : 'bg-dark-800 text-dark-600 cursor-not-allowed border border-dark-700'}
                  `}
                >
                  {letter}
                  {hasData && (
                    <span className="absolute -top-1 -right-1 text-[10px] bg-accent-500 text-white px-1 rounded-full">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 pb-4 border-b border-dark-700">
          <div className="text-dark-300">
            共 <span className="text-accent-400 font-medium">{filteredCharacters.length}</span> 个汉字
            {selectedLetter && (
              <span className="ml-2 text-sm">
                (筛选: 字母 <span className="text-accent-400 font-mono">{selectedLetter}</span>)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <ArrowUpDown className="w-4 h-4" />
            当前排序: {sortBy === 'code' ? '编码' : sortBy === 'char' ? '汉字' : '拼音'}
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-dark-700">
                <th className="py-3 px-4 text-dark-400 font-medium w-16">#</th>
                <th className="py-3 px-4 text-dark-400 font-medium">汉字</th>
                <th className="py-3 px-4 text-dark-400 font-medium">五笔编码</th>
                <th className="py-3 px-4 text-dark-400 font-medium">拼音</th>
                <th className="py-3 px-4 text-dark-400 font-medium">字根</th>
                <th className="py-3 px-4 text-dark-400 font-medium w-24">简码</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((item, index) => {
                const levelLabel = getLevelLabel(item.level);
                return (
                  <tr
                    key={`${item.char}-${index}`}
                    onClick={() => handleCharClick(item)}
                    className="
                      border-b border-dark-700/50 cursor-pointer
                      hover:bg-dark-700/30 transition-colors duration-200
                    "
                  >
                    <td className="py-3 px-4 text-dark-500 font-mono text-sm">
                      {startIndex + index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-serif text-2xl text-white hover:text-accent-400 transition-colors">
                        {item.char}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-lg text-accent-400 tracking-wider">
                        {item.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-dark-300">
                      {item.pinyin}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {item.radicals.map((radical, idx) => (
                          <span
                            key={idx}
                            className="
                              px-2 py-0.5 rounded text-sm
                              bg-dark-700/50 text-dark-300 border border-dark-600/50
                            "
                          >
                            {radical}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${levelLabel.class}`}>
                        {levelLabel.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pageData.length === 0 && (
          <div className="py-16 text-center">
            <BookOpen className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400 text-lg">未找到匹配的汉字</p>
            <p className="text-dark-500 text-sm mt-2">请尝试其他搜索条件或筛选字母</p>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredCharacters.length}
            pageSize={PAGE_SIZE}
          />
        )}
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="card p-5 text-center">
          <div className="text-4xl font-bold text-gradient mb-1">{allCharacters.length}</div>
          <div className="text-dark-400 text-sm">收录汉字总数</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-4xl font-bold text-green-400 mb-1">25</div>
          <div className="text-dark-400 text-sm">一级简码</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-4xl font-bold text-blue-400 mb-1">
            {allCharacters.filter(c => c.level === 2).length}
          </div>
          <div className="text-dark-400 text-sm">二级简码</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-4xl font-bold text-yellow-400 mb-1">
            {allCharacters.filter(c => c.level === 3).length}
          </div>
          <div className="text-dark-400 text-sm">三级简码</div>
        </div>
      </div>
    </div>
  );
}
