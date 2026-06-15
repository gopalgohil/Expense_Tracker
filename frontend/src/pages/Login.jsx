import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [form, setForm]         = useState({ email: '', password: '' })
  const [errors, setErrors]     = useState({})
  const [showPass, setShowPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { login, user, initializing } = useAuth()
  const navigate                = useNavigate()

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="w-8 h-8 border-2 border-sage border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Already logged in → go to dashboard
  if (user) { navigate('/dashboard', { replace: true }); return null }

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setErrors((p) => ({ ...p, [e.target.name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Client validation — keep errors visible
    const newErrors = {}
    if (!form.email.trim())    newErrors.email    = 'Email is required.'
    if (!form.password.trim()) newErrors.password = 'Password is required.'
    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    const result = await login(form.email.trim(), form.password)
    setSubmitting(false)

    if (result.success) {
      navigate('/dashboard')
      return
    }

    const msg = result.message || ''

    if (
      msg.toLowerCase().includes('no account') ||
      msg.toLowerCase().includes('register')   ||
      msg.toLowerCase().includes('not found')
    ) {
      // Unregistered email — show toast (stays 6 seconds)
      toast.error('🚫 No account found! Please register first.', {
        duration: 6000,
        style: {
          background: '#fff1f0',
          color: '#991b1b',
          border: '1px solid #fca5a5',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          padding: '14px 18px',
        },
      })
    } else {
      // Wrong password — show red text under field (stays until user types)
      setErrors({ password: '❌ ' + (msg || 'Incorrect password. Please try again.') })
    }
  }

  const busy = submitting  // don't use global loading — that blocks the button on mount

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-11 h-11 bg-sage rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-ink-800">Sign in to Spendwise</h1>
          <p className="text-sm text-ink-400 mt-1">Track every rupee, stress-free</p>
        </div>

        <div className="card p-6">
          {/* Use div + onClick instead of form submit to avoid any browser navigation */}
          <div className="space-y-4">

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                autoComplete="email"
                style={{
                  border: errors.email ? '1.5px solid #ef4444' : undefined,
                }}
                className="input-field"
              />
              {errors.email && (
                <p style={{ color: '#dc2626', fontSize: 12, marginTop: 5, fontWeight: 500 }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                  autoComplete="current-password"
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  style={{
                    paddingRight: 44,
                    border: errors.password ? '1.5px solid #ef4444' : undefined,
                  }}
                  className="input-field"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: 0,
                    color: '#9ca3af', display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPass ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {/* Red error — stays until user types again */}
              {errors.password && (
                <p style={{
                  color: '#dc2626', fontSize: 13, marginTop: 6,
                  fontWeight: 500, padding: '6px 10px',
                  background: '#fff1f0', borderRadius: 8,
                  border: '1px solid #fca5a5',
                }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Sign in button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={busy}
              className="btn-primary w-full"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-ink-400 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-sage font-medium hover:text-sage-dark">
            Register here
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Login
