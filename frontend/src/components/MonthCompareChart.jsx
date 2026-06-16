import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useCurrency } from '../hooks/useCurrency'

import AnimatedChart from './animations/AnimatedChart'

const Tip = ({ active, payload }) => {
  const { formatMoney } = useCurrency()
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-ink-100 rounded-xl shadow-lift px-3 py-2 text-xs space-y-1">
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-ink-600">{p.name}:</span>
          <span className="font-mono font-semibold text-ink-800">
            {formatMoney(p.value, 0)}
          </span>
        </div>
      ))}
    </div>
  )
}

const fmtMonth = (ym) => {
  if (!ym) return ''
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

const MonthCompareChart = ({ summary, chartKey = 'compare' }) => {
  const { currencySymbol } = useCurrency()
  if (!summary) return null

  const { currentMonth, previousMonth, currentTotal, previousTotal, changePercent } = summary

  const data = [
    {
      name:     'Spending',
      [fmtMonth(previousMonth)]: previousTotal,
      [fmtMonth(currentMonth)]:  currentTotal,
    },
  ]

  const currLabel = fmtMonth(currentMonth)
  const prevLabel = fmtMonth(previousMonth)

  return (
    <AnimatedChart chartKey={chartKey}>
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="label">Month comparison</p>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            changePercent > 0
              ? 'bg-red-50 text-red-500'
              : changePercent < 0
                ? 'bg-green-50 text-green-600'
                : 'bg-ink-50 text-ink-500'
          }`}>
            {changePercent > 0 ? '+' : ''}{changePercent}% vs last month
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barCategoryGap="40%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e6df" vertical={false} />
            <XAxis dataKey="name" hide />
            <YAxis
              tick={{ fontSize: 10, fill: '#7a7670' }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${currencySymbol}${(v / 1000).toFixed(0)}k` : `${currencySymbol}${v}`}
              width={44}
            />
            <Tooltip content={<Tip />} cursor={{ fill: '#f5f4f0' }} />
            <Legend
              formatter={(v) => <span className="text-xs text-ink-600">{v}</span>}
              iconType="circle" iconSize={8}
            />
            <Bar
              dataKey={prevLabel}
              fill="#c8dcd0"
              radius={[6, 6, 0, 0]}
              isAnimationActive
              animationDuration={700}
            />
            <Bar
              dataKey={currLabel}
              fill="#4a7c59"
              radius={[6, 6, 0, 0]}
              isAnimationActive
              animationDuration={700}
              animationBegin={150}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AnimatedChart>
  )
}

export default MonthCompareChart
