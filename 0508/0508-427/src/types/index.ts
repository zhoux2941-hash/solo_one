export interface CircuitParams {
  resistance: number;
  capacitance: number;
  voltage: number;
}

export interface KeyPointData {
  time: number;
  chargeV: number;
  dischargeV: number;
}

export interface KeyPoints {
  tau1: KeyPointData;
  tau2: KeyPointData;
  tau3: KeyPointData;
  tau5: KeyPointData;
}

export interface CalculationResult {
  tau: number;
  chargeVoltages: number[];
  dischargeVoltages: number[];
  timePoints: number[];
  keyPoints: KeyPoints;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  params: CircuitParams;
}
