import { Link, useLocation } from 'react-router-dom';
import { Home, Music, BookOpen, Mic } from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/training/entry', label: '训练', icon: Music },
    { path: '/heritage', label: '非遗', icon: BookOpen },
    { path: '/practice', label: '练习', icon: Mic },
  ];

  return (
    <nav className="bg-primary-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wood-400 to-wood-500 flex items-center justify-center">
              <Music size={20} className="text-primary-600" />
            </div>
            <span className="font-display text-xl font-bold">侗族大歌训练</span>
          </Link>

          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
