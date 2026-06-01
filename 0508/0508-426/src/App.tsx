import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import SodiumPage from "@/pages/SodiumPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sodium" element={<SodiumPage />} />
      </Routes>
    </Router>
  );
}
