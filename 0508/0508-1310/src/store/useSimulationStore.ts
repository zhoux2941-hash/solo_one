import { create } from 'zustand';
import { SimulationActions, SimulationState, SimulationParams, CalibrationPoint, DataPoint, MultiLevelState } from '../types';
import { DEFAULT_PARAMS, SIMULATION_SPEED, TIME_STEP } from '../utils/constants';
import {
  generateTheoreticalCurve,
  generateTheoreticalCurveWithMultiLevel,
  rk4Step,
  rk4StepWithMultiLevel,
  calculateApertureArea,
  calculateInstantaneousFlowRate,
  calculateInstantaneousVelocity,
  calculateMultiLevelMainFlowRate,
} from '../utils/physics';
import { performCurveFitting } from '../utils/fitting';

type StoreState = SimulationState & SimulationActions;

export const useSimulationStore = create<StoreState>((set, get) => ({
  params: { ...DEFAULT_PARAMS },
  isRunning: false,
  isPaused: false,
  currentTime: 0,
  currentWaterHeight: DEFAULT_PARAMS.initialWaterHeight,
  theoreticalData: [],
  calibrationPoints: [],
  fittingResult: null,
  totalDrainTime: 0,
  multiLevelState: null,

  setParams: (newParams: Partial<SimulationParams>) => {
    set((state) => {
      const updatedParams = { ...state.params, ...newParams };
      const needsRecalc =
        newParams.containerShape !== undefined ||
        newParams.apertureDiameter !== undefined ||
        newParams.initialWaterHeight !== undefined ||
        newParams.containerSize !== undefined ||
        newParams.useMultiLevel !== undefined ||
        newParams.compensationPotCount !== undefined ||
        newParams.overflowHeight !== undefined;

      let newTheoreticalData: DataPoint[] = state.theoreticalData;
      let newTotalDrainTime = state.totalDrainTime;
      let newMultiLevelState: MultiLevelState | null = state.multiLevelState;

      if (needsRecalc && !state.isRunning) {
        if (updatedParams.useMultiLevel) {
          const result = generateTheoreticalCurveWithMultiLevel(updatedParams);
          newTheoreticalData = result.data;
          newTotalDrainTime = result.totalDrainTime;
          newMultiLevelState = result.finalMultiLevelState;
        } else {
          const result = generateTheoreticalCurve(updatedParams);
          newTheoreticalData = result.data;
          newTotalDrainTime = result.totalDrainTime;
          newMultiLevelState = null;
        }
      }

      return {
        params: updatedParams,
        currentWaterHeight:
          newParams.initialWaterHeight !== undefined
            ? newParams.initialWaterHeight
            : state.currentWaterHeight,
        theoreticalData: newTheoreticalData,
        totalDrainTime: newTotalDrainTime,
        multiLevelState: newMultiLevelState,
        fittingResult: null,
      };
    });
  },

  toggleMultiLevel: (enabled: boolean) => {
    set((state) => {
      const updatedParams = { ...state.params, useMultiLevel: enabled };
      let newTheoreticalData: DataPoint[] = state.theoreticalData;
      let newTotalDrainTime = state.totalDrainTime;
      let newMultiLevelState: MultiLevelState | null = state.multiLevelState;

      if (!state.isRunning) {
        if (enabled) {
          const result = generateTheoreticalCurveWithMultiLevel(updatedParams);
          newTheoreticalData = result.data;
          newTotalDrainTime = result.totalDrainTime;
          newMultiLevelState = result.finalMultiLevelState;
        } else {
          const result = generateTheoreticalCurve(updatedParams);
          newTheoreticalData = result.data;
          newTotalDrainTime = result.totalDrainTime;
          newMultiLevelState = null;
        }
      }

      return {
        params: updatedParams,
        theoreticalData: newTheoreticalData,
        totalDrainTime: newTotalDrainTime,
        multiLevelState: newMultiLevelState,
        fittingResult: null,
      };
    });
  },

  startSimulation: () => {
    const state = get();
    if (state.theoreticalData.length === 0) {
      if (state.params.useMultiLevel) {
        const result = generateTheoreticalCurveWithMultiLevel(state.params);
        set({
          theoreticalData: result.data,
          totalDrainTime: result.totalDrainTime,
          multiLevelState: result.finalMultiLevelState,
        });
      } else {
        const result = generateTheoreticalCurve(state.params);
        set({
          theoreticalData: result.data,
          totalDrainTime: result.totalDrainTime,
        });
      }
    }
    set({
      isRunning: true,
      isPaused: false,
    });
  },

  pauseSimulation: () => {
    set({ isPaused: true });
  },

  resetSimulation: () => {
    const state = get();
    if (state.params.useMultiLevel) {
      const result = generateTheoreticalCurveWithMultiLevel(state.params);
      set({
        isRunning: false,
        isPaused: false,
        currentTime: 0,
        currentWaterHeight: state.params.initialWaterHeight,
        theoreticalData: result.data,
        totalDrainTime: result.totalDrainTime,
        multiLevelState: result.finalMultiLevelState,
        fittingResult: null,
      });
    } else {
      const result = generateTheoreticalCurve(state.params);
      set({
        isRunning: false,
        isPaused: false,
        currentTime: 0,
        currentWaterHeight: state.params.initialWaterHeight,
        theoreticalData: result.data,
        totalDrainTime: result.totalDrainTime,
        multiLevelState: null,
        fittingResult: null,
      });
    }
  },

  addCalibrationPoint: (point: Omit<CalibrationPoint, 'id'>) => {
    set((state) => {
      const existingIds = state.calibrationPoints.map((p) => p.id);
      const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      const newPoints = [...state.calibrationPoints, { ...point, id: newId }];

      let newFittingResult = state.fittingResult;
      if (newPoints.length >= 2) {
        newFittingResult = performCurveFitting(newPoints, state.theoreticalData);
      }

      return {
        calibrationPoints: newPoints,
        fittingResult: newFittingResult,
      };
    });
  },

  removeCalibrationPoint: (id: number) => {
    set((state) => {
      const newPoints = state.calibrationPoints.filter((p) => p.id !== id);

      let newFittingResult = state.fittingResult;
      if (newPoints.length >= 2) {
        newFittingResult = performCurveFitting(newPoints, state.theoreticalData);
      } else {
        newFittingResult = null;
      }

      return {
        calibrationPoints: newPoints,
        fittingResult: newFittingResult,
      };
    });
  },

  performFitting: () => {
    const state = get();
    if (state.calibrationPoints.length >= 2) {
      const result = performCurveFitting(
        state.calibrationPoints,
        state.theoreticalData
      );
      set({ fittingResult: result });
    }
  },

  updateSimulationStep: (deltaTime: number) => {
    const state = get();
    if (!state.isRunning || state.isPaused) return;
    if (state.currentWaterHeight <= 0.1) {
      set({ isRunning: false });
      return;
    }

    const simulationDt = deltaTime * SIMULATION_SPEED;
    let newHeight = state.currentWaterHeight;
    let newTime = state.currentTime;
    let newMultiLevelState = state.multiLevelState;
    const apertureArea = calculateApertureArea(state.params.apertureDiameter);

    const steps = Math.ceil(simulationDt / TIME_STEP);
    const stepDt = simulationDt / steps;

    for (let i = 0; i < steps; i++) {
      if (state.params.useMultiLevel && newMultiLevelState) {
        const result = rk4StepWithMultiLevel(newHeight, state.params, stepDt, newMultiLevelState);
        newHeight = result.newHeight;
        newMultiLevelState = result.newMultiLevelState;
      } else {
        newHeight = rk4Step(newHeight, state.params, stepDt);
      }
      newTime += stepDt;
      if (newHeight <= 0.1) {
        newHeight = 0;
        break;
      }
    }

    let newFlowRate: number;
    let newVelocity: number;
    let newPotHeights: number[] | undefined;
    let newPressureHead: number | undefined;

    if (state.params.useMultiLevel && newMultiLevelState) {
      newFlowRate = calculateMultiLevelMainFlowRate(newMultiLevelState, state.params.apertureDiameter);
      newVelocity = calculateInstantaneousVelocity(newMultiLevelState.pots[newMultiLevelState.pots.length - 1].waterHeight);
      newPotHeights = newMultiLevelState.pots.map((p) => p.waterHeight);
      newPressureHead = newMultiLevelState.constantPressureHead;
    } else {
      newFlowRate = calculateInstantaneousFlowRate(newHeight, apertureArea);
      newVelocity = calculateInstantaneousVelocity(newHeight);
    }

    const updatedData = [...state.theoreticalData];
    const lastPoint = updatedData[updatedData.length - 1];
    if (lastPoint && newTime > lastPoint.time) {
      updatedData.push({
        time: newTime,
        waterHeight: newHeight,
        flowRate: newFlowRate,
        velocity: newVelocity,
        compensationPotHeights: newPotHeights,
        constantPressureHead: newPressureHead,
      });
    }

    set({
      currentWaterHeight: newHeight,
      currentTime: newTime,
      theoreticalData: updatedData,
      multiLevelState: newMultiLevelState,
      isRunning: newHeight > 0.1,
    });
  },

  calculateTheoreticalCurve: () => {
    const state = get();
    if (state.params.useMultiLevel) {
      const result = generateTheoreticalCurveWithMultiLevel(state.params);
      set({
        theoreticalData: result.data,
        totalDrainTime: result.totalDrainTime,
        multiLevelState: result.finalMultiLevelState,
        currentWaterHeight: state.params.initialWaterHeight,
        currentTime: 0,
      });
    } else {
      const result = generateTheoreticalCurve(state.params);
      set({
        theoreticalData: result.data,
        totalDrainTime: result.totalDrainTime,
        multiLevelState: null,
        currentWaterHeight: state.params.initialWaterHeight,
        currentTime: 0,
      });
    }
  },
}));
