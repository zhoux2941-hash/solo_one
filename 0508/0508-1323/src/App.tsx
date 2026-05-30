import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoleSelect from "@/pages/RoleSelect";
import ParadeRoute from "@/pages/ParadeRoute";
import BadgeCollection from "@/pages/BadgeCollection";
import EndingPage from "@/pages/EndingPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/parade" element={<ParadeRoute />} />
        <Route path="/badges" element={<BadgeCollection />} />
        <Route path="/ending" element={<EndingPage />} />
      </Routes>
    </Router>
  );
}
