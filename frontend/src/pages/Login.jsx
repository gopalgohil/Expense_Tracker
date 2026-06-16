import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
}

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
    <div className="min-h-screen flex bg-white dark:bg-[#0f1117] text-ink-800 dark:text-gray-200 font-sans transition-colors duration-300">
      {/* Left side (gradient hero with sage theme) */}
      <div className="hidden md:flex md:w-[45%] flex-col justify-between p-12 bg-gradient-to-b from-[#2d4a3e] to-[#1a2d25] border-r border-ink-100 dark:border-gray-800 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/5 filter blur-[120px] pointer-events-none" />

        {/* Logo at top */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-white font-bold tracking-wide text-lg">Spendwise</span>
        </div>

        {/* Center hero */}
        <div className="my-auto space-y-5 relative z-10">
          <h1 className="text-4xl lg:text-[40px] font-black text-white leading-tight tracking-tight">
            A smarter way to track <span className="bg-gradient-to-r from-emerald-300 to-sage bg-clip-text text-transparent">expenses</span> and build better <span className="bg-gradient-to-r from-sage to-white bg-clip-text text-transparent">financial habits.</span>
          </h1>
          <p className="text-sm text-emerald-100/80 leading-relaxed max-w-md">
            Start tracking with clarity and ease.
          </p>
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
          {/* Smart Analytics Card */}
          <div className="p-5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md hover:border-white/30 transition-all duration-300 group">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mb-3 group-hover:bg-white/20 transition-all">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-white mb-1 tracking-wide uppercase">Smart Analytics</h3>
            <p className="text-[11px] text-emerald-100/70 leading-normal">Deep insights on your monthly spending habits.</p>
          </div>

          {/* PDF / CSV Export Card */}
          <div className="p-5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md hover:border-white/30 transition-all duration-300 group">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mb-3 group-hover:bg-white/20 transition-all">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-white mb-1 tracking-wide uppercase">PDF / CSV Export</h3>
            <p className="text-[11px] text-emerald-100/70 leading-normal">Generate elegant financial reports instantly.</p>
          </div>
        </div>
      </div>

      {/* Right side (Form) */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:px-16 lg:px-24 bg-white dark:bg-[#0f1117] transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md p-[1.5px] rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-xl group"
        >
          {/* Glowing Animated Gradient Border */}
          <div className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden z-0">
            <motion.div
              className="absolute bg-[conic-gradient(from_0deg,#34d399,#80c8a8,#059669,#34d399)] opacity-70 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                width: '300%',
                height: '300%',
                top: '-100%',
                left: '-100%',
              }}
              animate={{
                rotate: [0, 360]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>

          {/* Inner content wrapper */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 bg-white dark:bg-[#11131e] rounded-[22.5px] p-8 space-y-6"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl font-extrabold text-ink-850 dark:text-white tracking-tight">Sign In</h2>
              <p className="text-sm text-ink-400 dark:text-gray-400 mt-1.5">Welcome back! Enter your details to access your account</p>
            </motion.div>

            <div className="space-y-4">
              {/* Email */}
              <motion.div variants={itemVariants}>
                <label className="label">Email Address</label>
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                  autoComplete="email"
                  className={`input-field ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">⚠ {errors.email}</p>}
              </motion.div>

              {/* Password */}
              <motion.div variants={itemVariants}>
                <div className="flex justify-between items-center mb-2">
                  <label className="label mb-0">Password</label>
                  <Link to="/forgot-password" className="text-xs text-sage hover:text-sage-dark font-medium transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
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
                    className={`input-field pr-12 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:hover:text-white transition-colors"
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
                {errors.password && (
                  <p className="text-xs text-red-500 mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    {errors.password}
                  </p>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={busy}
                  className="btn-primary w-full h-12 flex items-center justify-center gap-2 mt-4"
                >
                  {busy ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : 'Sign In'}
                </button>
              </motion.div>
            </div>

            <motion.p variants={itemVariants} className="text-center text-sm text-ink-400 dark:text-gray-400 pt-2">
              Don't have an account?{' '}
              <Link to="/register" className="text-sage hover:text-sage-dark font-semibold transition-colors">
                Create Account
              </Link>
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default Login
