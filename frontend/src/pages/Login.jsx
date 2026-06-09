import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [form, setForm]        = useState({ email: '', password: '' })
  const [passwordError, setPasswordError] = useState('')
  const { login, loading }     = useAuth()
  const navigate               = useNavigate()

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setPasswordError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(form.email, form.password)

    if (result.success) {
      navigate('/dashboard')
    } else {
      const msg = result.message || ''

      if (msg.toLowerCase().includes('no account') || msg.toLowerCase().includes('register')) {
        // User not registered → show toast notification
        toast.error('User not registered! Please create an account first.', {
          icon: '🚫',
          style: {
            background: '#fff',
            color: '#0f0e0c',
            border: '1px solid #fcd9d0',
          },
        })
      } else {
        // Wrong password → show red text under password field
        setPasswordError(msg || 'Incorrect password. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="w-11 h-11 bg-sage rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-ink-800">Sign in to Spendwise</h1>
          <p className="text-sm text-ink-400 mt-1">Track every rupee, stress-free</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                name="email" type="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange}
                className="input-field" required autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                name="password" type="password" placeholder="••••••••"
                value={form.password} onChange={handleChange}
                className={`input-field ${passwordError ? 'border-red-400' : ''}`}
                required autoComplete="current-password"
              />
              {passwordError && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor"
                    strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {passwordError}
                </p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-400 mt-4">
          No account?{' '}
          <Link to="/register" className="text-sage font-medium hover:text-sage-dark">
            Create one
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Login
