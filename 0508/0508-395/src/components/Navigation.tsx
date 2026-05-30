import { NavLink } from 'react-router-dom';
import { Palette, Layers, Scale, Pipette, FileText } from 'lucide-react';

const navItems = [
  { path: '/', label: '颜色转换', icon: Palette },
  { path: '/overprint', label: '专色叠印', icon: Layers },
  { path: '/deltae', label: '色差计算', icon: Scale },
  { path: '/picker', label: '取色器', icon: Pipette },
  { path: '/export', label: '报告导出', icon: FileText },
];

export default function Navigation() {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">ColorSpace Pro</h1>
              <p className="text-xs text-slate-500">专业颜色空间转换工具</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `
                  flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'nav-link nav-link-active'
                    : 'nav-link'
                  }
                `}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
