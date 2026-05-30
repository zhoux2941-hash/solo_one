export type ContainerShape = 'cylinder' | 'cone' | 'cube';

export interface SimulationParams {
  containerShape: ContainerShape;
  apertureDiameter: number;
  initialWaterHeight: number;
  containerSize: number;
  useMultiLevel: boolean;
  compensationPotCount: number;
  overflowHeight: number;
}

export interface CompensationPotState {
  id: number;
  name: string;
  waterHeight: number;
  maxHeight: number;
  overflowHeight: number;
  isOverflowing: boolean;
  inflowRate: number;
  outflowRate: number;
}

export interface MultiLevelState {
  isActive: boolean;
  pots: CompensationPotState[];
  constantPressureHead: number;
  averageFlowRate: number;
  flowRateVariation: number;
}

export interface CalibrationPoint {
  id: number;
  observedTime: number;
  observedWaterHeight: number;
}

export interface DataPoint {
  time: number;
  waterHeight: number;
  flowRate: number;
  velocity: number;
  compensationPotHeights?: number[];
  constantPressureHead?: number;
}

export interface FittingResult {
  coefficients: number[];
  correctedTimeScale: DataPoint[];
  rSquared: number;
  correctionFormula: string;
}

export interface SimulationState {
  params: SimulationParams;
  isRunning: boolean;
  isPaused: boolean;
  currentTime: number;
  currentWaterHeight: number;
  theoreticalData: DataPoint[];
  calibrationPoints: CalibrationPoint[];
  fittingResult: FittingResult | null;
  totalDrainTime: number;
  multiLevelState: MultiLevelState | null;
}

export interface SimulationActions {
  setParams: (params: Partial<SimulationParams>) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  addCalibrationPoint: (point: Omit<CalibrationPoint, 'id'>) => void;
  removeCalibrationPoint: (id: number) => void;
  performFitting: () => void;
  updateSimulationStep: (deltaTime: number) => void;
  calculateTheoreticalCurve: () => void;
  toggleMultiLevel: (enabled: boolean) => void;
}
