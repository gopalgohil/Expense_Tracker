import { useState, useCallback } from 'react'
import {
  getTopCategories,
  getMonthlyCompare,
  getDailyBreakdown,
} from '../api/client'

export const useAnalytics = () => {
  const [summary,   setSummary]   = useState(null)
  const [topCats,   setTopCats]   = useState([])
  const [dailyData, setDailyData] = useState([])
  const [loading,   setLoading]   = useState(false)

  const fetchAnalytics = useCallback(async (month) => {
    setLoading(true)
    try {
      const [cmp, top, daily] = await Promise.all([
        getMonthlyCompare({ month }),
        getTopCategories({ month }),
        getDailyBreakdown({ month }),
      ])
      setSummary(cmp.data)
      setTopCats(top.data)
      setDailyData(daily.data)
    } catch (_) {
      // fail silently — analytics is additive
    } finally {
      setLoading(false)
    }
  }, [])

  return { summary, topCats, dailyData, loading, fetchAnalytics }
}
