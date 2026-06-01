import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import SearchPage from "@/pages/SearchPage";
import AdminLogin from "@/pages/admin/Login";
import AdminLayout from "@/components/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import PinManagement from "@/pages/admin/PinManagement";
import ABTestList from "@/pages/admin/ABTestList";
import ABTestDetail from "@/pages/admin/ABTestDetail";
import OperationLogs from "@/pages/admin/OperationLogs";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout><Dashboard /></AdminLayout>} />
        <Route path="/admin/pin" element={<AdminLayout><PinManagement /></AdminLayout>} />
        <Route path="/admin/abtest" element={<AdminLayout><ABTestList /></AdminLayout>} />
        <Route path="/admin/abtest/:id" element={<AdminLayout><ABTestDetail /></AdminLayout>} />
        <Route path="/admin/logs" element={<AdminLayout><OperationLogs /></AdminLayout>} />
      </Routes>
    </Router>
  );
}
