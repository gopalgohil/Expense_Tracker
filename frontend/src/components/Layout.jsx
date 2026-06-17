import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import SignOutModal from './SignOutModal'
import DarkModeToggle from './DarkModeToggle'
import { useAuth } from '../context/AuthContext'
import ScaleModal from './animations/ScaleModal'
import ExpenseForm from './ExpenseForm'
import { useExpenses } from '../hooks/useExpenses'
import toast from 'react-hot-toast'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSignOut, setShowSignOut] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  const { user, logout } = useAuth()
  const { addExpense } = useExpenses()
  const navigate = useNavigate()
  const location = useLocation()
  const dropdownRef = useRef(null)
  const mobileDropdownRef = useRef(null)

  // Map path to NAV key
  const activeSection = (() => {
    const path = location.pathname.replace(/\/$/, '')
    if (path.startsWith('/expenses')) return 'expenses'
    if (path.startsWith('/budgets'))   return 'budgets'
    if (path.startsWith('/reports'))   return 'reports'
    if (path.startsWith('/settings'))  return 'settings'
    return 'dashboard'
  })()

  const activeSectionLabel = (() => {
    if (activeSection === 'dashboard') return 'Dashboard'
    if (activeSection === 'expenses') return 'Expenses'
    if (activeSection === 'budgets') return 'Budgets'
    if (activeSection === 'reports') return 'Reports'
    if (activeSection === 'settings') return 'Settings'
    return 'Dashboard'
  })()

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const handleSignOut = () => {
    setShowSignOut(false)
    logout()
    navigate('/login')
  }

  const handleAddExpenseSubmit = async (payload) => {
    setFormLoading(true)
    const res = await addExpense(payload)
    setFormLoading(false)

    if (res.success) {
      toast.success('Expense added successfully!')
      setIsAddExpenseOpen(false)
      window.dispatchEvent(new Event('expense-updated'))
    } else {
      toast.error(res.message || 'Failed to add expense')
    }
    return res
  }

  useEffect(() => {
    const handleOutsideClick = (e) => {
      const clickedDesktop = dropdownRef.current && dropdownRef.current.contains(e.target)
      const clickedMobile = mobileDropdownRef.current && mobileDropdownRef.current.contains(e.target)
      if (!clickedDesktop && !clickedMobile) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div className="flex h-screen bg-ink-50 dark:bg-zinc-950 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 lg:static lg:z-auto
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          active={activeSection}
          setActive={(section) => navigate(`/${section}`)}
          onAddExpenseClick={() => setIsAddExpenseOpen(true)}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden lg:flex bg-white dark:bg-zinc-900 border-b border-ink-100 dark:border-zinc-800 h-16 items-center justify-between px-8 flex-shrink-0">
          {/* Current page label */}
          <div className="flex items-center">
            <span className="text-sm text-ink-800 dark:text-zinc-200 font-bold">{activeSectionLabel}</span>
          </div>

          {/* Right Area: Profile only */}
          <div className="flex items-center gap-5">

            {/* Profile trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 hover:opacity-90 transition-opacity focus:outline-none py-1 px-1.5 rounded-xl border border-transparent hover:border-ink-100 dark:hover:border-zinc-800"
              >
                <div className="w-9 h-9 rounded-full bg-sage-light flex items-center justify-center text-sage text-sm font-bold flex-shrink-0">
                  {initials}
                </div>
                <div className="text-left leading-tight hidden xl:block pr-1">
                  <p className="text-sm font-bold text-ink-800 dark:text-zinc-200">{user?.name}</p>
                  <p className="text-xs text-ink-400 dark:text-zinc-500 font-medium">{user?.email}</p>
                </div>
                <svg className={`w-3.5 h-3.5 text-ink-400 dark:text-zinc-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown Card */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-ink-150 dark:border-zinc-800 rounded-2xl shadow-lg z-50 p-3 animate-fade-in">
                  <div className="px-3 py-2">
                    <p className="text-[10px] text-ink-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm font-bold text-ink-800 dark:text-zinc-200 truncate mt-1">{user?.name}</p>
                    <p className="text-xs text-ink-400 dark:text-zinc-500 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <hr className="border-ink-100 dark:border-zinc-800 my-1.5" />
                  
                  {/* Settings Item */}
                  <button
                    onClick={() => { setDropdownOpen(false); navigate('/settings') }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-ink-600 dark:text-zinc-300 hover:bg-ink-50 dark:hover:bg-zinc-800 transition-colors font-medium text-left"
                  >
                    <svg className="w-4 h-4 text-ink-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>

                  {/* Theme Item */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-ink-600 dark:text-zinc-300 font-medium">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-ink-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      <span>Theme</span>
                    </div>
                    <DarkModeToggle />
                  </div>

                  <hr className="border-ink-100 dark:border-zinc-800 my-1.5" />

                  {/* Sign Out Item */}
                  <button
                    onClick={() => { setDropdownOpen(false); setShowSignOut(true) }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-coral hover:bg-coral-soft transition-colors font-bold text-left"
                  >
                    <svg className="w-4 h-4 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-zinc-900 border-b border-ink-100 dark:border-zinc-800 h-14 flex items-center px-4 flex-shrink-0 justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-ink-500 dark:text-zinc-400 hover:bg-ink-100 dark:hover:bg-zinc-800 transition-colors mr-2.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <img src="/favicon.png" alt="Spendwise logo" className="w-7 h-7 rounded-lg object-cover" />
              <span className="font-bold text-ink-800 dark:text-zinc-200">Spendwise</span>
            </div>
          </div>

          {/* Mobile Profile Trigger */}
          <div className="relative" ref={mobileDropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-8 h-8 rounded-full bg-sage-light flex items-center justify-center text-sage text-xs font-bold"
            >
              {initials}
            </button>

            {/* Profile Dropdown Card (Mobile) */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-ink-150 dark:border-zinc-800 rounded-2xl shadow-lg z-50 p-3 animate-fade-in">
                <div className="px-3 py-2">
                  <p className="text-[10px] text-ink-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Signed in as</p>
                  <p className="text-sm font-bold text-ink-800 dark:text-zinc-200 truncate mt-1">{user?.name}</p>
                  <p className="text-xs text-ink-400 dark:text-zinc-500 truncate mt-0.5">{user?.email}</p>
                </div>
                <hr className="border-ink-100 dark:border-zinc-800 my-1.5" />
                
                {/* Settings Item */}
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/settings') }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-ink-600 dark:text-zinc-300 hover:bg-ink-50 dark:hover:bg-zinc-800 transition-colors font-medium text-left"
                >
                  <svg className="w-4 h-4 text-ink-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>

                {/* Theme Item */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-ink-600 dark:text-zinc-300 font-medium">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-ink-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <span>Theme</span>
                  </div>
                  <DarkModeToggle />
                </div>

                <hr className="border-ink-100 dark:border-zinc-800 my-1.5" />

                {/* Sign Out Item */}
                <button
                  onClick={() => { setDropdownOpen(false); setShowSignOut(true) }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-coral hover:bg-coral-soft transition-colors font-bold text-left"
                >
                  <svg className="w-4 h-4 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable page body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Add Expense Modal */}
      <ScaleModal
        open={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        maxWidth="max-w-md"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-ink-100 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-ink-800 dark:text-zinc-200">
              ➕ Add Expense
            </h3>
            <button
              onClick={() => setIsAddExpenseOpen(false)}
              className="p-1 rounded-lg text-ink-400 hover:text-ink-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ExpenseForm
            onSubmit={handleAddExpenseSubmit}
            onCancel={() => setIsAddExpenseOpen(false)}
            loading={formLoading}
          />
        </div>
      </ScaleModal>

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        open={showSignOut}
        onClose={() => setShowSignOut(false)}
        onConfirm={handleSignOut}
      />
    </div>
  )
}

export default Layout
