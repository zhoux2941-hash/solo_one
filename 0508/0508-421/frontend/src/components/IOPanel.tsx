import React, { useState, useEffect, useRef } from 'react';
import { usePlcStore } from '../store/plcStore';
import { usePlcSimulation } from '../hooks/usePlcSimulation';

type SignalType = 'switch' | 'pulse';

export const IOPanel: React.FC = () => {
  const { ioState } = usePlcStore();
  const { setInput } = usePlcSimulation();

  const [signalTypes, setSignalTypes] = useState<SignalType[]>(
    new Array(8).fill('switch')
  );
  const pulseIntervalsRef = useRef<(number | null)[]>(new Array(8).fill(null));
  const ioStateRef = useRef(ioState);

  useEffect(() => {
    ioStateRef.current = ioState;
  }, [ioState]);

  const handleInputToggle = (index: number) => {
    if (signalTypes[index] === 'pulse') return;
    const currentValue = ioState.inputs[index] ?? false;
    setInput(index, !currentValue);
  };

  const handleSignalTypeChange = (index: number, type: SignalType) => {
    setSignalTypes((prev) => {
      const newTypes = [...prev];
      newTypes[index] = type;
      return newTypes;
    });

    if (type === 'pulse') {
      if (pulseIntervalsRef.current[index] !== null) {
        clearInterval(pulseIntervalsRef.current[index]!);
      }
      pulseIntervalsRef.current[index] = window.setInterval(() => {
        const currentValue = ioStateRef.current.inputs[index] ?? false;
        setInput(index, !currentValue);
      }, 1000);
    } else {
      if (pulseIntervalsRef.current[index] !== null) {
        clearInterval(pulseIntervalsRef.current[index]!);
        pulseIntervalsRef.current[index] = null;
      }
    }
  };

  useEffect(() => {
    const intervals = pulseIntervalsRef.current;
    return () => {
      intervals.forEach((interval) => {
        if (interval !== null) {
          clearInterval(interval);
        }
      });
    };
  }, []);

  const inputSectionStyle = {
    marginBottom: '24px',
  };

  const sectionTitleStyle = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '2px solid #e5e7eb',
  };

  const ioGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  };

  const ioItemStyle = {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    gap: '8px',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
  };

  const ioLabelStyle = {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#374151',
  };

  const getToggleButtonStyle = (isOn: boolean, isPulse: boolean) => ({
    width: '60px',
    height: '32px',
    borderRadius: '16px',
    border: 'none',
    cursor: isPulse ? 'not-allowed' : 'pointer',
    backgroundColor: isOn ? '#ef4444' : '#9ca3af',
    transition: 'background-color 0.2s',
    opacity: isPulse ? 0.6 : 1,
    position: 'relative' as const,
  });

  const toggleKnobStyle = (isOn: boolean) => ({
    position: 'absolute' as const,
    top: '3px',
    left: isOn ? '31px' : '3px',
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'left 0.2s',
  });

  const selectStyle = {
    padding: '4px 8px',
    fontSize: '11px',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
  };

  const getOutputDisplayStyle = (isOn: boolean) => ({
    width: '60px',
    height: '32px',
    borderRadius: '16px',
    backgroundColor: isOn ? '#ef4444' : '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  });

  return (
    <div className="io-panel" style={{ padding: '16px' }}>
      <div style={inputSectionStyle}>
        <h3 style={sectionTitleStyle}>输入 (X0-X7)</h3>
        <div style={ioGridStyle}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={`X${i}`} style={ioItemStyle}>
              <span style={ioLabelStyle}>X{i}</span>
              <button
                type="button"
                onClick={() => handleInputToggle(i)}
                style={getToggleButtonStyle(
                  ioState.inputs[i] ?? false,
                  signalTypes[i] === 'pulse'
                )}
                disabled={signalTypes[i] === 'pulse'}
              >
                <div style={toggleKnobStyle(ioState.inputs[i] ?? false)} />
              </button>
              <select
                value={signalTypes[i]}
                onChange={(e) =>
                  handleSignalTypeChange(i, e.target.value as SignalType)
                }
                style={selectStyle}
              >
                <option value="switch">手动</option>
                <option value="pulse">脉冲</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={sectionTitleStyle}>输出 (Y0-Y7)</h3>
        <div style={ioGridStyle}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={`Y${i}`} style={ioItemStyle}>
              <span style={ioLabelStyle}>Y{i}</span>
              <div style={getOutputDisplayStyle(ioState.outputs[i] ?? false)}>
                {ioState.outputs[i] ? 'ON' : 'OFF'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
