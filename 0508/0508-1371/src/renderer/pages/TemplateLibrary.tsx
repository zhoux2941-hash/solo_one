import { useState } from 'react';
import {
  Library,
  Search,
  Play,
  Code,
  Settings,
  Copy,
  Download,
  Star,
  Clock,
  X,
  Check,
  ChevronDown,
  Zap,
  Monitor,
  Terminal as TerminalIcon,
  Server,
} from 'lucide-react';
import type { AttackTemplate, Severity } from '@shared/types';

const mockTemplates: AttackTemplate[] = [
  {
    id: '1',
    name: 'Windows Reverse Shell',
    description: '通过 PowerShell 创建反向 TCP 连接，实现远程命令执行',
    category: 'windows',
    severity: 'critical',
    parameters: [
      { name: 'LHOST', description: '攻击者监听IP地址', type: 'string', defaultValue: '192.168.1.100', required: true, placeholder: 'x.x.x.x' },
      { name: 'LPORT', description: '监听端口', type: 'number', defaultValue: 4444, required: true },
      { name: 'DELAY', description: '执行前延迟(毫秒)', type: 'number', defaultValue: 1000, required: false },
    ],
    script: `DELAY 1000\nGUI r\nDELAY 500\nSTRING powershell -NoP -NonI -W Hidden\nENTER`,
  },
  {
    id: '2',
    name: 'Bypass UAC',
    description: '利用 Windows 漏洞绕过用户账户控制，获取管理员权限',
    category: 'windows',
    severity: 'high',
    parameters: [
      { name: 'METHOD', description: '绕过方法', type: 'string', defaultValue: 'fodhelper', required: true },
    ],
    script: `DELAY 1000\nGUI r\nDELAY 500\nSTRING cmd\nENTER`,
  },
  {
    id: '3',
    name: 'Disable Windows Defender',
    description: '通过 PowerShell 命令禁用 Windows Defender 实时保护',
    category: 'windows',
    severity: 'high',
    parameters: [
      { name: 'DISABLE_FIREWALL', description: '同时禁用防火墙', type: 'boolean', defaultValue: false, required: false },
    ],
    script: `DELAY 1000\nGUI x\nSTRING a\nDELAY 500`,
  },
  {
    id: '4',
    name: 'macOS Privilege Escalation',
    description: '利用 macOS 系统漏洞提升至 root 权限',
    category: 'macos',
    severity: 'critical',
    parameters: [
      { name: 'EXPLOIT', description: '漏洞利用类型', type: 'string', defaultValue: 'cve-2023-xxx', required: true },
    ],
    script: `DELAY 500\nGUI SPACE\nSTRING terminal\nENTER`,
  },
  {
    id: '5',
    name: 'Linux SSH Stealer',
    description: '窃取系统中保存的 SSH 密钥和配置',
    category: 'linux',
    severity: 'high',
    parameters: [
      { name: 'EXFIL_URL', description: '数据外泄地址', type: 'string', required: true, placeholder: 'http://...' },
    ],
    script: `DELAY 1000\nSTRING tar -czf /tmp/keys.tar.gz ~/.ssh\nENTER`,
  },
  {
    id: '6',
    name: 'USB Boot Execute',
    description: '修改 BIOS 设置从 USB 启动并执行自定义 payload',
    category: 'general',
    severity: 'critical',
    parameters: [
      { name: 'BIOS_KEY', description: '进入BIOS按键', type: 'string', defaultValue: 'F2', required: true },
    ],
    script: `DELAY 500\nF2\nDELAY 2000`,
  },
  {
    id: '7',
    name: 'Information Gathering',
    description: '收集系统信息：网络配置、运行进程、已安装软件',
    category: 'general',
    severity: 'medium',
    parameters: [
      { name: 'OUTPUT_FILE', description: '输出文件路径', type: 'string', defaultValue: '/tmp/sysinfo.txt', required: true },
    ],
    script: `DELAY 1000\nGUI r\nDELAY 500\nSTRING cmd\nENTER`,
  },
  {
    id: '8',
    name: 'WiFi Password Grabber',
    description: '导出系统保存的所有 WiFi 密码',
    category: 'windows',
    severity: 'medium',
    parameters: [
      { name: 'EXPORT_ALL', description: '导出所有配置文件', type: 'boolean', defaultValue: true, required: false },
    ],
    script: `DELAY 1000\nGUI r\nDELAY 500\nSTRING cmd\nENTER`,
  },
  {
    id: '9',
    name: 'Ransomware Simulator',
    description: '模拟勒索软件行为（仅用于测试）',
    category: 'general',
    severity: 'critical',
    parameters: [
      { name: 'TEST_MODE', description: '测试模式（不实际加密）', type: 'boolean', defaultValue: true, required: true },
      { name: 'TARGET_DIR', description: '目标目录', type: 'string', defaultValue: '/tmp/test', required: true },
    ],
    script: `DELAY 1000\nREM Ransomware Simulation Script`,
  },
];

