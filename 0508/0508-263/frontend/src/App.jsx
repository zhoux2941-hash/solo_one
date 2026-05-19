import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Playlists from './pages/Playlists';
import History from './pages/History';
import MusicDetail from './pages/MusicDetail';
import UserProfile from './pages/UserProfile';
import Admin from './pages/Admin';
import Share from './pages/Share';
import GlobalMusicPlayer from './components/GlobalMusicPlayer';
import useAuthStore from './store/useAuthStore';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/" />;
  }

  return children;
};

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/share/:code" element={<Share />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Home />} />
          <Route path="upload" element={<Upload />} />
          <Route path="playlists" element={<Playlists />} />
          <Route path="history" element={<History />} />
          <Route path="music/:id" element={<MusicDetail />} />
          <Route path="user/:id" element={<UserProfile />} />
          <Route path="admin" element={
            <ProtectedRoute requireAdmin>
              <Admin />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
      <GlobalMusicPlayer />
    </>
  );
};

export default App;
