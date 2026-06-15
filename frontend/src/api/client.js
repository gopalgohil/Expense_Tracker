import axios from 'axios'

const api = axios.create({
  baseURL:          import.meta.env.VITE_API_URL || '/api',
  headers:          { 'Content-Type': 'application/json' },
  withCredentials:  true,   // send cookies with every request
})

// Request interceptor to attach Bearer token fallback for cross-site cookie restrictions
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Auto-logout on 401
const SKIP_REDIRECT = ['/user/delete-account', '/user/change-password', '/auth/me', '/auth/login', '/auth/register']

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url       = err.config?.url || ''
    const pathname  = window.location.pathname
    const isSkipped = SKIP_REDIRECT.some((path) => url.includes(path))
    const onAuthPage = pathname === '/login' || pathname === '/register'

    if (err.response?.status === 401 && !isSkipped && !onAuthPage) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ────────────────────────────────────────
export const register = (data) => api.post('/auth/register', data)
export const login    = (data) => api.post('/auth/login',    data)
export const logout   = ()     => api.post('/auth/logout')
export const getMe    = ()     => api.get('/auth/me')

// ── Expenses ─────────────────────────────────────
export const getExpenses    = (params)   => api.get('/expenses',    { params })
export const createExpense  = (data)     => api.post('/expenses',   data)
export const updateExpense  = (id, data) => api.put(`/expenses/${id}`, data)
export const deleteExpense  = (id)       => api.delete(`/expenses/${id}`)

// ── Budgets ──────────────────────────────────────
export const getBudgets      = (params)   => api.get('/budgets',          { params })
export const getBudgetStatus = (params)   => api.get('/budgets/status',   { params })
export const upsertBudget    = (data)     => api.post('/budgets',          data)
export const deleteBudget    = (id)       => api.delete(`/budgets/${id}`)

// ── Analytics ────────────────────────────────────
export const getTopCategories  = (params) => api.get('/analytics/top-categories',  { params })
export const getMonthlyCompare = (params) => api.get('/analytics/monthly-compare', { params })
export const getDailyBreakdown = (params) => api.get('/analytics/daily-breakdown', { params })

// ── User Profile ─────────────────────────────────
export const getUserProfile    = ()       => api.get('/user/profile')
export const updateUserProfile = (data)   => api.put('/user/profile',         data)
export const changePassword    = (data)   => api.put('/user/change-password', data)
export const deleteAccount     = (data)   => api.delete('/user/delete-account', { data })

export default api
