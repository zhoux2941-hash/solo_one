import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Header from "@/components/Header";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-ink-900 bg-grain">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}
