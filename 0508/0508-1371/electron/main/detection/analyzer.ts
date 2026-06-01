import type { HIDInputEvent, DetectionAlert, Severity, HIDDevice } from '@shared/types';
import crypto from 'crypto';

function toDate(timestamp: Date | number | string): Date {
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
}

export interface AnalysisConfig {
  minTypingSpeedThreshold: number;
  shortcutDensityThreshold: number;
  shortcutTimeWindowMs: number;
  minInputIntervalVariance: number;
  mouseEdgeDetection: boolean;
  screenWidth: number;
  screenHeight: number;
  edgeThreshold: number;
}

export interface AnalysisResult {
  alerts: DetectionAlert[];
  metrics: AnalysisMetrics;
}

export interface AnalysisMetrics {
  typingSpeed: number;
  shortcutDensity: number;
  inputIntervalVariance: number;
  averageInterval: number;
  mouseEdgeCrossings: number;
  patternMatches: string[];
}

const DEFAULT_CONFIG: AnalysisConfig = {
  minTypingSpeedThreshold: 800,
  shortcutDensityThreshold: 5,
  shortcutTimeWindowMs: 2000,
  minInputIntervalVariance: 10,
  mouseEdgeDetection: true,
  screenWidth: 1920,
  screenHeight: 1080,
  edgeThreshold: 50,
};

const SUSPICIOUS_SEQUENCES: { pattern: string[]; name: string; severity: Severity }[] = [
  { pattern: ['MetaLeft', 'r'], name: 'Windows Run dialog', severity: 'medium' },
  { pattern: ['ControlLeft', 'ShiftLeft', 'Escape'], name: 'Task Manager', severity: 'medium' },
  { pattern: ['MetaLeft', 'x'], name: 'Power User Menu', severity: 'low' },
  { pattern: ['MetaLeft', 'x', 'a'], name: 'PowerShell (Admin) via WIN+X+A', severity: 'critical' },
  { pattern: ['MetaLeft', 'x', 'i'], name: 'Settings via WIN+X+I', severity: 'medium' },
  { pattern: ['MetaLeft', 'x', 'u', 'u'], name: 'Shutdown via WIN+X+U+U', severity: 'high' },
  { pattern: ['MetaLeft', 'x', 'u', 'r'], name: 'Restart via WIN+X+U+R', severity: 'high' },
  { pattern: ['MetaLeft', 'i'], name: 'Settings', severity: 'low' },
  { pattern: ['ControlLeft', 'AltLeft', 'Delete'], name: 'Secure Attention Sequence', severity: 'high' },
  { pattern: ['MetaLeft', ' '], name: 'Cortana/Search', severity: 'low' },
  { pattern: ['ControlLeft', 'ShiftLeft', 'Enter'], name: 'Run as Admin (Ctrl+Shift+Enter)', severity: 'high' },
  { pattern: ['ShiftLeft', 'F10'], name: 'Context Menu (Shift+F10)', severity: 'medium' },
  { pattern: ['MetaLeft', 'r'], name: 'Run then PowerShell', severity: 'high' },
];

export class BehaviorAnalyzer {
  private config: AnalysisConfig;
  private eventBuffer: HIDInputEvent[] = [];
  private readonly maxBufferSize = 1000;
  private lastAlertTime: Map<string, number> = new Map();
  private alertCooldownMs = 5000;

  constructor(customConfig?: Partial<AnalysisConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
  }

  updateConfig(customConfig: Partial<AnalysisConfig>): void {
    this.config = { ...this.config, ...customConfig };
  }

  processEvent(event: HIDInputEvent): AnalysisResult {
    this.addEvent(event);
    const metrics = this.calculateMetrics();
    const alerts = this.detectAnomalies(event, metrics);

    return { alerts, metrics };
  }

  processEvents(events: HIDInputEvent[]): AnalysisResult {
    for (const event of events) {
      this.addEvent(event);
    }
    const metrics = this.calculateMetrics();
    const alerts: DetectionAlert[] = [];

    for (const event of events) {
      const result = this.detectAnomalies(event, metrics);
      alerts.push(...result);
    }

    return { alerts, metrics };
  }

