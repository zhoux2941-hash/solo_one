import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, FileText } from 'lucide-react';
import { StudentLayout } from '@/components/Layouts';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import type { Club } from '@/types';

const COLLEGES = [
  '文学院',
  '历史学院',
  '新闻与传播学院',
  '数学学院',
  '物理学院',
  '化学学院',
  '信息学院',
  '计算机学院',
  '经济学院',
  '管理学院',
  '外国语学院',
  '艺术学院',
];

export default function StudentApply() {
  const navigate = useNavigate();
  const { studentId, studentName } = useAppStore();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [college, setCollege] = useState('');
  const [club1Id, setClub1Id] = useState<number | ''>('');
  const [club2Id, setClub2Id] = useState<number | ''>(0);
  const [intro, setIntro] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api<{ clubs: Club[] }>('/api/clubs').then((d) => setClubs(d.clubs));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      await api('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          name: studentName,
          college,
          club1Id: Number(club1Id),
          club2Id: Number(club2Id) || 0,
          intro,
        }),
      });
      navigate('/student/status');
    } catch (err: any) {
      setMsg(err.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="grid md:grid-cols-[1fr_340px] gap-8">
        <div className="card">
          <h1 className="font-serif text-3xl text-ink-800 flex items-center gap-2">
            <FileText size={22} /> 填写报名表
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            提交后将进入筛选与面试排期流程，请认真填写。
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm text-ink-600 mb-1 block">学号</label>
                <input
                  className="input bg-cream-100/60 cursor-not-allowed"
                  value={studentId || ''}
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm text-ink-600 mb-1 block">姓名</label>
                <input
                  className="input bg-cream-100/60 cursor-not-allowed"
                  value={studentName || ''}
                  readOnly
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-ink-600 mb-1 block">学院</label>
              <select
                className="input"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                required
              >
                <option value="">请选择学院</option>
                {COLLEGES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm text-ink-600 mb-1 block">
                  第一志愿社团
                </label>
                <select
                  className="input"
                  value={club1Id}
                  onChange={(e) => setClub1Id(Number(e.target.value))}
                  required
                >
                  <option value="">请选择</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-ink-600 mb-1 block">
                  第二志愿社团（可选）
                </label>
                <select
                  className="input"
                  value={club2Id}
                  onChange={(e) => setClub2Id(Number(e.target.value))}
                >
                  <option value={0}>—</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-ink-600 mb-1 block">自我介绍</label>
              <textarea
                className="input min-h-[140px] resize-y"
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                placeholder="请介绍你的兴趣、特长、加入动机等（不少于 30 字）"
                required
                minLength={10}
              />
            </div>

            {msg && (
              <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {msg}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-ink-500/10">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => navigate('/student/status')}
              >
                查看我的状态
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-accent px-6 py-3"
              >
                <Send size={16} /> {loading ? '提交中…' : '提交报名表'}
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="card bg-ink-800 text-cream-50 border-0">
            <div className="font-serif text-xl text-gold-400">流程时间线</div>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-2">
                <span className="text-gold-400">①</span> 提交报名表
              </li>
              <li className="flex gap-2">
                <span className="text-gold-400">②</span> 社团负责人筛选
              </li>
              <li className="flex gap-2">
                <span className="text-gold-400">③</span> 系统自动分配面试时段
              </li>
              <li className="flex gap-2">
                <span className="text-gold-400">④</span> 负责人录入面试结果
              </li>
              <li className="flex gap-2">
                <span className="text-gold-400">⑤</span> 查看最终录取状态
              </li>
            </ul>
          </div>
          <div className="card">
            <div className="font-serif text-lg text-ink-800">小贴士</div>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-600 list-disc list-inside">
              <li>报名后可随时在「报名状态」查看进度</li>
              <li>通过筛选后系统会自动为你安排最近的面试时段</li>
              <li>面试结果录入后状态会实时更新</li>
            </ul>
          </div>
        </aside>
      </div>
    </StudentLayout>
  );
}
