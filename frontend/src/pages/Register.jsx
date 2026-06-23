import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { sendRegisterOTP, verifyRegisterOTP } from '../api/client'
import hashPassword from '../utils/hashPassword'

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

// Validate any standard email format
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())

const LeftPanel = () => (
  <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#1e3825] p-12 text-white relative overflow-hidden">
    <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
    <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />
    <div className="flex items-center gap-3 relative z-10">
      <div className="w-10 h-10 bg-emerald-800/40 border border-emerald-500/30 rounded-xl flex items-center justify-center">
        <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <span className="text-xl font-bold tracking-tight text-white">Spendwise</span>
    </div>
    <div className="my-auto max-w-lg space-y-4 relative z-10">
      <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
        A smarter way to track <span className="text-emerald-400">expenses</span> and build better <span className="text-emerald-300 font-medium">financial habits</span>.
      </h2>
      <p className="text-emerald-200/80 text-lg">Start tracking with clarity and ease.</p>
    </div>
    <div className="grid grid-cols-2 gap-4 relative z-10">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
          </svg>
        </div>
        <p className="text-[10px] font-bold text-white tracking-wider uppercase mb-1">Smart Analytics</p>
        <p className="text-xs text-emerald-200/70 leading-relaxed">Deep insights on your monthly spending habits.</p>
      </div>
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
)

