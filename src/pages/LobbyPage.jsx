import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Users, Crown, Shield, Clock, CheckCircle, XCircle, 
  ArrowLeft, Play, LogOut, AlertTriangle, Swords,
  User, Loader2, Copy, Check
} from 'lucide-react'
import { useAuthStore, useLobbyStore, useToastStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { formatDistanceToNow } from 'date-fns'

export default function LobbyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { setReady, leaveLobby } = useLobbyStore()
  const { addToast } = useToastStore()
  
  const [lobby, setLobby] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(null)

  // Fetch lobby data
  const fetchLobby = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('lobbies')
        .select(`
          *,
          lobby_players (
            *,
            profiles (id, username, elo, matches_played),
            decks (id, name, commander_name)
          ),
          profiles:created_by (username)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      setLobby(data)
      
      // Check if all players are ready
      if (data.lobby_players?.length === 4) {
        const allReady = data.lobby_players.every(p => p.is_ready)
        if (allReady && !countdown) {
          startCountdown()
        }
      }
    } catch (error) {
      console.error('Fetch lobby error:', error)
      addToast({ type: 'error', message: 'Failed to load lobby' })
      navigate('/lobbies')
    } finally {
      setLoading(false)
    }
  }, [id, countdown, addToast, navigate])

  // Subscribe to real-time updates
  useEffect(() => {
    fetchLobby()

    const channel = supabase
      .channel(`lobby:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobby_players',
          filter: `lobby_id=eq.${id}`
        },
        () => {
          fetchLobby()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lobbies',
          filter: `id=eq.${id}`
        },
        (payload) => {
          if (payload.new.status === 'in_progress') {
            navigate(`/match/${payload.new.id}`)
          }
          fetchLobby()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, fetchLobby, navigate])

  // Countdown when all ready
  const startCountdown = () => {
    setCountdown(3)
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          startMatch()
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  // Start the match
  const startMatch = async () => {
    try {
      // Create match record
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          lobby_id: id,
          status: 'in_progress'
        })
        .select()
        .single()

      if (matchError) throw matchError

      // Create match results for each player
      const matchResults = lobby.lobby_players.map(lp => ({
        match_id: match.id,
        player_id: lp.player_id,
        deck_id: lp.deck_id
      }))

      const { error: resultsError } = await supabase
        .from('match_results')
        .insert(matchResults)

      if (resultsError) throw resultsError

      // Update lobby status
      await supabase
        .from('lobbies')
        .update({ status: 'in_progress' })
        .eq('id', id)

      navigate(`/match/${match.id}`)
    } catch (error) {
      console.error('Start match error:', error)
      addToast({ type: 'error', message: 'Failed to start match' })
      setCountdown(null)
    }
  }

  // Handle ready toggle
  const handleReadyToggle = async () => {
    const currentPlayer = lobby?.lobby_players?.find(p => p.player_id === user.id)
    if (!currentPlayer) return

    setActionLoading(true)
    try {
      await setReady(id, !currentPlayer.is_ready)
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to update ready status' })
    } finally {
      setActionLoading(false)
    }
  }

  // Handle leave lobby
  const handleLeave = async () => {
    setActionLoading(true)
    try {
      await leaveLobby(id)
      addToast({ type: 'success', message: 'Left lobby' })
      navigate('/lobbies')
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to leave lobby' })
    } finally {
      setActionLoading(false)
    }
  }

  // Copy lobby link
  const copyLobbyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-ember" />
      </div>
    )
  }

  if (!lobby) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Lobby not found</p>
      </div>
    )
  }

  const currentPlayer = lobby.lobby_players?.find(p => p.player_id === user.id)
  const isInLobby = !!currentPlayer
  const playerCount = lobby.lobby_players?.length || 0
  const readyCount = lobby.lobby_players?.filter(p => p.is_ready).length || 0
  const allReady = playerCount === 4 && readyCount === 4

  // Create player slots (4 total)
  const playerSlots = Array(4).fill(null).map((_, index) => 
    lobby.lobby_players?.[index] || null
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/lobbies')}
          className="p-2 hover:bg-surface rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold">{lobby.name}</h1>
          <p className="text-sm text-gray-400">
            Created by {lobby.profiles?.username || 'Unknown'} • {formatDistanceToNow(new Date(lobby.created_at))} ago
          </p>
        </div>
        <button
          onClick={copyLobbyLink}
          className="btn-secondary flex items-center gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      {/* Status Bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-ember" />
              <span className="font-medium">{playerCount}/4 Players</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium">{readyCount}/4 Ready</span>
            </div>
          </div>
          
          {countdown !== null && (
            <div className="flex items-center gap-2 text-ember animate-pulse">
              <Swords className="w-5 h-5" />
              <span className="font-display font-bold text-xl">Starting in {countdown}...</span>
            </div>
          )}
          
          {!countdown && playerCount === 4 && !allReady && (
            <div className="flex items-center gap-2 text-yellow-500">
              <Clock className="w-5 h-5" />
              <span>Waiting for all players to ready up</span>
            </div>
          )}
          
          {!countdown && playerCount < 4 && (
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="w-5 h-5" />
              <span>Waiting for more players</span>
            </div>
          )}
        </div>
      </div>

      {/* Player Grid */}
      <div className="grid grid-cols-2 gap-4">
        {playerSlots.map((player, index) => (
          <PlayerSlot
            key={index}
            player={player}
            index={index}
            isCurrentUser={player?.player_id === user.id}
            lobbyCreator={lobby.created_by}
          />
        ))}
      </div>

      {/* Actions */}
      {isInLobby && (
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-lg">Your Status</h3>
              <p className="text-sm text-gray-400">
                Playing as <span className="text-ember">{currentPlayer.decks?.commander_name}</span>
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleLeave}
                disabled={actionLoading || countdown !== null}
                className="btn-secondary flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Leave
              </button>
              <button
                onClick={handleReadyToggle}
                disabled={actionLoading || countdown !== null}
                className={`btn-primary flex items-center gap-2 ${
                  currentPlayer.is_ready 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : ''
                }`}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentPlayer.is_ready ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {currentPlayer.is_ready ? 'Ready!' : 'Ready Up'}
              </button>
            </div>
          </div>
          
          {playerCount === 4 && !currentPlayer.is_ready && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">All players are here! Ready up to start the match.</span>
            </div>
          )}
        </div>
      )}

      {/* Game Info */}
      <div className="card p-6">
        <h3 className="font-display font-semibold text-lg mb-4">Match Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Format:</span>
            <span className="ml-2 font-medium">PDH (Pauper EDH)</span>
          </div>
          <div>
            <span className="text-gray-400">Players:</span>
            <span className="ml-2 font-medium">4 Player Free-for-All</span>
          </div>
          <div>
            <span className="text-gray-400">ELO Rated:</span>
            <span className="ml-2 font-medium text-green-500">Yes</span>
          </div>
          <div>
            <span className="text-gray-400">Validation:</span>
            <span className="ml-2 font-medium">Required</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Player Slot Component
