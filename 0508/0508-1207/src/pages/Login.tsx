import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, UserCog, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';

type Mode = 'student' | 'admin';

export default function Login() {
  const [mode, setMode] = useState<Mode>('student');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setStudent = useAppStore((s) => s.setStudent);
  const setAdmin = useAppStore((s) => s.setAdmin);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'student') {
        const data = await api<{ student: { studentId: string; name: string } }>(
          '/api/student/login',
          { method: 'POST', body: JSON.stringify({ studentId, name: studentName }) },
        );
        setStudent(data.student.studentId, data.student.name);
        navigate('/student/apply');
      } else {
        const data = await api<{
          admin: { id: number; username: string };
          club: { id: number; name: string };
        }>('/api/admin/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        });
        setAdmin({
          id: data.admin.id,
          username: data.admin.username,
          clubId: data.club.id,
          clubName: data.club.name,
        });
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dot-grid flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-stretch">
        <div className="relative overflow-hidden rounded-3xl bg-ink-800 text-cream-50 p-10 shadow-soft flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-gold-400 font-serif text-2xl">
              <Sparkles size={20} /> Guild 招新
            </div>
            <h1 className="mt-6 font-serif text-5xl leading-tight">
              在这里，
              <br />
              找到你的
              <br />
              <span className="text-gold-400">热爱。</span>
            </h1>
            <p className="mt-6 text-cream-100/80 leading-relaxed">
              从报名表到面试安排，一站式完成社团招新全流程。
              <br />
              学生可随时查看进度，负责人轻松管理筛选与排期。
            </p>
          </div>
          <div className="mt-10 text-xs text-cream-100/60">
            默认负责人账号：
            <br />
            music / drama / tech &nbsp;&nbsp; 密码：123456
          </div>
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-gold-500/20 blur-3xl" />
        </div>

        <div className="card self-center">
          <div className="flex gap-2 mb-6 p-1 bg-cream-100 rounded-xl">
            <button
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                mode === 'student'
                  ? 'bg-ink-800 text-cream-50 shadow-card'
                  : 'text-ink-500 hover:text-ink-800'
              }`}
              onClick={() => setMode('student')}
            >
              <GraduationCap size={16} className="inline mr-2" />
              学生登录
            </button>
            <button
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                mode === 'admin'
                  ? 'bg-ink-800 text-cream-50 shadow-card'
                  : 'text-ink-500 hover:text-ink-800'
              }`}
              onClick={() => setMode('admin')}
            >
              <UserCog size={16} className="inline mr-2" />
              社团负责人
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'student' ? (
              <>
                <div>
                  <label className="text-sm text-ink-600 mb-1 block">学号</label>
                  <input
                    className="input"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="请输入学号"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-ink-600 mb-1 block">姓名</label>
                  <input
                    className="input"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="请输入姓名"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm text-ink-600 mb-1 block">账号</label>
                  <input
                    className="input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="社团账号"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-ink-600 mb-1 block">密码</label>
                  <input
                    className="input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    required
                  />
                </div>
              </>
            )}

            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? '登录中…' : '进入系统'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
