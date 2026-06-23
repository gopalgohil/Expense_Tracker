import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { login as apiLogin, register as apiRegister, logout as apiLogout, getMe, googleLogin as apiGoogleLogin } from '../api/client'
import api from '../api/client'
import hashPassword from '../utils/hashPassword'

const AuthContext = createContext(null)

// ── localStorage cache key for user profile ──
const USER_CACHE_KEY = 'sw_user_cache'

const readCache = () => {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

const writeCache = (user) => {
  try {
    if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_CACHE_KEY)
  } catch { /* quota exceeded — ignore */ }
}

export const AuthProvider = ({ children }) => {
  // Seed user synchronously from cache so the layout renders on first paint
  const cached = useRef(readCache())
  const [user, setUser]               = useState(cached.current)
  // initializing = true only when there is NO cached user (first visit / after logout)
  const [initializing, setInitializing] = useState(!cached.current)
  // sessionValidated = true once getMe() has confirmed the cookie is still valid
  const [sessionValidated, setSessionValidated] = useState(false)
  const [loading, setLoading]         = useState(false)

  const normalizeUser = (data) => ({
    _id:      data._id,
    name:     data.name,
    email:    data.email,
    avatar:   data.avatar   || null,
    currency: data.currency || 'INR',
  })

  // On mount: validate the HttpOnly cookie session in the background.
  // If cached user exists, the layout is already showing — we just confirm/refresh.
  useEffect(() => {
    // Remove old unrelated keys
    localStorage.removeItem('user')
    localStorage.removeItem('token')

    getMe()
      .then(({ data }) => {
        const fresh = normalizeUser(data)
        setUser(fresh)
        writeCache(fresh)
      })
      .catch((err) => {
        if (err?.response?.status !== 401) {
          console.error('Session restore failed:', err?.message)
        }
        // Cookie is gone / invalid — clear cache and force login
        writeCache(null)
        setUser(null)
      })
      .finally(() => {
        setInitializing(false)
        setSessionValidated(true)
      })
  }, [])

  const syncUser = (data) => {
    const u = normalizeUser(data)
    setUser(u)
    writeCache(u)
    return u
  }

  const login = async (email, password) => {
    setLoading(true)
    try {
      const hashedPassword = await hashPassword(password)
      const { data } = await apiLogin({ email, password: hashedPassword })
      const u = syncUser(data)
      setSessionValidated(true)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' }
    } finally { setLoading(false) }
  }

  const loginWithGoogle = async (idToken) => {
    setLoading(true)
    try {
      const { data } = await apiGoogleLogin({ idToken })
      const u = syncUser(data)
      setSessionValidated(true)
      return { success: true, isNewUser: data.isNewUser, name: data.name }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Google login failed' }
    } finally { setLoading(false) }
  }

  const register = async (name, email, password, preHashed = false) => {
    setLoading(true)
    try {
      const finalPassword = preHashed ? password : await hashPassword(password)
      await apiRegister({ name, email, password: finalPassword })
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
    try { await apiLogout() } catch (_) {}
    writeCache(null)
    setUser(null)
    setSessionValidated(false)
  }

  return (
    <AuthContext.Provider value={{
      user, login, loginWithGoogle, register, logout,
      loading, initializing, sessionValidated,
      updateUser, uploadAvatar,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
