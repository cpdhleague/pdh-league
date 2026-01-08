import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Trophy, Crown, Medal, Award, Shield, TrendingUp, 
  Search, Filter, ChevronUp, ChevronDown, User,
  Loader2, RefreshCw, Layers
} from 'lucide-react'
import { useLeaderboardStore, useAuthStore } from '../lib/store'
import { getEloTier, calculateMedian } from '../lib/utils'

export default function LeaderboardPage() {
  const { leaderboard, loading, fetchLeaderboard } = useLeaderboardStore()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('elo')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    fetchLeaderboard(100)
  }, [fetchLeaderboard])

  // Filter and sort leaderboard
  const filteredLeaderboard = leaderboard
    .filter(player => 
      player.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortBy] || 0
      const bVal = b[sortBy] || 0
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
    })

  // Toggle sort
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  // Get rank badge
  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: Crown, color: 'text-gold', bg: 'bg-gold/20' }
    if (rank === 2) return { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-300/20' }
    if (rank === 3) return { icon: Award, color: 'text-amber-600', bg: 'bg-amber-600/20' }
    return null
  }

  // Calculate stats
  const totalMatches = Math.floor(leaderboard.reduce((sum, p) => sum + (p.matches_played || 0), 0) / 4)
  const totalDecks = leaderboard.reduce((sum, p) => sum + (p.deck_count || 1), 0)
  const medianElo = calculateMedian(leaderboard.map(p => p.elo || 1000))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Trophy className="w-8 h-8 text-gold" />
            Leaderboard
          </h1>
          <p className="text-gray-400 mt-1">Season 2026 Rankings</p>
        </div>
        
        <button
          onClick={() => fetchLeaderboard(100)}
          disabled={loading}
          className="btn-secondary flex items-center gap-2 w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-400">Total Players</p>
          <p className="text-2xl font-display font-bold text-ember">{leaderboard.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-400">Total Matches</p>
          <p className="text-2xl font-display font-bold text-ember">
            {totalMatches}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-1 mb-1">
            <Layers className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-400">Total Decks</p>
          </div>
          <p className="text-2xl font-display font-bold text-gold">
            {totalDecks}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-400">Median ELO</p>
          <p className="text-2xl font-display font-bold text-arcane">
            {Math.round(medianElo) || '-'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-ember" />
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400">No players found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-400 w-16">
                    Rank
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-400">
                    Player
                  </th>
                  <th 
                    className="px-4 py-4 text-left text-sm font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('elo')}
                  >
                    <div className="flex items-center gap-1">
                      ELO
                      {sortBy === 'elo' && (
                        sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-400">
                    Tier
                  </th>
                  <th 
                    className="px-4 py-4 text-center text-sm font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('wins')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      W
                      {sortBy === 'wins' && (
                        sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-4 text-center text-sm font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('losses')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      L
                      {sortBy === 'losses' && (
                        sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-medium text-gray-400">
                    D
                  </th>
                  <th 
                    className="px-4 py-4 text-center text-sm font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('matches_played')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Games
                      {sortBy === 'matches_played' && (
                        sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-medium text-gray-400">
                    Win %
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((player, index) => {
                  const rank = index + 1
                  const rankBadge = getRankBadge(rank)
                  const tier = getEloTier(player.elo)
                  const winRate = player.matches_played > 0 
                    ? Math.round((player.wins / player.matches_played) * 100) 
                    : 0
                  const isCurrentUser = player.id === user?.id

                  return (
                    <tr 
                      key={player.id}
                      className={`border-b border-gray-800/50 transition-colors ${
                        isCurrentUser 
                          ? 'bg-ember/10 hover:bg-ember/15' 
                          : 'hover:bg-surface/50'
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-4 py-4">
                        {rankBadge ? (
                          <div className={`w-8 h-8 rounded-lg ${rankBadge.bg} flex items-center justify-center`}>
                            <rankBadge.icon className={`w-4 h-4 ${rankBadge.color}`} />
                          </div>
                        ) : (
                          <span className="text-gray-500 font-mono">#{rank}</span>
                        )}
                      </td>

                      {/* Player */}
                      <td className="px-4 py-4">
                        <Link 
                          to={`/profile/${player.id}`}
                          className="flex items-center gap-3 hover:text-ember transition-colors"
                        >
                          <div className={`w-10 h-10 rounded-lg ${tier.bg} flex items-center justify-center font-display font-bold`}>
                            {player.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {player.username}
                              {isCurrentUser && (
                                <span className="text-xs bg-ember/20 text-ember px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </p>
                          </div>
                        </Link>
                      </td>

                      {/* ELO */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Shield className={`w-4 h-4 ${tier.color}`} />
                          <span className={`font-display font-bold ${tier.color}`}>
                            {player.elo}
                          </span>
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="px-4 py-4">
                        <span className={`text-sm px-2 py-1 rounded ${tier.bg} ${tier.color}`}>
                          {tier.name}
                        </span>
                      </td>

                      {/* Wins */}
                      <td className="px-4 py-4 text-center">
                        <span className="text-green-500 font-medium">{player.wins}</span>
                      </td>

                      {/* Losses */}
                      <td className="px-4 py-4 text-center">
                        <span className="text-red-500 font-medium">{player.losses}</span>
                      </td>

                      {/* Draws */}
                      <td className="px-4 py-4 text-center">
                        <span className="text-yellow-500 font-medium">{player.draws || 0}</span>
                      </td>

                      {/* Games */}
                      <td className="px-4 py-4 text-center text-gray-400">
                        {player.matches_played}
                      </td>

                      {/* Win Rate */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-ember to-gold rounded-full"
                              style={{ width: `${winRate}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-400 w-10">{winRate}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="card p-6">
        <h3 className="font-display font-semibold mb-4">ELO Tiers</h3>
        <div className="flex flex-wrap gap-4">
          {[
            { name: 'Mythic', min: 1400, color: 'text-purple-500', bg: 'bg-purple-500/20' },
            { name: 'Diamond', min: 1300, color: 'text-cyan-400', bg: 'bg-cyan-400/20' },
            { name: 'Platinum', min: 1200, color: 'text-emerald-400', bg: 'bg-emerald-400/20' },
            { name: 'Gold', min: 1000, color: 'text-yellow-500', bg: 'bg-yellow-500/20' },
            { name: 'Silver', min: 800, color: 'text-gray-300', bg: 'bg-gray-300/20' },
            { name: 'Bronze', min: 0, color: 'text-orange-600', bg: 'bg-orange-600/20' },
          ].map(tier => (
            <div key={tier.name} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded ${tier.bg} flex items-center justify-center`}>
                <Shield className={`w-4 h-4 ${tier.color}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${tier.color}`}>{tier.name}</p>
                <p className="text-xs text-gray-500">{tier.min}+ ELO</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
