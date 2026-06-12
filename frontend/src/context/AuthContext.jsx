import { createContext, useContext, useState } from 'react'
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/client'
import api from '../api/client'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  // User display info (name, email, avatar) stored in localStorage — NOT sensitive
  // Token is stored in HttpOnly cookie by the server — JS cannot access it
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const syncUser = (data) => {
    const u = {
      _id:      data._id,
      name:     data.name,
      email:    data.email,
      avatar:   data.avatar   || null,
      currency: data.currency || 'INR',
    }
    localStorage.setItem('user', JSON.stringify(u))   // only display info, no token
    setUser(u)
    return u
  }

  const login = async (email, password) => {
    setLoading(true)
    try {
      const { data } = await apiLogin({ email, password })
      // Server automatically sets jwt token in HttpOnly cookie
      // We only save display info to localStorage
      syncUser(data)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' }
    } finally { setLoading(false) }
  }

  const register = async (name, email, password) => {
    setLoading(true)
    try {
      // Register only creates the account — don't set user state
      // User must explicitly log in after registration
      await apiRegister({ name, email, password })
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
      // Server clears the HttpOnly jwt cookie
      await apiLogout()
    } catch (_) {}
    // Clear display info from localStorage
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser, uploadAvatar }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
