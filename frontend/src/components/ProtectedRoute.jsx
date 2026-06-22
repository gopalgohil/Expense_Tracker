import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* Guards authenticated routes — renders child routes via Outlet when logged in */
const ProtectedRoute = () => {
  const { user, initializing } = useAuth()

  if (initializing) return null

  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
