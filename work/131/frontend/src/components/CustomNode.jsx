import React from 'react'
import { Handle, Position } from 'reactflow'

const CustomNode = ({ data, selected }) => {
  const getNodeStyle = () => {
    const baseStyle = {
      padding: '12px 18px',
      borderRadius: '8px',
      fontWeight: 600,
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: '2px solid',
    }

    const isPath = data.isPath

    if (isPath) {
      return {
        ...baseStyle,
        background: '#ffebee',
        borderColor: selected ? '#b71c1c' : '#ff1744',
        color: '#c62828',
        boxShadow: selected ? '0 0 0 2px #b71c1c' : '0 0 8px rgba(255, 23, 68, 0.4)',
        animation: 'pulse 2s infinite',
      }
    }

    switch (data.type) {
      case 'Disease':
        return {
          ...baseStyle,
          background: '#e3f2fd',
          borderColor: selected ? '#1565c0' : '#1976d2',
          color: '#1565c0',
          boxShadow: selected ? '0 0 0 2px #1565c0' : 'none',
        }
      case 'Symptom':
        return {
          ...baseStyle,
          background: '#fff3e0',
          borderColor: selected ? '#ef6c00' : '#f57c00',
          color: '#ef6c00',
          boxShadow: selected ? '0 0 0 2px #ef6c00' : 'none',
        }
      case 'Drug':
        return {
          ...baseStyle,
          background: '#e8f5e9',
          borderColor: selected ? '#2e7d32' : '#388e3c',
          color: '#2e7d32',
          boxShadow: selected ? '0 0 0 2px #2e7d32' : 'none',
        }
      case 'SideEffect':
        return {
          ...baseStyle,
          background: '#fce4ec',
          borderColor: selected ? '#ad1457' : '#c2185b',
          color: '#ad1457',
          boxShadow: selected ? '0 0 0 2px #ad1457' : 'none',
        }
      default:
        return {
          ...baseStyle,
          background: '#f5f5f5',
          borderColor: selected ? '#555' : '#999',
          color: '#333',
          boxShadow: selected ? '0 0 0 2px #555' : 'none',
        }
    }
  }

  const getTypeIcon = () => {
    switch (data.type) {
      case 'Disease':
        return '🏥'
      case 'Symptom':
        return '💊'
      case 'Drug':
        return '💉'
      case 'SideEffect':
        return '⚠️'
      default:
        return '📦'
    }
  }

  return (
    <div style={getNodeStyle()}>
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#fff',
          border: '2px solid #555',
          width: '8px',
          height: '8px',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{getTypeIcon()}</span>
        <span>{data.label}</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#fff',
          border: '2px solid #555',
          width: '8px',
          height: '8px',
        }}
      />
    </div>
  )
}

export default CustomNode