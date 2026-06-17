import { useState } from 'react'
import BudgetPanel from './BudgetPanel'

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const Budgets = () => {
  const [month, setMonth] = useState(currentMonth())

  return (
    <BudgetPanel month={month} onMonthChange={setMonth} />
  )
}

export default Budgets
