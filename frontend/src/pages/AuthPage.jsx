/**
 * AuthPage — unified login/register page
 * Left: fixed hero panel (never re-renders)
 * Right: animated form card (slides between Sign In and Register)
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate }           from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast                     from 'react-hot-toast'
import { useAuth }               from '../context/AuthContext'
import {
  sendRegisterOTP, verifyRegisterOTP,
  forgotPassword, verifyOTP, resetPassword,
} from '../api/client'
import hashPassword from '../utils/hashPassword'

/* ── Eye icon ── */
const Eye = ({ on }) => on ? (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

/* ── Field ── */
const Field = ({ label, name, type='text', value, onChange, placeholder, error, autoComplete, eye, ...rest }) => (
  <div>
    <label className="label">{label}</label>
    <div style={{ position:'relative' }}>
      <input name={name} type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
        className={`input-field ${error ? 'border-red-400' : ''}`}
        style={eye ? { paddingRight:40 } : {}}
        {...rest} />
      {eye && (
        <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)' }}>
          {eye}
        </div>
      )}
    </div>
    {error && <p style={{ color:'#dc2626', fontSize:12, marginTop:4 }}>⚠ {error}</p>}
  </div>
)

/* ── Spinner button ── */
const SubmitBtn = ({ busy, label, busyLabel }) => (
  <button type="submit" disabled={busy} className="btn-primary w-full flex items-center justify-center gap-2">
    {busy ? (
      <>
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        {busyLabel}
      </>
    ) : label}
  </button>
)

/* ── Password strength ── */
const Strength = ({ pwd }) => {
  if (!pwd) return null
  let s = 0
  if (pwd.length >= 6)           s++
  if (pwd.length >= 10)          s++
  if (/[A-Z]/.test(pwd))        s++
  if (/[0-9]/.test(pwd))        s++
  if (/[^A-Za-z0-9]/.test(pwd)) s++
  const cfg = s <= 2 ? { l:'Weak', c:'#ef4444', w:'33%' }
            : s <= 3 ? { l:'Medium', c:'#eab308', w:'66%' }
            :          { l:'Strong', c:'#22c55e', w:'100%' }
  return (
    <div style={{ marginTop:5 }}>
      <div style={{ height:3, background:'#e5e7eb', borderRadius:4, overflow:'hidden' }}>
        <motion.div style={{ height:'100%', background:cfg.c, borderRadius:4 }}
          animate={{ width:cfg.w }} transition={{ duration:0.3 }} />
      </div>
      <p style={{ fontSize:11, color:cfg.c, marginTop:2, fontWeight:500 }}>{cfg.l} password</p>
    </div>
  )
}

