import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Bell, Maximize2, Minimize2, Wifi } from 'lucide-react';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import type { HIDDevice } from '@shared/types';

const pageTitles: Record<string, string> = {
  '/dashboard': '仪表板',
  '/payload/generator': '载荷生成',
  '/payload/templates': '模板库',
  '/payload/compile': '设备编译',
  '/detection/monitor': '检测监控',
  '/detection/events': '事件查询',
  '/service/control': '服务控制',
  '/tools/playback': '分析工具',
  '/signatures': '签名管理',
  '/settings': '系统设置',
};

export default function Layout() {
  const location = useLocation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [deviceCount, setDeviceCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(3);

  const pageTitle = pageTitles[location.pathname] || 'HID Framework';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.detection.getDevices().then((devices: HIDDevice[]) => {
        setDeviceCount(devices.length);
      });
    }
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden cyber-bg bg-cyber-bg">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 bg-cyber-surface/80 backdrop-blur-sm border-b border-cyber-border flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-cyber-purple to-cyber-cyan rounded-full" />
                <h1 className="text-lg font-semibold text-cyber-text neon-text-purple">
                  {pageTitle}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-bg border border-cyber-border">
                <Wifi className="w-4 h-4 text-cyber-green" />
                <span className="text-xs text-cyber-muted font-mono">
                  {deviceCount} 设备在线
                </span>
              </div>

              <button className="relative p-2 rounded-lg hover:bg-cyber-bg transition-colors">
                <Bell className="w-5 h-5 text-cyber-muted" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyber-red text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {notificationCount}
                  </span>
                )}
              </button>

              <div className="h-6 w-px bg-cyber-border" />

              <div className="text-sm font-mono text-cyber-muted">
                {currentTime.toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-cyber-bg transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5 text-cyber-muted" />
                ) : (
                  <Maximize2 className="w-5 h-5 text-cyber-muted" />
                )}
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 cyber-grid">
            <div className="max-w-7xl mx-auto h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <StatusBar
        detectionRunning={true}
        serviceRunning={true}
        deviceCount={deviceCount}
      />
    </div>
  );
}
