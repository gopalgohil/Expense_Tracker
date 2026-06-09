import { useState, useEffect, useRef } from 'react'
import { useExpenses } from '../hooks/useExpenses'
import ExpenseCard      from '../components/ExpenseCard'
import ExpenseForm      from '../components/ExpenseForm'
import StatsBar         from '../components/StatsBar'
import Navbar           from '../components/Navbar'
import CategoryPieChart from '../components/CategoryPieChart'
import MonthlyBarChart  from '../components/MonthlyBarChart'

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

  const [filters, setFilters]       = useState({ month: currentMonth(), category: '' })
  const [showForm, setShowForm]     = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [activeTab, setActiveTab]   = useState('expenses') // 'expenses' | 'charts'
  const formRef = useRef(null)

  useEffect(() => { fetchExpenses(filters) }, [filters])

  const handleFilterChange = (e) =>
    setFilters((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleAdd = async (formData) => {
    setAddLoading(true)
    const result = await addExpense(formData)
    setAddLoading(false)
    if (result.success) setShowForm(false)
    return result
  }

  const handleShowForm = () => {
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-800">Dashboard</h2>
            <p className="text-sm text-ink-400">Manage and track your spending</p>
          </div>
          <button onClick={handleShowForm} className="btn-primary flex items-center gap-1.5 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add expense</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="label">Month</label>
              <input
                name="month" type="month" value={filters.month}
                onChange={handleFilterChange} className="input-field"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="label">Category</label>
              <select
                name="category" value={filters.category}
                onChange={handleFilterChange} className="input-field bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c || 'All categories'}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ month: currentMonth(), category: '' })}
                className="btn-ghost text-sm py-3"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        {!loading && expenses.length > 0 && <StatsBar expenses={expenses} />}

        {/* Add Form */}
        {showForm && (
          <div className="card p-5" ref={formRef}>
            <p className="label mb-4">New expense</p>
            <ExpenseForm
              onSubmit={handleAdd}
              onCancel={() => setShowForm(false)}
              loading={addLoading}
            />
          </div>
        )}

        {/* Tab switcher */}
        {!loading && !error && (expenses.length > 0 || allExpenses.length > 0) && (
          <div className="flex gap-1 bg-ink-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'expenses'
                  ? 'bg-white text-ink-800 shadow-card'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'charts'
                  ? 'bg-white text-ink-800 shadow-card'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              Charts
            </button>
          </div>
        )}

        {/* Loading skeletons */}
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
            <div className="w-10 h-10 bg-coral-soft rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-coral text-sm font-medium">{error}</p>
            <button onClick={() => fetchExpenses(filters)} className="btn-ghost mt-3 text-sm">
              Try again
            </button>
          </div>

        ) : activeTab === 'charts' ? (
          /* ── Charts tab ── */
          <div className="space-y-5">
            {/* Pie chart reacts to current filters */}
            {expenses.length > 0 ? (
              <CategoryPieChart expenses={expenses} />
            ) : (
              <div className="card p-8 text-center">
                <p className="text-ink-500 text-sm">No data for the selected filters.</p>
              </div>
            )}
            {/* Bar chart uses all-time data for trend */}
            {allExpenses.length > 0 && <MonthlyBarChart expenses={allExpenses} />}
          </div>

        ) : expenses.length === 0 ? (
          /* ── Empty state ── */
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
            {!showForm && (
              <button onClick={handleShowForm} className="btn-primary mt-4 text-sm">
                Add expense
              </button>
            )}
          </div>

        ) : (
          /* ── Expense list ── */
          <div className="space-y-2.5">
            {expenses.map((expense) => (
              <ExpenseCard
                key={expense._id}
                expense={expense}
                onEdit={editExpense}
                onDelete={removeExpense}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
