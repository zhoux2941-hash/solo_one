import { useState } from 'react';
import {
  Settings,
  Shield,
  Database,
  FileText,
  Key,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Folder,
  Zap,
  Activity,
} from 'lucide-react';
import type { AppSettings } from '@shared/types';

const defaultSettings: AppSettings = {
  detection: {
    enabled: true,
    minTypingSpeedThreshold: 30,
    shortcutDensityThreshold: 5,
    shortcutTimeWindowMs: 1000,
    minInputIntervalVariance: 0.5,
    mouseEdgeDetection: true,
    alertCooldownMs: 30000,
  },
  virustotal: {
    apiKey: '',
    autoScan: false,
  },
  signatures: {
    autoUpdate: true,
    updateUrl: 'https://api.example.com/signatures',
    checkIntervalHours: 24,
  },
  service: {
    logLevel: 'info',
    logPath: 'C:\\ProgramData\\HIDGuard\\logs',
  },
};

export default function SystemSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = <K extends keyof AppSettings, S extends keyof AppSettings[K]>(
    category: K,
    key: S,
    value: AppSettings[K][S]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveStatus('success');
    setHasChanges(false);
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const logLevels = [
    { value: 'debug', label: 'Debug', description: '详细调试信息' },
    { value: 'info', label: 'Info', description: '一般信息记录' },
    { value: 'warn', label: 'Warning', description: '仅警告和错误' },
    { value: 'error', label: 'Error', description: '仅错误记录' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-cyber-text neon-text-purple mb-2">系统设置</h1>
            <p className="text-cyber-muted text-sm">配置检测参数、API 密钥和系统选项</p>
          </div>
          {hasChanges && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-cyber-yellow/20 text-cyber-yellow rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4" />
              有未保存的更改
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-6 pb-6">
        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-cyber-purple/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-cyber-purple" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-cyber-text">VirusTotal API 设置</h2>
              <p className="text-cyber-muted text-sm">配置 VirusTotal 扫描服务</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-cyber-text text-sm font-medium mb-2">
                API 密钥
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.virustotal.apiKey}
                  onChange={(e) => updateSetting('virustotal', 'apiKey', e.target.value)}
                  placeholder="输入您的 VirusTotal API 密钥..."
                  className="w-full px-4 py-3 pr-12 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-cyber-purple font-mono"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-text"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-cyber-muted text-xs mt-2">
                获取 API 密钥: <a href="https://www.virustotal.com/gui/join-us" target="_blank" rel="noopener noreferrer" className="text-cyber-purple hover:underline">VirusTotal 注册页面</a>
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-cyber-bg/50 rounded-lg border border-cyber-border">
              <div>
                <div className="text-cyber-text font-medium">自动扫描生成的 payload</div>
                <div className="text-cyber-muted text-sm">生成 payload 后自动提交到 VirusTotal 扫描</div>
              </div>
              <button
                onClick={() => updateSetting('virustotal', 'autoScan', !settings.virustotal.autoScan)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.virustotal.autoScan ? 'bg-cyber-green' : 'bg-cyber-border'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.virustotal.autoScan ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-cyber-green/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyber-green" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-cyber-text">检测阈值设置</h2>
              <p className="text-cyber-muted text-sm">调整攻击检测的敏感度参数</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-cyber-text text-sm font-medium">最小击键速度阈值</label>
                <span className="text-cyber-green font-mono text-lg">{settings.detection.minTypingSpeedThreshold} ms</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={settings.detection.minTypingSpeedThreshold}
                onChange={(e) => updateSetting('detection', 'minTypingSpeedThreshold', parseInt(e.target.value))}
                className="w-full accent-cyber-green"
              />
              <div className="flex justify-between text-cyber-muted text-xs mt-1">
                <span>更快 (敏感)</span>
                <span>更慢 (宽松)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-cyber-text text-sm font-medium">快捷键密度阈值</label>
                <span className="text-cyber-cyan font-mono text-lg">{settings.detection.shortcutDensityThreshold} 次/秒</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={settings.detection.shortcutDensityThreshold}
                onChange={(e) => updateSetting('detection', 'shortcutDensityThreshold', parseInt(e.target.value))}
                className="w-full accent-cyber-cyan"
              />
              <div className="flex justify-between text-cyber-muted text-xs mt-1">
                <span>宽松</span>
                <span>敏感</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-cyber-text text-sm font-medium">快捷键时间窗口</label>
                <span className="text-cyber-purple font-mono text-lg">{settings.detection.shortcutTimeWindowMs} ms</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={settings.detection.shortcutTimeWindowMs}
                onChange={(e) => updateSetting('detection', 'shortcutTimeWindowMs', parseInt(e.target.value))}
                className="w-full accent-cyber-purple"
              />
              <div className="flex justify-between text-cyber-muted text-xs mt-1">
                <span>500ms</span>
                <span>5000ms</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-cyber-text text-sm font-medium">输入间隔方差阈值</label>
                <span className="text-cyber-yellow font-mono text-lg">{settings.detection.minInputIntervalVariance}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={settings.detection.minInputIntervalVariance}
                onChange={(e) => updateSetting('detection', 'minInputIntervalVariance', parseFloat(e.target.value))}
                className="w-full accent-cyber-yellow"
              />
              <div className="flex justify-between text-cyber-muted text-xs mt-1">
                <span>低方差</span>
                <span>高方差</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-cyber-bg/50 rounded-lg border border-cyber-border">
                <div>
                  <div className="text-cyber-text font-medium">鼠标边缘检测</div>
                  <div className="text-cyber-muted text-sm">检测屏幕边缘的异常鼠标移动</div>
                </div>
                <button
                  onClick={() => updateSetting('detection', 'mouseEdgeDetection', !settings.detection.mouseEdgeDetection)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.detection.mouseEdgeDetection ? 'bg-cyber-green' : 'bg-cyber-border'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.detection.mouseEdgeDetection ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="p-4 bg-cyber-bg/50 rounded-lg border border-cyber-border">
                <div className="text-cyber-text font-medium mb-2">告警冷却时间</div>
                <input
                  type="number"
                  value={settings.detection.alertCooldownMs / 1000}
                  onChange={(e) => updateSetting('detection', 'alertCooldownMs', parseInt(e.target.value) * 1000)}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-green font-mono"
                />
                <div className="text-cyber-muted text-xs mt-1">相同告警的最小间隔 (秒)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-cyber-cyan/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyber-cyan" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-cyber-text">签名更新设置</h2>
              <p className="text-cyber-muted text-sm">配置攻击特征签名的自动更新</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-cyber-bg/50 rounded-lg border border-cyber-border">
              <div>
                <div className="text-cyber-text font-medium">自动更新签名</div>
                <div className="text-cyber-muted text-sm">定期从远程服务器更新检测规则</div>
              </div>
              <button
                onClick={() => updateSetting('signatures', 'autoUpdate', !settings.signatures.autoUpdate)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.signatures.autoUpdate ? 'bg-cyber-cyan' : 'bg-cyber-border'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.signatures.autoUpdate ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {settings.signatures.autoUpdate && (
              <>
                <div>
                  <label className="block text-cyber-text text-sm font-medium mb-2">
                    更新服务器地址
                  </label>
                  <input
                    type="text"
                    value={settings.signatures.updateUrl}
                    onChange={(e) => updateSetting('signatures', 'updateUrl', e.target.value)}
                    className="w-full px-4 py-3 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-cyan font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-cyber-text text-sm font-medium mb-2">
                    检查间隔: {settings.signatures.checkIntervalHours} 小时
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="168"
                    value={settings.signatures.checkIntervalHours}
                    onChange={(e) => updateSetting('signatures', 'checkIntervalHours', parseInt(e.target.value))}
                    className="w-full accent-cyber-cyan"
                  />
                  <div className="flex justify-between text-cyber-muted text-xs mt-1">
                    <span>1 小时</span>
                    <span>168 小时 (每周)</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-cyber-orange/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-cyber-orange" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-cyber-text">日志设置</h2>
              <p className="text-cyber-muted text-sm">配置系统日志记录选项</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-cyber-text text-sm font-medium mb-3">
                日志级别
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {logLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => updateSetting('service', 'logLevel', level.value as any)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      settings.service.logLevel === level.value
                        ? 'bg-cyber-orange/20 border-cyber-orange/50'
                        : 'bg-cyber-bg/50 border-cyber-border hover:border-cyber-orange/30'
                    }`}
                  >
                    <div className={`font-semibold ${
                      settings.service.logLevel === level.value ? 'text-cyber-orange' : 'text-cyber-text'
                    }`}>
                      {level.label}
                    </div>
                    <div className="text-cyber-muted text-xs mt-1">{level.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-cyber-text text-sm font-medium mb-2">
                日志存储路径
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.service.logPath}
                  onChange={(e) => updateSetting('service', 'logPath', e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-orange font-mono"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-orange">
                  <Folder className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-cyber-blue/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-cyber-blue" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-cyber-text">数据库设置</h2>
              <p className="text-cyber-muted text-sm">配置数据库存储选项</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-cyber-text text-sm font-medium mb-2">
                数据库文件路径
              </label>
              <div className="relative">
                <input
                  type="text"
                  value="C:\\ProgramData\\HIDGuard\\data\\events.db"
                  readOnly
                  className="w-full px-4 py-3 pr-12 bg-cyber-bg/50 border border-cyber-border rounded-lg text-cyber-muted font-mono cursor-not-allowed"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted">
                  <Folder className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-cyber-bg/50 rounded-lg border border-cyber-border">
                <div className="text-cyber-muted text-sm mb-1">事件记录数</div>
                <div className="text-cyber-text text-2xl font-bold">12,458</div>
              </div>
              <div className="p-4 bg-cyber-bg/50 rounded-lg border border-cyber-border">
                <div className="text-cyber-muted text-sm mb-1">数据库大小</div>
                <div className="text-cyber-text text-2xl font-bold">45.2 MB</div>
              </div>
              <div className="p-4 bg-cyber-bg/50 rounded-lg border border-cyber-border">
                <div className="text-cyber-muted text-sm mb-1">最后清理</div>
                <div className="text-cyber-text text-2xl font-bold">3 天前</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="px-4 py-2 bg-cyber-red/20 text-cyber-red rounded-lg hover:bg-cyber-red/30 transition-colors">
                清理旧数据
              </button>
              <button className="px-4 py-2 bg-cyber-blue/20 text-cyber-blue rounded-lg hover:bg-cyber-blue/30 transition-colors">
                导出数据库
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-cyber-border">
        <div className="flex items-center gap-3">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-cyber-green">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">设置已保存</span>
            </div>
          )}
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-2 text-cyber-purple">
              <div className="w-5 h-5 border-2 border-cyber-purple border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">正在保存...</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-6 py-2.5 border border-cyber-border text-cyber-text rounded-lg hover:bg-cyber-border/30 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重置默认
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saveStatus === 'saving'}
            className="px-8 py-2.5 bg-cyber-purple text-white rounded-lg hover:bg-cyber-purple/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 btn-cyber"
          >
            <Save className="w-4 h-4" />
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
}
