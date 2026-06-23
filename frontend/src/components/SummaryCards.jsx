import { motion } from 'framer-motion'
import CountUpNumber from './animations/CountUpNumber'
import FadeInSection from './animations/FadeInSection'

const fmt = (n) => Number(n)

const SummaryCards = ({ summary, topCats }) => {
  if (!summary) return null

  const { currentTotal, changePercent, avgDailySpend } = summary
  const top = topCats?.[0]

  const changeUp   = changePercent > 0
  const changeZero = changePercent === 0

  const cards = [
    {
      label: 'Total Spent',
      numeric: currentTotal,
      prefix: '₹',
      decimals: 0,
      sub: 'This month',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-sage-light text-sage',
    },
    {
      label: 'Top Category',
      text: top ? top.category : '—',
      sub: top ? `₹${fmt(top.total).toLocaleString('en-IN')}` : 'No data',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      color: 'bg-amber-soft text-amber-strong',
    },
    {
      label: 'vs Last Month',
      text: changeZero
        ? 'No change'
        : `${changeUp ? '+' : ''}${changePercent}%`,
      sub: changeUp
        ? 'Spending increased'
        : changeZero ? 'Same as last month' : 'Spending decreased',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d={changeUp
              ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
              : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'} />
        </svg>
      ),
      color: changeZero
        ? 'bg-ink-50 text-ink-500'
        : changeUp
          ? 'bg-red-50 text-red-500'
          : 'bg-green-50 text-green-600',
      valueColor: changeZero
        ? 'text-ink-800'
        : changeUp ? 'text-red-500' : 'text-green-600',
    },
    {
      label: 'Avg Daily Spend',
      numeric: avgDailySpend,
      prefix: '₹',
      decimals: 0,
      sub: 'Per day this month',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-blue-50 text-blue-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => {
        const isHero = card.label === 'Total Spent'
        return (
          <FadeInSection key={card.label} delay={i * 0.08}>
            <motion.div
              className={`card p-4 flex flex-col gap-3 h-full hover:shadow-lift transition-all duration-300 relative overflow-hidden ${
                isHero 
                  ? 'bg-gradient-to-br from-[#1e3825] via-[#162f1e] to-[#0f2214] text-white border-emerald-800/40 shadow-lg shadow-emerald-950/20' 
                  : ''
              }`}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              {/* Glowing Background Blur for Hero Card */}
              {isHero && (
                <div className="absolute top-[-30%] right-[-20%] w-[130px] h-[130px] rounded-full bg-emerald-400/20 blur-[30px] pointer-events-none animate-pulse" />
              )}

              <div className="flex items-center justify-between relative z-10">
                <p className={`text-xs font-medium uppercase tracking-wider ${isHero ? 'text-emerald-300/90' : 'text-ink-400 dark:text-zinc-500'}`}>
                  {card.label}
                </p>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isHero ? 'bg-white/10 text-emerald-300 border border-white/10' : card.color
                }`}>
                  {card.icon}
                </div>
              </div>
              <div className="relative z-10">
                <p className={`text-xl font-bold font-mono ${
                  isHero ? 'text-white' : (card.valueColor || 'text-ink-800 dark:text-zinc-150')
                }`}>
                  {card.numeric != null ? (
                    <>
                      {card.prefix}
                      <CountUpNumber value={card.numeric} decimals={card.decimals} />
                    </>
                  ) : card.text}
                </p>
                <p className={`text-xs mt-0.5 ${isHero ? 'text-emerald-200/70' : 'text-ink-400 dark:text-zinc-500'}`}>
                  {card.sub}
                </p>
              </div>
            </motion.div>
          </FadeInSection>
        )
      })}
    </div>
  )
}

export default SummaryCards
