import { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Upload,
  FileCode,
  Clock,
  Save,
  RotateCcw,
  Copy,
  Check,
  Search,
  Filter,
} from 'lucide-react';
import type { AttackSignature, Severity } from '@shared/types';

const mockSignatures: AttackSignature[] = [
  {
    id: 'sig-001',
    signatureId: 'win_shortcut_suspicious',
    name: 'Windows 可疑快捷键检测',
    description: '检测快速连续的 WIN+R、CMD 执行等可疑快捷键序列',
    severity: 'high',
    pattern: {
      type: 'sequence',
      events: [
        { type: 'shortcut', keys: ['GUI', 'R'], window: 1000 },
        { type: 'string', contains: 'cmd', window: 2000 },
      ],
    },
    patternYaml: `type: sequence
events:
  - type: shortcut
    keys: ["GUI", "R"]
    window: 1000
  - type: string
    contains: "cmd"
    window: 2000`,
    createdAt: new Date(Date.now() - 86400000 * 30),
    updatedAt: new Date(Date.now() - 86400000 * 5),
    source: 'local',
  },
  {
    id: 'sig-002',
    signatureId: 'rapid_keystroke',
    name: '快速击键检测',
    description: '检测超人类速度的键盘输入，可能是自动化工具',
    severity: 'medium',
    pattern: {
      type: 'statistical',
      metric: 'keystroke_speed',
      threshold: 30,
      window: 1000,
    },
    patternYaml: `type: statistical
metric: keystroke_speed
threshold: 30
window: 1000`,
    createdAt: new Date(Date.now() - 86400000 * 25),
    updatedAt: new Date(Date.now() - 86400000 * 3),
    source: 'remote',
  },
  {
    id: 'sig-003',
    signatureId: 'rubber_ducky_detect',
    name: 'Rubber Ducky 特征检测',
    description: '检测已知的 USB HID 攻击设备特征',
    severity: 'critical',
    pattern: {
      type: 'sequence',
      events: [
        { type: 'regex', regex: '^VID_1234.*PID_5678$', window: 0 },
      ],
    },
    patternYaml: `type: sequence
events:
  - type: regex
    regex: "^VID_1234.*PID_5678$"
    window: 0`,
    createdAt: new Date(Date.now() - 86400000 * 20),
    updatedAt: new Date(Date.now() - 86400000 * 1),
    source: 'remote',
  },
  {
    id: 'sig-004',
    signatureId: 'mouse_movement_anomaly',
    name: '鼠标移动异常检测',
    description: '检测非人类的鼠标移动模式',
    severity: 'low',
    pattern: {
      type: 'mouse',
      movement: 'linear',
      duration: 500,
    },
    patternYaml: `type: mouse
movement: linear
duration: 500`,
    createdAt: new Date(Date.now() - 86400000 * 15),
    updatedAt: new Date(Date.now() - 86400000 * 10),
    source: 'local',
  },
  {
    id: 'sig-005',
    signatureId: 'unknown_device',
    name: '未知设备检测',
    description: '检测首次接入的未知设备',
    severity: 'medium',
    pattern: {
      type: 'statistical',
      metric: 'device_trust_score',
      threshold: 30,
    },
    patternYaml: `type: statistical
metric: device_trust_score
threshold: 30`,
    createdAt: new Date(Date.now() - 86400000 * 10),
    updatedAt: new Date(Date.now() - 86400000 * 7),
    source: 'local',
  },
];

const testInputSequence = `DELAY 500
GUI r
DELAY 100
STRING cmd.exe
ENTER
DELAY 300
STRING whoami /priv
ENTER`;