const Register = () => {
  const { register } = useAuth()
  const navigate     = useNavigate()

  // step 1 = fill form + send OTP, step 2 = enter OTP
  const [step, setStep] = useState(1)

  // Form fields
  const [form, setForm]               = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors]           = useState({})
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [sendingOTP, setSendingOTP]   = useState(false)

  // OTP step
  const [otp, setOtp]               = useState('')
  const [otpError, setOtpError]     = useState('')
  const [verifying, setVerifying]   = useState(false)
  const [resending, setResending]   = useState(false)

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setErrors((p) => ({ ...p, [e.target.name]: '' }))
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

  // Validate form fields
  const validate = () => {
    const e = {}
    if (!form.name.trim())             e.name     = 'Name is required.'
    if (!form.email.trim())            e.email    = 'Email is required.'
    else if (!isValidEmail(form.email)) e.email   = 'Please enter a valid email address.'
    if (!form.password)                e.password = 'Password is required.'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.'
    if (!form.confirm)                 e.confirm  = 'Please confirm your password.'
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match.'
    return e
  }

  // Step 1 submit — validate then send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault()
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return }

    setSendingOTP(true)
    try {
      await sendRegisterOTP({ email: form.email.trim() })
      toast.success(`OTP sent to ${form.email.trim()}! Check inbox or Spam/Junk folder.`, { duration: 6000 })
      setStep(2)
      setOtp('')
      setOtpError('')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP. Please try again.'
      if (msg.toLowerCase().includes('already')) {
        setErrors({ email: 'This email is already registered. Please sign in.' })
      } else if (msg.toLowerCase().includes('valid email')) {
        setErrors({ email: msg })
      } else {
        toast.error(msg)
      }
    } finally {
      setSendingOTP(false)
    }
  }

  // Resend OTP
  const handleResend = async () => {
    setResending(true)
    setOtpError('')
    try {
      await sendRegisterOTP({ email: form.email.trim() })
      toast.success('New OTP sent!')
      setOtp('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.')
    } finally {
      setResending(false)
    }
  }

  // Step 2 submit — verify OTP then create account
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault()
    if (!otp.trim()) { setOtpError('Please enter the OTP.'); return }
    if (otp.trim().length !== 6) { setOtpError('OTP must be exactly 6 digits.'); return }

    setVerifying(true)
    setOtpError('')

    try {
      // 1 — verify OTP
      await verifyRegisterOTP({ email: form.email.trim(), otp: otp.trim() })

      // 2 — create account (password hashed before sending)
      const hashedPassword = await hashPassword(form.password)
      const result = await register(form.name.trim(), form.email.trim(), hashedPassword, true)

      if (result.success) {
        toast.success('Account created! Please sign in.')
        navigate('/login')
      } else {
        toast.error(result.message || 'Registration failed.')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed.'
      setOtpError(msg)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-zinc-950 flex flex-row">
      <LeftPanel />

      {/* Right panel */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between items-center pt-8 bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
        
        {/* Top/Center content wrapper */}
        <div className="my-auto w-full max-w-[440px] px-6 py-8 flex flex-col justify-center">
          
          {/* Logo Brand Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-[#1e3825] rounded-2xl flex items-center justify-center mb-3 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 12h.01M3 10h18M10 14h4" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-ink-900 dark:text-zinc-100 tracking-tight">Spendwise</h1>
            <span className="text-[10px] font-bold text-ink-400 dark:text-zinc-500 tracking-[0.2em] uppercase mt-1">VERDANT PRECISION</span>
          </div>

          {step === 1 ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-ink-900 dark:text-zinc-100">Create Account</h2>
                <p className="text-sm text-ink-405 dark:text-zinc-400 mt-1 leading-relaxed">
                  Please enter your details to continue
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4" noValidate>
                {/* Name */}
                <div>
                  <label className="text-[10px] font-bold text-ink-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-zinc-500">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </span>
                    <input name="name" type="text" placeholder="Your full name"
                      value={form.name} onChange={handleChange} autoComplete="name"
                      style={{ paddingLeft: '44px', border: errors.name ? '1.5px solid #ef4444' : undefined }}
                      className="input-field" />
                  </div>
                  {errors.name && <p style={{ color:'#ef4444', fontSize:12, marginTop:4, fontWeight:500 }}>⚠ {errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="text-[10px] font-bold text-ink-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5 block">Email</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-zinc-500">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </span>
                    <input name="email" type="email" placeholder="name@company.com"
                      value={form.email} onChange={handleChange} autoComplete="email"
                      style={{ paddingLeft: '44px', border: errors.email ? '1.5px solid #ef4444' : undefined }}
                      className="input-field" />
                  </div>
                  {errors.email && <p style={{ color:'#ef4444', fontSize:12, marginTop:4, fontWeight:500 }}>⚠ {errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="text-[10px] font-bold text-ink-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5 block">Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-zinc-500">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                    <input name="password" type={showPass ? 'text' : 'password'}
                      placeholder="••••••••" value={form.password}
                      onChange={handleChange} autoComplete="new-password"
                      onCopy={(e) => e.preventDefault()} onPaste={(e) => e.preventDefault()}
                      onCut={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()}
                      onDrop={(e) => e.preventDefault()}
                      style={{ paddingLeft: '44px', paddingRight: 44, border: errors.password ? '1.5px solid #ef4444' : undefined }}
                      className="input-field" />
                    <button type="button" tabIndex={-1} onClick={() => setShowPass(p => !p)}
                      style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:0, color:'#9ca3af', display:'flex' }}>
                      <EyeIcon visible={showPass} />
                    </button>
                  </div>
                  {strength && (
                    <div style={{ marginTop:6 }}>
                      <div style={{ height:4, background:'#e5e7eb', borderRadius:4, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:strength.w, background:strength.color, borderRadius:4, transition:'width 0.3s' }} />
                      </div>
                      <p style={{ fontSize:11, color:strength.color, marginTop:2, fontWeight:500 }}>{strength.label} password</p>
                    </div>
                  )}
                  {errors.password && <p style={{ color:'#ef4444', fontSize:12, marginTop:4, fontWeight:500 }}>⚠ {errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-[10px] font-bold text-ink-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-zinc-500">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                    <input name="confirm" type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••" value={form.confirm}
                      onChange={handleChange} autoComplete="new-password"
                      onCopy={(e) => e.preventDefault()} onPaste={(e) => e.preventDefault()}
                      onCut={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()}
                      onDrop={(e) => e.preventDefault()}
                      style={{ paddingLeft: '44px', paddingRight: 44, border: errors.confirm ? '1.5px solid #ef4444' : undefined }}
                      className="input-field" />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(p => !p)}
                      style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:0, color:'#9ca3af', display:'flex' }}>
                      <EyeIcon visible={showConfirm} />
                    </button>
                  </div>
                  {form.confirm && (
                    <p style={{ fontSize:12, marginTop:4, fontWeight:500, color: form.confirm === form.password ? '#16a34a' : '#ef4444' }}>
                      {form.confirm === form.password ? '✅ Passwords match' : '❌ Passwords do not match'}
                    </p>
                  )}
                  {errors.confirm && <p style={{ color:'#ef4444', fontSize:12, marginTop:4, fontWeight:500 }}>⚠ {errors.confirm}</p>}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={sendingOTP}
                  className="w-full py-3 px-4 rounded-xl bg-[#1e3825] hover:bg-[#142619] text-white font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {sendingOTP ? 'Sending OTP…' : (
                    <>
                      Register
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                  )}
                </button>

                {/* OR CONTINUE WITH Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-ink-200 dark:border-zinc-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-50 dark:bg-zinc-950 px-3 text-[10px] font-bold text-ink-405 dark:text-zinc-500 tracking-wider">
                      OR CONTINUE WITH
                    </span>
                  </div>
                </div>

                {/* Google Button */}
                <button
                  type="button"
                  onClick={() => toast('Google Sign-In is not configured for local development.', { icon: 'ℹ️' })}
                  className="w-full py-3 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-ink-200 dark:border-zinc-800 text-ink-700 dark:text-zinc-300 font-semibold text-sm hover:bg-ink-50 dark:hover:bg-zinc-800 transition-colors duration-150 flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.13h3.99c2.33-2.14 3.54-5.3 3.54-8.75z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.99-3.13c-1.11.75-2.53 1.19-3.97 1.19-3.05 0-5.64-2.06-6.56-4.83H1.36v3.23C3.33 21.43 7.39 24 12 24z" />
                    <path fill="#FBBC05" d="M5.44 14.32a7.17 7.17 0 0 1 0-4.64V6.45H1.36a11.96 11.96 0 0 0 0 11.1l4.08-3.23z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.39 0 3.33 2.57 1.36 6.45l4.08 3.23c.92-2.77 3.51-4.93 6.56-4.93z" />
                  </svg>
                  Google
                </button>

                {/* Footer link */}
                <p className="text-center text-sm text-ink-500 dark:text-zinc-400 mt-6">
                  Already have an account?{' '}
                  <Link to="/login" className="text-sage font-bold hover:underline transition-colors">
                    Sign In
                  </Link>
                </p>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-ink-900 dark:text-zinc-100">Verify Your Email</h2>
                <p className="text-sm text-ink-405 dark:text-zinc-400 mt-1 leading-relaxed">
                  We sent a 6-digit OTP to{' '}
                  <strong className="text-ink-700 dark:text-zinc-300">{form.email}</strong>.
                  {' '}<span className="text-amber-500 font-medium">If not in inbox, check Spam folder.</span>
                </p>
              </div>

              <form onSubmit={handleVerifyAndRegister} className="space-y-4" noValidate>
                <div>
                  <label className="text-[10px] font-bold text-ink-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5 block">
                    One-Time Password (OTP)
                  </label>
                  <input
                    type="text" maxLength="6" placeholder="000000"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setOtpError('') }}
                    className="input-field font-mono text-center tracking-[10px] text-xl font-bold"
                    style={{ border: otpError ? '1.5px solid #ef4444' : undefined }}
                    autoFocus
                  />
                  {otpError && (
                    <p className="flex items-center gap-1 mt-2 text-xs font-medium text-red-500">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      </svg>
                      {otpError}
                    </p>
                  )}
                  <p className="text-xs text-ink-400 dark:text-zinc-500 mt-2">OTP expires in 10 minutes.</p>
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full py-3 px-4 rounded-xl bg-[#1e3825] hover:bg-[#142619] text-white font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {verifying ? 'Verifying…' : (
                    <>
                      Verify & Create Account
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center justify-between mt-4 text-xs">
                <button onClick={handleResend} disabled={resending}
                  className="text-sage font-semibold hover:underline disabled:opacity-50">
                  {resending ? 'Resending…' : 'Resend OTP'}
                </button>
                <button onClick={() => { setStep(1); setOtp(''); setOtpError('') }}
                  className="text-ink-400 dark:text-zinc-500 hover:underline font-medium">
                  ← Change email
                </button>
              </div>
            </>
          )}
        </div>

        {/* Leafy botanical image at the bottom */}
        <div className="w-full mt-auto flex justify-center z-10 pointer-events-none">
          <div className="w-full max-w-[440px] h-[160px] overflow-hidden rounded-t-[32px] border-t border-x border-sage/10 shadow-lg relative bg-white dark:bg-zinc-950">
            <img 
              src="/leaves.png" 
              alt="leaves decoration" 
              className="w-full h-full object-cover grayscale brightness-95 opacity-80 contrast-125 hover:grayscale-0 transition-all duration-700 pointer-events-auto cursor-pointer" 
            />
          </div>
        </div>

      </div>
    </div>
  )
}

export default Register
