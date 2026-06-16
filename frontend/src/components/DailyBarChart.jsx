import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useCurrency } from '../hooks/useCurrency'

import AnimatedChart from './animations/AnimatedChart'

const Tip = ({ active, payload, label }) => {
  const { formatMoney } = useCurrency()
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-ink-100 rounded-xl shadow-lift px-3 py-2 text-xs">
      <p className="font-medium text-ink-700">Day {label}</p>
      <p className="text-ink-500 font-mono mt-0.5">
        {formatMoney(payload[0].value)}
      </p>
    </div>
  )
}

const DailyBarChart = ({ data, chartKey = 'daily' }) => {
  const { currencySymbol } = useCurrency()
  if (!data?.length) return null

  const max = Math.max(...data.map((d) => d.total))

  return (
    <AnimatedChart chartKey={chartKey}>
      <div className="card p-5">
        <p className="label mb-4">Daily spending</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e6df" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: '#7a7670' }}
              axisLine={false} tickLine={false}
              interval={4}
              tickFormatter={(v) => `${v}`}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#7a7670' }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${currencySymbol}${(v / 1000).toFixed(0)}k` : `${currencySymbol}${v}`}
              width={44}
            />
            <Tooltip content={<Tip />} cursor={{ fill: '#f5f4f0' }} />
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
                  fill={entry.total === max && max > 0 ? '#e05a3a' : entry.total > 0 ? '#4a7c59' : '#e8e6df'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-ink-400 mt-2 text-right">
          Red bar = highest spend day
        </p>
      </div>
    </AnimatedChart>
  )
}

export default DailyBarChart