export default function SignatureManager() {
  const [signatures, setSignatures] = useState<AttackSignature[]>(mockSignatures);
  const [selectedSignature, setSelectedSignature] = useState<AttackSignature | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editYaml, setEditYaml] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');
  const [testRunning, setTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<{ signatureId: string; matched: boolean; name: string }[]>([]);
  const [testInput, setTestInput] = useState(testInputSequence);
  const [copied, setCopied] = useState(false);

  const filteredSignatures = signatures.filter((sig) => {
    const matchesSearch =
      sig.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sig.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sig.signatureId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || sig.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-cyber-red text-white';
      case 'high': return 'bg-cyber-orange text-white';
      case 'medium': return 'bg-cyber-yellow text-black';
      case 'low': return 'bg-cyber-green text-black';
      default: return 'bg-cyber-muted text-white';
    }
  };

  const getSeverityBorder = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-cyber-red/30 hover:border-cyber-red';
      case 'high': return 'border-cyber-orange/30 hover:border-cyber-orange';
      case 'medium': return 'border-cyber-yellow/30 hover:border-cyber-yellow';
      case 'low': return 'border-cyber-green/30 hover:border-cyber-green';
      default: return 'border-cyber-border hover:border-cyber-purple';
    }
  };

  const handleSelectSignature = (sig: AttackSignature) => {
    setSelectedSignature(sig);
    setEditYaml(sig.patternYaml);
    setIsEditing(false);
  };

  const handleUpdateSignatures = async () => {
    setIsUpdating(true);
    setUpdateStatus('updating');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsUpdating(false);
    setUpdateStatus('success');
    setTimeout(() => setUpdateStatus('idle'), 3000);
  };

  const handleRunTest = async () => {
    setTestRunning(true);
    setTestResults([]);
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const results = signatures.map((sig, index) => ({
      signatureId: sig.signatureId,
      matched: index % 3 === 0,
      name: sig.name,
    }));
    
    setTestResults(results);
    setTestRunning(false);
  };

  const handleSaveYaml = () => {
    if (selectedSignature) {
      setSignatures((prev) =>
        prev.map((sig) =>
          sig.id === selectedSignature.id
            ? { ...sig, patternYaml: editYaml, updatedAt: new Date() }
            : sig
        )
      );
      setSelectedSignature((prev) => prev ? { ...prev, patternYaml: editYaml, updatedAt: new Date() } : null);
      setIsEditing(false);
    }
  };

  const copyYaml = () => {
    navigator.clipboard.writeText(editYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cyber-text neon-text-purple mb-2">签名管理</h1>
        <p className="text-cyber-muted text-sm">管理和测试 HID 攻击检测签名规则</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        <div className="glass-panel rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-cyber-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-cyber-text flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyber-purple" />
                签名列表
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUpdateSignatures}
                  disabled={isUpdating}
                  className={`p-2 rounded-lg transition-colors ${
                    updateStatus === 'success'
                      ? 'bg-cyber-green/20 text-cyber-green'
                      : updateStatus === 'error'
                      ? 'bg-cyber-red/20 text-cyber-red'
                      : 'bg-cyber-border/50 text-cyber-muted hover:bg-cyber-border hover:text-cyber-text'
                  }`}
                  title="更新签名"
                >
                  <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                </button>
                <button className="p-2 rounded-lg bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple/30 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
              <input
                type="text"
                placeholder="搜索签名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-cyber-purple text-sm"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as Severity | 'all')}
              className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-purple text-sm"
            >
              <option value="all">全部严重程度</option>
              <option value="critical">严重</option>
              <option value="high">高危</option>
              <option value="medium">中危</option>
              <option value="low">低危</option>
            </select>
          </div>

          <div className="flex-1 overflow-auto p-3">
            <div className="space-y-2">
              {filteredSignatures.map((sig) => (
                <div
                  key={sig.id}
                  onClick={() => handleSelectSignature(sig)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedSignature?.id === sig.id
                      ? 'bg-cyber-purple/20 border-cyber-purple'
                      : `bg-cyber-bg/50 ${getSeverityBorder(sig.severity)}`
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getSeverityColor(sig.severity)}`}>
                      {sig.severity.toUpperCase()}
                    </span>
                    <span className={`text-xs ${
                      sig.source === 'remote' ? 'text-cyber-cyan' : 'text-cyber-muted'
                    }`}>
                      {sig.source === 'remote' ? '远程' : '本地'}
                    </span>
                  </div>
                  <div className="text-cyber-text font-medium text-sm mb-1">{sig.name}</div>
                  <div className="text-cyber-muted text-xs truncate">{sig.signatureId}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-cyber-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-cyber-muted">
                共 {signatures.length} 条签名
              </span>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 bg-cyber-green/20 text-cyber-green rounded-lg hover:bg-cyber-green/30 transition-colors">
                  <Download className="w-3 h-3" />
                  导出
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-cyber-cyan/20 text-cyber-cyan rounded-lg hover:bg-cyber-cyan/30 transition-colors">
                  <Upload className="w-3 h-3" />
                  导入
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl flex flex-col overflow-hidden lg:col-span-2">
          {selectedSignature ? (
            <>
              <div className="p-4 border-b border-cyber-border">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-cyber-text">{selectedSignature.name}</h2>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getSeverityColor(selectedSignature.severity)}`}>
                        {selectedSignature.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-cyber-muted text-sm">{selectedSignature.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSaveYaml}
                          className="p-2 rounded-lg bg-cyber-green/20 text-cyber-green hover:bg-cyber-green/30 transition-colors"
                          title="保存"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditYaml(selectedSignature.patternYaml);
                          }}
                          className="p-2 rounded-lg bg-cyber-border/50 text-cyber-muted hover:bg-cyber-border hover:text-cyber-text transition-colors"
                          title="取消"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 rounded-lg bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple/30 transition-colors"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2 text-cyber-muted">
                    <FileCode className="w-4 h-4" />
                    <span>ID: {selectedSignature.signatureId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-cyber-muted">
                    <Clock className="w-4 h-4" />
                    <span>更新: {new Date(selectedSignature.updatedAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-cyber-muted">
                    <Shield className="w-4 h-4" />
                    <span>来源: {selectedSignature.source === 'remote' ? '远程规则库' : '本地自定义'}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 bg-cyber-bg/50 border-b border-cyber-border">
                  <span className="text-cyber-text font-medium text-sm flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-cyber-green" />
                    YAML 规则定义
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyYaml}
                      className="p-1.5 rounded hover:bg-cyber-border/50 text-cyber-muted hover:text-cyber-text transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-cyber-green" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setEditYaml(selectedSignature.patternYaml)}
                      className="p-1.5 rounded hover:bg-cyber-border/50 text-cyber-muted hover:text-cyber-text transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <textarea
                    value={editYaml}
                    onChange={(e) => setEditYaml(e.target.value)}
                    disabled={!isEditing}
                    className={`w-full h-full p-4 font-mono text-sm bg-black/50 text-cyber-green focus:outline-none resize-none ${
                      !isEditing ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="border-t border-cyber-border">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-cyber-text font-medium text-sm flex items-center gap-2">
                      <Play className="w-4 h-4 text-cyber-cyan" />
                      规则测试
                    </span>
                    <button
                      onClick={handleRunTest}
                      disabled={testRunning}
                      className="flex items-center gap-2 px-4 py-2 bg-cyber-cyan/20 text-cyber-cyan rounded-lg hover:bg-cyber-cyan/30 transition-colors disabled:opacity-50"
                    >
                      {testRunning ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      {testRunning ? '测试中...' : '运行测试'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-cyber-muted text-xs mb-2">测试输入序列</label>
                      <textarea
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        className="w-full h-32 p-3 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-green font-mono text-xs focus:outline-none focus:border-cyber-cyan resize-none"
                        spellCheck={false}
                      />
                    </div>
                    <div>
                      <label className="block text-cyber-muted text-xs mb-2">测试结果</label>
                      <div className="h-32 p-3 bg-cyber-bg border border-cyber-border rounded-lg overflow-auto">
                        {testResults.length === 0 ? (
                          <div className="text-cyber-muted text-sm text-center py-8">
                            点击"运行测试"查看结果
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {testResults.map((result) => (
                              <div
                                key={result.signatureId}
                                className={`flex items-center gap-2 text-sm p-2 rounded ${
                                  result.matched ? 'bg-cyber-red/10' : 'bg-cyber-green/10'
                                }`}
                              >
                                {result.matched ? (
                                  <AlertTriangle className="w-4 h-4 text-cyber-red" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 text-cyber-green" />
                                )}
                                <span className={result.matched ? 'text-cyber-red' : 'text-cyber-green'}>
                                  {result.name}
                                </span>
                                <span className="text-cyber-muted text-xs ml-auto">
                                  {result.matched ? '匹配' : '未匹配'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-cyber-muted">
              <Shield className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg">选择一个签名查看详情</p>
              <p className="text-sm mt-2">或点击 + 创建新的检测规则</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 glass-panel rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              updateStatus === 'updating' ? 'bg-cyber-yellow animate-pulse' :
              updateStatus === 'success' ? 'bg-cyber-green' :
              updateStatus === 'error' ? 'bg-cyber-red' :
              'bg-cyber-green'
            }`} />
            <span className="text-cyber-text text-sm">
              {updateStatus === 'updating' ? '正在更新签名库...' :
               updateStatus === 'success' ? '签名库已更新至最新版本' :
               updateStatus === 'error' ? '签名库更新失败' :
               '签名库状态正常'}
            </span>
            {updateStatus === 'success' && (
              <span className="text-cyber-muted text-xs">
                最后更新: {new Date().toLocaleTimeString('zh-CN')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-cyber-muted">
              启用规则: <span className="text-cyber-green font-bold">{signatures.length}</span>
            </span>
            <span className="text-cyber-muted">
              远程规则: <span className="text-cyber-cyan font-bold">{signatures.filter(s => s.source === 'remote').length}</span>
            </span>
            <span className="text-cyber-muted">
              本地规则: <span className="text-cyber-purple font-bold">{signatures.filter(s => s.source === 'local').length}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
