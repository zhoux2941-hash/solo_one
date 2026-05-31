import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Receipt, Wallet, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: '统计概览', icon: BarChart3 },
  { to: '/expenses', label: '开销记录', icon: Receipt },
  { to: '/budget', label: '预算管理', icon: Wallet },
];

export default function Layout() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className={cn('flex h-screen', isDark ? 'bg-[#1a1a2e] text-gray-100' : 'bg-gray-50 text-gray-900')}>
      <aside
        className={cn(
          'hidden md:flex flex-col w-64 shrink-0 border-r',
          isDark ? 'bg-[#16213e] border-[#2a2a4a]' : 'bg-white border-gray-200'
        )}
      >
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">家庭记账</h1>
            <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>开销分类统计</p>
          </div>
        </div>

        <nav className="flex-1 px-3 mt-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
                    : isDark
                      ? 'text-gray-400 hover:bg-[#1e2a4a] hover:text-gray-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 pb-6">
          <button
            onClick={toggleTheme}
            className={cn(
              'flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all',
              isDark
                ? 'text-gray-400 hover:bg-[#1e2a4a] hover:text-gray-200'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isDark ? '浅色模式' : '深色模式'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <header
          className={cn(
            'md:hidden flex items-center justify-between px-4 py-3 border-b',
            isDark ? 'bg-[#16213e] border-[#2a2a4a]' : 'bg-white border-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">家庭记账</span>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>

        <nav
          className={cn(
            'md:hidden flex items-center justify-around py-2 border-t',
            isDark ? 'bg-[#16213e] border-[#2a2a4a]' : 'bg-white border-gray-200'
          )}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs transition-all',
                  isActive
                    ? 'text-orange-500 font-semibold'
                    : isDark
                      ? 'text-gray-500'
                      : 'text-gray-400'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
