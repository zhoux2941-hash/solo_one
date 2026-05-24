import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TaskQueue } from './pages/TaskQueue';
import { BuoyTrack } from './pages/BuoyTrack';
import { Verification } from './pages/Verification';
import 'leaflet/dist/leaflet.css';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<TaskQueue />} />
          <Route path="/buoy/:id" element={<BuoyTrack />} />
          <Route path="/buoy/:id/verification" element={<Verification />} />
          <Route path="/demo" element={
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-slate-700 mb-4">演示说明</h2>
              <p className="text-slate-500">
                请先在任务队列页面创建模拟数据，然后查看浮标轨迹和补传核验功能
              </p>
            </div>
          } />
        </Routes>
      </Layout>
    </Router>
  );
}
