import { Link, useLocation } from 'react-router-dom';
import { Palette, Layout, Upload } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const navItems = [
    { path: '/', label: '纹样库', icon: Palette },
    { path: '/editor', label: '设计工作台', icon: Layout },
    { path: '/upload', label: '上传纹样', icon: Upload },
  ];
  return (
    <header className="bg-[#1A2332] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D4A84B] rounded-lg flex items-center justify-center">
            <Palette className="w-6 h-6 text-[#1A2332]" />
          </div>
          <h1 className="text-xl font-bold tracking-wide">蜡染纹样设计</h1>
        </Link>
        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-[#D4A84B] text-[#1A2332] font-medium'
                    : 'hover:bg-white/10 text-white/80 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
