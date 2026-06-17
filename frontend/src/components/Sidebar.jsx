import { useAuth } from '../context/AuthContext'
import DarkModeToggle from './DarkModeToggle'

const NAV = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: 'expenses',
    label: 'Expenses',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    key: 'add-expense',
    label: 'Add Expense',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    key: 'budgets',
    label: 'Budgets',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
  },
]

const Sidebar = ({ active, setActive, onAddExpenseClick, onClose }) => {
  const handleNav = (key) => {
    if (key === 'add-expense') {
      if (onAddExpenseClick) onAddExpenseClick()
    } else {
      setActive(key)
    }
    if (onClose) onClose()
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-ink-100 dark:border-zinc-800 w-64">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-ink-100 dark:border-zinc-800 flex-shrink-0">
        <button
          onClick={() => handleNav('dashboard')}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity text-left focus:outline-none"
        >
          <img
            src="/favicon.png"
            alt="Spendwise logo"
            className="w-8 h-8 rounded-xl object-cover"
          />
          <span className="font-bold text-ink-800 dark:text-zinc-200 text-lg tracking-tight">Spendwise</span>
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-4 py-6 space-y-3.5 overflow-y-auto">
        {NAV.map((item) => (
          <button
            key={item.key}
            onClick={() => handleNav(item.key)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-150 text-left
              ${active === item.key
                ? 'bg-sage text-white shadow-sm'
                : 'text-ink-500 hover:bg-ink-50 dark:hover:bg-zinc-850 hover:text-ink-800 dark:hover:text-zinc-100'
              }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default Sidebar
