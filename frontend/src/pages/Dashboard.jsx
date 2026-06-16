import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useExpenses }      from '../hooks/useExpenses'
import { useBudgets }       from '../hooks/useBudgets'
import { useAnalytics }     from '../hooks/useAnalytics'
import Sidebar              from '../components/Sidebar'
import Navbar               from '../components/Navbar'
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
import DateRangeSelector    from '../components/DateRangeSelector'
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
  const { status, loading: budgetsLoading, fetchBudgets, refreshStatus } = useBudgets()
  const { summary, topCats, dailyData, loading: analyticsLoading, error: analyticsError, fetchAnalytics } = useAnalytics()

  const location = useLocation()
  const navigate = useNavigate()
  const activeSection = (() => {
    const path = location.pathname.replace(/\/$/, '')
    if (path === '/expenses')    return 'expenses'
    if (path === '/add-expense') return 'add-expense'
    if (path === '/budgets')     return 'budgets'
    if (path === '/charts')      return 'charts'
    if (path === '/settings')    return 'settings'
    return 'dashboard'
  })()
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [filters,    setFilters]    = useState({ category: '' })
  const [dateRangeType, setDateRangeType] = useState('monthly')
  const [month, setMonth] = useState(currentMonth())
  const [year, setYear] = useState(() => String(new Date().getFullYear()))
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' })
  const [search,     setSearch]     = useState('')
  const [advanced,   setAdvanced]   = useState(DEFAULT_ADVANCED)
  const [page,       setPage]       = useState(1)
  const [addLoading, setAddLoading] = useState(false)
  const [newExpenseIds, setNewExpenseIds] = useState(new Set())

  // Build full params object for API
  const buildParams = useCallback(() => {
    const p = { category: filters.category, page, limit: 5, sortBy: advanced.sortBy }
    if (search)              p.search    = search
    if (advanced.minAmount)  p.minAmount = advanced.minAmount
    if (advanced.maxAmount)  p.maxAmount = advanced.maxAmount

    if (dateRangeType === 'monthly') {
      p.month = month
    } else if (dateRangeType === 'yearly') {
      p.year = year
    } else if (dateRangeType === 'custom') {
      if (customRange.startDate) p.startDate = customRange.startDate
      if (customRange.endDate) p.endDate = customRange.endDate
    } else if (dateRangeType === 'all') {
      p.allTime = 'true'
    }
    return p
  }, [filters.category, page, advanced.sortBy, search, advanced.minAmount, advanced.maxAmount, dateRangeType, month, year, customRange])

  // Helper to refresh all dashboard data (expenses, budgets, and analytics cards/charts)
  const refreshAllData = useCallback(async () => {
    await Promise.all([
      fetchExpenses(buildParams()),
      fetchBudgets(month),
      fetchAnalytics(buildParams()),
    ])
  }, [fetchExpenses, buildParams, fetchBudgets, fetchAnalytics, month])

  // Fetch expenses whenever any filter/search/sort/page changes
  useEffect(() => {
    fetchExpenses(buildParams())
  }, [filters.category, search, advanced, page, dateRangeType, month, year, customRange])

  // Fetch budgets + analytics only when DATE parameters change
  useEffect(() => {
    fetchBudgets(month)
    fetchAnalytics(buildParams())
  }, [dateRangeType, month, year, customRange])

  // Toast when budget crosses 90% — only fire once per category per session/page refresh
  useEffect(() => {
    if (!status.length) return
    status.forEach((item) => {
      const storageKey = `budget-notified-${month}-${item.category}`
      const alreadyNotified = sessionStorage.getItem(storageKey)

      if (item.percent >= 90) {
        if (!alreadyNotified) {
          sessionStorage.setItem(storageKey, 'true')
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
      } else {
        // Reset if it drops below 90% (e.g. user deleted or edited an expense)
        sessionStorage.removeItem(storageKey)
      }
    })
  }, [status, month])

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
    setFilters({ category: '' })
    setDateRangeType('monthly')
    setMonth(currentMonth())
    setYear(String(new Date().getFullYear()))
    setCustomRange({ startDate: '', endDate: '' })
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

  const chartKey = `${dateRangeType}-${month}-${year}-${customRange.startDate}-${customRange.endDate}-${filters.category}-${search}`

  /* ─────────────────────────────────────────
     Content panels
   ───────────────────────────────────────── */

  const renderContent = () => {
    switch (activeSection) {

      /* ── Add Expense ── */
      case 'add-expense':
        return (
          <FadeInSection>
            <div className="w-full mt-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-ink-800">Add Expense</h2>
                <p className="text-sm text-ink-400 mt-1">Record a new transaction</p>
              </div>
              <motion.div
                className="card p-8 md:p-10"
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
        return <BudgetPanel month={month} onMonthChange={(m) => setMonth(m)} />

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
              {loading ? (
                <>
                  <ChartSkeleton height={260} />
                  <ChartSkeleton height={220} />
                </>
              ) : expenses.length > 0 ? (
                <>
                  <CategoryPieChart expenses={expenses} chartKey={chartKey} />
                  {allExpenses.length > 0 && (
                    <MonthlyBarChart expenses={allExpenses} chartKey={chartKey} />
                  )}
                </>
              ) : (
                <FadeInSection>
                  <div className="card p-10 text-center">
                    <p className="text-ink-400 text-sm">No data for the selected period.</p>
                  </div>
                </FadeInSection>
              )}
            </div>
          </div>
        )

      /* ── Expenses List Page ── */
      case 'expenses':
        return (
          <div className="space-y-5">
            <FadeInSection>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-ink-800">Expenses</h2>
                  <p className="text-sm text-ink-400 mt-0.5">Filter, search, and manage your transactions</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-start">
                  <ExportButtons filters={{ dateRangeType, month, year, startDate: customRange.startDate, endDate: customRange.endDate, category: filters.category }} />
                  <HoverButton
                    onClick={() => navigate('/add-expense')}
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

            <FadeInSection delay={0.06}>
              <SearchFilterBar
                search={search}
                onSearchChange={(v) => { setSearch(v); setPage(1) }}
                month={month}
                onMonthChange={(m) => { setMonth(m); setPage(1) }}
                dateRangeType={dateRangeType}
                onDateRangeTypeChange={(t) => { setDateRangeType(t); setPage(1) }}
                year={year}
                onYearChange={(y) => { setYear(y); setPage(1) }}
                customRange={customRange}
                onCustomRangeChange={(r) => { setCustomRange(r); setPage(1) }}
                category={filters.category}
                onCategoryChange={(c) => { setFilters((p) => ({ ...p, category: c })); setPage(1) }}
                advanced={advanced}
                onAdvancedChange={(v) => { setAdvanced((p) => ({ ...p, ...v })); setPage(1) }}
                onReset={handleResetAll}
              />
            </FadeInSection>

            {loading ? (
              <StatsBarSkeleton />
            ) : expenses.length > 0 ? (
              <FadeInSection delay={0.12}>
                <StatsBar expenses={expenses} />
              </FadeInSection>
            ) : null}

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
                    {filters.category || dateRangeType !== 'monthly' || month !== currentMonth()
                      ? 'Try adjusting your filters'
                      : 'Add your first expense to get started'}
                  </p>
                  <HoverButton onClick={() => navigate('/add-expense')}
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

      /* ── Dashboard (default) ── */
      default:
        return (
          <div className="space-y-5">
            <FadeInSection>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-ink-800">Dashboard</h2>
                  <p className="text-sm text-ink-400 mt-0.5">Track and manage your spending</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 self-start sm:self-auto min-w-[280px] sm:min-w-[400px]">
                  <DateRangeSelector
                    dateRangeType={dateRangeType}
                    onDateRangeTypeChange={(t) => { setDateRangeType(t); setPage(1) }}
                    month={month}
                    onMonthChange={(m) => { setMonth(m); setPage(1) }}
                    year={year}
                    onYearChange={(y) => { setYear(y); setPage(1) }}
                    customRange={customRange}
                    onCustomRangeChange={(r) => { setCustomRange(r); setPage(1) }}
                  />
                </div>
              </div>
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
                  <HoverButton onClick={() => fetchAnalytics(buildParams())} className="btn-ghost mt-3 text-xs py-1.5 px-4">
                    Try again
                  </HoverButton>
                </div>
              </FadeInSection>
            ) : (
              <FadeInSection delay={0.1}>
                <SummaryCards summary={summary} topCats={topCats} />
              </FadeInSection>
            )}

            {budgetsLoading ? (
              <BudgetSkeleton />
            ) : status.length > 0 ? (
              <FadeInSection delay={0.14}>
                <BudgetProgress status={status} />
              </FadeInSection>
            ) : null}

            {!analyticsError && (analyticsLoading || dailyData.length > 0 || summary) && (
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

            <FadeInSection delay={0.18}>
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-bold text-ink-800">Recent Expenses</h3>
                </div>
                {loading ? (
                  <ExpenseListSkeleton count={3} />
                ) : expenses.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-ink-400 text-sm">No expenses recorded for this period.</p>
                    <HoverButton
                      onClick={() => navigate('/add-expense')}
                      className="btn-primary mt-3 text-xs py-1.5"
                    >
                      Add expense
                    </HoverButton>
                  </div>
                ) : (
                  <>
                    <AnimatedList className="space-y-2.5">
                      {expenses.slice(0, 3).map((expense, index) => (
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
                    <div className="mt-4 pt-4 border-t border-ink-100 flex justify-center">
                      <HoverButton
                        onClick={() => navigate('/expenses')}
                        className="btn-ghost text-xs py-2 px-6 border border-ink-200 text-ink-600 hover:text-ink-800 hover:bg-ink-50 font-semibold rounded-xl flex items-center gap-1.5"
                      >
                        View All Expenses
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </HoverButton>
                    </div>
                  </>
                )}
              </div>
            </FadeInSection>
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
          setActive={(section) => navigate(section === 'dashboard' ? '/dashboard' : `/${section}`)}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Navbar */}
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          activeSection={activeSection}
        />

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
