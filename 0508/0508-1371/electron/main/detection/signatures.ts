import fs from 'fs-extra';
import yaml from 'js-yaml';
import path from 'path';
import crypto from 'crypto';
import type {
  AttackSignature,
  SignaturePattern,
  SignatureEvent,
  HIDInputEvent,
  DetectionAlert,
  Severity,
  HIDDevice,
} from '@shared/types';

function toDate(timestamp: Date | number | string): Date {
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
}

interface YamlSignature {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  pattern: YamlPattern;
}

interface YamlPattern {
  type: 'sequence' | 'statistical' | 'mouse' | 'regex';
  events?: YamlEvent[];
  metric?: string;
  threshold?: number;
  window?: number;
  comparison?: 'above' | 'below' | 'equal';
  movement?: string;
  duration?: number;
  min_speed?: number;
  edge_threshold?: number;
  regex?: string;
}

interface YamlEvent {
  type: 'shortcut' | 'string' | 'key' | 'regex';
  keys?: string[];
  value?: string;
  contains?: string;
  regex?: string;
  window?: number;
}

interface MatchResult {
  matched: boolean;
  signatureId: string;
  signatureName: string;
  severity: Severity;
  reason: string;
  matchedEvents?: HIDInputEvent[];
}

interface SignatureMatcher {
  match(events: HIDInputEvent[], pattern: SignaturePattern): MatchResult | null;
  matchEvent?: (event: HIDInputEvent, sigEvent: SignatureEvent) => boolean;
}

export class SignatureEngine {
  private signatures: AttackSignature[] = [];
  private matchers: Map<string, SignatureMatcher>;
  private lastMatchTime: Map<string, number> = new Map();
  private readonly cooldownMs = 3000;

  constructor() {
    this.matchers = new Map<string, SignatureMatcher>([
      ['sequence', new SequenceMatcher()],
      ['statistical', new StatisticalMatcher()],
      ['mouse', new MouseMatcher()],
      ['regex', new RegexMatcher()],
    ]);
  }

  async loadFromFile(filePath: string): Promise<number> {
    const content = await fs.readFile(filePath, 'utf-8');
    return this.loadFromString(content, filePath);
  }

  async loadFromDirectory(dirPath: string): Promise<number> {
    const files = await fs.readdir(dirPath);
    const yamlFiles = files.filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
    let totalLoaded = 0;

    for (const file of yamlFiles) {
      const fullPath = path.join(dirPath, file);
      try {
        const count = await this.loadFromFile(fullPath);
        totalLoaded += count;
      } catch {
        // ignore
      }
    }

    return totalLoaded;
  }

  loadFromString(content: string, sourcePath: string = 'inline'): number {
    const parsed = yaml.load(content);
    const yamlSignatures = this.normalizeYamlInput(parsed);
    const loadedSignatures: AttackSignature[] = [];

    for (const yamlSig of yamlSignatures) {
      const signature = this.convertYamlToSignature(yamlSig, sourcePath);
      if (signature) {
        loadedSignatures.push(signature);
      }
    }

    this.signatures = [...this.signatures, ...loadedSignatures];
    return loadedSignatures.length;
  }

  private normalizeYamlInput(parsed: unknown): YamlSignature[] {
    if (!parsed) return [];
    if (Array.isArray(parsed)) return parsed as YamlSignature[];
    if (typeof parsed === 'object' && 'signatures' in parsed) {
      return (parsed as { signatures: YamlSignature[] }).signatures;
    }
    return [parsed as YamlSignature];
  }

  private convertYamlToSignature(yamlSig: YamlSignature, sourcePath: string): AttackSignature | null {
    if (!yamlSig.id || !yamlSig.name || !yamlSig.pattern) {
      return null;
    }

    const pattern = this.convertYamlPattern(yamlSig.pattern);
    if (!pattern) return null;

    return {
      id: crypto.randomUUID(),
      signatureId: yamlSig.id,
      name: yamlSig.name,
      description: yamlSig.description || '',
      severity: yamlSig.severity || 'medium',
      pattern,
      patternYaml: yaml.dump(yamlSig.pattern),
      createdAt: new Date(),
      updatedAt: new Date(),
      source: sourcePath === 'inline' ? 'local' : 'local',
    };
  }

