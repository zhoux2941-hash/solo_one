import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, User, Clock, Download, History, Settings, Menu, ChevronDown, GitCompare, Save } from 'lucide-react';
import { useChartStore } from '../store/useChartStore';
import { SaveVersionDialog } from './SaveVersionDialog';

interface TopNavbarProps {
  onExport: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onExport }) => {
  const navigate = useNavigate();
  const { currentOperator, collisions, saveVersion, versions } = useChartStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const dangerCount = collisions.filter((c) => c.severity === 'danger').length;

  return (
    <>
      <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Compass size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              海图工作台
            </h1>
            <p className="text-xs text-slate-400">CHART WORKSTATION v1.0</p>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-700 mx-4" />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="px-3 py-1.5 text-sm bg-slate-800 text-slate-300 rounded border border-slate-600 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Save size={14} />
            保存版本
          </button>
          <button
            onClick={() => navigate('/compare')}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded border border-blue-500 hover:bg-blue-500 transition-colors flex items-center gap-1.5"
          >
            <GitCompare size={14} />
            版本比对
            {versions.length > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-400 text-blue-900 rounded-full text-xs font-bold">
                {versions.length}
              </span>
            )}
          </button>
          <button className="px-3 py-1.5 text-sm bg-slate-800 text-slate-300 rounded border border-slate-600 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-1.5">
            <Settings size={14} />
            设置
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-300">
          <Clock size={16} className="text-blue-400" />
          <div className="text-right">
            <div className="text-sm font-mono font-medium">{formatTime(currentTime)}</div>
            <div className="text-xs text-slate-500">{formatDate(currentTime)}</div>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-700" />

        <button
          onClick={onExport}
          className={`px-4 py-2 rounded font-medium text-sm flex items-center gap-2 transition-all ${
            dangerCount > 0
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30'
              : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25'
          }`}
        >
          <Download size={16} />
          {dangerCount > 0 ? `导出值班图 (${dangerCount}个问题)` : '导出值班图'}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded border border-slate-600 hover:bg-slate-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white">{currentOperator}</div>
              <div className="text-xs text-slate-400">值班调度员</div>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden">
              <button className="w-full px-4 py-2.5 text-sm text-left text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                个人设置
              </button>
              <button className="w-full px-4 py-2.5 text-sm text-left text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                切换账号
              </button>
              <div className="h-px bg-slate-700" />
              <button className="w-full px-4 py-2.5 text-sm text-left text-red-400 hover:bg-slate-700 transition-colors">
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

    <SaveVersionDialog
      isOpen={showSaveDialog}
      onClose={() => setShowSaveDialog(false)}
      onSave={saveVersion}
    />
    </>
  );
};
