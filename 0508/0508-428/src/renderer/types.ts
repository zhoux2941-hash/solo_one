export interface CanFrame {
  timestamp_us: number;
  can_id: number;
  is_extended: boolean;
  is_remote: boolean;
  dlc: number;
  data: number[];
}

export interface ByteStats {
  index: number;
  min: number;
  max: number;
  mean: number;
  variance: number;
  change_count: number;
  unique_values: number;
}

export interface CanIdProfile {
  can_id: number;
  period_ms: number;
  dlc: number;
  occurrence_count: number;
  data_change_rate: number;
  byte_stats: ByteStats[];
  signal_type: SignalType;
  confidence: number;
}

export type SignalType =
  | 'Unknown'
  | 'VehicleSpeed'
  | 'EngineRPM'
  | 'ThrottlePosition'
  | 'SteeringAngle'
  | 'BrakeStatus'
  | 'DoorStatus'
  | 'GearPosition'
  | 'ContinuousValue'
  | 'DiscreteValue'
  | 'BooleanValue';

export interface AttackEvent {
  attack_type: 'Injection' | 'Replay' | 'Spoofing';
  timestamp_us: number;
  can_id: number;
  confidence: number;
  details: string;
  raw_data: number[];
  dlc: number;
}

export interface SignalIdentification {
  can_id: number;
  signal_type: SignalType;
  confidence: number;
  cluster_id: number;
  correlated_can_ids: [number, number][];
  period_ms: number;
  data_change_rate: number;
}

export interface AttackRecord {
  id: number;
  attack_type: string;
  timestamp_us: number;
  can_id: number;
  confidence: number;
  details: string;
  raw_data: string;
  created_at: string;
}

export interface LabelRecord {
  id: number;
  can_id: number;
  start_time_us: number;
  end_time_us: number;
  is_normal: boolean;
  label_text: string;
  created_at: string;
}

export interface CorrelationPair {
  id1: number;
  id2: number;
  correlation: number;
}

export const SIGNAL_TYPE_LABELS: Record<SignalType, string> = {
  Unknown: '❓ Unknown',
  VehicleSpeed: '🏎️ Vehicle Speed',
  EngineRPM: '🔄 Engine RPM',
  ThrottlePosition: '⚡ Throttle',
  SteeringAngle: '🎯 Steering',
  BrakeStatus: '🛑 Brake',
  DoorStatus: '🚪 Door',
  GearPosition: '⚙️ Gear',
  ContinuousValue: '📈 Continuous',
  DiscreteValue: '📊 Discrete',
  BooleanValue: '🔘 Boolean',
};

export const SIGNAL_TYPE_CLASS: Record<SignalType, string> = {
  Unknown: '',
  VehicleSpeed: 'speed',
  EngineRPM: 'rpm',
  ThrottlePosition: 'throttle',
  SteeringAngle: 'steering',
  BrakeStatus: 'brake',
  DoorStatus: 'door',
  GearPosition: 'gear',
  ContinuousValue: 'speed',
  DiscreteValue: 'door',
  BooleanValue: 'door',
};

export function isDigitalSignal(type: SignalType): boolean {
  return type === 'BooleanValue' || type === 'DoorStatus' || type === 'BrakeStatus';
}

export function formatCanId(id: number): string {
  return `0x${id.toString(16).toUpperCase().padStart(3, '0')}`;
}

export function formatTimestamp(us: number): string {
  const s = us / 1_000_000;
  const mins = Math.floor(s / 60);
  const secs = (s % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
}

export function frameToSignalValue(frame: CanFrame): number {
  if (frame.dlc === 0) return 0;
  const raw16 = ((frame.data[1] || 0) << 8) | frame.data[0];
  return raw16;
}
