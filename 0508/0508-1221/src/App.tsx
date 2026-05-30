import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import PracticePage from "@/pages/PracticePage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/practice/:id" element={<PracticePage />} />
      </Routes>
    </Router>
  );
}
