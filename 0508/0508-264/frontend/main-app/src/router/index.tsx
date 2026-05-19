import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Order from '@/pages/Order'
import Product from '@/pages/Product'
import Finance from '@/pages/Finance'
import System from '@/pages/System'

const AuthRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = localStorage.getItem('auth-storage')
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <AuthRoute>
        <Layout />
      </AuthRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'order', element: <Order /> },
      { path: 'product', element: <Product /> },
      { path: 'finance', element: <Finance /> },
      { path: 'system', element: <System /> },
    ],
  },
])

export default router
