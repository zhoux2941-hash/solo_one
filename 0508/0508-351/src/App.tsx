import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "@/pages/Home";
import { Applications } from "@/pages/Applications";
import { Teams } from "@/pages/Teams";
import { Handover } from "@/pages/Handover";
import { Sidebar } from "@/components/Sidebar/Sidebar";

export default function App() {
  return (
    <Router>
      <div className="flex h-screen">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/handover" element={<Handover />} />
        </Routes>
      </div>
    </Router>
  );
}
