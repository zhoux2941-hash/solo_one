import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MemberHome from './pages/member/MemberHome';
import MemberPackages from './pages/member/MemberPackages';
import MemberBooking from './pages/member/MemberBooking';
import MemberRecords from './pages/member/MemberRecords';
import CoachHome from './pages/coach/CoachHome';
import CoachBookings from './pages/coach/CoachBookings';
import CoachSettlement from './pages/coach/CoachSettlement';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/member" element={
          <ProtectedRoute requiredRole="member">
            <MemberHome />
          </ProtectedRoute>
        } />
        <Route path="/member/packages" element={
          <ProtectedRoute requiredRole="member">
            <MemberPackages />
          </ProtectedRoute>
        } />
        <Route path="/member/booking" element={
          <ProtectedRoute requiredRole="member">
            <MemberBooking />
          </ProtectedRoute>
        } />
        <Route path="/member/records" element={
          <ProtectedRoute requiredRole="member">
            <MemberRecords />
          </ProtectedRoute>
        } />
        
        <Route path="/coach" element={
          <ProtectedRoute requiredRole="coach">
            <CoachHome />
          </ProtectedRoute>
        } />
        <Route path="/coach/bookings" element={
          <ProtectedRoute requiredRole="coach">
            <CoachBookings />
          </ProtectedRoute>
        } />
        <Route path="/coach/settlement" element={
          <ProtectedRoute requiredRole="coach">
            <CoachSettlement />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
