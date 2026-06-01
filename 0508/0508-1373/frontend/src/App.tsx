import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ABTestPage } from './pages/ABTestPage';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '仪表盘', icon: '📊' },
    { path: '/ab-tests', label: 'A/B对比', icon: '⚖️' },
  ];

  return (
    <nav className="bg-dark-600 border-b border-dark-500">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚀</span>
              <span className="text-xl font-bold text-white">LLM 压测平台</span>
            </div>
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                    location.pathname === item.path
                      ? 'bg-primary-600 text-white'
                      : 'text-dark-200 hover:text-white hover:bg-dark-500'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-700">
      <Navigation />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ab-tests" element={<ABTestPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
