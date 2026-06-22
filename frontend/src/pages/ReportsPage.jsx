import { useState, useEffect, useRef, useCallback } from 'react'
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

const ReportsPage = () => {
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonth())
  const chartsRef = useRef(null)

  const { expenses, allExpenses, fetchExpenses } = useExpenses()
  const { summary, dailyData, loading, fetchAnalytics } = useAnalytics()

  const refresh = useCallback(() => {
    fetchExpenses({ month, limit: 9999 })
    fetchAnalytics(month)
  }, [month, fetchExpenses, fetchAnalytics])

  useEffect(() => { refresh() }, [refresh])

  const chartKey = month

  return (
    <div className="space-y-5">
      <FadeInSection>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink-800 dark:text-zinc-200">Reports</h2>
            <p className="text-sm text-ink-400 mt-0.5">Visual breakdown of your spending</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="input-field max-w-[160px]"
              max={currentMonth()}
            />
            <ChartPdfButton chartsRef={chartsRef} month={month} userName={user?.name} />
          </div>
        </div>
      </FadeInSection>

      <div ref={chartsRef} className="space-y-5">
        {loading ? (
          <>
            <ChartSkeleton height={260} />
            <ChartSkeleton />
          </>
        ) : (
          <>
            {expenses.length > 0 && (
              <FadeInSection delay={0.05}>
                <CategoryPieChart expenses={expenses} chartKey={chartKey} />
              </FadeInSection>
            )}
            {allExpenses.length > 0 && (
              <FadeInSection delay={0.1}>
                <MonthlyBarChart expenses={allExpenses} chartKey={chartKey} />
              </FadeInSection>
            )}
            <FadeInSection delay={0.15}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <DailyBarChart data={dailyData} chartKey={chartKey} />
                <MonthCompareChart summary={summary} chartKey={chartKey} />
              </div>
            </FadeInSection>
          </>
        )}
      </div>
    </div>
  )
}

export default ReportsPage
