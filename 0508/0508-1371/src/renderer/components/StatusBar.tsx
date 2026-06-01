import { Shield, Server, Usb, Activity } from 'lucide-react';

interface StatusBarProps {
  detectionRunning?: boolean;
  serviceRunning?: boolean;
  deviceCount?: number;
}

export default function StatusBar({
  detectionRunning = true,
  serviceRunning = true,
  deviceCount = 0,
}: StatusBarProps) {
  return (
    <footer className="h-10 bg-cyber-surface border-t border-cyber-border flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyber-muted" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-cyber-muted">检测状态:</span>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  detectionRunning
                    ? 'bg-cyber-green animate-pulse shadow-neon-green'
                    : 'bg-cyber-muted'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  detectionRunning ? 'text-cyber-green' : 'text-cyber-muted'
                }`}
              >
                {detectionRunning ? '运行中' : '已停止'}
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-cyber-border" />

        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-cyber-muted" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-cyber-muted">服务状态:</span>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  serviceRunning
                    ? 'bg-cyber-cyan animate-pulse shadow-neon-cyan'
                    : 'bg-cyber-red'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  serviceRunning ? 'text-cyber-cyan' : 'text-cyber-red'
                }`}
              >
                {serviceRunning ? '在线' : '离线'}
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-cyber-border" />

        <div className="flex items-center gap-2">
          <Usb className="w-4 h-4 text-cyber-muted" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-cyber-muted">已连接设备:</span>
            <span className="text-xs font-mono text-cyber-text">
              {deviceCount}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyber-purple" />
          <span className="text-xs text-cyber-muted">HID Security Framework</span>
        </div>
        <div className="text-xs text-cyber-muted font-mono">
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </footer>
  );
}
