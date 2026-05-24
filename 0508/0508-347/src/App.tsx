import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Checkout from './pages/Checkout';
import SealManagement from './pages/SealManagement';
import Acceptance from './pages/Acceptance';
import CabinetCheckout from './pages/CabinetCheckout';
import DiffCenter from './pages/DiffCenter';
import { useAppStore } from './store/useAppStore';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: '工作台', subtitle: '借展回库工作流程概览' },
  '/checkout': { title: '标本借出', subtitle: '借出登记与借出标本管理' },
  '/seal': { title: '封签管理', subtitle: '运输箱封签状态追踪与解封验证' },
  '/acceptance': { title: '返馆验收', subtitle: '标本状态检查与验收记录' },
  '/cabinet': { title: '柜位核对台', subtitle: '标本回放与原柜位置核对' },
  '/diff': { title: '差异中心', subtitle: '回库位置差异清单与处理' },
};

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { loadAllData } = useAppStore();

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const pageInfo = pageTitles[location.pathname] || {
    title: '借展回库核对台',
    subtitle: '',
  };

  return (
    <div className="flex min-h-screen bg-museum-50">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/seal" element={<SealManagement />} />
            <Route path="/acceptance" element={<Acceptance />} />
            <Route path="/cabinet" element={<CabinetCheckout />} />
            <Route path="/diff" element={<DiffCenter />} />
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
