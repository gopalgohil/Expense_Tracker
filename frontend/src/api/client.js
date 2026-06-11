import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ────────────────────────────────────────
export const register    = (data) => api.post('/auth/register', data)
export const login       = (data) => api.post('/auth/login', data)
export const getMe       = ()     => api.get('/auth/me')

// ── Expenses ─────────────────────────────────────
export const getExpenses    = (params)     => api.get('/expenses', { params })
export const createExpense  = (data)       => api.post('/expenses', data)
export const updateExpense  = (id, data)   => api.put(`/expenses/${id}`, data)
export const deleteExpense  = (id)         => api.delete(`/expenses/${id}`)

// ── Budgets ──────────────────────────────────────
export const getBudgets       = (params)     => api.get('/budgets', { params })
export const getBudgetStatus  = (params)     => api.get('/budgets/status', { params })
export const upsertBudget     = (data)       => api.post('/budgets', data)
export const deleteBudget     = (id)         => api.delete(`/budgets/${id}`)

// ── Analytics ────────────────────────────────────
export const getTopCategories  = (params) => api.get('/analytics/top-categories',  { params })
export const getMonthlyCompare = (params) => api.get('/analytics/monthly-compare', { params })
export const getDailyBreakdown = (params) => api.get('/analytics/daily-breakdown', { params })

export default api
