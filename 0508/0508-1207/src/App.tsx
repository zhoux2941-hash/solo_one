import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import StudentApply from "@/pages/StudentApply";
import StudentStatus from "@/pages/StudentStatus";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminSchedule from "@/pages/AdminSchedule";
import AdminInterviews from "@/pages/AdminInterviews";
import { useAppStore } from "@/store/appStore";

function RequireRole({ role, children }: { role: 'student' | 'admin'; children: JSX.Element }) {
  const currentRole = useAppStore((s) => s.role);
  if (currentRole !== role) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/student/apply"
          element={
            <RequireRole role="student">
              <StudentApply />
            </RequireRole>
          }
        />
        <Route
          path="/student/status"
          element={
            <RequireRole role="student">
              <StudentStatus />
            </RequireRole>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <RequireRole role="admin">
              <AdminDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/admin/schedule"
          element={
            <RequireRole role="admin">
              <AdminSchedule />
            </RequireRole>
          }
        />
        <Route
          path="/admin/interviews"
          element={
            <RequireRole role="admin">
              <AdminInterviews />
            </RequireRole>
          }
        />
      </Routes>
    </Router>
  );
}