  private convertYamlPattern(yamlPattern: YamlPattern): SignaturePattern | null {
    const type = yamlPattern.type;
    if (!type) return null;

    const pattern: SignaturePattern = { type };

    switch (type) {
      case 'sequence':
        pattern.events = yamlPattern.events?.map((e) => ({
          type: e.type,
          keys: e.keys,
          value: e.value,
          contains: e.contains,
          regex: e.regex,
          window: e.window || 1000,
        }));
        break;
      case 'statistical':
        pattern.metric = yamlPattern.metric;
        pattern.threshold = yamlPattern.threshold;
        pattern.window = yamlPattern.window;
        break;
      case 'mouse':
        pattern.movement = yamlPattern.movement;
        pattern.duration = yamlPattern.duration;
        pattern.threshold = yamlPattern.min_speed || yamlPattern.threshold;
        break;
      case 'regex':
        pattern.threshold = yamlPattern.threshold;
        pattern.window = yamlPattern.window;
        break;
    }

    return pattern;
  }

  match(events: HIDInputEvent[]): DetectionAlert[] {
    const alerts: DetectionAlert[] = [];
    const now = Date.now();

    for (const signature of this.signatures) {
      const lastMatch = this.lastMatchTime.get(signature.signatureId) || 0;
      if (now - lastMatch < this.cooldownMs) continue;

      const matcher = this.matchers.get(signature.pattern.type);
      if (!matcher) continue;

      const result = matcher.match(events, signature.pattern);
      if (result && result.matched) {
        this.lastMatchTime.set(signature.signatureId, now);
        const alert = this.createAlert(signature, result, events);
        alerts.push(alert);
      }
    }

    return alerts;
  }

  private createAlert(
    signature: AttackSignature,
    result: MatchResult,
    allEvents: HIDInputEvent[]
  ): DetectionAlert {
    const matchedEvents = result.matchedEvents || allEvents.slice(-20);
    const device = this.extractDevice(matchedEvents);
    const sequenceHash = this.generateSequenceHash(matchedEvents);

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      device,
      severity: signature.severity,
      reason: `签名匹配: ${signature.name} - ${result.reason}`,
      matchedSignatures: [signature.signatureId, signature.name],
      inputSequence: matchedEvents,
      riskScore: this.calculateRiskScore(signature.severity),
      inputSequenceHash: sequenceHash,
      isReviewed: false,
    };
  }

  private extractDevice(events: HIDInputEvent[]): HIDDevice {
    const deviceEvent = events.find((e) => e.device);
    if (deviceEvent?.device) return deviceEvent.device;

    const devicePath = events[0]?.devicePath || '';
    return {
      vendorId: 0,
      productId: 0,
      manufacturer: 'Unknown',
      productName: 'Unknown HID Device',
      serialNumber: '',
      devicePath,
      firstSeen: new Date(),
    };
  }

  private generateSequenceHash(events: HIDInputEvent[]): string {
    const keyData = events
      .filter((e) => e.keyCode)
      .map((e) => `${e.keyCode}:${e.modifiers?.join('+') || ''}`)
      .join('|');
    return crypto.createHash('sha256').update(keyData).digest('hex');
  }

  private calculateRiskScore(severity: Severity): number {
    const scores: Record<Severity, number> = {
      low: 25,
      medium: 50,
      high: 75,
      critical: 100,
    };
    return scores[severity] || 50;
  }

  addSignature(signature: AttackSignature): void {
    const existingIdx = this.signatures.findIndex((s) => s.signatureId === signature.signatureId);
    if (existingIdx >= 0) {
      this.signatures[existingIdx] = signature;
    } else {
      this.signatures.push(signature);
    }
  }

  removeSignature(signatureId: string): boolean {
    const initialLength = this.signatures.length;
    this.signatures = this.signatures.filter((s) => s.signatureId !== signatureId);
    return this.signatures.length < initialLength;
  }

  getSignatures(): AttackSignature[] {
    return [...this.signatures];
  }

  getSignatureById(signatureId: string): AttackSignature | undefined {
    return this.signatures.find((s) => s.signatureId === signatureId);
  }

  clearSignatures(): void {
    this.signatures = [];
    this.lastMatchTime.clear();
  }

  getSignatureCount(): number {
    return this.signatures.length;
  }

  async saveSignaturesToFile(filePath: string): Promise<void> {
    const yamlData = {
      signatures: this.signatures.map((s) => ({
        id: s.signatureId,
        name: s.name,
        description: s.description,
        severity: s.severity,
        pattern: yaml.load(s.patternYaml) as YamlPattern,
      })),
    };
    await fs.writeFile(filePath, yaml.dump(yamlData, { indent: 2 }));
  }
}

