import React, { useState, useEffect } from 'react';
import type { PlcElement } from '../types/plc';
import { usePlcStore } from '../store/plcStore';

const typeLabels: Record<string, string> = {
  'normally-open': '常开触点',
  'normally-closed': '常闭触点',
  'coil': '线圈',
  'timer': '定时器',
  'counter': '计数器',
  'left-bus': '左母线',
  'right-bus': '右母线',
  'horizontal-line': '水平线',
  'vertical-line': '垂直线',
};

export const ElementPropertyPanel: React.FC = () => {
  const { selectedElementId, program, updateElement, removeElement } = usePlcStore();
  const [variable, setVariable] = useState('');
  const [value, setValue] = useState<number | ''>('');

  const selectedElement = program.rungs
    .flatMap((rung) => rung.elements)
    .find((el) => el.id === selectedElementId);

  useEffect(() => {
    if (selectedElement) {
      setVariable(selectedElement.variable);
      setValue(selectedElement.value ?? '');
    }
  }, [selectedElement]);

  const handleVariableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVariable(e.target.value);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setValue('');
    } else {
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        setValue(num);
      }
    }
  };

  const handleSave = () => {
    if (selectedElement) {
      const updates: Partial<PlcElement> = { variable };
      if (value !== '') {
        updates.value = value;
      }
      updateElement(selectedElement.id, updates);
    }
  };

  const handleDelete = () => {
    if (selectedElement && window.confirm('确定要删除此元件吗？')) {
      removeElement(selectedElement.id);
    }
  };

  if (!selectedElement) {
    return (
      <div
        style={{
          width: '240px',
          backgroundColor: '#fafafa',
          borderLeft: '1px solid #ddd',
          height: '100%',
          padding: '16px',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: '14px',
        }}
      >
        请选择一个元件
      </div>
    );
  }

  const showValueField =
    selectedElement.type === 'timer' || selectedElement.type === 'counter';

  return (
    <div
      style={{
        width: '240px',
        backgroundColor: '#fafafa',
        borderLeft: '1px solid #ddd',
        height: '100%',
        padding: '16px',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: '16px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#333',
        }}
      >
        元件属性
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '13px',
              color: '#666',
              fontWeight: '500',
            }}
          >
            类型
          </label>
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#333',
            }}
          >
            {typeLabels[selectedElement.type] || selectedElement.type}
          </div>
        </div>
        <div>
          <label
            htmlFor="variable"
            style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '13px',
              color: '#666',
              fontWeight: '500',
            }}
          >
            变量名
          </label>
          <input
            id="variable"
            type="text"
            value={variable}
            onChange={handleVariableChange}
            onBlur={handleSave}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box',
              fontFamily: 'monospace',
            }}
          />
        </div>
        {showValueField && (
          <div>
            <label
              htmlFor="value"
              style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '13px',
                color: '#666',
                fontWeight: '500',
              }}
            >
              预设值
            </label>
            <input
              id="value"
              type="number"
              value={value}
              onChange={handleValueChange}
              onBlur={handleSave}
              min="0"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
              }}
            />
          </div>
        )}
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '13px',
              color: '#666',
              fontWeight: '500',
            }}
          >
            位置
          </label>
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#333',
              fontFamily: 'monospace',
            }}
          >
            X: {selectedElement.x}, Y: {selectedElement.y}
          </div>
        </div>
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '13px',
              color: '#666',
              fontWeight: '500',
            }}
          >
            状态
          </label>
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: selectedElement.state ? '#ffebee' : '#e8f5e9',
              border: `1px solid ${selectedElement.state ? '#ef5350' : '#66bb6a'}`,
              borderRadius: '4px',
              fontSize: '14px',
              color: selectedElement.state ? '#c62828' : '#2e7d32',
              fontWeight: '500',
            }}
          >
            {selectedElement.state ? '导通 (ON)' : '断开 (OFF)'}
          </div>
        </div>
        <button
          onClick={handleDelete}
          style={{
            marginTop: '8px',
            padding: '10px 16px',
            backgroundColor: '#f44336',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#d32f2f';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f44336';
          }}
        >
          删除元件
        </button>
      </div>
    </div>
  );
};
