import { Link, useLocation } from 'react-router-dom';
import { BookOpen, FileText, AlertTriangle, Clock, BarChart3 } from 'lucide-react';

const Header = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: '首页', icon: BookOpen },
    { path: '/practice', label: '顺序练习', icon: FileText },
    { path: '/wrong-questions', label: '错题本', icon: AlertTriangle },
    { path: '/exam', label: '模拟考试', icon: Clock },
    { path: '/history', label: '历史记录', icon: BarChart3 },
  ];

  return (
    <header className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-8 h-8" />
            <span className="text-xl font-bold">科目一练习系统</span>
          </div>
          
          <nav className="flex space-x-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
