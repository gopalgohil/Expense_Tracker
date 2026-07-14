import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

import AnimatedChart from './animations/AnimatedChart'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
}

const Tip = ({ active, payload, symbol }) => {
  if (!active || !payload?.length) return null
  const locale = symbol === '₹' ? 'en-IN' : 'en-US'
  return (
    <div className="bg-white dark:bg-zinc-800 border border-ink-100 dark:border-zinc-700 rounded-xl shadow-lift px-3 py-2 text-xs space-y-1">
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-ink-600 dark:text-zinc-400">{p.name}:</span>
          <span className="font-mono font-semibold text-ink-800 dark:text-zinc-200">
            {symbol}{Number(p.value).toLocaleString(locale, { minimumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </div>
  )
}

const fmtMonth = (ym) => {
  if (!ym) return ''
  if (ym.includes('-') && ym.split('-').length === 2 && !isNaN(ym.split('-')[0])) {
    const [y, m] = ym.split('-').map(Number)
    return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
  }
  return ym
}

const MonthCompareChart = ({ summary, chartKey = 'compare' }) => {
  const { dark } = useTheme()
  const { user } = useAuth()
  if (!summary) return null

  const baseCurrency = user?.currency || 'INR'
  const symbol = CURRENCY_SYMBOLS[baseCurrency] || baseCurrency || '₹'

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

  const gridColor = dark ? '#2d3148' : '#e8e6df'
  const tickColor = dark ? '#9ca3af' : '#7a7670'
  const cursorColor = dark ? '#222538' : '#f5f4f0'

  return (
    <AnimatedChart chartKey={chartKey}>
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="label">Month comparison</p>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            changePercent > 0
              ? 'bg-red-50 dark:bg-red-950/30 text-red-500'
              : changePercent < 0
                ? 'bg-green-50 dark:bg-green-950/30 text-green-600'
                : 'bg-ink-50 dark:bg-zinc-800 text-ink-500'
          }`}>
            {changePercent > 0 ? '+' : ''}{changePercent}% vs last month
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barCategoryGap="40%">
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="name" hide />
            <YAxis
              tick={{ fontSize: 10, fill: tickColor }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${symbol}${(v / 1000).toFixed(0)}k` : `${symbol}${v}`}
              width={44}
            />
            <Tooltip content={<Tip symbol={symbol} />} cursor={{ fill: cursorColor }} />
            <Legend
              formatter={(v) => <span className="text-xs text-ink-600 dark:text-zinc-400">{v}</span>}
              iconType="circle" iconSize={8}
            />
            <Bar
              dataKey={prevLabel}
              fill={dark ? '#2d4d3a' : '#c8dcd0'}
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
