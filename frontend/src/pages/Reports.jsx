import { useState, useEffect, useRef } from 'react'
import { useExpenses } from '../hooks/useExpenses'
import { useAnalytics } from '../hooks/useAnalytics'
import { useAuth } from '../context/AuthContext'
import CategoryPieChart from '../components/CategoryPieChart'
import MonthlyBarChart from '../components/MonthlyBarChart'
import DailyBarChart from '../components/DailyBarChart'
import MonthCompareChart from '../components/MonthCompareChart'
import ChartPdfButton from '../components/ChartPdfButton'
import FadeInSection from '../components/animations/FadeInSection'
import { ChartSkeleton } from '../components/animations/SkeletonLoader'

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const Reports = () => {
  const [month, setMonth] = useState(currentMonth())
  const { user } = useAuth()
  const chartsRef = useRef(null)
  const { expenses, allExpenses, loading: expensesLoading, fetchExpenses } = useExpenses()
  const { summary, dailyData, loading: analyticsLoading, error: analyticsError, fetchAnalytics } = useAnalytics()

  useEffect(() => {
    fetchExpenses({ month, limit: 1000 })
    fetchAnalytics(month)
  }, [month])

  useEffect(() => {
    const handleUpdate = () => {
      fetchExpenses({ month, limit: 1000 })
      fetchAnalytics(month)
    }
    window.addEventListener('expense-updated', handleUpdate)
    return () => window.removeEventListener('expense-updated', handleUpdate)
  }, [month, fetchExpenses, fetchAnalytics])

  const chartKey = `${month}`
  const loading = expensesLoading || analyticsLoading

  return (
    <div className="space-y-5">
      {/* Header */}
      <FadeInSection>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink-800 dark:text-zinc-200">Reports & Analytics</h2>
            <p className="text-sm text-ink-400 mt-1">Visual breakdown and trend analysis of your spending</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* PDF download — only shown when charts are loaded */}
            {!loading && (
              <ChartPdfButton
                chartsRef={chartsRef}
                month={month}
                userName={user?.name}
              />
            )}
            {/* Month picker */}
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-ink-150 dark:border-zinc-800 rounded-xl px-3 py-1.5 shadow-sm">
              <span className="text-xs font-semibold text-ink-500">Filter Month:</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border-0 bg-transparent text-sm font-semibold text-ink-700 dark:text-zinc-300 focus:ring-0 cursor-pointer p-0"
                max={currentMonth()}
              />
            </div>
          </div>
        </div>
      </FadeInSection>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ChartSkeleton height={260} />
          <ChartSkeleton height={260} />
          <ChartSkeleton height={260} />
          <ChartSkeleton height={260} />
        </div>
      ) : (
        <div className="space-y-5">
          {/* All charts wrapped in a ref so we can capture them for PDF */}
          <div ref={chartsRef} className="space-y-5">

            {/* Top Row: Pie chart and comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FadeInSection delay={0.05}>
              {expenses.length > 0 ? (
                <CategoryPieChart expenses={expenses} chartKey={chartKey} />
              ) : (
                <div className="card p-10 text-center h-full flex flex-col justify-center items-center">
                  <p className="text-ink-400 text-sm">No category breakdown data for {month}.</p>
                </div>
              )}
            </FadeInSection>

            <FadeInSection delay={0.1}>
              {summary && !analyticsError ? (
                <MonthCompareChart summary={summary} chartKey={chartKey} />
              ) : (
                <div className="card p-10 text-center h-full flex flex-col justify-center items-center">
                  <p className="text-ink-400 text-sm">No monthly comparison data available.</p>
                </div>
              )}
            </FadeInSection>
          </div>

          {/* Bottom Row: Daily bar chart and multi-month trend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FadeInSection delay={0.15}>
              {dailyData.length > 0 && !analyticsError ? (
                <DailyBarChart data={dailyData} chartKey={chartKey} />
              ) : (
                <div className="card p-10 text-center h-full flex flex-col justify-center items-center">
                  <p className="text-ink-400 text-sm">No daily spending records found for {month}.</p>
                </div>
              )}
            </FadeInSection>

            <FadeInSection delay={0.2}>
              {allExpenses.length > 0 ? (
                <MonthlyBarChart expenses={allExpenses} chartKey={chartKey} />
              ) : (
                <div className="card p-10 text-center h-full flex flex-col justify-center items-center">
                  <p className="text-ink-400 text-sm">No trend data available.</p>
                </div>
              )}
            </FadeInSection>
          </div>

          </div>{/* end chartsRef */}
        </div>
      )}
    </div>
  )
}

export default Reports
