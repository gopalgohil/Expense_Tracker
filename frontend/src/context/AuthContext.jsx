import { createContext, useContext, useState } from 'react'
import { login as apiLogin, register as apiRegister } from '../api/client'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    setLoading(true)
    try {
      const { data } = await apiLogin({ email, password })
      const u = { _id: data._id, name: data.name, email: data.email }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(u))
      setUser(u)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' }
    } finally { setLoading(false) }
  }

  const register = async (name, email, password) => {
    setLoading(true)
    try {
      const { data } = await apiRegister({ name, email, password })
      const u = { _id: data._id, name: data.name, email: data.email }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(u))
      setUser(u)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' }
    } finally { setLoading(false) }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
