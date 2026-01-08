import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore, useToastStore } from '../lib/store'
import { Loader2, Mail, Lock, User, ArrowRight, Check, Info, FileText } from 'lucide-react'

function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useAuthStore()
  const { addToast } = useToastStore()
  
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [legalName, setLegalName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const passwordRequirements = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      addToast({ type: 'error', message: 'Passwords do not match' })
      return
    }

    if (!passwordRequirements.every(r => r.met)) {
      addToast({ type: 'error', message: 'Please meet all password requirements' })
      return
    }

    if (!legalName.trim()) {
      addToast({ type: 'error', message: 'Legal name is required' })
      return
    }

    if (!agreed) {
      addToast({ type: 'error', message: 'Please agree to the terms' })
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, username, legalName)
      addToast({ 
        type: 'success', 
        title: 'Account created!',
        message: 'Please check your email to verify your account.' 
      })
      navigate('/login')
    } catch (error) {
      addToast({ 
        type: 'error', 
        title: 'Registration failed',
        message: error.message 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-void flex">
      {/* Left side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-abyss relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-arcane/20 via-transparent to-transparent" />
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-ember/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gold/30 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center p-12">
          <h2 className="font-display font-bold text-4xl text-pale mb-4">
            Join the League
          </h2>
          <p className="text-dim text-lg max-w-md mb-8">
            Create your account and start competing in the premier PDH league.
          </p>
          
          <div className="space-y-4 text-left max-w-sm mx-auto">
            {[
              'Register unlimited decks',
              'Track your ELO rating',
              'Compete in tournaments',
              'Win prizes and rewards'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-success" />
                </div>
                <span className="text-pale">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ember to-gold flex items-center justify-center">
              <span className="font-display font-bold text-void text-xl">PDH</span>
            </div>
            <span className="font-display font-bold text-2xl text-pale">
              PDH League
            </span>
          </Link>

          <h1 className="font-display font-bold text-3xl text-pale mb-2">
            Create your account
          </h1>
          <p className="text-dim mb-8">
            Start your journey to become a PDH champion
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-pale mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dim" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Legal Name Field */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label htmlFor="legalName" className="block text-sm font-medium text-pale">
                  Legal Name
                </label>
                <div className="group relative">
                  <Info className="w-4 h-4 text-dim cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-abyss border border-gray-700 rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    We need to verify your identity before sending out large cash prizes. This should match your passport or driver's license.
                  </div>
                </div>
              </div>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dim" />
                <input
                  id="legalName"
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="input-field pl-12"
                  placeholder="John Smith"
                  required
                />
              </div>
              <p className="text-xs text-dim mt-1">
                Required for prize verification. Must match your ID.
              </p>
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-pale mb-2">
                Username
                <span className="text-dim font-normal ml-2">• This is what others see you as</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dim" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field pl-12"
                  placeholder="YourUsername"
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>
              <p className="text-xs text-dim mt-1">
                Cannot be changed after account creation
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-pale mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dim" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12"
                  placeholder="••••••••"
                  required
                />
              </div>
              {password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center
                        ${req.met ? 'bg-success/20' : 'bg-mist'}`}>
                        {req.met && <Check className="w-3 h-3 text-success" />}
                      </div>
                      <span className={req.met ? 'text-success' : 'text-dim'}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-pale mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dim" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pl-12"
                  placeholder="••••••••"
                  required
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-sm text-danger">Passwords do not match</p>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded bg-abyss border-mist" 
              />
              <span className="text-sm text-dim">
                I agree to the{' '}
                <a href="#" className="text-ember hover:text-ember-glow">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-ember hover:text-ember-glow">Privacy Policy</a>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-dim">
            Already have an account?{' '}
            <Link to="/login" className="text-ember hover:text-ember-glow font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
