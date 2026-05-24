import { Archive, QrCode, Search, Unlock, Plus, Info } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/format';
import { useState } from 'react';

export default function SealManagement() {
  const { seals, specimens, unsealSeal } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSeals = seals.filter(
    (seal) =>
      seal.boxCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seal.sealCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSpecimenNames = (specimenIds: string[]) => {
    return specimenIds
      .map((id) => specimens.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join('、');
  };

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-museum-100 rounded-xl">
              <Archive className="w-6 h-6 text-museum-600" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-museum-900">
                封签管理
              </h2>
              <p className="text-museum-500 text-sm">
                运输箱封签状态追踪与解封验证
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-museum-400" />
              <input
                type="text"
                placeholder="搜索箱号、封签号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-museum-50 border border-museum-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-museum-500 w-64"
              />
            </div>

            <button className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              新建封箱
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-museum-500 text-sm">已封箱</p>
              <p className="text-3xl font-bold text-museum-900">
                {seals.filter((s) => s.status === 'sealed').length}
              </p>
            </div>
            <div className="p-3 bg-museum-100 rounded-xl">
              <Archive className="w-6 h-6 text-museum-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm">运输中</p>
              <p className="text-3xl font-bold text-amber-700">
                {seals.filter((s) => s.status === 'in-transit').length}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <QrCode className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-forest-600 text-sm">已解封</p>
              <p className="text-3xl font-bold text-forest-700">
                {seals.filter((s) => s.status === 'unsealed').length}
              </p>
            </div>
            <div className="p-3 bg-forest-100 rounded-xl">
              <Unlock className="w-6 h-6 text-forest-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-museum-100">
          <h3 className="font-semibold text-museum-900">封签列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-museum-50">
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  箱号
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  封签号
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  标本
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  目的地
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  封箱时间
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  解封时间
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  状态
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSeals.map((seal) => (
                <tr
                  key={seal.id}
                  className="border-b border-museum-100 hover:bg-museum-50 transition-colors"
                >
                  <td className="py-4 px-5">
                    <div className="font-medium text-museum-900">
                      {seal.boxCode}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <code className="px-2 py-1 bg-museum-100 rounded text-museum-700 text-sm font-mono">
                      {seal.sealCode}
                    </code>
                  </td>
                  <td className="py-4 px-5">
                    <div className="max-w-xs">
                      <p className="text-sm text-museum-700 truncate">
                        {getSpecimenNames(seal.specimenIds)}
                      </p>
                      <p className="text-xs text-museum-500">
                        共 {seal.specimenIds.length} 件
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-museum-700 text-sm">
                    {seal.destination}
                  </td>
                  <td className="py-4 px-5 text-museum-600 text-sm">
                    {formatDate(seal.sealedAt)}
                  </td>
                  <td className="py-4 px-5 text-museum-600 text-sm">
                    {seal.unsealedAt ? formatDate(seal.unsealedAt) : '-'}
                  </td>
                  <td className="py-4 px-5">
                    <StatusBadge type="seal" status={seal.status} />
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-museum-100 rounded-lg transition-colors">
                        <Info className="w-4 h-4 text-museum-500" />
                      </button>
                      {seal.status !== 'unsealed' && (
                        <button
                          onClick={() => unsealSeal(seal.id)}
                          className="p-2 hover:bg-forest-100 rounded-lg transition-colors"
                          title="解封"
                        >
                          <Unlock className="w-4 h-4 text-forest-600" />
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