function PlayerSlot({ player, index, isCurrentUser, lobbyCreator }) {
  if (!player) {
    return (
      <div className="card p-6 border-dashed border-gray-700 bg-transparent">
        <div className="flex items-center justify-center h-24">
          <div className="text-center text-gray-500">
            <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Waiting for player...</p>
          </div>
        </div>
      </div>
    )
  }

  const isHost = player.player_id === lobbyCreator
  const eloTier = getEloTier(player.profiles?.elo || 1200)

  return (
    <div className={`card p-6 relative ${
      isCurrentUser ? 'ring-2 ring-ember' : ''
    } ${player.is_ready ? 'bg-green-500/5 border-green-500/30' : ''}`}>
      {/* Host badge */}
      {isHost && (
        <div className="absolute -top-2 -right-2 bg-gold text-void px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
          <Crown className="w-3 h-3" />
          Host
        </div>
      )}

      {/* Ready indicator */}
      <div className={`absolute top-4 right-4 ${
        player.is_ready ? 'text-green-500' : 'text-gray-600'
      }`}>
        {player.is_ready ? (
          <CheckCircle className="w-6 h-6" />
        ) : (
          <Clock className="w-6 h-6" />
        )}
      </div>

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-display font-bold text-xl ${
          eloTier.bg
        }`}>
          {player.profiles?.username?.charAt(0).toUpperCase() || '?'}
        </div>

        <div className="flex-1 min-w-0">
          {/* Username */}
          <div className="flex items-center gap-2">
            <h4 className="font-display font-semibold truncate">
              {player.profiles?.username || 'Unknown'}
            </h4>
            {isCurrentUser && (
              <span className="text-xs bg-ember/20 text-ember px-2 py-0.5 rounded-full">You</span>
            )}
          </div>

          {/* ELO */}
          <div className="flex items-center gap-2 mt-1">
            <Shield className={`w-4 h-4 ${eloTier.color}`} />
            <span className={`text-sm font-medium ${eloTier.color}`}>
              {player.profiles?.elo || 1200} ELO
            </span>
            <span className="text-xs text-gray-500">
              ({player.profiles?.matches_played || 0} games)
            </span>
          </div>

          {/* Deck */}
          <div className="mt-2 p-2 bg-void rounded-lg">
            <p className="text-sm font-medium truncate">{player.decks?.name || 'Unknown Deck'}</p>
            <p className="text-xs text-gray-400 truncate">{player.decks?.commander_name || 'Unknown Commander'}</p>
          </div>
        </div>
      </div>

      {/* Ready status */}
      <div className={`mt-4 text-center py-2 rounded-lg text-sm font-medium ${
        player.is_ready 
          ? 'bg-green-500/20 text-green-500' 
          : 'bg-gray-800 text-gray-400'
      }`}>
        {player.is_ready ? 'Ready to Play!' : 'Not Ready'}
      </div>
    </div>
  )
}

// Helper to get ELO tier styling
function getEloTier(elo) {
  if (elo >= 1800) return { bg: 'bg-arcane/20', color: 'text-arcane' }
  if (elo >= 1600) return { bg: 'bg-gold/20', color: 'text-gold' }
  if (elo >= 1400) return { bg: 'bg-ember/20', color: 'text-ember' }
  if (elo >= 1200) return { bg: 'bg-blue-500/20', color: 'text-blue-400' }
  return { bg: 'bg-gray-700/50', color: 'text-gray-400' }
}
