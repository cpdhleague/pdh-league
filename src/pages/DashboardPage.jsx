import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore, useDeckStore, useMatchStore, useLeaderboardStore } from '../lib/store'
import { formatRelativeTime, getEloTier, getHighestDeckElo } from '../lib/utils'
import { 
  Trophy, 
  Swords, 
  Layers, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Plus,
  Users,
  Target,
  Crown,
  ChevronRight,
  Minus
} from 'lucide-react'

function DashboardPage() {
  const { profile } = useAuthStore()
  const { decks, fetchDecks } = useDeckStore()
  const { matches, fetchMatches } = useMatchStore()
  const { leaderboard, fetchLeaderboard } = useLeaderboardStore()

  useEffect(() => {
    fetchDecks()
    fetchMatches()
    fetchLeaderboard(10)
  }, [fetchDecks, fetchMatches, fetchLeaderboard])

  const recentMatches = matches.slice(0, 5)
  
  // Calculate stats from decks (ELO is deck-based, not player-based)
  const activeDecks = decks.filter(d => d.is_active)
  const highestDeckElo = getHighestDeckElo(activeDecks)
  const tier = getEloTier(highestDeckElo)
  
  // Aggregate stats across all decks
  const totalMatches = decks.reduce((sum, d) => sum + (d.matches_played || 0), 0)
  const totalWins = decks.reduce((sum, d) => sum + (d.wins || 0), 0)
  const totalDraws = decks.reduce((sum, d) => sum + (d.draws || 0), 0)
  const totalLosses = totalMatches - totalWins - totalDraws
  
  const winRate = totalMatches > 0
    ? Math.round((totalWins / totalMatches) * 100) 
    : 0

  // Find user rank (based on highest deck ELO)
  const userRank = leaderboard.findIndex(p => p.id === profile?.id) + 1

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-pale mb-2">
            Welcome back, {profile?.username || 'Commander'}
          </h1>
          <p className="text-dim">
            Here's your league overview for this season
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/decks/register" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Register Deck
          </Link>
          <Link to="/lobbies" className="btn-secondary flex items-center gap-2">
            <Users className="w-5 h-5" />
            Find Match
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className={`absolute top-0 right-0 w-24 h-24 ${tier.bgColor} rounded-full blur-2xl`} />
          <div className="relative">
            <div className="flex items-center gap-2 text-dim mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">Top Deck ELO</span>
            </div>
            <p className={`font-display font-bold text-4xl ${tier.color}`}>
              {highestDeckElo || 0}
            </p>
            <p className={`text-sm mt-1 ${tier.color}`}>
              {tier.name} {userRank > 0 && `• Rank #${userRank}`}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="absolute top-0 right-0 w-24 h-24 bg-ember/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-dim mb-1">
              <Swords className="w-4 h-4" />
              <span className="text-sm font-medium">Matches</span>
            </div>
            <p className="font-display font-bold text-4xl text-pale">
              {totalMatches}
            </p>
            <p className="text-sm text-dim mt-1">
              {totalWins}W - {totalLosses}L - {totalDraws}D
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="absolute top-0 right-0 w-24 h-24 bg-success/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-dim mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Win Rate</span>
            </div>
            <p className="font-display font-bold text-4xl text-pale">
              {winRate}%
            </p>
            <p className="text-sm text-dim mt-1">
              Across all decks
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="absolute top-0 right-0 w-24 h-24 bg-arcane/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-dim mb-1">
              <Layers className="w-4 h-4" />
              <span className="text-sm font-medium">Active Decks</span>
            </div>
            <p className="font-display font-bold text-4xl text-pale">
              {activeDecks.length}
            </p>
            <p className="text-sm text-dim mt-1">
              {decks.length} total registered
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Matches */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-xl text-pale">
              Recent Matches
            </h2>
            <Link to="/profile" className="text-ember hover:text-ember-glow text-sm font-medium flex items-center gap-1">
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {recentMatches.length > 0 ? (
            <div className="space-y-3">
              {recentMatches.map((match, index) => {
                const isWin = match.placement === 1
                const isDraw = match.placement === 0 || match.is_draw
                const eloChange = match.elo_change || 0
                
                return (
                  <div 
                    key={match.id} 
                    className="flex items-center justify-between p-4 bg-stone/30 rounded-lg
                      hover:bg-stone/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                        ${isWin ? 'bg-success/20' : isDraw ? 'bg-yellow-500/20' : 'bg-stone'}`}>
                        {isWin ? (
                          <Crown className="w-5 h-5 text-success" />
                        ) : isDraw ? (
                          <Minus className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <span className="font-display font-bold text-dim">
                            #{match.placement}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-pale">
                          {match.deck?.commander_name || 'Match'}
                        </p>
                        <p className="text-sm text-dim">
                          {formatRelativeTime(match.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 font-display font-semibold
                      ${eloChange > 0 ? 'text-success' : eloChange < 0 ? 'text-danger' : 'text-yellow-500'}`}>
                      {eloChange > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : eloChange < 0 ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                      {eloChange > 0 ? '+' : ''}{eloChange}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Swords className="w-12 h-12 text-mist mx-auto mb-4" />
              <p className="text-dim mb-4">No matches played yet</p>
              <Link to="/lobbies" className="btn-primary inline-flex items-center gap-2">
                Find a Match
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Leaderboard Preview */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-xl text-pale">
              Top Players
            </h2>
            <Link to="/leaderboard" className="text-ember hover:text-ember-glow text-sm font-medium flex items-center gap-1">
              Full Rankings
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((player, index) => (
              <div 
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors
                  ${player.id === profile?.id ? 'bg-ember/10 border border-ember/30' : 'hover:bg-stone/30'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold
                  ${index === 0 ? 'bg-gold/20 text-gold' : 
                    index === 1 ? 'bg-pale/20 text-pale' :
                    index === 2 ? 'bg-ember/20 text-ember' : 'bg-stone text-dim'}`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-pale truncate">
                    {player.username}
                    {player.id === profile?.id && (
                      <span className="text-ember ml-2 text-sm">(You)</span>
                    )}
                  </p>
                  <p className="text-sm text-dim">
                    {player.wins}W - {player.losses}L - {player.draws || 0}D
                  </p>
                </div>
                <div className="font-display font-semibold text-gold">
                  {player.elo}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/decks/register" className="card-interactive group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-ember/20 flex items-center justify-center
              group-hover:bg-ember/30 transition-colors">
              <Plus className="w-6 h-6 text-ember" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-pale">
                Register New Deck
              </h3>
              <p className="text-dim text-sm">Add a new commander to your arsenal</p>
            </div>
          </div>
        </Link>

        <Link to="/lobbies" className="card-interactive group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-arcane/20 flex items-center justify-center
              group-hover:bg-arcane/30 transition-colors">
              <Users className="w-6 h-6 text-arcane-glow" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-pale">
                Find a Match
              </h3>
              <p className="text-dim text-sm">Join or create a game lobby</p>
            </div>
          </div>
        </Link>

        <Link to="/contests" className="card-interactive group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center
              group-hover:bg-gold/30 transition-colors">
              <Trophy className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-pale">
                Deckbuilding Contests
              </h3>
              <p className="text-dim text-sm">Compete in themed challenges</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default DashboardPage