class SequenceMatcher implements SignatureMatcher {
  match(events: HIDInputEvent[], pattern: SignaturePattern): MatchResult | null {
    if (!pattern.events || pattern.events.length === 0) return null;

    const signatureEvents = pattern.events;
    const matchedEvents: HIDInputEvent[] = [];

    let eventIdx = 0;
    let sigIdx = 0;
    let windowStart = -1;

    while (eventIdx < events.length && sigIdx < signatureEvents.length) {
      const event = events[eventIdx];
      const sigEvent = signatureEvents[sigIdx];

      const eventTime = toDate(event.timestamp).getTime();

      if (windowStart === -1) {
        windowStart = eventTime;
      }

      const currentWindow = sigEvent.window || signatureEvents[0].window || 5000;
      const totalElapsed = eventTime - windowStart;
      const cumulativeWindow = signatureEvents
        .slice(0, sigIdx + 1)
        .reduce((sum, se) => sum + (se.window || 1000), 0);

      if (totalElapsed > cumulativeWindow && totalElapsed > currentWindow) {
        eventIdx = eventIdx - sigIdx + 1;
        sigIdx = 0;
        windowStart = -1;
        matchedEvents.length = 0;
        continue;
      }

      if (this.matchEvent(event, sigEvent)) {
        matchedEvents.push(event);
        sigIdx++;
        if (sigIdx === signatureEvents.length) {
          return {
            matched: true,
            signatureId: '',
            signatureName: '',
            severity: 'medium',
            reason: `序列匹配: ${signatureEvents.map((e) => e.value || e.keys?.join('+') || e.type).join(' -> ')}`,
            matchedEvents,
          };
        }
      }

      eventIdx++;
    }

    return null;
  }

  matchEvent(event: HIDInputEvent, sigEvent: SignatureEvent): boolean {
    switch (sigEvent.type) {
      case 'key': {
        if (!sigEvent.value) return false;
        const eventKey = (event.keyName || '').toLowerCase();
        const sigKey = sigEvent.value.toLowerCase();
        if (eventKey === sigKey) return true;
        const keyAliases: Record<string, string[]> = {
          'a': ['a', 'KeyA'], 'b': ['b', 'KeyB'], 'c': ['c', 'KeyC'],
          'd': ['d', 'KeyD'], 'e': ['e', 'KeyE'], 'f': ['f', 'KeyF'],
          'g': ['g', 'KeyG'], 'h': ['h', 'KeyH'], 'i': ['i', 'KeyI'],
          'j': ['j', 'KeyJ'], 'k': ['k', 'KeyK'], 'l': ['l', 'KeyL'],
          'm': ['m', 'KeyM'], 'n': ['n', 'KeyN'], 'o': ['o', 'KeyO'],
          'p': ['p', 'KeyP'], 'q': ['q', 'KeyQ'], 'r': ['r', 'KeyR'],
          's': ['s', 'KeyS'], 't': ['t', 'KeyT'], 'u': ['u', 'KeyU'],
          'v': ['v', 'KeyV'], 'w': ['w', 'KeyW'], 'x': ['x', 'KeyX'],
          'y': ['y', 'KeyY'], 'z': ['z', 'KeyZ'],
          'enter': ['enter', 'Enter'],
          'escape': ['escape', 'Escape', 'esc'],
          'arrowleft': ['arrowleft', 'ArrowLeft', 'left'],
          'arrowright': ['arrowright', 'ArrowRight', 'right'],
          'arrowup': ['arrowup', 'ArrowUp', 'up'],
          'arrowdown': ['arrowdown', 'ArrowDown', 'down'],
        };
        const aliases = keyAliases[sigKey];
        if (aliases && aliases.some(a => a.toLowerCase() === eventKey)) return true;
        return false;
      }

      case 'shortcut': {
        if (!sigEvent.keys || sigEvent.keys.length === 0) return false;
        const modifierKeys = ['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight',
                              'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight',
                              'ctrl', 'control', 'shift', 'alt', 'gui', 'windows', 'command'];
        const expectedMods = sigEvent.keys.filter((k) => modifierKeys.includes(k));
        const expectedNonMods = sigEvent.keys.filter((k) => !modifierKeys.includes(k));

        if (event.modifiers && event.modifiers.length > 0) {
          const hasAllMods = expectedMods.every((m) =>
            event.modifiers!.some((em) => em === m || this.isSameModifierFamily(em, m))
          );
          if (!hasAllMods) return false;

          if (expectedNonMods.length > 0) {
            return expectedNonMods.some((k) =>
              (event.keyName || '').toLowerCase() === k.toLowerCase()
            );
          }

          return true;
        }

        if (event.isModifier && expectedMods.length > 0) {
          return expectedMods.some((m) =>
            (event.keyName || '') === m || this.isSameModifierFamily(event.keyName || '', m)
          );
        }

        return false;
      }

      case 'string':
        if (!sigEvent.contains || !event.keyName) return false;
        return event.keyName.toLowerCase().includes(sigEvent.contains.toLowerCase());

      case 'regex':
        if (!sigEvent.regex || !event.keyName) return false;
        try {
          const regex = new RegExp(sigEvent.regex, 'i');
          return regex.test(event.keyName);
        } catch {
          return false;
        }

      default:
        return false;
    }
  }

