import { Bell, Search, User, Settings } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="bg-white border-b border-museum-100 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-museum-900">{title}</h1>
          {subtitle && <p className="text-museum-500 text-sm mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-museum-400" />
            <input
              type="text"
              placeholder="搜索标本编号、名称..."
              className="pl-10 pr-4 py-2 bg-museum-50 border border-museum-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-museum-500 focus:border-transparent w-64 transition-all"
            />
          </div>

          <button className="relative p-2 hover:bg-museum-50 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-museum-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
          </button>

          <button className="p-2 hover:bg-museum-50 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-museum-600" />
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-museum-200">
            <div className="w-9 h-9 bg-museum-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-museum-600" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-museum-900">王馆员</p>
              <p className="text-xs text-museum-500">标本管理员</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
