import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster }       from 'react-hot-toast'
import { AuthProvider }  from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute    from './components/ProtectedRoute'
import Layout            from './components/Layout'
import Login            from './pages/Login'
import Register         from './pages/Register'
import Dashboard         from './pages/Dashboard'
import BudgetsPage       from './pages/BudgetsPage'
import ExpensesPage      from './pages/ExpensesPage'
import ReportsPage       from './pages/ReportsPage'
import Settings          from './pages/Settings'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              padding: '14px 18px',
            },
            success: { iconTheme: { primary: '#4a7c59', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#e05a3a', secondary: '#fff' } },
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Authenticated shell — sidebar + header wrap all protected pages */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/expenses"  element={<ExpensesPage />} />
                <Route path="/budgets"   element={<BudgetsPage />} />
                <Route path="/reports"   element={<ReportsPage />} />
                <Route path="/settings"  element={<Settings />} />
              </Route>
            </Route>

            <Route path="/"  element={<Navigate to="/dashboard" replace />} />
            <Route path="*"  element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
