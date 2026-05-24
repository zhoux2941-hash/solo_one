import { PackageOpen, Plus, Search, Calendar, User, MapPin } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import StatusBadge from '../components/StatusBadge';
import { formatShortDate } from '../utils/format';
import { useState } from 'react';

export default function Checkout() {
  const { specimens } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const lentSpecimens = specimens.filter(
    (s) => s.status === 'lent-out' || s.status === 'in-transit'
  );

  const filteredSpecimens = lentSpecimens.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-museum-100 rounded-xl">
              <PackageOpen className="w-6 h-6 text-museum-600" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-museum-900">
                标本借出
              </h2>
              <p className="text-museum-500 text-sm">
                借出登记与借出标本管理
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

            <button className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              新建借出
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-museum-500 text-sm">借出中</p>
              <p className="text-3xl font-bold text-museum-900">
                {lentSpecimens.length}
              </p>
            </div>
            <div className="p-3 bg-museum-100 rounded-xl">
              <PackageOpen className="w-6 h-6 text-museum-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm">今日到期</p>
              <p className="text-3xl font-bold text-amber-700">0</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-museum-500 text-sm">待返馆</p>
              <p className="text-3xl font-bold text-museum-700">
                {lentSpecimens.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-forest-600 text-sm">外展地点</p>
              <p className="text-3xl font-bold text-forest-700">1</p>
            </div>
            <div className="p-3 bg-forest-100 rounded-xl">
              <MapPin className="w-6 h-6 text-forest-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-museum-100">
          <h3 className="font-semibold text-museum-900">借出标本列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-museum-50">
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  标本名称
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  编号
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  分类
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  原柜位置
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  借出日期
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  预计归还
                </th>
                <th className="text-left py-3 px-5 text-sm font-medium text-museum-600">
                  状态
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSpecimens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-museum-500">
                    暂无借出标本
                  </td>
                </tr>
              ) : (
                filteredSpecimens.map((specimen) => (
                  <tr
                    key={specimen.id}
                    className="border-b border-museum-100 hover:bg-museum-50 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <p className="font-medium text-museum-900">
                        {specimen.name}
                      </p>
                    </td>
                    <td className="py-4 px-5 text-museum-600 text-sm font-mono">
                      {specimen.code}
                    </td>
                    <td className="py-4 px-5 text-museum-700 text-sm">
                      {specimen.category}
                    </td>
                    <td className="py-4 px-5 text-museum-600 text-sm">
                      {specimen.originalCabinetId.toUpperCase()} ·{' '}
                      {specimen.originalPosition.row}-
                      {specimen.originalPosition.col}
                    </td>
                    <td className="py-4 px-5 text-museum-600 text-sm">
                      {specimen.checkoutDate
                        ? formatShortDate(specimen.checkoutDate)
                        : '-'}
                    </td>
                    <td className="py-4 px-5 text-museum-600 text-sm">
                      {specimen.returnDate
                        ? formatShortDate(specimen.returnDate)
                        : '-'}
                    </td>
                    <td className="py-4 px-5">
                      <StatusBadge type="specimen" status={specimen.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-museum-900 mb-4">快速借出登记</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-museum-700 mb-2">
              选择标本
            </label>
            <select className="input-field">
              <option>请选择要借出的标本</option>
              {specimens
                .filter((s) => s.status === 'in-storage')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-museum-700 mb-2">
              借展单位
            </label>
            <input
              type="text"
              placeholder="请输入借展单位名称"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-museum-700 mb-2">
              借出日期
            </label>
            <input type="date" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-museum-700 mb-2">
              预计归还日期
            </label>
            <input type="date" className="input-field" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-museum-700 mb-2">
              备注
            </label>
            <textarea
              placeholder="请输入备注信息..."
              rows={3}
              className="input-field resize-none"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button className="btn-secondary">取消</button>
          <button className="btn-primary">确认借出</button>
        </div>
      </div>
    </div>
  );
}
