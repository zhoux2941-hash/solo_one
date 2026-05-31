import { memo, useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Table2, FileCode, Plus, Minus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatDate } from '../utils/dateUtils';

export const DataTable = memo(function DataTable() {
  const { filteredCommits } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortField, setSortField] = useState<'date' | 'insertions' | 'deletions' | 'filesChanged'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedCommits = useMemo(() => {
    return [...filteredCommits].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'insertions':
          comparison = a.insertions - b.insertions;
          break;
        case 'deletions':
          comparison = a.deletions - b.deletions;
          break;
        case 'filesChanged':
          comparison = a.filesChanged - b.filesChanged;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredCommits, sortField, sortOrder]);

  const displayCommits = isExpanded ? sortedCommits : sortedCommits.slice(0, 10);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  if (filteredCommits.length === 0) return null;

  return (
    <div className="glass rounded-2xl overflow-hidden opacity-0 animate-fade-in-up animate-fill-forwards animate-delay-600">
      <div
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-dark-800/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
            <Table2 size={20} />
          </div>
          <div>
            <h3 className="text-white font-semibold">原始提交记录</h3>
            <p className="text-xs text-dark-400">
              显示 {isExpanded ? filteredCommits.length : 10} / {filteredCommits.length} 条记录
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-dark-400">
          {isExpanded ? '收起' : '展开'}
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-dark-700">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-dark-900/50 sticky top-0">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">
                    提交信息
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">
                    作者
                  </th>
                  <th
                    className="text-left px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleSort('date')}
                  >
                    <span className="flex items-center gap-1">
                      日期
                      <SortIcon field="date" />
                    </span>
                  </th>
                  <th
                    className="text-center px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleSort('filesChanged')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      <FileCode size={12} />
                      <SortIcon field="filesChanged" />
                    </span>
                  </th>
                  <th
                    className="text-center px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleSort('insertions')}
                  >
                    <span className="flex items-center justify-center gap-1 text-emerald-400">
                      <Plus size={12} />
                      <SortIcon field="insertions" />
                    </span>
                  </th>
                  <th
                    className="text-center px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleSort('deletions')}
                  >
                    <span className="flex items-center justify-center gap-1 text-accent-400">
                      <Minus size={12} />
                      <SortIcon field="deletions" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {displayCommits.map((commit) => (
                  <tr key={commit.id} className="hover:bg-dark-800/30 transition-colors">
                    <td className="px-6 py-3">
                      <div className="max-w-md truncate text-sm text-white" title={commit.message}>
                        {commit.message}
                      </div>
                      <div className="text-xs text-dark-500 font-mono mt-0.5">
                        {commit.id.slice(0, 7)}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-sm text-dark-200">{commit.author}</div>
                      <div className="text-xs text-dark-500">{commit.email}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-dark-300 font-mono">
                      {formatDate(commit.date)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-dark-300 font-mono">
                      {commit.filesChanged}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-emerald-400 font-mono">
                      +{commit.insertions}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-accent-400 font-mono">
                      -{commit.deletions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isExpanded && filteredCommits.length > 10 && (
            <div
              className="p-4 text-center text-sm text-dark-400 hover:text-white hover:bg-dark-800/30 cursor-pointer transition-colors border-t border-dark-700"
              onClick={() => setIsExpanded(true)}
            >
              查看全部 {filteredCommits.length} 条记录
            </div>
          )}
        </div>
      )}
    </div>
  );
});
