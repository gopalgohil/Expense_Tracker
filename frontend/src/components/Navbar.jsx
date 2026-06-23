import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <nav className="bg-white border-b border-ink-100 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-sage rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-semibold text-ink-800 tracking-tight">Spendwise</span>
          </Link>
          {user && (
            <Link to="/budgets"
              className="text-sm text-ink-500 hover:text-sage font-medium transition-colors hidden sm:block">
              Budgets
            </Link>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <Link to="/budgets"
              className="sm:hidden p-2 text-ink-500 hover:text-sage hover:bg-sage-light rounded-xl transition-colors"
              title="Budgets">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-ink-150"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-sage-light flex items-center justify-center text-sage text-xs font-semibold">
                  {initials}
                </div>
              )}
              <span className="text-sm text-ink-600 font-medium">{user.name}</span>
            </div>
            <button onClick={() => { logout(); navigate('/login') }} className="btn-ghost text-sm py-1.5 px-3">
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
