import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const [form, setForm]   = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const { register, loading } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    const result = await register(form.name, form.email, form.password)
    if (result.success) navigate('/dashboard')
    else setError(result.message)
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
          <h1 className="text-xl font-semibold text-ink-800">Create your account</h1>
          <p className="text-sm text-ink-400 mt-1">Start tracking expenses today</p>
        </div>

        <div className="card p-6">
          {error && <div className="bg-coral-soft text-coral text-sm px-4 py-2.5 rounded-xl mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input name="name" type="text" placeholder="Your name"
                value={form.name} onChange={handleChange} className="input-field" required autoComplete="name" />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange} className="input-field" required autoComplete="email" />
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" placeholder="Min. 6 characters"
                value={form.password} onChange={handleChange} className="input-field" required autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-sage font-medium hover:text-sage-dark">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
