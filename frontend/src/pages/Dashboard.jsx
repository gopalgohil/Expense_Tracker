import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useExpenses }      from '../hooks/useExpenses'
import { useBudgets }       from '../hooks/useBudgets'
import { useAnalytics }     from '../hooks/useAnalytics'
import Sidebar              from '../components/Sidebar'
import ExpenseCard          from '../components/ExpenseCard'
import ExpenseForm          from '../components/ExpenseForm'
import StatsBar             from '../components/StatsBar'
import BudgetProgress       from '../components/BudgetProgress'
import CategoryPieChart     from '../components/CategoryPieChart'
import MonthlyBarChart      from '../components/MonthlyBarChart'
import ExportButtons        from '../components/ExportButtons'
import SummaryCards         from '../components/SummaryCards'
import DailyBarChart        from '../components/DailyBarChart'
import MonthCompareChart    from '../components/MonthCompareChart'
import SearchFilterBar      from '../components/SearchFilterBar'
import Pagination           from '../components/Pagination'
import DarkModeToggle       from '../components/DarkModeToggle'
import BudgetPanel          from './BudgetPanel'
import Settings             from './Settings'
import FadeInSection        from '../components/animations/FadeInSection'
import { AnimatedList, ListItem } from '../components/animations/AnimatedList'
import { HoverButton }      from '../components/animations/HoverButton'
import {
  SummaryCardsSkeleton,
  StatsBarSkeleton,
  ChartSkeleton,
  ExpenseListSkeleton,
  BudgetSkeleton,
} from '../components/animations/SkeletonLoader'

const CATEGORIES = [
  '', 'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
  'Health', 'Utilities', 'Housing', 'Education', 'Travel', 'Other',
]

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const maxMonth = currentMonth

const DEFAULT_ADVANCED = { minAmount: '', maxAmount: '', sortBy: 'date_desc' }

