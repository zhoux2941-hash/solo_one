import { LogOut, Home } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { studentName, studentId, logout } = useAppStore();

  const tabs = [
    { key: '/student/apply', label: '填写报名表' },
    { key: '/student/status', label: '报名状态' },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-cream-50/90 backdrop-blur border-b border-ink-500/10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-6">
          <button
            className="font-serif text-xl text-ink-800"
            onClick={() => navigate('/student/apply')}
          >
            Guild 招新
          </button>
          <nav className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => navigate(t.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname === t.key
                    ? 'bg-ink-800 text-cream-50'
                    : 'text-ink-600 hover:bg-ink-500/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm text-ink-600">
            <span>
              {studentName}（{studentId}）
            </span>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="btn-ghost text-xs py-1 px-2"
            >
              <LogOut size={14} /> 退出
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
      <div className="pointer-events-none fixed bottom-0 right-0 w-96 h-96 bg-gold-500/10 blur-3xl rounded-full -z-10" />
    </div>
  );
}

export function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { adminUser, logout } = useAppStore();

  const tabs = [
    { key: '/admin/dashboard', label: '报名审核', icon: Home },
    { key: '/admin/schedule', label: '面试时段' },
    { key: '/admin/interviews', label: '面试结果' },
  ];

  return (
    <div className="min-h-screen grid md:grid-cols-[240px_1fr]">
      <aside className="bg-ink-800 text-cream-50 p-6 flex flex-col">
        <div className="font-serif text-2xl text-gold-400">Guild 招新</div>
        <div className="mt-1 text-xs text-cream-100/60">负责人工作台</div>
        <div className="mt-6 text-sm">
          <div className="text-cream-100/50 text-xs">当前社团</div>
          <div className="font-medium">{adminUser?.clubName}</div>
        </div>
        <nav className="mt-8 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => navigate(t.key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                pathname.startsWith(t.key)
                  ? 'bg-gold-500 text-ink-900 font-medium'
                  : 'text-cream-100/80 hover:bg-ink-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto text-xs text-cream-100/60">
          <div>{adminUser?.username}</div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="mt-2 text-cream-100/50 hover:text-cream-50"
          >
            退出登录
          </button>
        </div>
      </aside>
      <main className="p-8 bg-cream-50 dot-grid">{children}</main>
    </div>
  );
}
