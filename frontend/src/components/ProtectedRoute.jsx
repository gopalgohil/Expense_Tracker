import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute — guards authenticated routes.
 *
 * Behaviour on refresh:
 *  - If user profile is in localStorage cache → layout renders IMMEDIATELY (no flash).
 *  - getMe() runs in background to validate the cookie; if it fails the cache
 *    is cleared and user is set to null, triggering a redirect to /login.
 *  - If there is NO cached user AND initializing is still true → show a slim
 *    top progress bar instead of a blank/full-screen loader.
 */

/* Slim top-of-page loading bar shown only on very first visit (no cache) */
const TopBar = () => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0,
    height: 3, zIndex: 9999,
    background: 'linear-gradient(90deg, #4a7c59, #2d5a3d, #4a7c59)',
    backgroundSize: '200% 100%',
    animation: 'topbar-slide 1.2s ease-in-out infinite',
  }}>
    <style>{`
      @keyframes topbar-slide {
        0%   { background-position: 100% 0; }
        100% { background-position: -100% 0; }
      }
    `}</style>
  </div>
)

const ProtectedRoute = () => {
  const { user, initializing } = useAuth()

  // No cache AND still waiting for getMe() — show minimal indicator
  if (!user && initializing) return <TopBar />

  // Cache cleared by failed getMe() OR genuinely logged out → redirect
  if (!user) return <Navigate to="/login" replace />

  // Cached user exists → render layout immediately; getMe() validates in background
  return <Outlet />
}

export default ProtectedRoute
