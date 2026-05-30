import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Overprint from "@/pages/Overprint";
import DeltaE from "@/pages/DeltaE";
import ColorPicker from "@/pages/ColorPicker";
import Export from "@/pages/Export";
import Layout from "@/components/Layout";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/overprint" element={<Overprint />} />
          <Route path="/deltae" element={<DeltaE />} />
          <Route path="/picker" element={<ColorPicker />} />
          <Route path="/export" element={<Export />} />
        </Routes>
      </Layout>
    </Router>
  );
}
