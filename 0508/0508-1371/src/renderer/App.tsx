import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PayloadGenerator from './pages/PayloadGenerator';
import TemplateLibrary from './pages/TemplateLibrary';
import DeviceCompiler from './pages/DeviceCompiler';
import DetectionMonitor from './pages/DetectionMonitor';
import EventQuery from './pages/EventQuery';
import ServiceControl from './pages/ServiceControl';
import AnalysisTools from './pages/AnalysisTools';
import SignatureManager from './pages/SignatureManager';
import SystemSettings from './pages/SystemSettings';
import { useDetectionEvents } from './hooks/useDetection';

export default function App() {
  useDetectionEvents();

  useEffect(() => {
    console.log('[HID Framework] Application initialized');
  }, []);

  return (
    <div className="h-full w-full">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="payload/generator" element={<PayloadGenerator />} />
          <Route path="payload/templates" element={<TemplateLibrary />} />
          <Route path="payload/compile" element={<DeviceCompiler />} />
          <Route path="detection/monitor" element={<DetectionMonitor />} />
          <Route path="detection/events" element={<EventQuery />} />
          <Route path="service/control" element={<ServiceControl />} />
          <Route path="tools/playback" element={<AnalysisTools />} />
          <Route path="signatures" element={<SignatureManager />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>
      </Routes>
    </div>
  );
}
