import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Spin } from 'antd';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthorDashboard from './pages/AuthorDashboard';
import ReviewerDashboard from './pages/ReviewerDashboard';
import ChairDashboard from './pages/ChairDashboard';
import PaperDetail from './pages/PaperDetail';
import ReviewDetail from './pages/ReviewDetail';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const getDefaultRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'author':
        return '/author';
      case 'reviewer':
        return '/reviewer';
      case 'chair':
        return '/chair';
      default:
        return '/login';
    }
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={getDefaultRoute()} replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to={getDefaultRoute()} replace /> : <RegisterPage />}
      />
      <Route
        path="/author"
        element={
          <ProtectedRoute allowedRoles={['author']}>
            <AuthorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/author/papers/:id"
        element={
          <ProtectedRoute allowedRoles={['author', 'chair', 'reviewer']}>
            <PaperDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviewer"
        element={
          <ProtectedRoute allowedRoles={['reviewer']}>
            <ReviewerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviewer/reviews/:id"
        element={
          <ProtectedRoute allowedRoles={['reviewer']}>
            <ReviewDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chair"
        element={
          <ProtectedRoute allowedRoles={['chair']}>
            <ChairDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chair/papers/:id"
        element={
          <ProtectedRoute allowedRoles={['chair']}>
            <PaperDetail />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};

export default App;
