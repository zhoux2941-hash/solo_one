import { useState, useEffect } from 'react';
import { Warehouse, Clock } from 'lucide-react';
import { formatDateTime } from '@/utils/helpers';

export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-gradient-to-r from-green-900 via-green-800 to-emerald-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Warehouse className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                仓库进销存管理系统
              </h1>
              <p className="text-green-200 text-sm">本地数据存储 · 安全可靠</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-green-100">
            <Clock className="h-5 w-5" />
            <span className="font-mono text-sm">{formatDateTime(currentTime)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
