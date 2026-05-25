import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, ClipboardList, Train } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/', label: '联排台', icon: LayoutDashboard },
  { path: '/applications', label: '申请管理', icon: FileText },
  { path: '/teams', label: '班组管理', icon: Users },
  { path: '/handover', label: '班次交接', icon: ClipboardList }
];

export const Sidebar: React.FC = () => {
  return (
    <div className="w-56 bg-slate-800 text-white h-screen flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Train className="text-blue-400" size={28} />
          <div>
            <h1 className="text-lg font-bold">地铁检修联排台</h1>
            <p className="text-xs text-slate-400">Metro Maintenance</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              )
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-medium">
            调
          </div>
          <div>
            <p className="text-sm font-medium">调度员</p>
            <p className="text-xs text-slate-400">在线</p>
          </div>
        </div>
      </div>
    </div>
  );
};
