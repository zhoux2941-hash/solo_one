import { NavLink, useLocation } from 'react-router-dom';
import { Search, BookOpen, HelpCircle, Keyboard } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '编码查询', icon: Search },
    { path: '/common', label: '常用字列表', icon: BookOpen },
    { path: '/rules', label: '编码规则', icon: HelpCircle },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-dark-900/90 backdrop-blur-md border-b border-dark-700/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg group-hover:shadow-primary-500/30 transition-all duration-300">
              <Keyboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-white tracking-wide">
                五笔编码查询
              </h1>
              <p className="text-xs text-dark-400 -mt-1">86版 · 字根拆解</p>
            </div>
          </NavLink>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`
                    nav-link flex items-center gap-2
                    ${isActive ? 'active' : ''}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
