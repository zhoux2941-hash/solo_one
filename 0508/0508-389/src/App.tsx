import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from '@/components/Header';
import PatternLibrary from '@/pages/PatternLibrary';
import Editor from '@/pages/Editor';
import Upload from '@/pages/Upload';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F5F0E8]">
        <Header />
        <Routes>
          <Route path="/" element={<PatternLibrary />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </div>
    </Router>
  );
}