  private isSameModifierFamily(a: string, b: string): boolean {
    const families: string[][] = [
      ['ControlLeft', 'ControlRight', 'ctrl', 'control'],
      ['ShiftLeft', 'ShiftRight', 'shift'],
      ['AltLeft', 'AltRight', 'alt'],
      ['MetaLeft', 'MetaRight', 'gui', 'windows', 'command'],
    ];
    return families.some(
      (f) => f.includes(a) && f.includes(b)
    );
  }
}

class StatisticalMatcher implements SignatureMatcher {
  match(events: HIDInputEvent[], pattern: SignaturePattern): MatchResult | null {
    if (!pattern.metric || pattern.threshold === undefined) return null;

    const windowMs = pattern.window || 5000;
    const recentEvents = this.getRecentEvents(events, windowMs);

    let value = 0;
    let metricName = pattern.metric;

    switch (pattern.metric) {
      case 'typing_speed':
        value = this.calculateTypingSpeed(recentEvents);
        metricName = '输入速度';
        break;
      case 'shortcut_density':
        value = this.calculateShortcutDensity(recentEvents);
        metricName = '快捷键密度';
        break;
      case 'interval_variance':
        value = this.calculateIntervalVariance(recentEvents);
        metricName = '输入间隔方差';
        break;
      case 'average_interval':
        value = this.calculateAverageInterval(recentEvents);
        metricName = '平均输入间隔';
        break;
      case 'event_count':
        value = recentEvents.length;
        metricName = '事件数量';
        break;
      default:
        return null;
    }

    if (value >= pattern.threshold) {
      return {
        matched: true,
        signatureId: '',
        signatureName: '',
        severity: 'medium',
        reason: `统计指标异常: ${metricName} = ${value.toFixed(2)} (阈值: ${pattern.threshold})`,
        matchedEvents: recentEvents,
      };
    }

    return null;
  }

  private getRecentEvents(events: HIDInputEvent[], windowMs: number): HIDInputEvent[] {
    if (events.length === 0) return [];
    const now = Date.now();
    return events.filter((e) => {
      const ts = toDate(e.timestamp).getTime();
      return now - ts <= windowMs;
    });
  }

  private calculateTypingSpeed(events: HIDInputEvent[]): number {
    const keyEvents = events.filter((e) => e.type === 'keyboard' && e.keyCode);
    if (keyEvents.length < 2) return 0;

    const firstTime = toDate(keyEvents[0].timestamp).getTime();
    const lastTime = toDate(keyEvents[keyEvents.length - 1].timestamp).getTime();

    const durationMin = (lastTime - firstTime) / 60000;
    if (durationMin <= 0) return 0;

    return keyEvents.length / durationMin;
  }

