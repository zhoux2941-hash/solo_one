import { useEffect, useMemo, useState } from 'react';
import { Search, Check, X, Filter } from 'lucide-react';
import { AdminLayout } from '@/components/Layouts';
import StatusChip from '@/components/StatusChip';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import type { Application } from '@/types';

export default function AdminDashboard() {
  const { adminUser } = useAppStore();
  const [list, setList] = useState<Application[]>([]);
  const [college, setCollege] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const fetchList = () => {
    const params = new URLSearchParams();
    if (adminUser?.clubId) params.set('clubId', String(adminUser.clubId));
    if (college) params.set('college', college);
    if (keyword) params.set('keyword', keyword);
    api<{ applications: Application[] }>(
      `/api/applications?${params.toString()}`,
    ).then((d) => setList(d.applications));
  };

  useEffect(() => {
    fetchList();
  }, [college, keyword, adminUser?.clubId]);

  const stats = useMemo(() => {
    const total = list.length;
    const pending = list.filter((a) => a.status === 'submitted').length;
    const interview = list.filter((a) => a.status === 'interview').length;
    const admitted = list.filter((a) => a.status === 'admitted').length;
    return { total, pending, interview, admitted };
  }, [list]);

  const review = async (id: number, status: 'approved' | 'rejected') => {
    setLoading(true);
    try {
      await api(`/api/applications/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      setToast(status === 'approved' ? '已通过并分配面试时段' : '已拒绝申请');
      fetchList();
    } catch (err: any) {
      setToast(err.message || '操作失败');
    } finally {
      setLoading(false);
      setTimeout(() => setToast(''), 2200);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-3xl text-ink-800">
              {adminUser?.clubName} · 报名审核
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              按学院或自我介绍关键词筛选，通过后自动进入排期。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="chip bg-cream-200 text-ink-700">
              全部 {stats.total}
            </div>
            <div className="chip bg-ink-500/10 text-ink-700">
              待筛选 {stats.pending}
            </div>
            <div className="chip bg-sky-100 text-sky-700">
              面试中 {stats.interview}
            </div>
            <div className="chip bg-emerald-100 text-emerald-700">
              已录取 {stats.admitted}
            </div>
          </div>
        </div>

        <div className="mt-6 card">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-ink-600">
              <Filter size={14} /> 筛选
            </div>
            <input
              className="input max-w-xs"
              placeholder="学院，例如 信息学院"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
            />
            <div className="relative max-w-xs flex-1 min-w-[200px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
              />
              <input
                className="input pl-8"
                placeholder="自我介绍关键词"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-ink-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">学生</th>
                  <th className="text-left px-5 py-3">学院</th>
                  <th className="text-left px-5 py-3">自我介绍</th>
                  <th className="text-left px-5 py-3">状态</th>
                  <th className="text-right px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center text-ink-500 py-16"
                    >
                      暂无报名记录
                    </td>
                  </tr>
                )}
                {list.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-ink-500/10 hover:bg-cream-50/60"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-ink-900">{a.name}</div>
                      <div className="text-xs text-ink-500">{a.studentId}</div>
                    </td>
                    <td className="px-5 py-4 text-ink-700">{a.college}</td>
                    <td className="px-5 py-4 max-w-md">
                      <div className="text-ink-700 line-clamp-2">
                        {a.intro}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusChip status={a.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      {a.status === 'submitted' ? (
                        <div className="inline-flex gap-2">
                          <button
                            disabled={loading}
                            className="btn-primary text-xs py-1.5 px-3"
                            onClick={() => review(a.id, 'approved')}
                          >
                            <Check size={12} /> 通过
                          </button>
                          <button
                            disabled={loading}
                            className="btn-danger text-xs py-1.5 px-3"
                            onClick={() => review(a.id, 'rejected')}
                          >
                            <X size={12} /> 拒绝
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-500">
                          已进入下一阶段
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-6 right-6 bg-ink-800 text-cream-50 px-5 py-3 rounded-lg shadow-card text-sm">
            {toast}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
