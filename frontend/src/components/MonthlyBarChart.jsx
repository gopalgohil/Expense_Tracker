import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

import AnimatedChart from './animations/AnimatedChart'

import { useTheme } from '../context/ThemeContext'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-zinc-800 border border-ink-100 dark:border-zinc-700 rounded-xl shadow-lift px-3 py-2 text-xs">
      <p className="font-medium text-ink-700 dark:text-zinc-200">{label}</p>
      <p className="text-ink-500 dark:text-zinc-400 font-mono mt-0.5">
        ₹{Number(payload[0].value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}

// Build last 6 months of data from the expenses array (all-time data needed)
const buildMonthlyData = (expenses) => {
  const map = {}
  expenses.forEach((e) => {
    const d = new Date(e.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    map[key] = (map[key] || 0) + e.amount
  })

  // Show all months that have data, sorted ascending
  return Object.entries(map)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([key, total]) => {
      const [year, month] = key.split('-')
      const label = new Date(Number(year), Number(month) - 1).toLocaleDateString('en-IN', {
        month: 'short', year: '2-digit',
      })
      return { month: label, total }
    })
}

const MonthlyBarChart = ({ expenses, chartKey = 'monthly' }) => {
  const { dark } = useTheme()
  const data = buildMonthlyData(expenses)

  if (!data.length) return null

  const gridColor = dark ? '#2d3148' : '#e8e6df'
  const tickColor = dark ? '#9ca3af' : '#7a7670'
  const cursorColor = dark ? '#222538' : '#f5f4f0'

  return (
    <AnimatedChart chartKey={chartKey}>
      <div className="card p-5">
        <p className="label mb-4">Monthly spending trend</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: tickColor }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: tickColor }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: cursorColor }} />
            <Bar
              dataKey="total"
              radius={[6, 6, 0, 0]}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={index === data.length - 1 ? '#4a7c59' : (dark ? '#2d4d3a' : '#c8dcd0')}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AnimatedChart>
  )
}

export default MonthlyBarChart
