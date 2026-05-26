import { Package, User, Coins, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';

export function Navbar() {
  const location = useLocation();
  const currentUser = useAppStore(state => state.getCurrentUser());
  const users = useAppStore(state => state.users);
  const switchUser = useAppStore(state => state.switchUser);
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">校园快递代取</h1>
              <p className="text-xs text-white/80">便捷互助，校园生活好帮手</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Coins className="w-5 h-5 text-yellow-300" />
              <span className="font-semibold">{currentUser?.points || 0}</span>
              <span className="text-white/70 text-sm">积分</span>
              <div className="w-px h-5 bg-white/30 mx-2" />
              <Shield className={`w-5 h-5 ${(currentUser?.creditScore || 0) >= 60 ? 'text-green-300' : 'text-red-300'}`} />
              <span className="font-semibold">{currentUser?.creditScore || 0}</span>
              <span className="text-white/70 text-sm">信用分</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive('/')
                    ? 'bg-white text-primary-600 font-semibold shadow-lg'
                    : 'hover:bg-white/20'
                }`}
              >
                <Package className="w-5 h-5" />
                <span className="hidden sm:inline">订单广场</span>
              </Link>
              
              <Link
                to="/profile"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive('/profile')
                    ? 'bg-white text-primary-600 font-semibold shadow-lg'
                    : 'hover:bg-white/20'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">个人中心</span>
              </Link>
            </div>
            
            <div className="relative group">
              <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-all">
                <img
                  src={currentUser?.avatar}
                  alt={currentUser?.name}
                  className="w-8 h-8 rounded-full border-2 border-white/50"
                />
                <span className="hidden sm:inline font-medium">{currentUser?.name}</span>
              </button>
              
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-sm text-gray-500">切换用户</p>
                </div>
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => switchUser(user.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                      user.id === currentUser?.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="text-left">
                      <p className="font-medium text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500">
                        信用分: <span className={user.creditScore >= 60 ? 'text-green-600' : 'text-red-600'}>
                          {user.creditScore}
                        </span>
                      </p>
                    </div>
                    {user.id === currentUser?.id && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
