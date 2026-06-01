export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type DeviceType = 'arduino' | 'pico' | 'badusb' | 'flipper';

export type OutputType = 'bin' | 'json' | 'txt' | 'uf2';

export interface HIDDevice {
  id?: number;
  vendorId: number;
  productId: number;
  manufacturer: string;
  productName: string;
  serialNumber: string;
  devicePath: string;
  firstSeen: Date | string;
  lastSeen?: Date | string;
  isBlocked?: boolean;
  trustScore?: number;
}

export interface HIDInputEvent {
  id: string;
  timestamp: Date | string;
  devicePath: string;
  device?: HIDDevice;
  type: 'keyboard' | 'mouse' | 'other';
  keyCode?: number;
  keyName?: string;
  isModifier?: boolean;
  modifiers?: string[];
  mouseX?: number;
  mouseY?: number;
  rawData: number[];
  processingTimeMs?: number;
}

export interface DetectionAlert {
  id: string;
  timestamp: Date | string;
  device: HIDDevice;
  deviceId?: number;
  severity: Severity;
  reason: string;
  matchedSignatures: string[];
  inputSequence: HIDInputEvent[];
  riskScore: number;
  inputSequenceHash?: string;
  isReviewed?: boolean;
  reviewNotes?: string;
  reviewedAt?: Date | string;
}

export interface AttackTemplate {
  id: string;
  name: string;
  description: string;
  category: 'windows' | 'macos' | 'linux' | 'general';
  severity: Severity;
  parameters: TemplateParameter[];
  script: string;
}

export interface TemplateParameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean';
  defaultValue?: string | number | boolean;
  required: boolean;
  placeholder?: string;
}

export interface ASTNode {
  type: string;
  line: number;
  column: number;
}

export interface DelayNode extends ASTNode {
  type: 'delay';
  milliseconds: number;
}

export interface StringNode extends ASTNode {
  type: 'string';
  value: string;
}

export interface KeyNode extends ASTNode {
  type: 'key';
  key: string;
  modifiers: string[];
  repeat?: number;
}

export interface MouseMoveNode extends ASTNode {
  type: 'mouse_move';
  x: number;
  y: number;
}

export interface MouseClickNode extends ASTNode {
  type: 'mouse_click';
  button: 'left' | 'right' | 'middle';
}

export interface RepeatNode extends ASTNode {
  type: 'repeat';
  count: number;
  body: ASTNode[];
}

export interface IfOSNode extends ASTNode {
  type: 'if_os';
  os: 'windows' | 'macos' | 'linux';
  body: ASTNode[];
}

export interface VarNode extends ASTNode {
  type: 'var';
  name: string;
  value: string;
}

export interface IncludeNode extends ASTNode {
  type: 'include';
  template: string;
}

export interface DSLParseError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface DSLAnalysisResult {
  valid: boolean;
  errors: DSLParseError[];
  ast: ASTNode[] | null;
  compiledPreview: string;
}

export interface DeviceCompileResult {
  success: boolean;
  outputPath: string;
  outputType: OutputType;
  fileSize: number;
  errors: string[];
  targetDevice: DeviceType;
}

export interface SignaturePattern {
  type: 'sequence' | 'statistical' | 'mouse' | 'regex';
  events?: SignatureEvent[];
  metric?: string;
  threshold?: number;
  window?: number;
  movement?: string;
  duration?: number;
  regex?: string;
}

export interface SignatureEvent {
  type: 'shortcut' | 'string' | 'key' | 'regex';
  keys?: string[];
  value?: string;
  contains?: string;
  regex?: string;
  window: number;
}

export interface AttackSignature {
  id: string;
  signatureId: string;
  name: string;
  description: string;
  severity: Severity;
  pattern: SignaturePattern;
  patternYaml: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  source: 'local' | 'remote';
}

export interface VirusTotalScanResult {
  id?: number;
  payloadId?: number;
  scanId: string;
  permalink: string;
  positives: number;
  total: number;
  detectionRate: number;
  scans: Record<string, { detected: boolean; result: string }>;
  scanDate: Date | string;
}

export interface WindowsServiceStatus {
  installed: boolean;
  running: boolean;
  autoStart: boolean;
  processId?: number;
  lastStart?: Date | string;
  logPath: string;
}

export interface AppSettings {
  detection: {
    enabled: boolean;
    minTypingSpeedThreshold: number;
    shortcutDensityThreshold: number;
    shortcutTimeWindowMs: number;
    minInputIntervalVariance: number;
    mouseEdgeDetection: boolean;
    alertCooldownMs: number;
  };
  virustotal: {
    apiKey: string;
    autoScan: boolean;
  };
  signatures: {
    autoUpdate: boolean;
    updateUrl: string;
    checkIntervalHours: number;
  };
  service: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    logPath: string;
  };
}

export interface QueryFilter {
  severity?: Severity[];
  startDate?: Date;
  endDate?: Date;
  devicePath?: string;
  reviewed?: boolean;
  limit?: number;
  offset?: number;
}

export interface CompiledPayload {
  id?: number;
  originalScript: string;
  targetDevice: DeviceType;
  outputPath?: string;
  fileHash?: string;
  compiledAt: Date | string;
  paramsJson: string;
}

export type SandboxMode = 'windows-sandbox' | 'vmware';

export interface SandboxPlaybackResult {
  success: boolean;
  mode: SandboxMode;
  scriptPath: string;
  configPath?: string;
  outputPath: string;
  message: string;
}

export interface SandboxPlaybackOptions {
  mode: SandboxMode;
  speedMultiplier: number;
  ignoreDelays: boolean;
  defaultDelayMs: number;
  vmwareVmName?: string;
  vmwareVmPath?: string;
  sandboxMemoryMB?: number;
}
