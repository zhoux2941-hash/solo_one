import { memo, useCallback, useState } from 'react';
import { Filter, Users, Calendar, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatDateInput, parseDateInput } from '../utils/dateUtils';
import { AUTHOR_COLORS } from '../types';

export const FilterPanel = memo(function FilterPanel() {
  const { filters, allAuthors, dateRange, setFilters, resetFilters, filteredCommits } = useStore();
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);

  const handleAuthorToggle = useCallback((author: string) => {
    const currentAuthors = filters.authors;
    const newAuthors = currentAuthors.includes(author)
      ? currentAuthors.filter(a => a !== author)
      : [...currentAuthors, author];
    setFilters({ authors: newAuthors });
  }, [filters.authors, setFilters]);

  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const date = parseDateInput(e.target.value);
    setFilters({ startDate: date });
  }, [setFilters]);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const date = parseDateInput(e.target.value);
    setFilters({ endDate: date });
  }, [setFilters]);

  const handleSelectAllAuthors = useCallback(() => {
    setFilters({ authors: [] });
  }, [setFilters]);

  const hasFilters = filters.authors.length > 0 || filters.startDate || filters.endDate;

  return (
    <div className="glass rounded-2xl p-6 opacity-0 animate-fade-in-up animate-fill-forwards animate-delay-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
            <Filter size={20} />
          </div>
          <div>
            <h3 className="text-white font-semibold">筛选条件</h3>
            <p className="text-xs text-dark-400">
              共 <span className="text-primary-400 font-mono">{filteredCommits.length}</span> 条记录
            </p>
          </div>
        </div>
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
          >
            <RotateCcw size={14} />
            重置
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative">
          <label className="flex items-center gap-2 text-sm text-dark-400 mb-2">
            <Users size={14} />
            作者筛选
          </label>
          <div className="relative">
            <button
              onClick={() => setShowAuthorDropdown(!showAuthorDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 bg-dark-900/50 border border-dark-700 rounded-xl text-white hover:border-primary-500/30 transition-colors"
            >
              <span className="text-sm">
                {filters.authors.length === 0
                  ? '全部作者'
                  : `已选 ${filters.authors.length} 人`}
              </span>
              <ChevronDown size={16} className={`text-dark-400 transition-transform ${showAuthorDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showAuthorDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                <button
                  onClick={handleSelectAllAuthors}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-dark-700 transition-colors ${
                    filters.authors.length === 0 ? 'text-primary-400' : 'text-white'
                  }`}
                >
                  <span>全部作者</span>
                  {filters.authors.length === 0 && <Check size={16} />}
                </button>
                <div className="border-t border-dark-700" />
                {allAuthors.map((author, idx) => (
                  <button
                    key={author}
                    onClick={() => handleAuthorToggle(author)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-dark-700 transition-colors ${
                      filters.authors.includes(author) ? 'text-primary-400' : 'text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: AUTHOR_COLORS[idx % AUTHOR_COLORS.length] }}
                      />
                      {author}
                    </span>
                    {filters.authors.includes(author) && <Check size={16} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-dark-400 mb-2">
            <Calendar size={14} />
            开始日期
          </label>
          <input
            type="date"
            value={formatDateInput(filters.startDate)}
            min={formatDateInput(dateRange.min)}
            max={formatDateInput(dateRange.max)}
            onChange={handleStartDateChange}
            className="w-full px-4 py-3 bg-dark-900/50 border border-dark-700 rounded-xl text-white hover:border-primary-500/30 focus:border-primary-500 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-dark-400 mb-2">
            <Calendar size={14} />
            结束日期
          </label>
          <input
            type="date"
            value={formatDateInput(filters.endDate)}
            min={formatDateInput(dateRange.min)}
            max={formatDateInput(dateRange.max)}
            onChange={handleEndDateChange}
            className="w-full px-4 py-3 bg-dark-900/50 border border-dark-700 rounded-xl text-white hover:border-primary-500/30 focus:border-primary-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {filters.authors.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-dark-700">
          {filters.authors.map((author, idx) => (
            <span
              key={author}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-sm text-primary-300"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: AUTHOR_COLORS[idx % AUTHOR_COLORS.length] }}
              />
              {author}
              <button
                onClick={() => handleAuthorToggle(author)}
                className="hover:text-white ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
});
