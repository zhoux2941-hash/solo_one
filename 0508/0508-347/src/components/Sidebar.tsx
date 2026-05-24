import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PackageOpen,
  FileCheck,
  Grid3X3,
  AlertTriangle,
  Archive,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  {
    path: '/',
    label: '工作台',
    icon: LayoutDashboard,
    description: '流程概览与待办',
  },
  {
    path: '/checkout',
    label: '标本借出',
    icon: PackageOpen,
    description: '借出登记管理',
  },
  {
    path: '/seal',
    label: '封签管理',
    icon: Archive,
    description: '运输箱封签状态',
  },
  {
    path: '/acceptance',
    label: '返馆验收',
    icon: FileCheck,
    description: '标本清点与状态',
  },
  {
    path: '/cabinet',
    label: '柜位核对台',
    icon: Grid3X3,
    description: '标本回放与核对',
  },
  {
    path: '/diff',
    label: '差异中心',
    icon: AlertTriangle,
    description: '回库差异清单',
  },
];

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`flex flex-col bg-museum-800 text-white transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } min-h-screen`}
    >
      <div className="flex items-center justify-between p-4 border-b border-museum-700">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-museum-600 rounded-lg flex items-center justify-center">
              <span className="font-serif text-lg font-bold">博</span>
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold">借展回库</h1>
              <p className="text-xs text-museum-300">核对管理系统</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-10 h-10 mx-auto bg-museum-600 rounded-lg flex items-center justify-center">
            <span className="font-serif text-lg font-bold">博</span>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-museum-600 text-white shadow-lg'
                  : 'text-museum-200 hover:bg-museum-700 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-museum-400 truncate">{item.description}</p>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={onToggle}
        className="flex items-center justify-center p-3 border-t border-museum-700 hover:bg-museum-700 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>
    </aside>
  );
}
