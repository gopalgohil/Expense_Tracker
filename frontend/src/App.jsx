import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { AuthProvider }  from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute    from './components/ProtectedRoute'
import PageTransition    from './components/animations/PageTransition'
import Login             from './pages/Login'
import Register          from './pages/Register'
import ForgotPassword    from './pages/ForgotPassword'
import Dashboard         from './pages/Dashboard'

// AnimatePresence needs location from inside BrowserRouter
const AnimatedRoutes = () => {
  const location = useLocation()
  const isDashboardRoute = ['/dashboard', '/expenses', '/add-expense', '/budgets', '/charts', '/settings'].includes(location.pathname)
  const routeKey = isDashboardRoute ? 'dashboard-group' : location.pathname

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={routeKey}>
        <Route path="/login"     element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register"  element={<PageTransition><Register /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <PageTransition><Dashboard /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/expenses" element={
          <ProtectedRoute>
            <PageTransition><Dashboard /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/add-expense" element={
          <ProtectedRoute>
            <PageTransition><Dashboard /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/budgets" element={
          <ProtectedRoute>
            <PageTransition><Dashboard /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/charts" element={
          <ProtectedRoute>
            <PageTransition><Dashboard /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <PageTransition><Dashboard /></PageTransition>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            },
            success: {
              iconTheme: { primary: '#4a7c59', secondary: '#fff' },
              style: { borderLeft: '4px solid #4a7c59' },
            },
            error: {
              iconTheme: { primary: '#e05a3a', secondary: '#fff' },
              style: { borderLeft: '4px solid #e05a3a' },
            },
            loading: {
              iconTheme: { primary: '#4a7c59', secondary: '#fff' },
            },
          }}
        />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