/* ═══════════════════════════════════════
   SIGN IN FORM
═══════════════════════════════════════ */
const SignInForm = ({ onSwitch, onForgot, prefillEmail = '' }) => {
  const [form,   setForm]   = useState({ email: prefillEmail, password:'' })
  const [errors, setErrors] = useState({})
  const [show,   setShow]   = useState(false)
  const [busy,   setBusy]   = useState(false)
  const { login }           = useAuth()

  const change = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setErrors(p => ({ ...p, [e.target.name]: '' }))
  }

  const submit = async e => {
    e.preventDefault()
    const errs = {}
    if (!form.email.trim())    errs.email    = 'Email is required.'
    if (!form.password.trim()) errs.password = 'Password is required.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    // Guard: browser password manager occasionally autofills with a
    // previously-seen bcrypt hash. Catch it early with a clear message.
    if (form.password.trim().startsWith('$2')) {
      setErrors({ password: 'Invalid password detected. Please type your password manually.' })
      return
    }

    setBusy(true)
    const res = await login(form.email.trim(), form.password.trim())
    setBusy(false)

    if (res.success) return

    const msg = res.message || ''
    if (msg.toLowerCase().includes('no account') || msg.toLowerCase().includes('register')) {
      toast.error('🚫 No account found! Please register first.', {
        duration: 5000,
        style: { background:'#fff1f0', color:'#991b1b', border:'1px solid #fca5a5', borderRadius:'12px' },
      })
    } else {
      setErrors({ password: '❌ ' + (msg || 'Incorrect password. Please try again.') })
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Email" name="email" type="email" value={form.email}
        onChange={change} placeholder="you@example.com"
        autoComplete="email" error={errors.email} />

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="label mb-0">Password</label>
          <button
            type="button"
            onClick={onForgot}
            className="text-xs text-sage hover:text-sage-dark font-semibold transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <div style={{ position:'relative' }}>
          <input name="password" type={show ? 'text' : 'password'} value={form.password}
            onChange={change} placeholder="Enter your password"
            autoComplete="current-password"
            className={`input-field ${errors.password ? 'border-red-400' : ''}`}
            style={{ paddingRight:40 }} />
          <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)' }}>
            <button type="button" tabIndex={-1} onClick={() => setShow(p => !p)}
              style={{ background:'none', border:'none', cursor:'pointer', padding:0, color:'#9ca3af', display:'flex' }}>
              <Eye on={show}/>
            </button>
          </div>
        </div>
        {errors.password && <p style={{ color:'#dc2626', fontSize:12, marginTop:4 }}>⚠ {errors.password}</p>}
      </div>

      <SubmitBtn busy={busy} label="Sign in" busyLabel="Signing in…" />

      <p className="text-center text-sm text-ink-400">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitch}
          className="text-sage font-semibold hover:text-sage-dark transition-colors">
          Register here
        </button>
      </p>
    </form>
  )
}

