import { useState } from 'react';
import './App.css';
import PlcMonitor3D from './components/PlcMonitor3D';
import ProjectManager from './components/ProjectManager';
import { usePlcStore } from './store/plcStore';

type TabType = 'editor' | 'monitor';

const ElementLibrary = () => (
  <div className="element-library">
    <h3>Element Library</h3>
    <p>Drag elements to the ladder editor</p>
  </div>
);

const SimulationControls = () => {
  const { simMode, setSimMode } = usePlcStore();

  return (
    <div className="simulation-controls">
      <div className="toolbar">
        <span style={{ fontWeight: 500, marginRight: 8 }}>Simulation:</span>
        <button
          className={`btn ${simMode === 'running' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSimMode('running')}
        >
          Start
        </button>
        <button
          className={`btn ${simMode === 'paused' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSimMode('paused')}
        >
          Pause
        </button>
        <button
          className={`btn ${simMode === 'stopped' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSimMode('stopped')}
        >
          Stop
        </button>
        <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}>
          Status: <strong style={{ color: simMode === 'running' ? 'var(--success-color)' : simMode === 'paused' ? 'var(--warning-color)' : 'var(--text-secondary)' }}>
            {simMode.toUpperCase()}
          </strong>
        </span>
      </div>
    </div>
  );
};

const LadderEditor = () => {
  const { program } = usePlcStore();

  return (
    <div className="ladder-editor">
      <h3>Ladder Editor</h3>
      <p>Rungs: {program.rungs.length}</p>
      {program.rungs.map((rung, index) => (
        <div key={rung.id} style={{ margin: '12px 0', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 4 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Rung {index + 1}: </span>
          <span>{rung.elements.length} elements</span>
        </div>
      ))}
    </div>
  );
};

const StatusBar = () => {
  const { simMode, ioState, currentProjectId, projectName } = usePlcStore();

  return (
    <div className="status-bar">
      <span>
        Project: {projectName || 'Unsaved'} {currentProjectId && `(#${currentProjectId})`}
      </span>
      <span style={{ marginLeft: 24 }}>
        Inputs: {ioState.inputs.filter(Boolean).length}/8
      </span>
      <span style={{ marginLeft: 24 }}>
        Outputs: {ioState.outputs.filter(Boolean).length}/8
      </span>
      <span style={{ marginLeft: 'auto' }}>
        Mode: {simMode.toUpperCase()}
      </span>
    </div>
  );
};

const ElementPropertyPanel = () => {
  const { selectedElementId } = usePlcStore();

  return (
    <div className="element-property-panel">
      <h3>Properties</h3>
      {selectedElementId ? (
        <p>Selected element: {selectedElementId}</p>
      ) : (
        <p style={{ color: 'var(--text-secondary)' }}>No element selected</p>
      )}
    </div>
  );
};

const IOPanel = () => {
  const { ioState, setInput } = usePlcStore();

  return (
    <div className="io-panel">
      <h3>IO Panel</h3>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>Inputs</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {ioState.inputs.map((value, i) => (
            <button
              key={`in-${i}`}
              className="btn btn-small"
              style={{
                backgroundColor: value ? 'var(--success-color)' : 'var(--panel-bg)',
                border: '1px solid var(--border-color)',
              }}
              onClick={() => setInput(i, !value)}
            >
              I{i}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>Outputs</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {ioState.outputs.map((value, i) => (
            <div
              key={`out-${i}`}
              style={{
                padding: '8px',
                textAlign: 'center',
                borderRadius: 4,
                backgroundColor: value ? 'var(--danger-color)' : 'var(--bg-color)',
                border: '1px solid var(--border-color)',
                fontSize: 12,
              }}
            >
              O{i}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState<TabType>('editor');

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <div className="app-logo">PLC</div>
          <h1 className="app-title">PLC梯形图在线编辑与仿真平台</h1>
        </div>
      </header>

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
        >
          编辑 (Editor)
        </button>
        <button
          className={`tab-btn ${activeTab === 'monitor' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitor')}
        >
          监控 (Monitor)
        </button>
      </div>

      <main className="main-content">
        {activeTab === 'editor' ? (
          <div className="editor-view">
            <div className="editor-left">
              <ElementLibrary />
            </div>
            <div className="editor-center">
              <SimulationControls />
              <LadderEditor />
              <StatusBar />
            </div>
            <div className="editor-right">
              <ElementPropertyPanel />
              <IOPanel />
            </div>
            <div className="editor-bottom">
              <ProjectManager />
            </div>
          </div>
        ) : (
          <div className="monitor-view">
            <PlcMonitor3D />
            <div className="monitor-overlay">
              <IOPanel />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
