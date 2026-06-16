import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DarkModeToggle from './DarkModeToggle'
import SignOutModal from './SignOutModal'

const Navbar = ({ onMenuClick, activeSection }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showSignOut, setShowSignOut] = useState(false)
  const dropdownRef = useRef(null)

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLinkClick = (path) => {
    navigate(path)
    setDropdownOpen(false)
  }

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'expenses':
        return 'Expenses'
      case 'add-expense':
        return 'Add Expense'
      case 'budgets':
        return 'Budgets'
      case 'charts':
        return 'Charts'
      case 'settings':
        return 'Settings'
      default:
        return 'Dashboard'
    }
  }

  return (
    <header className="bg-white dark:bg-zinc-950 border-b border-ink-100 dark:border-zinc-800/80 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0 relative z-30">
      
      {/* Left side: Hamburger menu on mobile, Section name / breadcrumbs on desktop */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-ink-500 dark:text-zinc-400 hover:bg-ink-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Open sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* Mobile Logo Branding */}
        <div className="flex lg:hidden items-center gap-2">
          <img src="/favicon.png" alt="Spendwise logo" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-bold text-ink-800 dark:text-zinc-100">Spendwise</span>
        </div>

        {/* Desktop Breadcrumbs */}
        <div className="hidden lg:flex items-center gap-2 text-sm">
          <span className="text-ink-400 dark:text-zinc-500 font-medium">Pages</span>
          <span className="text-ink-300 dark:text-zinc-600">/</span>
          <span className="text-ink-800 dark:text-zinc-100 font-bold tracking-tight">{getSectionTitle()}</span>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Notifications Icon */}
        <button className="p-2 rounded-xl text-ink-500 dark:text-zinc-400 hover:bg-ink-100 dark:hover:bg-zinc-800 transition-colors relative" aria-label="Notifications">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.641C7.66 6.596 6 8.82 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* Notification Indicator Dot */}
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-sage ring-2 ring-white dark:ring-zinc-950" />
        </button>

        {/* User profile with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-ink-50 dark:hover:bg-zinc-800 transition-all text-left"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sage-light dark:bg-emerald-950/40 flex items-center justify-center text-sage dark:text-emerald-400 text-sm font-bold flex-shrink-0 shadow-inner">
              {initials}
            </div>
            <div className="hidden sm:block min-w-0 pr-1">
              <p className="text-sm font-semibold text-ink-800 dark:text-zinc-200 leading-tight truncate">{user?.name}</p>
              <p className="text-[10px] text-ink-400 dark:text-zinc-500 leading-none mt-0.5 truncate">{user?.email}</p>
            </div>
            <svg className={`w-4 h-4 text-ink-400 dark:text-zinc-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* SaaS-Style Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-ink-150 dark:border-zinc-800 shadow-xl py-2 z-50 transform origin-top-right animate-in fade-in slide-in-from-top-1 duration-200">
              
              {/* User details header */}
              <div className="px-4 py-2 border-b border-ink-100 dark:border-zinc-800 mb-1">
                <p className="text-xs text-ink-400 dark:text-zinc-500">Signed in as</p>
                <p className="text-sm font-bold text-ink-800 dark:text-zinc-200 truncate mt-0.5">{user?.name}</p>
                <p className="text-xs text-ink-500 dark:text-zinc-400 truncate">{user?.email}</p>
              </div>

              {/* Menu Actions */}

              <button
                onClick={() => handleLinkClick('/settings')}
                className="w-full text-left px-4 py-2 text-sm text-ink-700 dark:text-zinc-300 hover:bg-ink-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors"
              >
                <svg className="w-4 h-4 text-ink-400 dark:text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>

              {/* Theme Toggle row */}
              <div className="px-4 py-1.5 border-t border-b border-ink-100 dark:border-zinc-800 my-1 flex items-center justify-between text-sm text-ink-700 dark:text-zinc-300">
                <span className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-ink-400 dark:text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Theme
                </span>
                <DarkModeToggle />
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false)
                  setShowSignOut(true)
                }}
                className="w-full text-left px-4 py-2 text-sm text-coral hover:bg-coral-soft flex items-center gap-2.5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        open={showSignOut}
        onClose={() => setShowSignOut(false)}
        onConfirm={() => {
          setShowSignOut(false)
          logout()
          navigate('/login')
        }}
      />
    </header>
  )
}

export default Navbar
