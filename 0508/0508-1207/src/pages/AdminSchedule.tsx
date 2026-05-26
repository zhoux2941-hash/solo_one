import { useEffect, useState } from 'react';
import { Plus, Trash2, Calendar as CalIcon, MapPin } from 'lucide-react';
import { AdminLayout } from '@/components/Layouts';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import type { Slot } from '@/types';

export default function AdminSchedule() {
  const { adminUser } = useAppStore();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [form, setForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    capacity: 5,
    location: '',
  });
  const [msg, setMsg] = useState('');

  const load = () => {
    api<{ slots: Slot[] }>(`/api/slots?clubId=${adminUser?.clubId}`).then((d) =>
      setSlots(d.slots),
    );
  };

  useEffect(() => {
    load();
  }, [adminUser?.clubId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      await api('/api/slots', {
        method: 'POST',
        body: JSON.stringify({ clubId: adminUser?.clubId, ...form }),
      });
      setForm({
        date: '',
        startTime: '',
        endTime: '',
        capacity: 5,
        location: '',
      });
      load();
      setMsg('时段已添加');
      setTimeout(() => setMsg(''), 1800);
    } catch (err: any) {
      setMsg(err.message || '添加失败');
    }
  };

  const remove = async (id: number) => {
    await api(`/api/slots/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="font-serif text-3xl text-ink-800">面试时段管理</h1>
        <p className="text-sm text-ink-500 mt-1">
          通过筛选的学生会按报名顺序自动分配到最早的可用时段。
        </p>

        <div className="mt-6 grid md:grid-cols-[360px_1fr] gap-6">
          <form onSubmit={add} className="card space-y-4 h-fit">
            <h2 className="font-serif text-xl text-ink-800">新增时段</h2>

            <div>
              <label className="text-sm text-ink-600 mb-1 block">日期</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-ink-600 mb-1 block">开始</label>
                <input
                  type="time"
                  className="input"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="text-sm text-ink-600 mb-1 block">结束</label>
                <input
                  type="time"
                  className="input"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-ink-600 mb-1 block">容量</label>
              <input
                type="number"
                min={1}
                className="input"
                value={form.capacity}
                onChange={(e) =>
                  setForm({ ...form, capacity: Number(e.target.value) })
                }
                required
              />
            </div>
            <div>
              <label className="text-sm text-ink-600 mb-1 block">地点</label>
              <input
                className="input"
                placeholder="例如 艺术楼 201"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn-accent w-full">
              <Plus size={16} /> 新增时段
            </button>

            {msg && (
              <div className="text-xs text-ink-700 bg-cream-100 rounded px-3 py-2">
                {msg}
              </div>
            )}
          </form>

          <div className="card">
            <h2 className="font-serif text-xl text-ink-800">已有时段</h2>
            <div className="mt-4 space-y-3">
              {slots.length === 0 && (
                <div className="text-center text-ink-500 py-10">
                  暂无时段，请先添加。
                </div>
              )}
              {slots.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-cream-100/60 border border-ink-500/10"
                >
                  <div className="w-12 h-12 rounded-lg bg-gold-500/20 text-ink-900 flex items-center justify-center">
                    <CalIcon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-ink-900">
                      {s.date} · {s.startTime} - {s.endTime}
                    </div>
                    <div className="text-xs text-ink-600 flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {s.location}
                      </span>
                      <span>
                        已分配 {s.used ?? 0} / {s.capacity}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(s.id)}
                    className="btn-ghost text-xs py-1 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 size={14} /> 删除
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
