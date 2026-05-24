import { AlertTriangle, Search, Filter, CheckCircle, RotateCcw, ThumbsUp } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatPosition } from '../utils/format';
import { useState } from 'react';

export default function DiffCenter() {
  const { diffs, resolveDiff, approveDiff } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredDiffs = diffs.filter((d) => {
    const matchesSearch =
      d.specimenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specimenCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: diffs.length,
    pending: diffs.filter((d) => d.status === 'pending').length,
    resolved: diffs.filter((d) => d.status === 'resolved').length,
    approved: diffs.filter((d) => d.status === 'approved').length,
  };

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-museum-900">
                差异中心
              </h2>
              <p className="text-museum-500 text-sm">
                回库位置差异清单与处理
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-museum-400" />
              <input
                type="text"
                placeholder="搜索标本..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-museum-50 border border-museum-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-museum-500 w-64"
              />
            </div>

            <button className="btn-secondary flex items-center gap-2">
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-museum-500 text-sm">差异总数</p>
              <p className="text-3xl font-bold text-museum-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-museum-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-museum-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm">待处理</p>
              <p className="text-3xl font-bold text-red-700">{stats.pending}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm">已记录</p>
              <p className="text-3xl font-bold text-amber-700">{stats.resolved}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-forest-600 text-sm">已批准</p>
              <p className="text-3xl font-bold text-forest-700">
                {stats.approved}
              </p>
            </div>
            <div className="p-3 bg-forest-100 rounded-xl">
              <ThumbsUp className="w-6 h-6 text-forest-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-museum-100 flex items-center justify-between">
          <h3 className="font-semibold text-museum-900">差异清单</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterStatus === 'all'
                  ? 'bg-museum-600 text-white'
                  : 'bg-museum-50 text-museum-600 hover:bg-museum-100'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              待处理
            </button>
            <button
              onClick={() => setFilterStatus('resolved')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterStatus === 'resolved'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
              }`}
            >
              已记录
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterStatus === 'approved'
                  ? 'bg-forest-600 text-white'
                  : 'bg-forest-50 text-forest-600 hover:bg-forest-100'
              }`}
            >
              已批准
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-museum-50">
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  状态
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  标本名称
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  编号
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  期望位置
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  实际位置
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  发现时间
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  处理人
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDiffs.map((diff) => (
                <tr
                  key={diff.id}
                  className={`border-b border-museum-100 transition-colors ${
                    diff.status === 'pending'
                      ? 'bg-red-50/30 hover:bg-red-50/50'
                      : 'hover:bg-museum-50'
                  }`}
                >
                  <td className="py-4 px-5">
                    <StatusBadge type="diff" status={diff.status} />
                  </td>
                  <td className="py-4 px-5">
                    <p className="font-medium text-museum-900">
                      {diff.specimenName}
                    </p>
                  </td>
                  <td className="py-4 px-5 text-museum-600 text-sm font-mono">
                    {diff.specimenCode}
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-sm font-medium text-forest-600 bg-forest-50 px-2 py-1 rounded">
                      {formatPosition(diff.expectedPosition)}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      {formatPosition(diff.actualPosition)}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-museum-600 text-sm">
                    {formatDate(diff.createdAt)}
                  </td>
                  <td className="py-4 px-5 text-museum-700 text-sm">
                    {diff.resolvedBy || '-'}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      {diff.status === 'pending' && (
                        <>
                          <button
                            onClick={() => resolveDiff(diff.id)}
                            className="p-2 hover:bg-museum-100 rounded-lg transition-colors"
                            title="记录差异"
                          >
                            <CheckCircle className="w-4 h-4 text-museum-600" />
                          </button>
                          <button
                            onClick={() => approveDiff(diff.id)}
                            className="p-2 hover:bg-forest-100 rounded-lg transition-colors"
                            title="批准调整"
                          >
                            <ThumbsUp className="w-4 h-4 text-forest-600" />
                          </button>
                        </>
                      )}
                      {diff.status === 'resolved' && (
                        <button
                          onClick={() => approveDiff(diff.id)}
                          className="p-2 hover:bg-forest-100 rounded-lg transition-colors"
                          title="批准"
                        >
                          <ThumbsUp className="w-4 h-4 text-forest-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