  private calculateShortcutDensity(events: HIDInputEvent[]): number {
    return events.filter((e) => e.isModifier && e.modifiers && e.modifiers.length > 0).length;
  }

  private calculateIntervalVariance(events: HIDInputEvent[]): number {
    if (events.length < 3) return 0;

    const intervals: number[] = [];
    for (let i = 1; i < events.length; i++) {
      const prevTime = toDate(events[i - 1].timestamp).getTime();
      const currTime = toDate(events[i].timestamp).getTime();
      intervals.push(currTime - prevTime);
    }

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const squaredDiffs = intervals.map((i) => Math.pow(i - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
  }

  private calculateAverageInterval(events: HIDInputEvent[]): number {
    if (events.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < events.length; i++) {
      const prevTime = toDate(events[i - 1].timestamp).getTime();
      const currTime = toDate(events[i].timestamp).getTime();
      total += currTime - prevTime;
    }
    return total / (events.length - 1);
  }
}

class MouseMatcher implements SignatureMatcher {
  match(events: HIDInputEvent[], pattern: SignaturePattern): MatchResult | null {
    const mouseEvents = events.filter((e) => e.type === 'mouse');
    if (mouseEvents.length < 5) return null;

    const duration = pattern.duration || 2000;
    const threshold = pattern.threshold || 5;
    const recent = this.getRecentEvents(mouseEvents, duration);

    switch (pattern.movement) {
      case 'edge_movement':
        return this.detectEdgeMovement(recent, threshold);
      case 'instant_jump':
        return this.detectInstantJump(recent, threshold);
      case 'circular':
        return this.detectCircularMovement(recent, threshold);
      case 'straight_line':
        return this.detectStraightLine(recent, threshold);
      default:
        return this.detectSuspiciousMovement(recent, threshold);
    }
  }

  private getRecentEvents(events: HIDInputEvent[], windowMs: number): HIDInputEvent[] {
    if (events.length === 0) return [];
    const now = Date.now();
    return events.filter((e) => {
      const ts = toDate(e.timestamp).getTime();
      return now - ts <= windowMs;
    });
  }

  private detectEdgeMovement(events: HIDInputEvent[], threshold: number): MatchResult | null {
    const edgeThreshold = 50;
    const screenWidth = 1920;
    const screenHeight = 1080;
    let x = screenWidth / 2;
    let y = screenHeight / 2;
    let edgeCount = 0;

    for (const event of events) {
      if (event.mouseX !== undefined) x += event.mouseX;
      if (event.mouseY !== undefined) y += event.mouseY;
      x = Math.max(0, Math.min(screenWidth, x));
      y = Math.max(0, Math.min(screenHeight, y));

      if (x <= edgeThreshold || x >= screenWidth - edgeThreshold ||
          y <= edgeThreshold || y >= screenHeight - edgeThreshold) {
        edgeCount++;
      }
    }

    if (edgeCount >= threshold) {
      return {
        matched: true,
        signatureId: '',
        signatureName: '',
        severity: 'medium',
        reason: `鼠标边缘移动检测: ${edgeCount} 次边缘接触 (阈值: ${threshold})`,
        matchedEvents: events,
      };
    }
    return null;
  }

  private detectInstantJump(events: HIDInputEvent[], threshold: number): MatchResult | null {
    for (const event of events) {
      const distance = Math.sqrt(
        Math.pow(event.mouseX || 0, 2) + Math.pow(event.mouseY || 0, 2)
      );
      if (distance >= threshold * 10) {
        return {
          matched: true,
          signatureId: '',
          signatureName: '',
          severity: 'high',
          reason: `鼠标瞬时跳跃检测: 距离 = ${distance.toFixed(2)}px`,
          matchedEvents: [event],
        };
      }
    }
    return null;
  }

  private detectCircularMovement(events: HIDInputEvent[], threshold: number): MatchResult | null {
    if (events.length < 8) return null;

    let totalAngle = 0;
    for (let i = 2; i < events.length; i++) {
      const v1x = events[i - 1].mouseX || 0;
      const v1y = events[i - 1].mouseY || 0;
      const v2x = events[i].mouseX || 0;
      const v2y = events[i].mouseY || 0;

      const dot = v1x * v2x + v1y * v2y;
      const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
      const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

      if (mag1 > 0 && mag2 > 0) {
        const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
        totalAngle += Math.acos(cosAngle);
      }
    }

    if (totalAngle >= threshold * Math.PI) {
      return {
        matched: true,
        signatureId: '',
        signatureName: '',
        severity: 'medium',
        reason: `鼠标圆周运动检测: 总角度 = ${(totalAngle / Math.PI).toFixed(2)}π`,
        matchedEvents: events,
      };
    }
    return null;
  }

  private detectStraightLine(events: HIDInputEvent[], threshold: number): MatchResult | null {
    if (events.length < threshold) return null;

    let directionCount = 0;
    let lastX = 0;
    let lastY = 0;

    for (let i = 1; i < events.length; i++) {
      const x = events[i].mouseX || 0;
      const y = events[i].mouseY || 0;

      if (i > 1) {
        const sameDirX = (x > 0 && lastX > 0) || (x < 0 && lastX < 0) || (x === 0 && lastX === 0);
        const sameDirY = (y > 0 && lastY > 0) || (y < 0 && lastY < 0) || (y === 0 && lastY === 0);
        if (sameDirX && sameDirY) {
          directionCount++;
        }
      }

      lastX = x;
      lastY = y;
    }

    if (directionCount >= threshold) {
      return {
        matched: true,
        signatureId: '',
        signatureName: '',
        severity: 'low',
        reason: `鼠标直线运动检测: 连续同方向移动 ${directionCount} 次`,
        matchedEvents: events,
      };
    }
    return null;
  }

  private detectSuspiciousMovement(events: HIDInputEvent[], threshold: number): MatchResult | null {
    const avgDistance = events.reduce((sum, e) => {
      return sum + Math.sqrt(Math.pow(e.mouseX || 0, 2) + Math.pow(e.mouseY || 0, 2));
    }, 0) / events.length;

    if (avgDistance > threshold * 3) {
      return {
        matched: true,
        signatureId: '',
        signatureName: '',
        severity: 'medium',
        reason: `可疑鼠标移动检测: 平均移动距离 = ${avgDistance.toFixed(2)}px`,
        matchedEvents: events,
      };
    }
    return null;
  }
}

class RegexMatcher implements SignatureMatcher {
  match(events: HIDInputEvent[], pattern: SignaturePattern): MatchResult | null {
    if (!pattern.threshold) return null;

    const windowMs = pattern.window || 10000;
    const recentEvents = this.getRecentEvents(events, windowMs);

    const typedString = recentEvents
      .filter((e) => e.type === 'keyboard' && e.keyName && e.keyName.length === 1)
      .map((e) => e.keyName)
      .join('');

    if (typedString.length < 3) return null;

    const suspiciousPatterns = [
      { regex: /powershell|cmd\.exe|bash/i, name: 'PowerShell/命令行' },
      { regex: /net\s+user|net\s+localgroup/i, name: '用户账户操作' },
      { regex: /whoami|ipconfig|ifconfig/i, name: '系统信息收集' },
      { regex: /reg\s+add|reg\s+delete/i, name: '注册表操作' },
      { regex: /schtasks|at\s+\/interactive/i, name: '计划任务创建' },
      { regex: /invoke\-|iex\s*\(|start\-process/i, name: 'PowerShell执行' },
      { regex: /curl|wget|http:\/\/|https:\/\//i, name: '网络请求' },
      { regex: /cscript|wscript|mshta/i, name: '脚本执行' },
    ];

    for (const sp of suspiciousPatterns) {
      if (sp.regex.test(typedString)) {
        return {
          matched: true,
          signatureId: '',
          signatureName: '',
          severity: 'high',
          reason: `正则匹配: 检测到 "${sp.name}" 模式`,
          matchedEvents: recentEvents,
        };
      }
    }

    return null;
  }

  private getRecentEvents(events: HIDInputEvent[], windowMs: number): HIDInputEvent[] {
    if (events.length === 0) return [];
    const now = Date.now();
    return events.filter((e) => {
      const ts = toDate(e.timestamp).getTime();
      return now - ts <= windowMs;
    });
  }
}

export default SignatureEngine;