const Dashboard = () => {
  const {
    expenses, allExpenses, pagination, loading, error,
    fetchExpenses, addExpense, editExpense, removeExpense, restoreExpense,
  } = useExpenses()
  const { status, fetchBudgets, refreshStatus } = useBudgets()
  const { summary, topCats, dailyData, loading: analyticsLoading, error: analyticsError, fetchAnalytics } = useAnalytics()

  const location = useLocation()
  const navigate = useNavigate()
  const activeSection = (() => {
    const path = location.pathname.replace(/\/$/, '')
    if (path === '/dashboard/add-expense') return 'add-expense'
    if (path === '/dashboard/budgets')     return 'budgets'
    if (path === '/dashboard/charts')      return 'charts'
    if (path === '/dashboard/settings')    return 'settings'
    return 'dashboard'
  })()
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [filters,    setFilters]    = useState({ month: currentMonth(), category: '' })
  const [search,     setSearch]     = useState('')
  const [advanced,   setAdvanced]   = useState(DEFAULT_ADVANCED)
  const [page,       setPage]       = useState(1)
  const [addLoading, setAddLoading] = useState(false)
  const [newExpenseIds, setNewExpenseIds] = useState(new Set())
  const notifiedRef = useRef(new Set())

  // Build full params object for API
  const buildParams = useCallback(() => {
    const p = { ...filters, page, limit: 20, sortBy: advanced.sortBy }
    if (search)              p.search    = search
    if (advanced.minAmount)  p.minAmount = advanced.minAmount
    if (advanced.maxAmount)  p.maxAmount = advanced.maxAmount
    return p
  }, [filters, search, advanced, page])

  // Helper to refresh all dashboard data (expenses, budgets, and analytics cards/charts)
  const refreshAllData = useCallback(async () => {
    await Promise.all([
      fetchExpenses(buildParams()),
      fetchBudgets(filters.month),
      fetchAnalytics(filters.month),
    ])
  }, [fetchExpenses, buildParams, fetchBudgets, fetchAnalytics, filters.month])

  // Fetch expenses whenever any filter/search/sort/page changes
  useEffect(() => {
    fetchExpenses(buildParams())
  }, [filters, search, advanced, page])

  // Fetch budgets + analytics only when MONTH changes (not on search/sort)
  // Also reset budget notifications only on month change
  useEffect(() => {
    fetchBudgets(filters.month)
    fetchAnalytics(filters.month)
    notifiedRef.current = new Set()   // reset only on month change
  }, [filters.month])

  // Toast when budget crosses 90% — only fire once per category per session
  useEffect(() => {
    if (!status.length) return
    status.forEach((item) => {
      if (item.percent >= 90 && !notifiedRef.current.has(item.category)) {
        notifiedRef.current.add(item.category)
        const over = item.percent >= 100
        toast(
          over
            ? `🚨 ${item.category} is over budget! (${item.percent}%)`
            : `⚠️ ${item.category} is at ${item.percent}% of budget`,
          {
            id: `budget-${item.category}`,   // prevent duplicate toasts
            style: {
              background: over ? '#fee2e2' : '#fef9c3',
              color:      over ? '#b91c1c' : '#92400e',
              border:     `1px solid ${over ? '#fca5a5' : '#fde68a'}`,
            },
            duration: 5000,
          }
        )
      }
    })
  }, [status])

  const handleAdd = async (formData) => {
    setAddLoading(true)
    const result = await addExpense(formData)
    if (result.success) {
      toast.success('Expense added!')
      if (result.data?._id) {
        setNewExpenseIds((prev) => new Set(prev).add(result.data._id))
        setTimeout(() => {
          setNewExpenseIds((prev) => {
            const next = new Set(prev)
            next.delete(result.data._id)
            return next
          })
        }, 3000)
      }
      await refreshAllData()
      navigate('/dashboard')
      setPage(1)
    } else {
      toast.error(result.message || 'Failed to add expense')
    }
    setAddLoading(false)
    return result
  }

  const handleResetAll = () => {
    setFilters({ month: currentMonth(), category: '' })
    setSearch('')
    setAdvanced(DEFAULT_ADVANCED)
    setPage(1)
  }

  const handleEdit = async (id, formData) => {
    const result = await editExpense(id, formData)
    if (result.success) {
      await refreshAllData()
    }
    return result
  }

  const handleDelete = async (id) => {
    const result = await removeExpense(id)
    if (result.success) {
      await refreshAllData()
      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <span className="text-sm">Expense deleted</span>
            <button
              onClick={async () => {
                toast.dismiss(t.id)
                const restored = await restoreExpense(result.deleted)
                if (restored.success) {
                  toast.success('Expense restored!')
                  await refreshAllData()
                } else {
                  toast.error(restored.message || 'Could not restore')
                }
              }}
              className="text-sm font-semibold text-sage hover:text-sage-dark underline"
            >
              Undo
            </button>
          </div>
        ),
        { duration: 3000, icon: '🗑️' }
      )
    } else {
      toast.error(result.message || 'Failed to delete expense')
    }
    return result
  }

  const chartKey = `${filters.month}-${filters.category}-${search}`

  /* ─────────────────────────────────────────
     Content panels
  ───────────────────────────────────────── */

  const renderContent = () => {
    switch (activeSection) {

      /* ── Add Expense ── */
      case 'add-expense':
        return (
          <FadeInSection>
            <div className="max-w-lg mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-ink-800">Add Expense</h2>
                <p className="text-sm text-ink-400 mt-1">Record a new transaction</p>
              </div>
              <motion.div
                className="card p-6"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <ExpenseForm
                  onSubmit={handleAdd}
                  onCancel={() => navigate('/dashboard')}
                  loading={addLoading}
                />
              </motion.div>
            </div>
          </FadeInSection>
        )

      /* ── Budgets ── */
      case 'budgets':
        return <BudgetPanel month={filters.month} onMonthChange={(m) => setFilters((p) => ({ ...p, month: m }))} />

      /* ── Settings ── */
      case 'settings':
        return <Settings />

      /* ── Charts ── */
      case 'charts':
        return (
          <div>
            <FadeInSection>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-ink-800">Charts</h2>
                <p className="text-sm text-ink-400 mt-1">Visual breakdown of your spending</p>
              </div>
            </FadeInSection>
            <div className="space-y-5">
              {expenses.length > 0 ? (
                <CategoryPieChart expenses={expenses} chartKey={chartKey} />
              ) : (
                <FadeInSection>
                  <div className="card p-10 text-center">
                    <p className="text-ink-400 text-sm">No data for the selected period.</p>
                  </div>
                </FadeInSection>
              )}
              {allExpenses.length > 0 && (
                <MonthlyBarChart expenses={allExpenses} chartKey={chartKey} />
              )}
            </div>
          </div>
        )

      /* ── Dashboard (default) ── */
      default:
        return (
          <div className="space-y-5">
            <FadeInSection>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-ink-800">Dashboard</h2>
                  <p className="text-sm text-ink-400 mt-0.5">Track and manage your spending</p>
                </div>
                <div className="flex items-center gap-2">
                  <ExportButtons filters={filters} />
                  <HoverButton
                    onClick={() => navigate('/dashboard/add-expense')}
                    className="btn-primary flex items-center gap-1.5 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add expense
                  </HoverButton>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection delay={0.05}>
              <div className="card p-4">
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[140px]">
                    <label className="label">Month</label>
                    <input name="month" type="month" value={filters.month}
                      onChange={(e) => { setFilters((p) => ({ ...p, month: e.target.value })); setPage(1) }}
                      className="input-field"
                      max={maxMonth()} />
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label className="label">Category</label>
                    <select name="category" value={filters.category}
                      onChange={(e) => { setFilters((p) => ({ ...p, category: e.target.value })); setPage(1) }}
                      className="input-field bg-white">
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c || 'All categories'}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <HoverButton onClick={handleResetAll} className="btn-ghost text-sm py-3">
                      Reset all
                    </HoverButton>
                  </div>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection delay={0.08}>
              <SearchFilterBar
                search={search}
                onSearchChange={(v) => { setSearch(v); setPage(1) }}
                advanced={advanced}
                onAdvancedChange={(v) => { setAdvanced((p) => ({ ...p, ...v })); setPage(1) }}
                onReset={handleResetAll}
              />
            </FadeInSection>

            {analyticsLoading ? (
              <SummaryCardsSkeleton />
            ) : analyticsError ? (
              <FadeInSection delay={0.1}>
                <div className="card p-6 text-center flex flex-col items-center justify-center border border-dashed border-ink-200">
                  <p className="text-sm text-coral-strong font-medium flex items-center gap-2">
                    <svg className="w-5 h-5 text-coral" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Failed to load analytics: {analyticsError}
                  </p>
                  <HoverButton onClick={() => fetchAnalytics(filters.month)} className="btn-ghost mt-3 text-xs py-1.5 px-4">
                    Try again
                  </HoverButton>
                </div>
              </FadeInSection>
            ) : (
              <FadeInSection delay={0.1}>
                <SummaryCards summary={summary} topCats={topCats} />
              </FadeInSection>
            )}

            {!loading && expenses.length > 0 && (
              <FadeInSection delay={0.12}>
                <StatsBar expenses={expenses} />
              </FadeInSection>
            )}
            {loading && !expenses.length && <StatsBarSkeleton />}

            {status.length > 0 && (
              <FadeInSection delay={0.14}>
                <BudgetProgress status={status} />
              </FadeInSection>
            )}
            {analyticsLoading && status.length === 0 && <BudgetSkeleton />}

            {(dailyData.length > 0 || summary) && !analyticsError && (
              <FadeInSection delay={0.16}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {analyticsLoading ? (
                    <>
                      <ChartSkeleton />
                      <ChartSkeleton />
                    </>
                  ) : (
                    <>
                      <DailyBarChart data={dailyData} chartKey={chartKey} />
                      <MonthCompareChart summary={summary} chartKey={chartKey} />
                    </>
                  )}
                </div>
              </FadeInSection>
            )}

            {loading ? (
              <ExpenseListSkeleton count={4} />
            ) : error ? (
              <FadeInSection>
                <div className="card p-8 text-center">
                  <p className="text-coral text-sm font-medium">{error}</p>
                  <HoverButton onClick={() => fetchExpenses(buildParams())} className="btn-ghost mt-3 text-sm">
                    Try again
                  </HoverButton>
                </div>
              </FadeInSection>
            ) : expenses.length === 0 ? (
              <FadeInSection>
                <div className="card p-12 text-center">
                  <div className="w-12 h-12 bg-sage-light rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-ink-600 font-medium">No expenses found</p>
                  <p className="text-ink-400 text-sm mt-1">
                    {filters.category || filters.month !== currentMonth()
                      ? 'Try adjusting your filters'
                      : 'Add your first expense to get started'}
                  </p>
                  <HoverButton onClick={() => navigate('/dashboard/add-expense')}
                    className="btn-primary mt-4 text-sm">Add expense</HoverButton>
                </div>
              </FadeInSection>
            ) : (
              <FadeInSection delay={0.18}>
                <AnimatedList className="space-y-2.5">
                  {expenses.map((expense, index) => (
                    <ListItem
                      key={expense._id}
                      index={index}
                      isNew={newExpenseIds.has(expense._id)}
                    >
                      <ExpenseCard
                        expense={expense}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isNew={newExpenseIds.has(expense._id)}
                      />
                    </ListItem>
                  ))}
                </AnimatedList>
                <Pagination
                  pagination={pagination}
                  onPageChange={(p) => setPage(p)}
                />
              </FadeInSection>
            )}
          </div>
        )
    }
  }

  /* ─────────────────────────────────────────
     Layout
  ───────────────────────────────────────── */
  return (
    <div className="flex h-screen bg-ink-50 overflow-hidden">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 lg:static lg:z-auto
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          active={activeSection}
          setActive={(section) => navigate(section === 'dashboard' ? '/dashboard' : `/dashboard/${section}`)}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar (mobile only) */}
        <header className="lg:hidden bg-white border-b border-ink-100 h-14 flex items-center px-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-ink-500 hover:bg-ink-100 transition-colors mr-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2 flex-1">
            <img src="/favicon.png" alt="Spendwise logo" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-bold text-ink-800">Spendwise</span>
          </div>
          {/* Dark mode toggle in mobile header */}
          <DarkModeToggle />
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard
