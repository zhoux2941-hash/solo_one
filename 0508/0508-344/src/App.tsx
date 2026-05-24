import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChartWorkbench } from '@/pages/ChartWorkbench';
import { VersionCompare } from '@/pages/VersionCompare';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ChartWorkbench />} />
        <Route path="/compare" element={<VersionCompare />} />
      </Routes>
    </Router>
  );
}