const categories = [
  { id: 'all', name: '全部', icon: Library },
  { id: 'windows', name: 'Windows', icon: Monitor },
  { id: 'macos', name: 'macOS', icon: Server },
  { id: 'linux', name: 'Linux', icon: TerminalIcon },
  { id: 'general', name: '通用', icon: Zap },
];

function getSeverityColor(severity: Severity) {
  switch (severity) {
    case 'low':
      return 'text-cyber-green bg-cyber-green/20';
    case 'medium':
      return 'text-cyber-yellow bg-cyber-yellow/20';
    case 'high':
      return 'text-cyber-orange bg-cyber-orange/20';
    case 'critical':
      return 'text-cyber-red bg-cyber-red/20 neon-glow-red';
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'windows':
      return 'text-cyber-blue bg-cyber-blue/20';
    case 'macos':
      return 'text-cyber-text bg-cyber-surface';
    case 'linux':
      return 'text-cyber-yellow bg-cyber-yellow/20';
    default:
      return 'text-cyber-purple bg-cyber-purple/20';
  }
}

interface TemplateModalProps {
  template: AttackTemplate | null;
  onClose: () => void;
  onApply: (template: AttackTemplate, params: Record<string, string | number | boolean>) => void;
}

function TemplateModal({ template, onClose, onApply }: TemplateModalProps) {
  const [params, setParams] = useState<Record<string, string | number | boolean>>({});

  if (!template) return null;

  const handleParamChange = (name: string, value: string | number | boolean) => {
    setParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    const finalParams: Record<string, string | number | boolean> = {};
    template.parameters.forEach((p) => {
      finalParams[p.name] = params[p.name] ?? p.defaultValue ?? '';
    });
    onApply(template, finalParams);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-panel rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden data-flow-border">
        <div className="flex items-center justify-between p-5 border-b border-cyber-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-cyber-purple/20">
              <Code className="text-cyber-purple" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-cyber-text">{template.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(template.category)}`}>
                  {template.category.toUpperCase()}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${getSeverityColor(template.severity)}`}>
                  {template.severity.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-cyber-surface text-cyber-muted hover:text-cyber-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[60vh]">
          <p className="text-cyber-muted mb-6">{template.description}</p>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-cyber-text mb-3 flex items-center gap-2">
              <Settings className="text-cyber-cyan" size={16} />
              参数配置
            </h3>
            <div className="space-y-4">
              {template.parameters.map((param) => (
                <div key={param.name} className="p-3 rounded-lg bg-cyber-bg/50 border border-cyber-border">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-cyber-text font-mono">
                      {param.name}
                      {param.required && <span className="text-cyber-red ml-1">*</span>}
                    </label>
                    <span className="text-xs text-cyber-muted">
                      {param.type === 'string' ? '字符串' : param.type === 'number' ? '数字' : '布尔值'}
                    </span>
                  </div>
                  <p className="text-xs text-cyber-muted mb-2">{param.description}</p>
                  {param.type === 'boolean' ? (
                    <button
                      onClick={() => handleParamChange(param.name, !params[param.name])}
                      className={`w-full p-2 rounded-lg border transition-colors text-sm flex items-center justify-between ${
                        params[param.name] ?? param.defaultValue
                          ? 'bg-cyber-green/20 border-cyber-green/50 text-cyber-green'
                          : 'bg-cyber-surface border-cyber-border text-cyber-muted'
                      }`}
                    >
                      <span>{(params[param.name] ?? param.defaultValue) ? '已启用' : '已禁用'}</span>
                      {(params[param.name] ?? param.defaultValue) ? <Check size={16} /> : <X size={16} />}
                    </button>
                  ) : (
                    <input
                      type={param.type === 'number' ? 'number' : 'text'}
                      value={String(params[param.name] ?? param.defaultValue ?? '')}
                      onChange={(e) =>
                        handleParamChange(
                          param.name,
                          param.type === 'number' ? Number(e.target.value) : e.target.value
                        )
                      }
                      placeholder={param.placeholder}
                      className="w-full p-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-text text-sm terminal-input"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-cyber-text mb-3 flex items-center gap-2">
              <Code className="text-cyber-green" size={16} />
              脚本预览
            </h3>
            <div className="rounded-lg border border-cyber-border overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-cyber-surface/50 border-b border-cyber-border">
                <div className="w-3 h-3 rounded-full bg-cyber-red" />
                <div className="w-3 h-3 rounded-full bg-cyber-yellow" />
                <div className="w-3 h-3 rounded-full bg-cyber-green" />
                <span className="text-xs text-cyber-muted ml-2">payload.dsl</span>
              </div>
              <pre className="p-4 text-sm font-mono text-cyber-green/80 bg-cyber-bg/80 max-h-48 overflow-auto">
                {template.script}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-cyber-border">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-text hover:border-cyber-muted transition-colors btn-cyber"
          >
            取消
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-lg bg-cyber-purple text-white font-medium hover:bg-cyber-purple/80 transition-colors btn-cyber neon-glow-purple flex items-center gap-2"
          >
            <Play size={16} />
            使用模板
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplateLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<AttackTemplate | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const filteredTemplates = mockTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || template.severity === selectedSeverity;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const handleApplyTemplate = (template: AttackTemplate, params: Record<string, string | number | boolean>) => {
    console.log('Applying template:', template.name, params);
    setSelectedTemplate(null);
  };

  return (
    <div className="h-full flex flex-col cyber-grid">
      <div className="px-6 py-4 border-b border-cyber-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-cyber-cyan/20">
              <Library className="text-cyber-cyan" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-cyber-text neon-text-cyan">
                攻击模板库
              </h1>
              <p className="text-cyber-muted text-sm">选择和配置预置的攻击载荷模板</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-cyber-muted">
              {filteredTemplates.length} 个模板
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" size={18} />
            <input
              type="text"
              placeholder="搜索模板名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-text terminal-input"
            />
          </div>

          <div className="relative">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as Severity | 'all')}
              className="appearance-none pl-4 pr-10 py-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-text cursor-pointer"
            >
              <option value="all">所有级别</option>
              <option value="low">低危</option>
              <option value="medium">中危</option>
              <option value="high">高危</option>
              <option value="critical">严重</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-cyber-border bg-cyber-surface/20">
        <div className="flex items-center gap-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                  selectedCategory === category.id
                    ? 'bg-cyber-purple text-white neon-glow-purple'
                    : 'bg-cyber-surface/50 text-cyber-muted hover:text-cyber-text hover:bg-cyber-surface'
                }`}
              >
                <Icon size={14} />
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="glass-panel rounded-xl overflow-hidden card-hover group cursor-pointer"
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-cyber-surface group-hover:bg-cyber-purple/20 transition-colors">
                    <Code className="text-cyber-cyan group-hover:text-cyber-purple transition-colors" size={20} />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(template.id);
                    }}
                    className="p-1 rounded hover:bg-cyber-surface transition-colors"
                  >
                    <Star
                      size={18}
                      className={favorites.includes(template.id) ? 'text-cyber-yellow fill-cyber-yellow' : 'text-cyber-muted'}
                    />
                  </button>
                </div>

                <h3 className="text-base font-semibold text-cyber-text mb-2 group-hover:text-cyber-purple transition-colors">
                  {template.name}
                </h3>
                <p className="text-sm text-cyber-muted mb-4 line-clamp-2">
                  {template.description}
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(template.category)}`}>
                    {template.category.toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${getSeverityColor(template.severity)}`}>
                    {template.severity.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-cyber-muted">
                  <div className="flex items-center gap-1">
                    <Settings size={12} />
                    {template.parameters.length} 个参数
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    ~{template.script.split('\n').length} 行
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 border-t border-cyber-border bg-cyber-surface/30 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-lg hover:bg-cyber-surface text-cyber-muted hover:text-cyber-cyan transition-colors"
                  title="复制脚本"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-lg hover:bg-cyber-surface text-cyber-muted hover:text-cyber-green transition-colors"
                  title="下载"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTemplate(template);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyber-purple text-white text-sm hover:bg-cyber-purple/80 transition-colors"
                >
                  <Play size={12} />
                  使用
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-cyber-muted">
            <Search className="mb-4" size={48} />
            <p className="text-lg">没有找到匹配的模板</p>
            <p className="text-sm mt-1">尝试调整搜索条件或筛选器</p>
          </div>
        )}
      </div>

      <TemplateModal
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onApply={handleApplyTemplate}
      />
    </div>
  );
}
