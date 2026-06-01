import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketManager } from './services/WebSocketManager';
import { CanIdList } from './components/CanIdList';
import { SignalChart } from './components/SignalChart';
import { IntrusionPanel } from './components/IntrusionPanel';
import { RecordingPanel } from './components/RecordingPanel';
import { CorrelationPanel } from './components/CorrelationPanel';
import { LabelingTool } from './components/LabelingTool';
import { StatusBar } from './components/StatusBar';
import { CanFrame, CanIdProfile, AttackEvent, SignalIdentification } from './types';
import './App.css';

const App: React.FC = () => {
  const wsRef = useRef(new WebSocketManager());
  const [connected, setConnected] = useState(false);
  const [frames, setFrames] = useState<CanFrame[]>([]);
  const [profiles, setProfiles] = useState<CanIdProfile[]>([]);
  const [attacks, setAttacks] = useState<AttackEvent[]>([]);
  const [identifications, setIdentifications] = useState<SignalIdentification[]>([]);
  const [selectedCanIds, setSelectedCanIds] = useState<number[]>([]);
  const [detectionEnabled, setDetectionEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'chart' | 'intrusion' | 'correlation' | 'labeling'>('chart');

  useEffect(() => {
    const ws = wsRef.current;

    ws.onMessage((msg: any) => {
      switch (msg.type) {
        case 'frames':
          setFrames(prev => {
            const updated = [...prev, ...msg.frames];
            return updated.slice(-50000);
          });
          break;
        case 'attacks':
          setAttacks(prev => [...prev, ...msg.attacks].slice(-1000));
          break;
        case 'profiles':
          setProfiles(msg.profiles);
          break;
        case 'identifications':
          setIdentifications(msg.signals);
          break;
        case 'status':
          setConnected(msg.connected);
          setDetectionEnabled(msg.detection_enabled);
          break;
      }
    });

    ws.onStatus((status: any) => {
      setConnected(status.connected);
    });

    ws.connect();

    return () => {
      ws.disconnect();
    };
  }, []);

  const handleConnect = useCallback((adapter: string, channel: number, bitrate: number) => {
    wsRef.current.send({ type: 'connect', adapter, channel, bitrate });
  }, []);

  const handleDisconnect = useCallback(() => {
    wsRef.current.send({ type: 'disconnect' });
  }, []);

  const handleIdentify = useCallback(() => {
    wsRef.current.send({ type: 'identify_signals' });
  }, []);

  const handleGetProfiles = useCallback(() => {
    wsRef.current.send({ type: 'get_profiles' });
  }, []);

  const handleToggleCanId = useCallback((canId: number) => {
    setSelectedCanIds(prev => {
      if (prev.includes(canId)) {
        return prev.filter(id => id !== canId);
      }
      if (prev.length >= 8) {
        return prev;
      }
      return [...prev, canId];
    });
  }, []);

  const handleSetDetectionEnabled = useCallback((enabled: boolean) => {
    wsRef.current.send({ type: 'set_detection_enabled', enabled });
    setDetectionEnabled(enabled);
  }, []);

  const handleAddLabel = useCallback((canId: number, startTimeUs: number, endTimeUs: number, isNormal: boolean, labelText: string) => {
    wsRef.current.send({
      type: 'add_label',
      can_id: canId,
      start_time_us: startTimeUs,
      end_time_us: endTimeUs,
      is_normal: isNormal,
      label_text: labelText,
    });
  }, []);

  const handleRetrain = useCallback(() => {
    wsRef.current.send({ type: 'retrain_model' });
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-icon">⚡</span>
          CAN-REID
        </h1>
        <span className="app-subtitle">CAN Bus Reverse Engineering & Intrusion Detection</span>
        <StatusBar
          connected={connected}
          detectionEnabled={detectionEnabled}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onToggleDetection={handleSetDetectionEnabled}
        />
      </header>
      <div className="app-body">
        <aside className="sidebar">
          <CanIdList
            profiles={profiles}
            identifications={identifications}
            selectedCanIds={selectedCanIds}
            onToggleCanId={handleToggleCanId}
            onIdentify={handleIdentify}
            onRefresh={handleGetProfiles}
          />
          <RecordingPanel ws={wsRef.current} />
        </aside>
        <main className="main-content">
          <nav className="tab-bar">
            <button className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`} onClick={() => setActiveTab('chart')}>
              📊 Signal Chart
            </button>
            <button className={`tab-btn ${activeTab === 'intrusion' ? 'active' : ''}`} onClick={() => setActiveTab('intrusion')}>
              🛡️ Intrusion Detection {attacks.length > 0 && <span className="badge">{attacks.length}</span>}
            </button>
            <button className={`tab-btn ${activeTab === 'correlation' ? 'active' : ''}`} onClick={() => setActiveTab('correlation')}>
              🔗 Correlation
            </button>
            <button className={`tab-btn ${activeTab === 'labeling' ? 'active' : ''}`} onClick={() => setActiveTab('labeling')}>
              🏷️ Labeling
            </button>
          </nav>
          <div className="tab-content">
            {activeTab === 'chart' && (
              <SignalChart
                frames={frames}
                selectedCanIds={selectedCanIds}
                profiles={profiles}
                identifications={identifications}
              />
            )}
            {activeTab === 'intrusion' && (
              <IntrusionPanel
                attacks={attacks}
                ws={wsRef.current}
                detectionEnabled={detectionEnabled}
              />
            )}
            {activeTab === 'correlation' && (
              <CorrelationPanel
                ws={wsRef.current}
                profiles={profiles}
              />
            )}
            {activeTab === 'labeling' && (
              <LabelingTool
                frames={frames}
                profiles={profiles}
                onAddLabel={handleAddLabel}
                onRetrain={handleRetrain}
                ws={wsRef.current}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
