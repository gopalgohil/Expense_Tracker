import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const EyeIcon = ({ visible }) => visible ? (
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
)

const eyeBtnStyle = {
  position: 'absolute',
  right: 12,
  top: '55%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  color: '#9ca3af',
  display: 'flex',
  alignItems: 'center',
}

const Register = () => {
  const [form, setForm]             = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors]         = useState({})
  const [showPass, setShowPass]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { register }                = useAuth()
  const navigate                    = useNavigate()

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setErrors((p) => ({ ...p, [e.target.name]: '' }))
  }

  const validateEmail = (email) => {
    if (!email || !email.trim()) {
      return 'Email is required.'
    }
    const emailRegex = /^[^\s@]+@gmail\.(com|in)$/i
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid Gmail address.'
    }
    return null
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())            e.name     = 'Name is required.'
    
    const emailError = validateEmail(form.email)
    if (emailError)                   e.email    = emailError

    if (!form.password)               e.password = 'Password is required.'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.'
    if (!form.confirm)                e.confirm  = 'Please confirm your password.'
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return }

    setSubmitting(true)
    const result = await register(form.name.trim(), form.email.trim(), form.password)
    setSubmitting(false)

    if (result.success) {
      toast.success(`Account created! Please sign in.`)
      navigate('/login')
    } else {
      const msg = result.message || ''
      if (msg.toLowerCase().includes('already')) {
        setErrors({ email: 'This email is already registered. Please sign in.' })
      } else {
        toast.error(msg || 'Registration failed. Please try again.')
      }
    }
  }

  // Password strength
  const strength = (() => {
    const p = form.password
    if (!p) return null
    let s = 0
    if (p.length >= 6)           s++
    if (p.length >= 10)          s++
    if (/[A-Z]/.test(p))        s++
    if (/[0-9]/.test(p))        s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    if (s <= 2) return { label: 'Weak',   color: '#ef4444', w: '33%'  }
    if (s <= 3) return { label: 'Medium', color: '#eab308', w: '66%'  }
    return              { label: 'Strong', color: '#22c55e', w: '100%' }
  })()

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-zinc-950 flex flex-row">
      {/* Left panel (desktop only) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-[#1e3825] p-12 text-white relative overflow-hidden">
        {/* Subtle background blurs */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />

        {/* Brand logo/text */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-emerald-800/40 border border-emerald-500/30 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Spendwise</span>
        </div>

        {/* Centered Main Heading */}
        <div className="my-auto max-w-lg space-y-4 relative z-10">
          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            A smarter way to track <span className="text-emerald-400">expenses</span> and build better <span className="text-emerald-350 font-medium">financial habits</span>.
          </h2>
          <p className="text-emerald-200/80 text-lg">
            Start tracking with clarity and ease.
          </p>
        </div>

        {/* Bottom Widgets */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {/* Smart Analytics */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
            </div>
            <p className="text-[10px] font-bold text-white tracking-wider uppercase mb-1">Smart Analytics</p>
            <p className="text-xs text-emerald-200/70 leading-relaxed">Deep insights on your monthly spending habits.</p>
          </div>

          {/* PDF/CSV Export */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
              </svg>
            </div>
            <p className="text-[10px] font-bold text-white tracking-wider uppercase mb-1">PDF / CSV Export</p>
            <p className="text-xs text-emerald-200/70 leading-relaxed">Generate elegant financial reports instantly.</p>
          </div>
        </div>
      </div>

      {/* Right panel (Form) */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center p-8 bg-zinc-50 dark:bg-zinc-950">
        
        {/* Mobile Logo */}
        <div className="lg:hidden text-center mb-8">
          <div className="w-11 h-11 bg-[#1e3825] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1e3825] dark:text-emerald-400 tracking-tight">Spendwise</h1>
        </div>

        <div className="card p-8 w-full max-w-[440px] shadow-lift border border-sage/20 dark:border-zinc-800">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-ink-800 dark:text-zinc-150">Create Account</h1>
            <p className="text-sm text-ink-400 dark:text-zinc-400 mt-1 leading-relaxed">
              Start tracking your expenses today.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name */}
            <div>
              <label className="text-[10px] font-bold text-ink-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5 block">
                Full Name
              </label>
              <input 
                name="name" 
                type="text" 
                placeholder="Your full name"
                value={form.name} 
                onChange={handleChange} 
                autoComplete="name"
                style={{
                  border: errors.name ? '1.5px solid #ef4444' : undefined,
                }}
                className="input-field" 
              />
              {errors.name && <p style={{ color:'#ef4444', fontSize:12, marginTop:4, fontWeight: 500 }}>⚠ {errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="text-[10px] font-bold text-ink-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5 block">
                Email Address
              </label>
              <input 
                name="email" 
                type="email" 
                placeholder="you@gmail.com"
                value={form.email} 
                onChange={handleChange} 
                autoComplete="email"
                style={{
                  border: errors.email ? '1.5px solid #ef4444' : undefined,
                }}
                className="input-field" 
              />
              {errors.email && <p style={{ color:'#ef4444', fontSize:12, marginTop:4, fontWeight: 500 }}>⚠ {errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] font-bold text-ink-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.password} 
                  onChange={handleChange}
                  autoComplete="new-password"
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  style={{
                    paddingRight: 44,
                    border: errors.password ? '1.5px solid #ef4444' : undefined,
                  }}
                  className="input-field"
                />
                <button 
                  type="button" 
                  tabIndex={-1}
                  onClick={() => setShowPass((p) => !p)}
                  style={eyeBtnStyle}
                >
                  <EyeIcon visible={showPass} />
                </button>
              </div>
              {/* Strength bar */}
              {strength && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 4, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: strength.w, background: strength.color, borderRadius: 4, transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ fontSize: 11, color: strength.color, marginTop: 2, fontWeight: 500 }}>{strength.label} password</p>
                </div>
              )}
              {errors.password && <p style={{ color:'#ef4444', fontSize:12, marginTop:4, fontWeight: 500 }}>⚠ {errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-[10px] font-bold text-ink-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5 block">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  name="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={form.confirm} 
                  onChange={handleChange}
                  autoComplete="new-password"
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  style={{
                    paddingRight: 44,
                    border: errors.confirm ? '1.5px solid #ef4444' : undefined,
                  }}
                  className="input-field"
                />
                <button 
                  type="button" 
                  tabIndex={-1}
                  onClick={() => setShowConfirm((p) => !p)}
                  style={eyeBtnStyle}
                >
                  <EyeIcon visible={showConfirm} />
                </button>
              </div>
              {/* Live match */}
              {form.confirm && (
                <p style={{ fontSize: 12, marginTop: 4, fontWeight: 500, color: form.confirm === form.password ? '#16a34a' : '#ef4444' }}>
                  {form.confirm === form.password ? '✅ Passwords match' : '❌ Passwords do not match'}
                </p>
              )}
              {errors.confirm && <p style={{ color:'#ef4444', fontSize:12, marginTop:4, fontWeight: 500 }}>⚠ {errors.confirm}</p>}
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-500 dark:text-zinc-400 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-sage font-semibold hover:text-sage-dark hover:underline transition-all duration-200">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Register
