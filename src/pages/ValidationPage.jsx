import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CheckCircle, XCircle, AlertTriangle, Trophy, Crown, Medal, 
  Award, Flag, Shield, Clock, TrendingUp, TrendingDown,
  Loader2, ArrowRight, MessageSquare
} from 'lucide-react'
import { useAuthStore, useMatchStore, useToastStore } from '../lib/store'
import { formatDistanceToNow } from 'date-fns'
import { calculateEloChange } from '../lib/utils'

export default function ValidationPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { pendingValidation, validateResult, fetchPendingValidation } = useMatchStore()
  const { addToast } = useToastStore()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const [challengeReason, setChallengeReason] = useState('')

  useEffect(() => {
    const load = async () => {
      await fetchPendingValidation()
      setLoading(false)
    }
    load()
  }, [fetchPendingValidation])

  // Handle validation
  const handleValidate = async () => {
    setSubmitting(true)
    try {
      await validateResult(pendingValidation.id, true)
      addToast({ type: 'success', message: 'Results validated! Your ELO has been updated.' })
      navigate('/dashboard')
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to validate results' })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle challenge
  const handleChallenge = async () => {
    if (!challengeReason.trim()) {
      addToast({ type: 'error', message: 'Please provide a reason for challenging' })
      return
    }

    setSubmitting(true)
    try {
      await validateResult(pendingValidation.id, false, true, challengeReason)
      addToast({ type: 'warning', message: 'Challenge submitted. An admin will review.' })
      navigate('/dashboard')
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to submit challenge' })
    } finally {
      setSubmitting(false)
      setShowChallengeModal(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-ember" />
      </div>
    )
  }

  if (!pendingValidation) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-xl font-display font-bold mb-2">All Clear!</h2>
        <p className="text-gray-400 mb-6">You have no pending match validations.</p>
        <button
          onClick={() => navigate('/lobbies')}
          className="btn-primary"
        >
          Find a Match
        </button>
      </div>
    )
  }

  const match = pendingValidation.matches
  const results = match?.match_results || []
  const myResult = pendingValidation
  const myPlacement = myResult.placement

  // Calculate ELO changes
  const myElo = profile?.elo || 1200
  const avgOppElo = results
    .filter(r => r.player_id !== user.id)
    .reduce((sum, r) => sum + (r.profiles?.elo || 1200), 0) / 3
  const myEloChange = calculateEloChange(myElo, avgOppElo, myPlacement, profile?.matches_played || 0)

  // Check for any reports or challenges
  const hasReports = results.some(r => r.challenged)

  const placementConfig = {
    1: { icon: Crown, color: 'text-gold', bg: 'bg-gold/20', label: '1st Place - Victory!' },
    2: { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-300/20', label: '2nd Place' },
    3: { icon: Award, color: 'text-amber-600', bg: 'bg-amber-600/20', label: '3rd Place' },
    4: { icon: Flag, color: 'text-gray-500', bg: 'bg-gray-500/20', label: '4th Place' }
  }

  const PlacementIcon = placementConfig[myPlacement]?.icon || Flag

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-display font-bold mb-2">Validate Match Results</h1>
        <p className="text-gray-400">
          Review and confirm the results from your recent match
        </p>
      </div>

      {/* Your Result Card */}
      <div className={`card p-8 text-center ${
        myPlacement === 1 ? 'bg-gradient-to-br from-gold/10 to-transparent border-gold/30' : ''
      }`}>
        <div className={`w-20 h-20 rounded-full ${placementConfig[myPlacement]?.bg} flex items-center justify-center mx-auto mb-4`}>
          <PlacementIcon className={`w-10 h-10 ${placementConfig[myPlacement]?.color}`} />
        </div>
        
        <h2 className={`text-2xl font-display font-bold ${placementConfig[myPlacement]?.color}`}>
          {placementConfig[myPlacement]?.label}
        </h2>
        
        <p className="text-gray-400 mt-2 mb-6">
          Playing {myResult.decks?.commander_name}
        </p>

        {/* ELO Change */}
        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl ${
          myEloChange >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
        }`}>
          {myEloChange >= 0 ? (
            <TrendingUp className="w-6 h-6 text-green-500" />
          ) : (
            <TrendingDown className="w-6 h-6 text-red-500" />
          )}
          <div className="text-left">
            <p className="text-sm text-gray-400">ELO Change</p>
            <p className={`text-xl font-display font-bold ${
              myEloChange >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {myEloChange >= 0 ? '+' : ''}{myEloChange}
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-500 mx-2" />
          <div className="text-left">
            <p className="text-sm text-gray-400">New ELO</p>
            <p className="text-xl font-display font-bold text-white">
              {myElo + myEloChange}
            </p>
          </div>
        </div>
      </div>

      {/* Match Details */}
      <div className="card p-6">
        <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-ember" />
          Match Results
        </h3>
        
        <p className="text-sm text-gray-400 mb-4">
          {match?.lobbies?.name || 'Match'} • Completed {formatDistanceToNow(new Date(match?.completed_at || match?.created_at))} ago
        </p>

        <div className="space-y-3">
          {results
            .sort((a, b) => a.placement - b.placement)
            .map(result => {
              const isMe = result.player_id === user.id
              const config = placementConfig[result.placement]
              const Icon = config?.icon || Flag

              return (
                <div
                  key={result.id}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    isMe ? 'bg-ember/10 border border-ember/30' : 'bg-surface'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${config?.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${config?.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {result.profiles?.username || 'Unknown'}
                      </span>
                      {isMe && (
                        <span className="text-xs bg-ember/20 text-ember px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                      {result.challenged && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Challenged
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {result.decks?.commander_name}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`font-display font-semibold ${config?.color}`}>
                      #{result.placement}
                    </p>
                    <p className="text-xs text-gray-500">
                      {result.profiles?.elo || 1200} ELO
                    </p>
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Reports Warning */}
      {hasReports && (
        <div className="card p-4 bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-500">Match Under Review</h4>
              <p className="text-sm text-gray-400 mt-1">
                One or more players have challenged these results. An admin will review the match.
                You may still validate or challenge.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="card p-6">
        <h3 className="font-display font-semibold text-lg mb-4">Confirm Results</h3>
        <p className="text-gray-400 text-sm mb-6">
          By validating, you confirm that the results above are accurate. If the results are incorrect,
          you can challenge them for admin review.
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => setShowChallengeModal(true)}
            disabled={submitting}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10"
          >
            <XCircle className="w-5 h-5" />
            Challenge
          </button>
          <button
            onClick={handleValidate}
            disabled={submitting}
            className="btn-primary flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            Validate Results
          </button>
        </div>
      </div>

      {/* Challenge Modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-void/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-xl font-display font-bold">Challenge Results</h2>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Please explain why you believe these results are incorrect. An admin will review your challenge.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Reason for Challenge</label>
              <textarea
                value={challengeReason}
                onChange={(e) => setChallengeReason(e.target.value)}
                placeholder="Explain the issue with these results..."
                rows={4}
                className="input-field resize-none"
              />
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-6">
              <p className="text-xs text-yellow-500">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                False challenges may result in account warnings. Only challenge if results are genuinely incorrect.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowChallengeModal(false)
                  setChallengeReason('')
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleChallenge}
                disabled={!challengeReason.trim() || submitting}
                className="btn-primary flex-1 bg-yellow-600 hover:bg-yellow-700 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                Submit Challenge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
