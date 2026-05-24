import { FileCheck, Search, Filter, CheckCircle, AlertTriangle, Wrench } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/format';
import { useState } from 'react';

export default function Acceptance() {
  const { acceptances, specimens } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCondition, setFilterCondition] = useState<string>('all');

  const filteredAcceptances = acceptances.filter((a) => {
    const matchesSearch =
      a.specimenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.specimenCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCondition =
      filterCondition === 'all' || a.condition === filterCondition;
    return matchesSearch && matchesCondition;
  });

  const stats = {
    total: acceptances.length,
    good: acceptances.filter((a) => a.condition === 'good').length,
    damaged: acceptances.filter((a) => a.condition === 'damaged').length,
    needsRepair: acceptances.filter((a) => a.condition === 'needs-repair').length,
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'good':
        return <CheckCircle className="w-5 h-5 text-forest-600" />;
      case 'damaged':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'needs-repair':
        return <Wrench className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-forest-100 rounded-xl">
              <FileCheck className="w-6 h-6 text-forest-600" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-museum-900">
                返馆验收
              </h2>
              <p className="text-museum-500 text-sm">
                标本状态检查与验收记录
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

            <div className="relative">
              <button className="btn-secondary flex items-center gap-2">
                <Filter className="w-4 h-4" />
                筛选
              </button>
            </div>

            <button className="btn-primary">新增验收记录</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-museum-500 text-sm">总验收数</p>
              <p className="text-3xl font-bold text-museum-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-museum-100 rounded-xl">
              <FileCheck className="w-6 h-6 text-museum-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-forest-600 text-sm">完好</p>
              <p className="text-3xl font-bold text-forest-700">{stats.good}</p>
            </div>
            <div className="p-3 bg-forest-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-forest-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm">有破损</p>
              <p className="text-3xl font-bold text-red-700">{stats.damaged}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm">需修复</p>
              <p className="text-3xl font-bold text-amber-700">
                {stats.needsRepair}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <Wrench className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-museum-100 flex items-center justify-between">
          <h3 className="font-semibold text-museum-900">验收记录</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterCondition('all')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterCondition === 'all'
                  ? 'bg-museum-600 text-white'
                  : 'bg-museum-50 text-museum-600 hover:bg-museum-100'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilterCondition('good')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterCondition === 'good'
                  ? 'bg-forest-600 text-white'
                  : 'bg-forest-50 text-forest-600 hover:bg-forest-100'
              }`}
            >
              完好
            </button>
            <button
              onClick={() => setFilterCondition('damaged')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterCondition === 'damaged'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              破损
            </button>
            <button
              onClick={() => setFilterCondition('needs-repair')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterCondition === 'needs-repair'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
              }`}
            >
              需修复
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
                  验收人
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  验收时间
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  备注
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAcceptances.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-museum-100 hover:bg-museum-50 transition-colors"
                >
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      {getConditionIcon(record.condition)}
                      <StatusBadge type="condition" status={record.condition} />
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <p className="font-medium text-museum-900">
                      {record.specimenName}
                    </p>
                  </td>
                  <td className="py-4 px-5 text-museum-600 text-sm font-mono">
                    {record.specimenCode}
                  </td>
                  <td className="py-4 px-5 text-museum-700 text-sm">
                    {record.acceptedBy}
                  </td>
                  <td className="py-4 px-5 text-museum-600 text-sm">
                    {formatDate(record.acceptedAt)}
                  </td>
                  <td className="py-4 px-5">
                    <p className="text-sm text-museum-600 max-w-xs truncate">
                      {record.notes || '-'}
                    </p>
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
