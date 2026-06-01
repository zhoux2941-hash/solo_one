import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import TopologyPage from '@/pages/TopologyPage';
import AnalysisPage from '@/pages/AnalysisPage';
import TimelinePage from '@/pages/TimelinePage';
import { Network, Search, Clock } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Network, label: '拓扑' },
  { to: '/analysis', icon: Search, label: '分析' },
  { to: '/timeline', icon: Clock, label: '时间轴' },
];

function Sidebar() {
  return (
    <nav className="w-[60px] bg-cyber-panel border-r border-cyber-border flex flex-col items-center py-4 gap-2">
      <div className="w-8 h-8 rounded-lg bg-cyber-cyan/20 flex items-center justify-center mb-4">
        <Network size={18} className="text-cyber-cyan" />
      </div>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              isActive
                ? 'bg-cyber-cyan/20 text-cyber-cyan glow-cyan'
                : 'text-cyber-muted hover:text-white hover:bg-cyber-bg'
            }`
          }
          title={item.label}
        >
          <item.icon size={20} />
        </NavLink>
      ))}
    </nav>
  );
}

function HeaderBar() {
  const location = useLocation();
  const titleMap: Record<string, string> = {
    '/': '微服务拓扑',
    '/analysis': '根因分析',
    '/timeline': '指标对比',
  };

  return (
    <header className="h-11 bg-cyber-panel border-b border-cyber-border flex items-center px-4">
      <h1 className="text-sm font-semibold text-cyber-cyan">
        {titleMap[location.pathname] || '微服务监控'}
      </h1>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-cyber-muted">微服务依赖可视化与根因分析系统</span>
      </div>
    </header>
  );
}

function AppLayout() {
  return (
    <div className="flex h-screen w-screen bg-cyber-bg overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderBar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<TopologyPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
