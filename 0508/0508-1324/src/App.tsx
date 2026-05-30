import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import Home from "@/pages/Home";
import Training from "@/pages/Training";
import Heritage from "@/pages/Heritage";
import Practice from "@/pages/Practice";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/training/:mode" element={<Training />} />
            <Route path="/heritage" element={<Heritage />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="bg-primary-900 text-white/70 py-6">
          <div className="container mx-auto px-4 text-center text-sm">
            <p>侗族大歌声部听辨训练系统 · 国家级非物质文化遗产</p>
            <p className="mt-1 text-white/50">保护与传承 · 让天籁之音永续流传</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