  private addEvent(event: HIDInputEvent): void {
    this.eventBuffer.push(event);
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer.shift();
    }
  }

  private calculateMetrics(): AnalysisMetrics {
    const recentEvents = this.getRecentEvents(5000);
    const keyboardEvents = recentEvents.filter((e) => e.type === 'keyboard' && e.keyCode);

    return {
      typingSpeed: this.calculateTypingSpeed(keyboardEvents),
      shortcutDensity: this.calculateShortcutDensity(keyboardEvents),
      inputIntervalVariance: this.calculateInputIntervalVariance(recentEvents),
      averageInterval: this.calculateAverageInterval(recentEvents),
      mouseEdgeCrossings: this.calculateMouseEdgeCrossings(recentEvents),
      patternMatches: this.matchSequencePatterns(keyboardEvents),
    };
  }

  private getRecentEvents(windowMs: number): HIDInputEvent[] {
    const now = Date.now();
    return this.eventBuffer.filter((e) => {
      const ts = toDate(e.timestamp).getTime();
      return now - ts <= windowMs;
    });
  }

  private calculateTypingSpeed(events: HIDInputEvent[]): number {
    if (events.length < 2) return 0;

    const keyPresses = events.filter((e) => e.keyCode && !e.isModifier);
    if (keyPresses.length < 2) return 0;

    const firstTime = toDate(keyPresses[0].timestamp).getTime();
    const lastTime = toDate(keyPresses[keyPresses.length - 1].timestamp).getTime();

    const durationSec = (lastTime - firstTime) / 1000;
    if (durationSec <= 0) return 0;

    return Math.round(keyPresses.length / durationSec * 60);
  }

  private calculateShortcutDensity(events: HIDInputEvent[]): number {
    if (events.length < 2) return 0;

    const windowMs = this.config.shortcutTimeWindowMs;
    let maxShortcuts = 0;
    let left = 0;
    const shortcutCount: number[] = [];

    for (let right = 0; right < events.length; right++) {
      const rightTime = toDate(events[right].timestamp).getTime();

      while (left <= right) {
        const leftTime = toDate(events[left].timestamp).getTime();
        if (rightTime - leftTime <= windowMs) break;
        left++;
      }

      const windowEvents = events.slice(left, right + 1);
      const shortcuts = windowEvents.filter((e) => e.isModifier && e.modifiers && e.modifiers.length > 0).length;
      shortcutCount.push(shortcuts);
      maxShortcuts = Math.max(maxShortcuts, shortcuts);
    }

    return maxShortcuts;
  }

  private calculateInputIntervalVariance(events: HIDInputEvent[]): number {
    if (events.length < 3) return 0;

    const intervals: number[] = [];
    for (let i = 1; i < events.length; i++) {
      const prevTime = toDate(events[i - 1].timestamp).getTime();
      const currTime = toDate(events[i].timestamp).getTime();
      intervals.push(currTime - prevTime);
    }

    if (intervals.length < 2) return 0;

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const squaredDiffs = intervals.map((interval) => Math.pow(interval - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;

    return Math.round(variance);
  }

  private calculateAverageInterval(events: HIDInputEvent[]): number {
    if (events.length < 2) return 0;

    let totalInterval = 0;
    for (let i = 1; i < events.length; i++) {
      const prevTime = toDate(events[i - 1].timestamp).getTime();
      const currTime = toDate(events[i].timestamp).getTime();
      totalInterval += currTime - prevTime;
    }

    return Math.round(totalInterval / (events.length - 1));
  }

  private calculateMouseEdgeCrossings(events: HIDInputEvent[]): number {
    if (!this.config.mouseEdgeDetection) return 0;

    const mouseEvents = events.filter((e) => e.type === 'mouse');
    if (mouseEvents.length < 2) return 0;

    let crossings = 0;
    let currentX = this.config.screenWidth / 2;
    let currentY = this.config.screenHeight / 2;
    const edgeThreshold = this.config.edgeThreshold;

    for (const event of mouseEvents) {
      if (event.mouseX !== undefined) currentX += event.mouseX;
      if (event.mouseY !== undefined) currentY += event.mouseY;

      currentX = Math.max(0, Math.min(this.config.screenWidth, currentX));
      currentY = Math.max(0, Math.min(this.config.screenHeight, currentY));

      const atEdge =
        currentX <= edgeThreshold ||
        currentX >= this.config.screenWidth - edgeThreshold ||
        currentY <= edgeThreshold ||
        currentY >= this.config.screenHeight - edgeThreshold;

      if (atEdge) crossings++;
    }

    return crossings;
  }

  private matchSequencePatterns(events: HIDInputEvent[]): string[] {
    const matches: string[] = [];
    if (events.length < 2) return matches;

    const eventGroups: string[][] = events
      .filter((e) => e.keyName)
      .map((e) => {
        if (e.modifiers && e.modifiers.length > 0) {
          return [...e.modifiers, e.keyName!];
        }
        return [e.keyName!];
      });

    const flatSequence = eventGroups.flat();

    for (const seq of SUSPICIOUS_SEQUENCES) {
      if (this.isSubsequence(flatSequence, seq.pattern)) {
        matches.push(seq.name);
        continue;
      }

      if (this.matchGroupedSequence(eventGroups, seq.pattern)) {
        matches.push(seq.name);
      }
    }

    return matches;
  }

  private matchGroupedSequence(eventGroups: string[][], pattern: string[]): boolean {
    if (pattern.length === 0) return false;

    let groupIdx = 0;
    let patIdx = 0;

    while (groupIdx < eventGroups.length && patIdx < pattern.length) {
      const group = eventGroups[groupIdx];
      const patRemaining = pattern.slice(patIdx);

      if (group.length >= 2 && patRemaining.length >= 2) {
        const shortcutMatch = group[0] === patRemaining[0] && group[1] === patRemaining[1];
        if (shortcutMatch && group.length === 2) {
          patIdx += group.length;
          groupIdx++;
          continue;
        }
        if (group.length > 2) {
          const allMatch = group.every((k, i) => i < patRemaining.length && k === patRemaining[i]);
          if (allMatch) {
            patIdx += group.length;
            groupIdx++;
            continue;
          }
        }
      }

      if (group.includes(patRemaining[0])) {
        const posInGroup = group.indexOf(patRemaining[0]);
        if (posInGroup > 0) {
          const prefixMatch = group.slice(0, posInGroup).every((k, i) => k === patRemaining[i]);
          if (prefixMatch) {
            patIdx += posInGroup + 1;
            groupIdx++;
            continue;
          }
        }
        patIdx++;
        groupIdx++;
        continue;
      }

      groupIdx++;
    }

    return patIdx >= pattern.length;
  }

  private isSubsequence(sequence: string[], pattern: string[]): boolean {
    if (pattern.length > sequence.length) return false;

    let patternIdx = 0;
    for (let i = 0; i < sequence.length && patternIdx < pattern.length; i++) {
      if (sequence[i] === pattern[patternIdx]) {
        patternIdx++;
      }
    }

    return patternIdx === pattern.length;
  }

  private detectAnomalies(event: HIDInputEvent, metrics: AnalysisMetrics): DetectionAlert[] {
    const alerts: DetectionAlert[] = [];
    const reasons: string[] = [];
    let severity: Severity = 'low';
    let riskScore = 0;
    const matchedSignatures: string[] = [];

    if (metrics.typingSpeed > this.config.minTypingSpeedThreshold) {
      reasons.push(`异常输入速度: ${metrics.typingSpeed} CPM (阈值: ${this.config.minTypingSpeedThreshold})`);
      severity = this.escalateSeverity(severity, 'medium');
      riskScore += 30;
      matchedSignatures.push('statistical:high_typing_speed');
    }

    if (metrics.shortcutDensity >= this.config.shortcutDensityThreshold) {
      reasons.push(`快捷键密度过高: ${metrics.shortcutDensity} (阈值: ${this.config.shortcutDensityThreshold})`);
      severity = this.escalateSeverity(severity, 'medium');
      riskScore += 25;
      matchedSignatures.push('statistical:high_shortcut_density');
    }

    if (metrics.inputIntervalVariance < this.config.minInputIntervalVariance && metrics.averageInterval > 0) {
      reasons.push(`输入间隔方差异常: ${metrics.inputIntervalVariance}ms² (阈值: ${this.config.minInputIntervalVariance}ms²)`);
      severity = this.escalateSeverity(severity, 'high');
      riskScore += 35;
      matchedSignatures.push('statistical:low_interval_variance');
    }

    if (metrics.mouseEdgeCrossings > 10) {
      reasons.push(`鼠标边缘检测异常: ${metrics.mouseEdgeCrossings} 次边缘移动`);
      severity = this.escalateSeverity(severity, 'medium');
      riskScore += 20;
      matchedSignatures.push('mouse:edge_movement');
    }

    for (const patternName of metrics.patternMatches) {
      const pattern = SUSPICIOUS_SEQUENCES.find((p) => p.name === patternName);
      reasons.push(`可疑序列模式匹配: ${patternName}`);
      severity = this.escalateSeverity(severity, pattern?.severity || 'medium');
      riskScore += 15;
      matchedSignatures.push(`sequence:${patternName}`);
    }

    if (reasons.length > 0) {
      const alertKey = `${event.devicePath}:${matchedSignatures.join(',')}`;
      const now = Date.now();
      const lastAlert = this.lastAlertTime.get(alertKey) || 0;

      if (now - lastAlert >= this.alertCooldownMs) {
        this.lastAlertTime.set(alertKey, now);
        const alert = this.createAlert(event, reasons, severity, riskScore, matchedSignatures);
        alerts.push(alert);
      }
    }

    return alerts;
  }

  private escalateSeverity(current: Severity, target: Severity): Severity {
    const levels: Severity[] = ['low', 'medium', 'high', 'critical'];
    const currentIdx = levels.indexOf(current);
    const targetIdx = levels.indexOf(target);
    return levels[Math.max(currentIdx, targetIdx)];
  }

  private createAlert(
    event: HIDInputEvent,
    reasons: string[],
    severity: Severity,
    riskScore: number,
    matchedSignatures: string[]
  ): DetectionAlert {
    const sequenceHash = this.generateSequenceHash(this.eventBuffer.slice(-20));

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      device: event.device || this.createUnknownDevice(event.devicePath),
      severity,
      reason: reasons.join('; '),
      matchedSignatures,
      inputSequence: this.eventBuffer.slice(-20),
      riskScore: Math.min(100, riskScore),
      inputSequenceHash: sequenceHash,
      isReviewed: false,
    };
  }

  private createUnknownDevice(devicePath: string): HIDDevice {
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

  clearBuffer(): void {
    this.eventBuffer = [];
    this.lastAlertTime.clear();
  }

  getBufferSize(): number {
    return this.eventBuffer.length;
  }
}

export default BehaviorAnalyzer;
