import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, register as apiRegister, logout as apiLogout, getMe } from '../api/client'
import api from '../api/client'
import hashPassword from '../utils/hashPassword'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  // Profile lives in memory only — jwt + user_id are HttpOnly cookies set by the server
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const [loading, setLoading] = useState(false)

  const normalizeUser = (data) => ({
    _id:      data._id,
    name:     data.name,
    email:    data.email,
    avatar:   data.avatar   || null,
    currency: data.currency || 'INR',
  })

  // Restore session from cookie on refresh — fetch profile from API
  useEffect(() => {
    // Remove legacy auth keys from localStorage
    localStorage.removeItem('user')
    localStorage.removeItem('token')

    getMe()
      .then(({ data }) => setUser(normalizeUser(data)))
      .catch(() => setUser(null))
      .finally(() => setInitializing(false))
  }, [])

  const syncUser = (data) => {
    const u = normalizeUser(data)
    setUser(u)
    return u
  }

  const login = async (email, password) => {
    setLoading(true)
    try {
      const hashedPassword = await hashPassword(password)
      const { data } = await apiLogin({ email, password: hashedPassword })
      syncUser(data)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' }
    } finally { setLoading(false) }
  }

  const register = async (name, email, password) => {
    setLoading(true)
    try {
      const hashedPassword = await hashPassword(password)
      await apiRegister({ name, email, password: hashedPassword })
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' }
    } finally { setLoading(false) }
  }

  const updateUser = (data) => syncUser(data)

  const uploadAvatar = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const { data } = await api.put('/auth/avatar', { avatar: e.target.result })
          syncUser(data)
          resolve({ success: true })
        } catch (err) {
          resolve({ success: false, message: err.response?.data?.message || 'Upload failed' })
        }
      }
      reader.onerror = () => resolve({ success: false, message: 'Failed to read image' })
      reader.readAsDataURL(file)
    })
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch (_) {}
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, initializing, updateUser, uploadAvatar }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