/* ═══════════════════════════════════════
   FORGOT PASSWORD FORM  (3-step flow)
═══════════════════════════════════════ */
const ForgotPasswordForm = ({ onBack, onSuccess }) => {
  const [step,        setStep]        = useState(1)   // 1 → email, 2 → OTP, 3 → new password
  const [email,       setEmail]       = useState('')
  const [otp,         setOtp]         = useState('')
  const [newPass,     setNewPass]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors,      setErrors]      = useState({})
  const [busy,        setBusy]        = useState(false)

  /* ── Step 1: send OTP ── */
  const handleSendOTP = async e => {
    e.preventDefault()
    setErrors({})
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim())                       { setErrors({ email: 'Email address is required.' }); return }
    if (!emailRegex.test(email.trim()))      { setErrors({ email: 'Please enter a valid email address.' }); return }

    setBusy(true)
    try {
      const res = await forgotPassword({ email: email.trim() })
      toast.success(res.data?.message || 'OTP sent to your email!')
      setStep(2)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP. Please try again.'
      setErrors({ email: msg })
    } finally {
      setBusy(false)
    }
  }

  /* ── Step 2: verify OTP ── */
  const handleVerifyOTP = async e => {
    e.preventDefault()
    setErrors({})
    if (!otp.trim())            { setErrors({ otp: 'OTP code is required.' }); return }
    if (otp.trim().length !== 6){ setErrors({ otp: 'OTP must be exactly 6 digits.' }); return }

    setBusy(true)
    try {
      const res = await verifyOTP({ email: email.trim(), otp: otp.trim() })
      toast.success(res.data?.message || 'OTP verified!')
      setStep(3)
    } catch (err) {
      const msg = err.response?.data?.message || 'Incorrect OTP. Please try again.'
      setErrors({ otp: msg })
    } finally {
      setBusy(false)
    }
  }

  /* ── Step 3: set new password ── */
  const handleResetPassword = async e => {
    e.preventDefault()
    setErrors({})

    const trimmedNew     = newPass.trim()
    const trimmedConfirm = confirmPass.trim()

    const errs = {}
    if (!trimmedNew)               errs.newPass = 'New password is required.'
    else if (trimmedNew.length < 6) errs.newPass = 'Password must be at least 6 characters.'
    if (!trimmedConfirm)            errs.confirm = 'Please confirm your new password.'
    else if (trimmedConfirm !== trimmedNew) errs.confirm = 'Passwords do not match.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setBusy(true)
    try {
      const hashedNew = await hashPassword(trimmedNew)
      const res = await resetPassword({
        email:       email.trim(),
        otp:         otp.trim(),
        newPassword: hashedNew,   // SHA-256 hashed — must match what login sends
      })
      toast.success(res.data?.message || 'Password reset successfully!')
      onSuccess(email.trim())
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password.'
      setErrors({ general: msg })
    } finally {
      setBusy(false)
    }
  }

  /* ── Step indicator ── */
  const steps = ['Email', 'Verify', 'Reset']

  return (
    <div className="space-y-5">

      {/* Step breadcrumb */}
      <div className="flex items-center justify-center gap-2 mb-1">
        {steps.map((label, i) => {
          const idx = i + 1
          const done    = idx < step
          const current = idx === step
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done    ? 'bg-sage text-white'
                : current ? 'bg-sage/20 text-sage border-2 border-sage'
                :           'bg-gray-100 text-gray-400 border-2 border-gray-200'
              }`}>
                {done ? '✓' : idx}
              </div>
              <span className={`text-xs font-semibold ${
                current ? 'text-sage' : done ? 'text-sage/70' : 'text-gray-400'
              }`}>{label}</span>
              {i < steps.length - 1 && (
                <div className={`w-6 h-0.5 rounded ${done ? 'bg-sage/60' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Step 1: Email ── */}
      {step === 1 && (
        <form onSubmit={handleSendOTP} className="space-y-4" noValidate>
          <p className="text-xs text-ink-500 dark:text-zinc-400 leading-relaxed">
            Enter your registered email address and we'll send you a 6-digit OTP to reset your password.
          </p>
          <Field
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErrors({}) }}
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email}
          />
          <SubmitBtn busy={busy} label="Send OTP" busyLabel="Sending OTP…" />
          <button type="button" onClick={onBack}
            className="btn-ghost w-full text-sm text-center">
            ← Back to Sign In
          </button>
        </form>
      )}

      {/* ── Step 2: OTP ── */}
      {step === 2 && (
        <form onSubmit={handleVerifyOTP} className="space-y-4" noValidate>
          <p className="text-xs text-ink-500 dark:text-zinc-400 leading-relaxed">
            We sent a 6-digit code to <strong className="text-ink-700 dark:text-zinc-300">{email}</strong>.
            Check your inbox and enter it below.
          </p>
          <div>
            <label className="label">One-Time Password (OTP)</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setErrors({}) }}
              placeholder="000000"
              className={`input-field font-mono text-center tracking-[10px] text-xl font-bold ${errors.otp ? 'border-red-400' : ''}`}
            />
            {errors.otp && <p style={{ color:'#dc2626', fontSize:12, marginTop:4 }}>⚠ {errors.otp}</p>}
          </div>
          <SubmitBtn busy={busy} label="Verify OTP" busyLabel="Verifying…" />
          <div className="flex items-center justify-between text-xs mt-1">
            <button type="button"
              onClick={() => { setStep(1); setOtp(''); setErrors({}) }}
              className="text-ink-400 hover:text-ink-600 dark:text-zinc-500 dark:hover:text-zinc-300 font-medium transition-colors">
              ← Change email
            </button>
            <button type="button"
              onClick={handleSendOTP}
              disabled={busy}
              className="text-sage hover:text-sage-dark font-semibold transition-colors disabled:opacity-50">
              Resend OTP
            </button>
          </div>
        </form>
      )}

      {/* ── Step 3: New Password ── */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
          <p className="text-xs text-ink-500 dark:text-zinc-400 leading-relaxed">
            OTP verified ✓ — Choose a new password for your account.
          </p>

          {errors.general && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              ⚠ {errors.general}
            </div>
          )}

          <div>
            <label className="label">New Password</label>
            <div style={{ position:'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPass}
                onChange={e => { setNewPass(e.target.value); setErrors({}) }}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                className={`input-field ${errors.newPass ? 'border-red-400' : ''}`}
                style={{ paddingRight:40 }}
              />
              <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)' }}>
                <button type="button" tabIndex={-1} onClick={() => setShowNew(p => !p)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:0, color:'#9ca3af', display:'flex' }}>
                  <Eye on={showNew}/>
                </button>
              </div>
            </div>
            {errors.newPass && <p style={{ color:'#dc2626', fontSize:12, marginTop:4 }}>⚠ {errors.newPass}</p>}
            <Strength pwd={newPass.trim()} />
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <div style={{ position:'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPass}
                onChange={e => { setConfirmPass(e.target.value); setErrors({}) }}
                placeholder="Re-enter new password"
                autoComplete="new-password"
                className={`input-field ${errors.confirm ? 'border-red-400' : ''}`}
                style={{ paddingRight:40 }}
              />
              <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)' }}>
                <button type="button" tabIndex={-1} onClick={() => setShowConfirm(p => !p)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:0, color:'#9ca3af', display:'flex' }}>
                  <Eye on={showConfirm}/>
                </button>
              </div>
            </div>
            {errors.confirm && <p style={{ color:'#dc2626', fontSize:12, marginTop:4 }}>⚠ {errors.confirm}</p>}
            {confirmPass && (
              <p style={{ fontSize:12, marginTop:3,
                color: confirmPass.trim() === newPass.trim() ? '#16a34a' : '#dc2626' }}>
                {confirmPass.trim() === newPass.trim() ? '✅ Passwords match' : '❌ Do not match'}
              </p>
            )}
          </div>

          <SubmitBtn busy={busy} label="Reset Password" busyLabel="Resetting…" />
        </form>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════
   REGISTER FORM
