import { useEffect, useState } from 'react';
import { Check, Clock, X, Calendar as CalIcon, MapPin, Send, Square, CheckSquare2 } from 'lucide-react';
import { AdminLayout } from '@/components/Layouts';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import type { Application, Interview, Slot } from '@/types';

type Row = {
  interview: Interview;
  slot: Slot;
  application: Application;
};

export default function AdminInterviews() {
  const { adminUser } = useAppStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [toast, setToast] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const load = () => {
    api<{ interviews: Row[] }>(
      `/api/slots/interviews?clubId=${adminUser?.clubId}`,
    ).then((d) => setRows(d.interviews));
  };

  useEffect(() => {
    load();
  }, [adminUser?.clubId]);

  const passedRows = rows.filter((r) => r.interview.result === 'pass');
  const allPassedSelected =
    passedRows.length > 0 && passedRows.every((r) => selected.has(r.interview.id));

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allPassedSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(passedRows.map((r) => r.interview.id)));
    }
  };

  const submit = async (id: number, result: 'pass' | 'pending' | 'fail') => {
    try {
      await api(`/api/applications/${id}/result`, {
        method: 'POST',
        body: JSON.stringify({ result }),
      });
      setToast('结果已提交');
      load();
    } catch (err: any) {
      setToast(err.message || '提交失败');
    }
    setTimeout(() => setToast(''), 1800);
  };

  const sendNotifications = async () => {
    if (selected.size === 0) {
      setToast('请先勾选要通知的学生');
      setTimeout(() => setToast(''), 1800);
      return;
    }
    const items = rows
      .filter((r) => selected.has(r.interview.id))
      .map((r) => ({
        studentId: r.application.studentId,
        clubId: adminUser?.clubId,
      }));
    try {
      const data = await api<{ count: number }>('/api/notifications/batch', {
        method: 'POST',
        body: JSON.stringify(items),
      });
      setToast(`已向 ${data.count} 位学生发送录取通知`);
      setSelected(new Set());
    } catch (err: any) {
      setToast(err.message || '发送失败');
    }
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-3xl text-ink-800">面试结果录入</h1>
            <p className="text-sm text-ink-500 mt-1">
              面试结束后，请及时录入结果，学生端会同步显示。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-ink-600">
              已选 <span className="font-semibold text-ink-900">{selected.size}</span> 人
            </div>
            <button
              className="btn-accent"
              onClick={sendNotifications}
              disabled={selected.size === 0}
            >
              <Send size={16} /> 批量发送录取通知
            </button>
          </div>
        </div>

        {passedRows.length > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-ink-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
            <button
              className="flex items-center gap-1.5 hover:text-ink-900"
              onClick={toggleSelectAll}
            >
              {allPassedSelected ? (
                <CheckSquare2 size={16} className="text-emerald-600" />
              ) : (
                <Square size={16} />
              )}
              {allPassedSelected ? '取消全选' : '全选通过面试的学生'}
            </button>
            <span className="text-ink-500">· 共 {passedRows.length} 人通过</span>
          </div>
        )}

        <div className="mt-4 card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-ink-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3 w-10">
                    <span className="sr-only">选择</span>
                  </th>
                  <th className="text-left px-5 py-3">学生</th>
                  <th className="text-left px-5 py-3">时段</th>
                  <th className="text-left px-5 py-3">地点</th>
                  <th className="text-left px-5 py-3">当前结果</th>
                  <th className="text-right px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-ink-500 py-16"
                    >
                      暂无面试记录
                    </td>
                  </tr>
                )}
                {rows.map((r) => {
                  const isPass = r.interview.result === 'pass';
                  const isChecked = selected.has(r.interview.id);
                  return (
                    <tr
                      key={r.interview.id}
                      className={`border-t border-ink-500/10 hover:bg-cream-50/60 ${
                        isChecked ? 'bg-gold-500/5' : ''
                      }`}
                    >
                      <td className="px-5 py-4">
                        {isPass ? (
                          <button
                            onClick={() => toggleSelect(r.interview.id)}
                            className="text-ink-600 hover:text-ink-900"
                          >
                            {isChecked ? (
                              <CheckSquare2 size={18} className="text-ink-800" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>
                        ) : (
                          <span className="text-ink-300">
                            <Square size={18} />
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-ink-900">
                          {r.application.name}
                        </div>
                        <div className="text-xs text-ink-500">
                          {r.application.studentId} · {r.application.college}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-ink-700">
                        <div className="flex items-center gap-1">
                          <CalIcon size={14} className="text-ink-500" />
                          {r.slot.date}
                        </div>
                        <div className="text-xs text-ink-500">
                          {r.slot.startTime} - {r.slot.endTime}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-ink-700">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-ink-500" />
                          {r.slot.location}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {r.interview.result ? (
                          <span
                            className={`chip ${
                              r.interview.result === 'pass'
                                ? 'bg-emerald-100 text-emerald-700'
                                : r.interview.result === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {r.interview.result === 'pass'
                              ? '通过'
                              : r.interview.result === 'pending'
                              ? '待定'
                              : '不通过'}
                          </span>
                        ) : (
                          <span className="chip bg-ink-500/10 text-ink-700">
                            <Clock size={12} /> 待录入
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            className="btn-primary text-xs py-1.5 px-3"
                            onClick={() => submit(r.interview.id, 'pass')}
                          >
                            <Check size={12} /> 通过
                          </button>
                          <button
                            className="btn-ghost text-xs py-1.5 px-3"
                            onClick={() => submit(r.interview.id, 'pending')}
                          >
                            <Clock size={12} /> 待定
                          </button>
                          <button
                            className="btn-danger text-xs py-1.5 px-3"
                            onClick={() => submit(r.interview.id, 'fail')}
                          >
                            <X size={12} /> 不通过
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
