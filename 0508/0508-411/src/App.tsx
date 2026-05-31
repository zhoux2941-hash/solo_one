import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import CommonList from "@/pages/CommonList";
import Rules from "@/pages/Rules";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="common" element={<CommonList />} />
          <Route path="rules" element={<Rules />} />
        </Route>
      </Routes>
    </Router>
  );
}