═══════════════════════════════════════ */
const RegisterForm = ({ onSwitch }) => {
  const [form,   setForm]   = useState({ name:'', email:'', password:'', confirm:'' })
  const [errors, setErrors] = useState({})
  const [showP,  setShowP]  = useState(false)
  const [showC,  setShowC]  = useState(false)
  const [busy,   setBusy]   = useState(false)
  const { register }        = useAuth()

  // OTP Verification States
  const [step, setStep]           = useState('register') // 'register' or 'otp'
  const [otp, setOtp]             = useState(['', '', '', '', '', ''])
  const [timer, setTimer]         = useState(30)
  const [resending, setResending] = useState(false)
  const [otpError, setOtpError]   = useState('')
  const inputRefs                 = useRef([])

  useEffect(() => {
    let interval
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [step, timer])

  const change = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setErrors(p => ({ ...p, [e.target.name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())              e.name     = 'Name is required.'
    
    const emailTrimmed = form.email.trim()
    if (!emailTrimmed) {
      e.email = 'Email is required.'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
      if (!emailRegex.test(emailTrimmed)) {
        e.email = 'Please enter a valid email address.'
      }
    }

    if (!form.password)                 e.password = 'Password is required.'
    else if (form.password.length < 6)  e.password = 'Minimum 6 characters.'
    if (!form.confirm)                  e.confirm  = 'Please confirm your password.'
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match.'
    return e
  }

  // Handle registration submit (Send OTP)
  const submitRegister = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setBusy(true)
    try {
      const res = await sendRegisterOTP({ email: form.email.trim() })
      toast.success(res.data?.message || 'Verification OTP sent to your email!')
      setStep('otp')
      setTimer(30)
      setOtp(['', '', '', '', '', ''])
      setOtpError('')
      setTimeout(() => {
        if (inputRefs.current[0]) inputRefs.current[0].focus()
      }, 100)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send verification email. Please try again.'
      if (msg.toLowerCase().includes('already')) {
        setErrors({ email: 'Email already registered. Please sign in.' })
      } else {
        toast.error(msg)
      }
    } finally {
      setBusy(false)
    }
  }

  // Handle OTP digit changes
  const handleOtpChange = (val, index) => {
    if (isNaN(val)) return;
    const newOtp = [...otp]
    newOtp[index] = val.slice(-1) // keep last digit entered
    setOtp(newOtp)
    setOtpError('')

    // Auto focus next input
    if (val !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace/navigation keys
  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        // focus previous and clear it
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        inputRefs.current[index - 1]?.focus()
      } else if (otp[index] !== '') {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle OTP pasting
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const data = e.clipboardData.getData('text').trim()
    if (data.length === 6 && /^\d+$/.test(data)) {
      const digits = data.split('')
      setOtp(digits)
      setOtpError('')
      inputRefs.current[5]?.focus()
    }
  }

  // Resend OTP
  const resendOTP = async () => {
    if (timer > 0 || resending) return
    setResending(true)
    try {
      const res = await sendRegisterOTP({ email: form.email.trim() })
      toast.success(res.data?.message || 'A new verification OTP has been sent!')
      setTimer(30)
      setOtp(['', '', '', '', '', ''])
      setOtpError('')
      setTimeout(() => {
        if (inputRefs.current[0]) inputRefs.current[0].focus()
      }, 100)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.')
    } finally {
      setResending(false)
    }
  }

  // Verify OTP and complete Registration
  const verifyAndRegister = async e => {
    e.preventDefault()
    const otpString = otp.join('')
    if (otpString.length < 6) {
      setOtpError('Please enter the full 6-digit verification code.')
      return
    }

    setBusy(true)
    setOtpError('')
    try {
      // 1. Verify OTP
      await verifyRegisterOTP({ email: form.email.trim(), otp: otpString })
      
      // 2. Complete Registration
      const res = await register(form.name.trim(), form.email.trim(), form.password)
      if (res.success) {
        toast.success('Account created successfully! Please sign in.')
        onSwitch() // Switch to Login view
      } else {
        toast.error(res.message || 'Registration failed.')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP verification failed. Please try again.'
      setOtpError(msg)
    } finally {
      setBusy(false)
    }
  }

  const EyeBtn = ({ show, toggle }) => (
    <button type="button" tabIndex={-1} onClick={toggle}
      style={{ background:'none', border:'none', cursor:'pointer', padding:0, color:'#9ca3af', display:'flex' }}>
      <Eye on={show}/>
    </button>
  )

  if (step === 'otp') {
    return (
      <form onSubmit={verifyAndRegister} className="space-y-5" noValidate>
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-sage/10 text-sage rounded-full flex items-center justify-center text-xl font-bold">
            ✉
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sage">Email Verification</p>
          <p className="text-sm text-ink-500">
            We have sent a 6-digit verification code to<br />
            <strong className="text-ink-800 break-all">{form.email.trim()}</strong>
          </p>
        </div>

        <div className="space-y-2">
          <label className="label text-center block">Enter 6-Digit Code</label>
          <div className="grid grid-cols-6 gap-2 max-w-[280px] mx-auto">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={el => (inputRefs.current[idx] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={e => handleOtpChange(e.target.value, idx)}
                onKeyDown={e => handleOtpKeyDown(e, idx)}
                onPaste={idx === 0 ? handleOtpPaste : undefined}
                className="w-10 h-12 text-center text-xl font-bold bg-white border border-ink-200 rounded-xl focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all duration-150 dark:bg-[#1e2130] dark:border-[#374151] dark:text-[#e8e6df] dark:focus:border-[#4a7c59]"
                autoComplete="off"
                inputMode="numeric"
                pattern="[0-9]*"
              />
            ))}
          </div>
          {otpError && (
            <p className="text-center text-red-600 text-xs mt-2 font-medium">
              ⚠ {otpError}
            </p>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <SubmitBtn busy={busy} label="Verify & Create Account" busyLabel="Verifying & Creating…" />
          
          <div className="flex flex-col items-center justify-center space-y-2 text-sm">
            <button
              type="button"
              onClick={resendOTP}
              disabled={timer > 0 || resending}
              className={`font-semibold transition-colors ${
                timer > 0 || resending
                  ? 'text-ink-300 cursor-not-allowed'
                  : 'text-sage hover:text-sage-dark'
              }`}
            >
              {resending ? 'Sending...' : timer > 0 ? `Resend code in ${timer}s` : 'Resend Code'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('register')
                setOtp(['', '', '', '', '', ''])
                setOtpError('')
              }}
              className="text-ink-400 hover:text-ink-600 text-xs underline transition-colors"
            >
              Change email / edit details
            </button>
          </div>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={submitRegister} className="space-y-3.5" noValidate>
      <Field label="Full Name" name="name" value={form.name} onChange={change}
        placeholder="Your full name" autoComplete="name" error={errors.name} />

      <Field label="Email Address" name="email" type="email" value={form.email}
        onChange={change} placeholder="you@example.com"
        autoComplete="email" error={errors.email} />

      <div>
        <Field label="Password" name="password" type={showP ? 'text' : 'password'}
          value={form.password} onChange={change} placeholder="Min. 6 characters"
          autoComplete="new-password" error={errors.password}
          eye={<EyeBtn show={showP} toggle={() => setShowP(p => !p)}/>}
          onCopy={e => e.preventDefault()}
          onPaste={e => e.preventDefault()}
          onCut={e => e.preventDefault()}
          onDragStart={e => e.preventDefault()}
          onDrop={e => e.preventDefault()}
          draggable={false} />
        <Strength pwd={form.password} />
      </div>

      <div>
        <Field label="Confirm Password" name="confirm" type={showC ? 'text' : 'password'}
          value={form.confirm} onChange={change} placeholder="Re-enter password"
          autoComplete="new-password" error={errors.confirm}
          eye={<EyeBtn show={showC} toggle={() => setShowC(p => !p)}/>}
          onCopy={e => e.preventDefault()}
          onPaste={e => e.preventDefault()}
          onCut={e => e.preventDefault()}
          onDragStart={e => e.preventDefault()}
          onDrop={e => e.preventDefault()}
          draggable={false} />
        {form.confirm && (
          <p style={{ fontSize:12, marginTop:3,
            color: form.confirm === form.password ? '#16a34a' : '#dc2626' }}>
            {form.confirm === form.password ? '✅ Passwords match' : '❌ Do not match'}
          </p>
        )}
      </div>

      <SubmitBtn busy={busy} label="Create Account" busyLabel="Sending OTP…" />

      <p className="text-center text-sm text-ink-400">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch}
          className="text-sage font-semibold hover:text-sage-dark transition-colors">
          Sign in
        </button>
      </p>
    </form>
  )
}

/* ═══════════════════════════════════════
   MAIN AUTH PAGE
═══════════════════════════════════════ */
const FEATURES = [
  { icon:'📊', text:'Track expenses by category' },
  { icon:'💰', text:'Set monthly budgets & alerts' },
  { icon:'📈', text:'Visualise spending trends' },
  { icon:'🔄', text:'Recurring expenses auto-added' },
  { icon:'📥', text:'Export to CSV & PDF' },
]

const AuthPage = ({ mode = 'login' }) => {
  const [view, setView] = useState(mode)
  const { user, initializing } = useAuth()
  const navigate = useNavigate()
  const toLogin    = useCallback(() => setView('login'),    [])
  const toRegister = useCallback(() => setView('register'), [])
  const toForgot   = useCallback(() => setView('forgot'),   [])

  // Called when reset succeeds — pre-fill email and return to login
  const [prefillEmail, setPrefillEmail] = useState('')
  const onForgotSuccess = useCallback((email) => {
    setPrefillEmail(email)
    setView('login')
  }, [])

  // Redirect as soon as auth state is set — avoids race with manual navigate after login
  useEffect(() => {
    if (!initializing && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [initializing, user, navigate])

  if (initializing || user) return null

  const isForgot = view === 'forgot'

  return (
    <div style={{ minHeight:'100vh', display:'flex' }}>

      {/* ── LEFT HERO — sticky, never remounts ── */}
      <div
        className="hidden lg:flex"
        style={{
          width:'44%', flexShrink:0, position:'sticky', top:0, height:'100vh',
          background:'linear-gradient(145deg,#1a2e22 0%,#2d5a3d 55%,#4a7c59 100%)',
          flexDirection:'column', alignItems:'flex-start', justifyContent:'center',
          padding:'48px 52px', color:'#fff', overflow:'hidden',
        }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:44 }}>
          <img src="/favicon.png" alt="logo"
            style={{ width:44, height:44, borderRadius:12, objectFit:'cover' }}
            onError={e => { e.target.style.display='none' }} />
          <span style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.5px' }}>Spendwise</span>
        </div>
        <h1 style={{ fontSize:34, fontWeight:800, lineHeight:1.2, marginBottom:14 }}>
          Take control of<br/>your finances.
        </h1>
        <p style={{ fontSize:15, color:'#c8dcd0', marginBottom:36, maxWidth:320, lineHeight:1.65 }}>
          Track every rupee, set smart budgets, and understand your spending — all in one place.
        </p>
        <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:13 }}>
          {FEATURES.map(f => (
            <li key={f.text} style={{ display:'flex', alignItems:'center', gap:11, fontSize:14, color:'#e8f0eb' }}>
              <span style={{ fontSize:18 }}>{f.icon}</span>{f.text}
            </li>
          ))}
        </ul>
        {/* Decorative circles */}
        <div style={{ position:'absolute', bottom:-60, right:-60, width:260, height:260,
          borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:-40, right:60, width:150, height:150,
          borderRadius:'50%', background:'rgba(255,255,255,0.03)', pointerEvents:'none' }} />
      </div>

      {/* ── RIGHT FORM — only this part animates ── */}
      <div style={{
        flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        padding:'32px 24px', background:'#f5f4f0', overflowY:'auto',
      }}>
        <div style={{ width:'100%', maxWidth:420 }}>

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div style={{ width:48, height:48, background:'#4a7c59', borderRadius:14,
              display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <svg width="26" height="26" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p className="font-bold text-ink-800 text-xl">Spendwise</p>
          </div>

          {/* Tab switcher — hidden on forgot view */}
          {!isForgot && (
            <div style={{ display:'flex', background:'#e8e6df', borderRadius:14,
              padding:4, marginBottom:24, gap:4 }}>
              {['login','register'].map(tab => (
                <button key={tab} type="button" onClick={() => setView(tab)}
                  style={{
                    flex:1, padding:'9px 0', borderRadius:10, border:'none', cursor:'pointer',
                    fontSize:14, fontWeight:600, transition:'all 0.2s',
                    background: view === tab ? '#fff'       : 'transparent',
                    color:      view === tab ? '#0f0e0c'    : '#7a7670',
                    boxShadow:  view === tab ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  }}>
                  {tab === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>
          )}

          {/* Card — only inner content slides, outer shell stays */}
          <div className="card p-6" style={{ overflow:'hidden' }}>

            {/* Heading animates */}
            <AnimatePresence mode="wait">
              <motion.div key={view + '-h'}
                initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:8 }} transition={{ duration:0.16 }}
                style={{ marginBottom:20 }}>
                <h2 className="text-xl font-bold text-ink-800">
                  {view === 'login'    ? 'Welcome back 👋'
                  : view === 'forgot'  ? 'Reset Password 🔑'
                  :                      'Create your account'}
                </h2>
                <p className="text-sm text-ink-400 mt-0.5">
                  {view === 'login'    ? 'Sign in to your Spendwise account'
                  : view === 'forgot'  ? 'We\'ll help you get back in'
                  :                      'Start tracking your expenses for free'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Form slides left ↔ right (200ms) */}
            <AnimatePresence mode="wait">
              <motion.div key={view}
                initial={{ opacity:0, x: view === 'register' ? 20 : -20 }}
                animate={{ opacity:1, x:0 }}
                exit={{    opacity:0, x: view === 'register' ? -20 : 20 }}
                transition={{ duration:0.2, ease:'easeOut' }}>
                {view === 'login'
                  ? <SignInForm  onSwitch={toRegister} onForgot={toForgot} prefillEmail={prefillEmail} />
                  : view === 'forgot'
                  ? <ForgotPasswordForm onBack={toLogin} onSuccess={onForgotSuccess} />
                  : <RegisterForm onSwitch={toLogin} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
