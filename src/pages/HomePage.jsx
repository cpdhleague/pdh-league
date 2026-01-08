import { Link } from 'react-router-dom'
import { useAuthStore } from '../lib/store'
import { config } from '../lib/config'
import { 
  Trophy, 
  Users, 
  Shield, 
  Zap, 
  Award, 
  ArrowRight,
  ChevronRight,
  Sparkles,
  ExternalLink
} from 'lucide-react'

const features = [
  {
    icon: Trophy,
    title: 'Competitive ELO System',
    description: 'Track your progress with our sophisticated rating system. Climb the leaderboard and prove your skill.'
  },
  {
    icon: Users,
    title: 'Async Multiplayer',
    description: 'Play anytime, anywhere. Join lobbies asynchronously and match with players across the globe.'
  },
  {
    icon: Shield,
    title: 'Fair Play Guaranteed',
    description: 'Robust validation system ensures all matches are legitimate. Every result is verified by participants.'
  },
  {
    icon: Zap,
    title: 'Instant Matchmaking',
    description: 'Create or join lobbies in seconds. As soon as all four players are ready, the game begins.'
  },
  {
    icon: Award,
    title: 'Deckbuilding Contests',
    description: 'Participate in themed contests to showcase your brewing skills and win exclusive rewards.'
  },
  {
    icon: Sparkles,
    title: 'Season Rewards',
    description: 'Earn rewards throughout the season with our upcoming battlepass system.'
  }
]

function HomePage() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-void">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-radial from-ember/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-arcane/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-ember/20 rounded-full blur-3xl" />
        
        {/* Navigation */}
        <nav className="relative z-10 max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ember to-gold flex items-center justify-center">
                <span className="font-display font-bold text-void text-xl">PDH</span>
              </div>
              <span className="font-display font-bold text-2xl text-pale">
                PDH League
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/leaderboard" className="btn-ghost">
                Leaderboard
              </Link>
              {user ? (
                <Link to="/dashboard" className="btn-primary">
                  Dashboard
                  <ArrowRight className="w-4 h-4 ml-2 inline" />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-ember/20 border border-ember/30 rounded-full">
                <Sparkles className="w-4 h-4 text-ember" />
                <span className="text-ember font-medium">Year 2 Now Live</span>
              </div>
              {config.YEAR_1_RESULTS_URL && (
                <a 
                  href={config.YEAR_1_RESULTS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-arcane/20 border border-arcane/30 rounded-full hover:bg-arcane/30 transition-colors"
                >
                  <Trophy className="w-4 h-4 text-arcane" />
                  <span className="text-arcane font-medium">Year 1 Results</span>
                  <ExternalLink className="w-3 h-3 text-arcane" />
                </a>
              )}
            </div>
            
            <h1 className="font-display font-bold text-5xl lg:text-7xl text-pale mb-6 animate-fade-in animate-delay-100">
              The Premier
              <span className="text-gradient block">PDH League</span>
            </h1>
            
            <p className="text-xl text-dim mb-10 max-w-2xl animate-fade-in animate-delay-200">
              Compete in the most exciting Pauper EDH league. Register your commanders, 
              battle players worldwide, and climb the ranks to become a champion.
            </p>
            
            <div className="flex flex-wrap gap-4 animate-fade-in animate-delay-300">
              <Link 
                to={user ? "/dashboard" : "/register"} 
                className="btn-primary text-lg px-8 py-4"
              >
                {user ? 'Go to Dashboard' : 'Join the League'}
                <ChevronRight className="w-5 h-5 ml-2 inline" />
              </Link>
              <Link to="/leaderboard" className="btn-secondary text-lg px-8 py-4">
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="relative z-10 border-y border-mist/30 bg-abyss/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <p className="font-display font-bold text-4xl text-ember mb-1">500+</p>
                <p className="text-dim">Active Players</p>
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-4xl text-gold mb-1">2,000+</p>
                <p className="text-dim">Matches Played</p>
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-4xl text-arcane-glow mb-1">150+</p>
                <p className="text-dim">Legal Commanders</p>
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-4xl text-success mb-1">$5K+</p>
                <p className="text-dim">Prize Pool</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl text-pale mb-4">
              Everything You Need to Compete
            </h2>
            <p className="text-dim text-lg max-w-2xl mx-auto">
              Our platform provides all the tools you need to track your progress,
              find matches, and compete at the highest level.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={feature.title}
                  className="card group animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-ember/20 flex items-center justify-center mb-4
                    group-hover:bg-ember/30 transition-colors">
                    <Icon className="w-6 h-6 text-ember" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-pale mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-dim">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-abyss/50 border-y border-mist/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl text-pale mb-4">
              How It Works
            </h2>
            <p className="text-dim text-lg max-w-2xl mx-auto">
              Get started in just a few simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up and set up your player profile' },
              { step: '02', title: 'Register Deck', desc: 'Add your PDH deck with a legal uncommon commander' },
              { step: '03', title: 'Find a Match', desc: 'Create or join a lobby with 4 players' },
              { step: '04', title: 'Compete & Rise', desc: 'Play, validate results, and climb the ranks' }
            ].map((item, index) => (
              <div key={item.step} className="relative">
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-ember/50 to-transparent -z-10" />
                )}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-ember/20 border border-ember/30 
                    flex items-center justify-center mx-auto mb-4">
                    <span className="font-display font-bold text-2xl text-ember">{item.step}</span>
                  </div>
                  <h3 className="font-display font-semibold text-lg text-pale mb-2">
                    {item.title}
                  </h3>
                  <p className="text-dim text-sm">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-ember/10 via-transparent to-transparent" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-4xl lg:text-5xl text-pale mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-dim text-lg mb-10 max-w-2xl mx-auto">
            Join hundreds of players competing in the most exciting PDH league. 
            Register today and start climbing the ranks.
          </p>
          <Link 
            to={user ? "/dashboard" : "/register"} 
            className="btn-primary text-lg px-10 py-4 inline-flex items-center"
          >
            {user ? 'Go to Dashboard' : 'Join Now — It\'s Free'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-mist/30 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-ember to-gold flex items-center justify-center">
                <span className="font-display font-bold text-void text-lg">PDH</span>
              </div>
              <span className="font-display font-semibold text-lg text-pale">
                PDH League
              </span>
            </div>
            
            <div className="flex items-center gap-8">
              <a href="#" className="text-dim hover:text-pale transition-colors">Rules</a>
              <a href="#" className="text-dim hover:text-pale transition-colors">Support</a>
              <a href="#" className="text-dim hover:text-pale transition-colors">Discord</a>
              <a href="#" className="text-dim hover:text-pale transition-colors">Twitter</a>
            </div>
            
            <p className="text-dim text-sm">
              © 2026 PDH League. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
