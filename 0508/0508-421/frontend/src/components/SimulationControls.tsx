import React, { useEffect, useRef } from 'react';
import { usePlcStore } from '../store/plcStore';
import { usePlcSimulation } from '../hooks/usePlcSimulation';

export const SimulationControls: React.FC = () => {
  const {
    program,
    setIoState,
    setSimMode: setStoreSimMode,
    setBytecodeSize,
    setScanCycle,
  } = usePlcStore();
  const { compile, step, start, stop, simMode, bytecode, ioState, scanCycle } =
    usePlcSimulation();

  const hasCompiledRef = useRef(false);

  useEffect(() => {
    if (program.rungs.length > 0 && !hasCompiledRef.current) {
      compile(program);
      hasCompiledRef.current = true;
    }
  }, [program, compile]);

  useEffect(() => {
    if (ioState) {
      setIoState(ioState);
    }
  }, [ioState, setIoState]);

  useEffect(() => {
    setStoreSimMode(simMode);
  }, [simMode, setStoreSimMode]);

  useEffect(() => {
    setBytecodeSize(bytecode ? bytecode.length : null);
  }, [bytecode]);

  useEffect(() => {
    setScanCycle(scanCycle);
  }, [scanCycle]);

  const handleStep = () => {
    if (!bytecode) {
      compile(program);
      return;
    }
    step();
  };

  const handleRun = () => {
    if (!bytecode) {
      compile(program);
    }
    if (simMode === 'running') {
      stop();
    } else {
      start(200);
    }
  };

  const handleStop = () => {
    stop();
  };

  const getButtonStyle = (isActive: boolean, isRunning: boolean) => ({
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: isActive ? (isRunning ? '#dc2626' : '#16a34a') : '#e5e7eb',
    color: isActive ? '#ffffff' : '#374151',
    transition: 'background-color 0.2s',
  });

  return (
    <div
      className="simulation-controls"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: '#f3f4f6',
        borderBottom: '1px solid #d1d5db',
      }}
    >
      <span
        style={{
          fontWeight: 'bold',
          fontSize: '14px',
          color: '#374151',
        }}
      >
        仿真:
      </span>

      <button
        type="button"
        onClick={handleStep}
        style={getButtonStyle(false, false)}
        title="执行单条指令"
      >
        单步执行
      </button>

      <button
        type="button"
        onClick={handleRun}
        style={getButtonStyle(simMode === 'running', true)}
        title={simMode === 'running' ? '暂停运行' : '开始连续运行'}
      >
        {simMode === 'running' ? '暂停' : '连续运行'}
      </button>

      <button
        type="button"
        onClick={handleStop}
        style={getButtonStyle(simMode === 'stopped', false)}
        title="停止仿真"
      >
        停止
      </button>

      <span
        style={{
          marginLeft: 'auto',
          fontSize: '13px',
          color: '#6b7280',
        }}
      >
        模式:{' '}
        <span
          style={{
            fontWeight: 'bold',
            color:
              simMode === 'running'
                ? '#dc2626'
                : simMode === 'paused'
                ? '#d97706'
                : '#16a34a',
          }}
        >
          {simMode === 'running'
            ? '运行中'
            : simMode === 'paused'
            ? '已暂停'
            : '已停止'}
        </span>
      </span>

      <span
        style={{
          fontSize: '13px',
          color: '#6b7280',
          marginLeft: '16px',
        }}
      >
        字节码: {bytecode ? `${bytecode.length} 字节` : '未编译'}
      </span>
    </div>
  );
};
