import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

import AnimatedChart from './animations/AnimatedChart'

import { useTheme } from '../context/ThemeContext'

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-zinc-800 border border-ink-100 dark:border-zinc-700 rounded-xl shadow-lift px-3 py-2 text-xs">
      <p className="font-medium text-ink-700 dark:text-zinc-200">Day {label}</p>
      <p className="text-ink-500 dark:text-zinc-400 font-mono mt-0.5">
        ₹{Number(payload[0].value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}

const DailyBarChart = ({ data, chartKey = 'daily' }) => {
  const { dark } = useTheme()
  if (!data?.length) return null

  const max = Math.max(...data.map((d) => d.total))
  const gridColor = dark ? '#2d3148' : '#e8e6df'
  const tickColor = dark ? '#9ca3af' : '#7a7670'
  const cursorColor = dark ? '#222538' : '#f5f4f0'

  return (
    <AnimatedChart chartKey={chartKey}>
      <div className="card p-5">
        <p className="label mb-4">Daily spending</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: tickColor }}
              axisLine={false} tickLine={false}
              interval={4}
              tickFormatter={(v) => `${v}`}
            />
            <YAxis
              tick={{ fontSize: 10, fill: tickColor }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
              width={44}
            />
            <Tooltip content={<Tip />} cursor={{ fill: cursorColor }} />
            <Bar
              dataKey="total"
              radius={[4, 4, 0, 0]}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.total === max && max > 0 ? '#e05a3a' : entry.total > 0 ? (dark ? '#3a6646' : '#4a7c59') : (dark ? '#252840' : '#e8e6df')}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-ink-400 dark:text-zinc-500 mt-2 text-right">
          Red bar = highest spend day
        </p>
      </div>
    </AnimatedChart>
  )
}

export default DailyBarChart
