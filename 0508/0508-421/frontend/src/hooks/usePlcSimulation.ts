import { useState, useRef, useCallback, useEffect } from 'react';
import { PlcVm } from '../utils/plcVm';
import { compileProgram } from '../utils/bytecode';
import type { LadderProgram, PlcIoState, SimMode } from '../types/plc';

export function usePlcSimulation() {
  const [vm, setVm] = useState<PlcVm | null>(null);
  const [bytecode, setBytecode] = useState<Uint8Array | null>(null);
  const [ioState, setIoState] = useState<PlcIoState | null>(null);
  const [simMode, setSimMode] = useState<SimMode>('stopped');
  const [scanCycle, setScanCycle] = useState(0);
  const runIntervalRef = useRef<number | null>(null);

  const compile = useCallback((program: LadderProgram) => {
    try {
      const bc = compileProgram(program);
      setBytecode(bc);
      const newVm = new PlcVm(bc);
      setVm(newVm);
      setIoState(newVm.getState());
      setScanCycle(0);
      return true;
    } catch (error) {
      console.error('Compilation error:', error);
      return false;
    }
  }, []);

  const step = useCallback(() => {
    if (!vm) return;
    const hadMore = vm.step();
    setIoState(vm.getState());
    return hadMore;
  }, [vm]);

  const runCycle = useCallback(() => {
    if (!vm) return;
    vm.runCycle();
    setIoState(vm.getState());
    setScanCycle((prev) => prev + 1);
  }, [vm]);

  const start = useCallback(
    (intervalMs: number = 200) => {
      if (runIntervalRef.current !== null) {
        clearInterval(runIntervalRef.current);
      }
      setSimMode('running');
      runIntervalRef.current = window.setInterval(() => {
        runCycle();
      }, intervalMs);
    },
    [runCycle]
  );

  const stop = useCallback(() => {
    if (runIntervalRef.current !== null) {
      clearInterval(runIntervalRef.current);
      runIntervalRef.current = null;
    }
    setSimMode('stopped');
  }, []);

  const setInput = useCallback(
    (index: number, value: boolean) => {
      if (!vm) return;
      vm.setInput(index, value);
      setIoState(vm.getState());
    },
    [vm]
  );

  useEffect(() => {
    return () => {
      if (runIntervalRef.current !== null) {
        clearInterval(runIntervalRef.current);
      }
    };
  }, []);

  return {
    vm,
    bytecode,
    ioState,
    simMode,
    scanCycle,
    compile,
    step,
    runCycle,
    start,
    stop,
    setInput,
  };
}
