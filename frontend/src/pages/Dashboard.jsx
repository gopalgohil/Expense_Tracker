import { useState, useEffect, useRef } from 'react'
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
import BudgetPanel from './BudgetPanel'

const CATEGORIES = [
  '', 'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
  'Health', 'Utilities', 'Housing', 'Education', 'Travel', 'Other',
]

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const Dashboard = () => {
  const {
    expenses, allExpenses, loading, error,
    fetchExpenses, addExpense, editExpense, removeExpense,
  } = useExpenses()
  const { status, fetchBudgets, refreshStatus } = useBudgets()
  const { summary, topCats, dailyData, fetchAnalytics } = useAnalytics()

  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [filters, setFilters]             = useState({ month: currentMonth(), category: '' })
  const [addLoading, setAddLoading]       = useState(false)
  const notifiedRef = useRef(new Set())
  const formRef     = useRef(null)

  useEffect(() => {
    fetchExpenses(filters)
    fetchBudgets(filters.month)
    fetchAnalytics(filters.month)
    notifiedRef.current = new Set()
  }, [filters])

  // Toast when budget crosses 90%
  useEffect(() => {
    status.forEach((item) => {
      if (item.percent >= 90 && !notifiedRef.current.has(item.category)) {
        notifiedRef.current.add(item.category)
        const over = item.percent >= 100
        toast(
          over
            ? `🚨 ${item.category} is over budget! (${item.percent}%)`
            : `⚠️ ${item.category} is at ${item.percent}% of budget`,
          {
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
      await refreshStatus(filters.month)
      setActiveSection('dashboard')
    }
    setAddLoading(false)
    return result
  }

  const handleEdit = async (id, formData) => {
    const result = await editExpense(id, formData)
    if (result.success) await refreshStatus(filters.month)
    return result
  }

  const handleDelete = async (id) => {
    const result = await removeExpense(id)
    if (result.success) await refreshStatus(filters.month)
    return result
  }

  /* ─────────────────────────────────────────
     Content panels
  ───────────────────────────────────────── */

  const renderContent = () => {
    switch (activeSection) {

      /* ── Add Expense ── */
      case 'add-expense':
        return (
          <div className="max-w-lg mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-ink-800">Add Expense</h2>
              <p className="text-sm text-ink-400 mt-1">Record a new transaction</p>
            </div>
            <div className="card p-6">
              <ExpenseForm
                onSubmit={handleAdd}
                onCancel={() => setActiveSection('dashboard')}
                loading={addLoading}
              />
            </div>
          </div>
        )

      /* ── Budgets ── */
      case 'budgets':
        return <BudgetPanel month={filters.month} onMonthChange={(m) => setFilters((p) => ({ ...p, month: m }))} />

      /* ── Charts ── */
      case 'charts':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-ink-800">Charts</h2>
              <p className="text-sm text-ink-400 mt-1">Visual breakdown of your spending</p>
            </div>
            <div className="space-y-5">
              {expenses.length > 0 ? (
                <CategoryPieChart expenses={expenses} />
              ) : (
                <div className="card p-10 text-center">
                  <p className="text-ink-400 text-sm">No data for the selected period.</p>
                </div>
              )}
              {allExpenses.length > 0 && <MonthlyBarChart expenses={allExpenses} />}
            </div>
          </div>
        )

      /* ── Dashboard (default) ── */
      default:
        return (
          <div className="space-y-5">
            {/* Page header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-ink-800">Dashboard</h2>
                <p className="text-sm text-ink-400 mt-0.5">Track and manage your spending</p>
              </div>
              <div className="flex items-center gap-2">
                <ExportButtons filters={filters} />
                <button
                  onClick={() => setActiveSection('add-expense')}
                  className="btn-primary flex items-center gap-1.5 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add expense
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[140px]">
                  <label className="label">Month</label>
                  <input name="month" type="month" value={filters.month}
                    onChange={(e) => setFilters((p) => ({ ...p, month: e.target.value }))}
                    className="input-field" />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="label">Category</label>
                  <select name="category" value={filters.category}
                    onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
                    className="input-field bg-white">
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c || 'All categories'}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={() => setFilters({ month: currentMonth(), category: '' })}
                    className="btn-ghost text-sm py-3">Reset</button>
                </div>
              </div>
            </div>

            {/* Summary cards */}
            <SummaryCards summary={summary} topCats={topCats} />

            {/* Stats */}
            {!loading && expenses.length > 0 && <StatsBar expenses={expenses} />}

            {/* Budget progress */}
            {status.length > 0 && <BudgetProgress status={status} />}

            {/* Daily bar chart + month compare side by side on desktop */}
            {(dailyData.length > 0 || summary) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <DailyBarChart data={dailyData} />
                <MonthCompareChart summary={summary} />
              </div>
            )}

            {/* Expense list */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="card p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-24 bg-ink-100 rounded-full" />
                      <div className="h-4 w-32 bg-ink-100 rounded" />
                      <div className="ml-auto h-5 w-16 bg-ink-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="card p-8 text-center">
                <p className="text-coral text-sm font-medium">{error}</p>
                <button onClick={() => fetchExpenses(filters)} className="btn-ghost mt-3 text-sm">Try again</button>
              </div>
            ) : expenses.length === 0 ? (
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
                <button onClick={() => setActiveSection('add-expense')}
                  className="btn-primary mt-4 text-sm">Add expense</button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {expenses.map((expense) => (
                  <ExpenseCard key={expense._id} expense={expense}
                    onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
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
          setActive={setActiveSection}
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
            {/* Hamburger icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/favicon.png"
              alt="Spendwise logo"
              className="w-7 h-7 rounded-lg object-cover"
            />
            <span className="font-bold text-ink-800">Spendwise</span>
          </div>
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
