import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  Library,
  Cpu,
  Shield,
  Search,
  Settings as SettingsIcon,
  Wrench,
  Key,
  Sliders,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: '仪表板', icon: LayoutDashboard },
  { path: '/payload/generator', label: '载荷生成', icon: Zap },
  { path: '/payload/templates', label: '模板库', icon: Library },
  { path: '/payload/compile', label: '设备编译', icon: Cpu },
  { path: '/detection/monitor', label: '检测监控', icon: Shield },
  { path: '/detection/events', label: '事件查询', icon: Search },
  { path: '/service/control', label: '服务控制', icon: SettingsIcon },
  { path: '/tools/playback', label: '分析工具', icon: Wrench },
  { path: '/signatures', label: '签名管理', icon: Key },
  { path: '/settings', label: '系统设置', icon: Sliders },
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-full bg-cyber-surface border-r border-cyber-border flex flex-col">
      <div className="p-6 border-b border-cyber-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-purple to-cyber-cyan flex items-center justify-center shadow-neon-purple">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-cyber-text text-sm">HID Framework</h1>
            <p className="text-xs text-cyber-muted">v1.0.0</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-cyber-purple/20 text-cyber-cyan border border-cyber-purple/50 shadow-neon-purple'
                    : 'text-cyber-muted hover:bg-cyber-bg hover:text-cyber-text border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-cyber-cyan' : ''}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-pulse shadow-neon-cyan" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-cyber-border">
        <div className="glass-panel rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
            <span className="text-xs text-cyber-muted">系统运行正常</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
