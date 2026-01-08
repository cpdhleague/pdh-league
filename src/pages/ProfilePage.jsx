import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  User, Trophy, Target, TrendingUp, TrendingDown, Calendar,
  Shield, Award, Swords, Clock, ChevronRight, Loader2, AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore, useToastStore } from '../lib/store'
import { formatDate } from '../lib/utils'

export default function ProfilePage() {
  const { id } = useParams()
  const { user, profile: myProfile } = useAuthStore()
  const { addToast } = useToastStore()
  
  const [profile, setProfile] = useState(null)
  const [decks, setDecks] = useState([])
  const [recentMatches, setRecentMatches] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  // Use current user's profile if no ID provided
  const profileId = id || user?.id

  useEffect(() => {
    if (profileId) {
      fetchProfile()
      fetchDecks()
      fetchRecentMatches()
    }
  }, [profileId])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (error) throw error
      setProfile(data)
      calculateStats(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      addToast('Failed to load profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchDecks = async () => {
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('player_id', profileId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDecks(data || [])
    } catch (error) {
      console.error('Error fetching decks:', error)
    }
  }

  const fetchRecentMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('match_results')
        .select(`
          *,
          match:matches(id, completed_at, status),
          deck:decks(name, commander_name)
        `)
        .eq('player_id', profileId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentMatches(data || [])
    } catch (error) {
      console.error('Error fetching matches:', error)
    }
  }

  const calculateStats = (profileData) => {
    const winRate = profileData.matches_played > 0 
      ? ((profileData.wins / profileData.matches_played) * 100).toFixed(1)
      : 0

    // Calculate rank based on ELO
    let rank = 'Unranked'
    if (profileData.elo >= 2000) rank = 'Grandmaster'
    else if (profileData.elo >= 1800) rank = 'Master'
    else if (profileData.elo >= 1600) rank = 'Diamond'
    else if (profileData.elo >= 1400) rank = 'Platinum'
    else if (profileData.elo >= 1200) rank = 'Gold'
    else if (profileData.elo >= 1000) rank = 'Silver'
    else rank = 'Bronze'

    setStats({
      winRate,
      rank,
      avgPlacement: profileData.matches_played > 0 
        ? (2.5 - (profileData.wins / profileData.matches_played)).toFixed(2)
        : '-'
    })
  }

  const getRankColor = (rank) => {
    const colors = {
      'Grandmaster': 'text-red-400',
      'Master': 'text-purple-400',
      'Diamond': 'text-cyan-400',
      'Platinum': 'text-emerald-400',
      'Gold': 'text-gold',
      'Silver': 'text-gray-300',
      'Bronze': 'text-orange-600',
      'Unranked': 'text-gray-500'
    }
    return colors[rank] || 'text-gray-400'
  }

  const isOwnProfile = user?.id === profileId

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-ember" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold text-white mb-2">Player Not Found</h2>
        <p className="text-gray-400 mb-6">This player doesn't exist or their profile is private.</p>
        <Link to="/leaderboard" className="btn-primary">
          View Leaderboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-ember to-arcane flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-display font-bold text-white">
                {profile.username}
              </h1>
              {profile.is_admin && (
                <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </span>
              )}
            </div>
            <p className="text-gray-400">
              Member since {formatDate(profile.created_at)}
            </p>
          </div>

          {/* ELO Badge */}
          <div className="text-center md:text-right">
            <div className="text-4xl font-display font-bold text-gold mb-1">
              {profile.elo}
            </div>
            <div className={`text-sm font-medium ${getRankColor(stats?.rank)}`}>
              {stats?.rank}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Swords className="w-5 h-5 text-ember" />
            <span className="text-gray-400">Matches</span>
          </div>
          <div className="text-3xl font-display font-bold text-white">
            {profile.matches_played}
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-gold" />
            <span className="text-gray-400">Wins</span>
          </div>
          <div className="text-3xl font-display font-bold text-white">
            {profile.wins}
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-400" />
            <span className="text-gray-400">Win Rate</span>
          </div>
          <div className="text-3xl font-display font-bold text-white">
            {stats?.winRate}%
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-arcane" />
            <span className="text-gray-400">Active Decks</span>
          </div>
          <div className="text-3xl font-display font-bold text-white">
            {decks.length}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Decks */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-ember" />
              Active Decks
            </h2>
            {isOwnProfile && (
              <Link to="/decks" className="text-ember hover:text-ember-light text-sm">
                Manage →
              </Link>
            )}
          </div>

          {decks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active decks</p>
          ) : (
            <div className="space-y-3">
              {decks.slice(0, 5).map(deck => (
                <div 
                  key={deck.id}
                  className="flex items-center justify-between p-3 bg-slate/50 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{deck.name}</p>
                    <p className="text-sm text-gray-400">{deck.commander_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">{deck.wins}W - {deck.matches_played - deck.wins}L</p>
                    <p className="text-xs text-gray-500">{deck.matches_played} matches</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Matches */}
        <div className="card p-6">
          <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-ember" />
            Recent Matches
          </h2>

          {recentMatches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No matches yet</p>
          ) : (
            <div className="space-y-3">
              {recentMatches.map(match => (
                <div 
                  key={match.id}
                  className="flex items-center justify-between p-3 bg-slate/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      match.placement === 1 
                        ? 'bg-gold/20 text-gold' 
                        : 'bg-abyss text-gray-400'
                    }`}>
                      #{match.placement}
                    </div>
                    <div>
                      <p className="text-white">{match.deck?.name || 'Unknown Deck'}</p>
                      <p className="text-xs text-gray-500">
                        {match.deck?.commander_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {match.elo_change > 0 ? (
                      <span className="flex items-center text-green-400">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +{match.elo_change}
                      </span>
                    ) : match.elo_change < 0 ? (
                      <span className="flex items-center text-red-400">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        {match.elo_change}
                      </span>
                    ) : (
                      <span className="text-gray-500">±0</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions (own profile only) */}
      {isOwnProfile && (
        <div className="grid md:grid-cols-3 gap-4">
          <Link 
            to="/lobbies"
            className="card p-6 hover:border-ember/50 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-bold text-white mb-1">
                  Find a Match
                </h3>
                <p className="text-sm text-gray-400">Join or create a lobby</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-ember transition-colors" />
            </div>
          </Link>

          <Link 
            to="/decks/register"
            className="card p-6 hover:border-ember/50 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-bold text-white mb-1">
                  Register Deck
                </h3>
                <p className="text-sm text-gray-400">Add a new deck to your arsenal</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-ember transition-colors" />
            </div>
          </Link>

          <Link 
            to="/settings"
            className="card p-6 hover:border-ember/50 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-bold text-white mb-1">
                  Settings
                </h3>
                <p className="text-sm text-gray-400">Manage your account</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-ember transition-colors" />
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
