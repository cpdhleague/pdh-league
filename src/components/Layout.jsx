import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, useMatchStore } from '../lib/store'
import { 
  LayoutDashboard, 
  Layers, 
  Users, 
  Trophy, 
  Award, 
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  ChevronDown,
  User
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/decks', label: 'My Decks', icon: Layers },
  { path: '/lobbies', label: 'Lobbies', icon: Users },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/contests', label: 'Contests', icon: Award },
]

function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuthStore()
  const { pendingValidation } = useMatchStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-void">
      {/* Pending Validation Banner */}
      {pendingValidation && (
        <div className="bg-warning/20 border-b border-warning/30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span className="text-warning font-medium">
                You have a match result pending validation
              </span>
            </div>
            <Link 
              to="/validate" 
              className="text-warning hover:text-warning/80 font-semibold underline"
            >
              Validate Now
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-abyss/80 backdrop-blur-lg border-b border-mist/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-ember to-gold flex items-center justify-center">
                <span className="font-display font-bold text-void text-lg">PDH</span>
              </div>
              <span className="font-display font-bold text-xl text-pale hidden sm:block">
                PDH League
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map(item => {
                const Icon = item.icon
                const isActive = location.pathname === item.path || 
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link flex items-center gap-2 ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* ELO Badge */}
              {profile?.elo && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gold/10 border border-gold/30 rounded-full">
                  <Trophy className="w-4 h-4 text-gold" />
                  <span className="font-display font-semibold text-gold">
                    {profile.elo}
                  </span>
                </div>
              )}

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-arcane/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-arcane-glow" />
                  </div>
                  <span className="hidden sm:block font-medium text-pale">
                    {profile?.username || user?.email?.split('@')[0]}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-dim transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserMenuOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-slate border border-mist rounded-xl shadow-xl z-50 overflow-hidden animate-slide-down">
                      <div className="p-3 border-b border-mist">
                        <p className="font-medium text-pale">{profile?.username}</p>
                        <p className="text-sm text-dim">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone text-dim hover:text-pale transition-colors"
                        >
                          <User className="w-4 h-4" />
                          View Profile
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone text-dim hover:text-pale transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        {profile?.is_admin && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone text-dim hover:text-pale transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}
                      </div>
                      <div className="p-2 border-t border-mist">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-danger/20 text-dim hover:text-danger transition-colors w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-stone transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-pale" />
                ) : (
                  <Menu className="w-6 h-6 text-pale" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden border-t border-mist/30 bg-abyss">
            <div className="px-4 py-4 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon
                const isActive = location.pathname === item.path ||
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-ember/20 text-ember' 
                        : 'text-dim hover:text-pale hover:bg-stone'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-mist/30 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-dim text-sm">
              © 2026 PDH League. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-dim hover:text-pale text-sm transition-colors">
                Rules
              </a>
              <a href="#" className="text-dim hover:text-pale text-sm transition-colors">
                Support
              </a>
              <a href="#" className="text-dim hover:text-pale text-sm transition-colors">
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
