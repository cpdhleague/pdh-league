import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Trophy, Crown, Medal, Award, Flag, AlertTriangle,
  Clock, CheckCircle, Users, Swords, ArrowLeft,
  Loader2, Send, Shield, X
} from 'lucide-react'
import { useAuthStore, useMatchStore, useReportStore, useToastStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { calculateEloChange } from '../lib/utils'

export default function MatchPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { submitMatchResult } = useMatchStore()
  const { submitReport } = useReportStore()
  const { addToast } = useToastStore()

  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportTarget, setReportTarget] = useState(null)
  const [placements, setPlacements] = useState({})
  const [reportData, setReportData] = useState({ reason: '', details: '' })

  // Fetch match data
  const fetchMatch = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          lobbies (name),
          match_results (
            *,
            profiles (id, username, elo, matches_played),
            decks (id, name, commander_name)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setMatch(data)

      // If match is completed, redirect to validation
      if (data.status === 'pending_validation' || data.status === 'completed') {
        navigate('/validate')
      }
    } catch (error) {
      console.error('Fetch match error:', error)
      addToast({ type: 'error', message: 'Failed to load match' })
      navigate('/lobbies')
    } finally {
      setLoading(false)
    }
  }, [id, addToast, navigate])

  useEffect(() => {
    fetchMatch()
  }, [fetchMatch])

  // Handle placement selection
  const handlePlacementSelect = (playerId, placement) => {
    // Remove player from any existing placement
    const newPlacements = { ...placements }
    Object.keys(newPlacements).forEach(key => {
      if (newPlacements[key] === playerId) {
        delete newPlacements[key]
      }
    })
    // Set new placement
    newPlacements[placement] = playerId
    setPlacements(newPlacements)
  }

  // Submit match results
  const handleSubmitResults = async () => {
    // Validate all placements are filled
    if (Object.keys(placements).length !== 4) {
      addToast({ type: 'error', message: 'Please assign all placements' })
      return
    }

    setSubmitting(true)
    try {
      const placementArray = Object.entries(placements).map(([place, playerId]) => ({
        playerId,
        place: parseInt(place)
      }))
      
      const winnerId = placements[1]
      await submitMatchResult(id, winnerId, placementArray)
      
      addToast({ type: 'success', message: 'Results submitted! Awaiting validation.' })
      navigate('/validate')
    } catch (error) {
      console.error('Submit error:', error)
      addToast({ type: 'error', message: 'Failed to submit results' })
    } finally {
      setSubmitting(false)
    }
  }

  // Submit report
  const handleSubmitReport = async () => {
    if (!reportData.reason.trim()) {
      addToast({ type: 'error', message: 'Please provide a reason' })
      return
    }

    try {
      await submitReport(reportTarget.player_id, id, reportData.reason, reportData.details)
      addToast({ type: 'success', message: 'Report submitted' })
      setShowReportModal(false)
      setReportData({ reason: '', details: '' })
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to submit report' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-ember" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Match not found</p>
      </div>
    )
  }

  const currentResult = match.match_results?.find(r => r.player_id === user.id)
  const players = match.match_results || []

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
          <div className="flex items-center gap-3">
            <Swords className="w-6 h-6 text-ember" />
            <h1 className="text-2xl font-display font-bold">Match in Progress</h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {match.lobbies?.name} • Started {formatDistanceToNow(new Date(match.created_at))} ago
          </p>
        </div>
      </div>

      {/* Match Status */}
      <div className="card p-6 bg-gradient-to-br from-ember/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-ember/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-ember" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg">Game Active</h2>
              <p className="text-sm text-gray-400">Play your match and submit results when complete</p>
            </div>
          </div>
          <button
            onClick={() => setShowResultModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            Submit Results
          </button>
        </div>
      </div>

      {/* Players */}
      <div className="space-y-4">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-ember" />
          Players
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {players.map((result, index) => {
            const isCurrentUser = result.player_id === user.id
            const eloTier = getEloTier(result.profiles?.elo || 1200)
            
            return (
              <div
                key={result.id}
                className={`card p-5 ${isCurrentUser ? 'ring-2 ring-ember' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg ${
                    eloTier.bg
                  }`}>
                    {result.profiles?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-semibold truncate">
                        {result.profiles?.username || 'Unknown'}
                      </h4>
                      {isCurrentUser && (
                        <span className="text-xs bg-ember/20 text-ember px-2 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Shield className={`w-4 h-4 ${eloTier.color}`} />
                      <span className={`text-sm ${eloTier.color}`}>
                        {result.profiles?.elo || 1200} ELO
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-400 mt-2 truncate">
                      {result.decks?.commander_name || 'Unknown Commander'}
                    </p>
                  </div>

                  {/* Report button (not for self) */}
                  {!isCurrentUser && (
                    <button
                      onClick={() => {
                        setReportTarget(result)
                        setShowReportModal(true)
                      }}
                      className="p-2 text-gray-500 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors"
                      title="Report player"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tips */}
      <div className="card p-6 bg-arcane/5 border-arcane/20">
        <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-arcane" />
          Important Reminders
        </h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>• All players must validate the results before ELO is updated</li>
          <li>• You cannot join another game until results are validated</li>
          <li>• Fraudulent results may result in account suspension</li>
          <li>• Use the report button if you suspect foul play</li>
        </ul>
      </div>

      {/* Result Submission Modal */}
      {showResultModal && (
        <ResultModal
          players={players}
          placements={placements}
          onSelect={handlePlacementSelect}
          onSubmit={handleSubmitResults}
          onClose={() => setShowResultModal(false)}
          submitting={submitting}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          target={reportTarget}
          data={reportData}
          onChange={setReportData}
          onSubmit={handleSubmitReport}
          onClose={() => {
            setShowReportModal(false)
            setReportData({ reason: '', details: '' })
          }}
        />
      )}
    </div>
  )
}

// Result Submission Modal
function ResultModal({ players, placements, onSelect, onSubmit, onClose, submitting }) {
  const placementIcons = {
    1: { icon: Crown, color: 'text-gold', bg: 'bg-gold/20', label: '1st Place' },
    2: { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-300/20', label: '2nd Place' },
    3: { icon: Award, color: 'text-amber-600', bg: 'bg-amber-600/20', label: '3rd Place' },
    4: { icon: Flag, color: 'text-gray-500', bg: 'bg-gray-500/20', label: '4th Place' }
  }

  // Get player by ID
  const getPlayerById = (id) => players.find(p => p.player_id === id)

  // Check if player is assigned to a placement
  const getPlayerPlacement = (playerId) => {
    const entry = Object.entries(placements).find(([_, id]) => id === playerId)
    return entry ? parseInt(entry[0]) : null
  }

  return (
    <div className="fixed inset-0 bg-void/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-gold" />
            Submit Match Results
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-400 mb-6">
          Select each player's final placement. All players will need to validate these results.
        </p>

        {/* Placements */}
        <div className="space-y-4 mb-6">
          {[1, 2, 3, 4].map(place => {
            const config = placementIcons[place]
            const Icon = config.icon
            const assignedPlayer = placements[place] ? getPlayerById(placements[place]) : null

            return (
              <div key={place} className="card p-4 bg-surface">
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <span className={`font-display font-semibold ${config.color}`}>
                    {config.label}
                  </span>
                  {assignedPlayer && (
                    <span className="ml-auto text-sm text-gray-400">
                      {assignedPlayer.profiles?.username}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {players.map(player => {
                    const isSelected = placements[place] === player.player_id
                    const currentPlacement = getPlayerPlacement(player.player_id)
                    const isAssignedElsewhere = currentPlacement && currentPlacement !== place

                    return (
                      <button
                        key={player.id}
                        onClick={() => onSelect(player.player_id, place)}
                        disabled={isAssignedElsewhere}
                        className={`p-3 rounded-lg text-left transition-all ${
                          isSelected
                            ? 'bg-ember/20 border border-ember text-white'
                            : isAssignedElsewhere
                            ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                            : 'bg-abyss hover:bg-gray-800 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected && <CheckCircle className="w-4 h-4 text-ember" />}
                          <span className="font-medium truncate">
                            {player.profiles?.username}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {player.decks?.commander_name}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* ELO Preview */}
        {Object.keys(placements).length === 4 && (
          <div className="mb-6 p-4 bg-arcane/10 border border-arcane/20 rounded-lg">
            <h4 className="font-display font-semibold mb-3 text-arcane">ELO Changes Preview</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[1, 2, 3, 4].map(place => {
                const player = getPlayerById(placements[place])
                const baseElo = player?.profiles?.elo || 1200
                const avgOppElo = players
                  .filter(p => p.player_id !== player?.player_id)
                  .reduce((sum, p) => sum + (p.profiles?.elo || 1200), 0) / 3
                const change = calculateEloChange(baseElo, avgOppElo, place, player?.profiles?.matches_played || 0)
                
                return (
                  <div key={place} className="flex justify-between items-center p-2 bg-void/50 rounded">
                    <span className="text-gray-400">{player?.profiles?.username}</span>
                    <span className={change >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {change >= 0 ? '+' : ''}{change}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={Object.keys(placements).length !== 4 || submitting}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit Results
          </button>
        </div>
      </div>
    </div>
  )
}

// Report Modal
function ReportModal({ target, data, onChange, onSubmit, onClose }) {
  const reasons = [
    'Cheating/Manipulation',
    'Unsportsmanlike Conduct',
    'Fake/Invalid Game',
    'Collusion',
    'Other'
  ]

  return (
    <div className="fixed inset-0 bg-void/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Flag className="w-5 h-5 text-yellow-500" />
            Report Player
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-400 mb-4">
          Reporting <span className="text-white font-medium">{target?.profiles?.username}</span>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <select
              value={data.reason}
              onChange={(e) => onChange({ ...data, reason: e.target.value })}
              className="input-field"
            >
              <option value="">Select a reason</option>
              {reasons.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Details (Optional)</label>
            <textarea
              value={data.details}
              onChange={(e) => onChange({ ...data, details: e.target.value })}
              placeholder="Provide any additional details..."
              rows={4}
              className="input-field resize-none"
            />
          </div>
        </div>

        <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-500">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            False reports may result in penalties. Only report genuine concerns.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!data.reason}
            className="btn-primary flex-1 bg-yellow-600 hover:bg-yellow-700"
          >
            Submit Report
          </button>
        </div>
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
