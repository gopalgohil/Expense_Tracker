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
  const [error,     setError]     = useState(null)

  const fetchAnalytics = useCallback(async (month) => {
    setLoading(true)
    setError(null)
    try {
      const [cmp, top, daily] = await Promise.all([
        getMonthlyCompare({ month }),
        getTopCategories({ month }),
        getDailyBreakdown({ month }),
      ])
      setSummary(cmp.data)
      setTopCats(top.data)
      setDailyData(daily.data)
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  return { summary, topCats, dailyData, loading, error, fetchAnalytics }
}
