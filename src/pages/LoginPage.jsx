import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore, useToastStore } from '../lib/store'
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuthStore()
  const { addToast } = useToastStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)
      addToast({ type: 'success', message: 'Welcome back!' })
      navigate(from, { replace: true })
    } catch (error) {
      addToast({ 
        type: 'error', 
        title: 'Sign in failed',
        message: error.message 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-void flex">
      {/* Left side - Form */}
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
            Welcome back
          </h1>
          <p className="text-dim mb-8">
            Sign in to continue your journey to the top
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
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
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded bg-abyss border-mist" />
                <span className="text-sm text-dim">Remember me</span>
              </label>
              <a href="#" className="text-sm text-ember hover:text-ember-glow">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-dim">
            Don't have an account?{' '}
            <Link to="/register" className="text-ember hover:text-ember-glow font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-abyss relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-ember/20 via-transparent to-transparent" />
        <div className="absolute top-1/4 -right-1/4 w-1/2 h-1/2 bg-arcane/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-ember/30 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center p-12">
          <h2 className="font-display font-bold text-4xl text-pale mb-4">
            The Battle Awaits
          </h2>
          <p className="text-dim text-lg max-w-md">
            Join hundreds of players competing for glory in the premier PDH league.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
