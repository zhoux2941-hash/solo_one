import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Calendar, CreditCard, Clock, LogOut, Home, DollarSign, User } from 'lucide-react';

interface NavbarProps {
  role: 'member' | 'coach';
}

export default function Navbar({ role }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const memberLinks = [
    { to: '/member', icon: Home, label: '首页' },
    { to: '/member/packages', icon: CreditCard, label: '购买课时' },
    { to: '/member/booking', icon: Calendar, label: '预约课程' },
    { to: '/member/records', icon: Clock, label: '预约记录' },
  ];

  const coachLinks = [
    { to: '/coach', icon: Home, label: '首页' },
    { to: '/coach/bookings', icon: Calendar, label: '预约管理' },
    { to: '/coach/settlement', icon: DollarSign, label: '结算中心' },
  ];

  const links = role === 'member' ? memberLinks : coachLinks;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-800 to-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">课时预约系统</span>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 
                           hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {user?.name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 
                       hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="sm:hidden border-t border-gray-100">
        <div className="flex justify-around py-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex flex-col items-center px-4 py-2 text-xs font-medium text-gray-600 
                       hover:text-blue-600 transition-colors duration-200"
            >
              <link.icon className="w-5 h-5 mb-1" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
