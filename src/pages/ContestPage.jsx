import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  Trophy, Calendar, Users, Clock, FileText, ExternalLink, 
  ChevronLeft, Upload, CheckCircle, AlertCircle, Loader2 
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore, useContestStore, useToastStore } from '../lib/store'
import { formatDate } from '../lib/utils'

export default function ContestPage() {
  const { id } = useParams()
  const { user, profile } = useAuthStore()
  const { submitEntry } = useContestStore()
  const { addToast } = useToastStore()
  
  const [contest, setContest] = useState(null)
  const [entries, setEntries] = useState([])
  const [userEntry, setUserEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [decklistUrl, setDecklistUrl] = useState('')
  const [decklistText, setDecklistText] = useState('')
  const [submitMethod, setSubmitMethod] = useState('url')

  useEffect(() => {
    fetchContest()
    fetchEntries()
  }, [id])

  const fetchContest = async () => {
    try {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setContest(data)
    } catch (error) {
      console.error('Error fetching contest:', error)
      addToast('Failed to load contest', 'error')
    }
  }

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('contest_entries')
        .select(`
          *,
          player:profiles(id, username, elo)
        `)
        .eq('contest_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEntries(data || [])
      
      // Check if user has an entry
      const myEntry = data?.find(e => e.player_id === user?.id)
      setUserEntry(myEntry || null)
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (submitMethod === 'url' && !decklistUrl) {
      addToast('Please enter a decklist URL', 'error')
      return
    }
    if (submitMethod === 'text' && !decklistText) {
      addToast('Please paste your decklist', 'error')
      return
    }

    setSubmitting(true)
    try {
      await submitEntry(id, {
        decklist_url: submitMethod === 'url' ? decklistUrl : null,
        decklist_text: submitMethod === 'text' ? decklistText : null
      })
      
      addToast('Entry submitted successfully!', 'success')
      setShowSubmitModal(false)
      setDecklistUrl('')
      setDecklistText('')
      fetchEntries()
    } catch (error) {
      addToast(error.message || 'Failed to submit entry', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const getContestStatus = () => {
    if (!contest) return 'unknown'
    const now = new Date()
    const start = new Date(contest.start_date)
    const end = new Date(contest.end_date)
    
    if (now < start) return 'upcoming'
    if (now > end) return 'ended'
    return 'active'
  }

  const status = getContestStatus()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-ember" />
      </div>
    )
  }

  if (!contest) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold text-white mb-2">Contest Not Found</h2>
        <p className="text-gray-400 mb-6">This contest doesn't exist or has been removed.</p>
        <Link to="/contests" className="btn-primary">
          Back to Contests
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link 
        to="/contests" 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Contests
      </Link>

      {/* Contest Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-gold" />
              <h1 className="text-3xl font-display font-bold text-white">
                {contest.title}
              </h1>
            </div>
            <p className="text-gray-400 max-w-2xl">{contest.description}</p>
          </div>
          
          <div className={`badge ${
            status === 'active' ? 'badge-success' :
            status === 'upcoming' ? 'badge-warning' :
            'badge-secondary'
          }`}>
            {status === 'active' ? 'Active' :
             status === 'upcoming' ? 'Upcoming' :
             'Ended'}
          </div>
        </div>

        {/* Contest Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Start Date</p>
              <p className="text-white">{formatDate(contest.start_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">End Date</p>
              <p className="text-white">{formatDate(contest.end_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Entries</p>
              <p className="text-white">{entries.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Your Status</p>
              <p className={userEntry ? 'text-green-400' : 'text-gray-400'}>
                {userEntry ? 'Submitted' : 'Not Entered'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules */}
      {contest.rules && (
        <div className="card p-6">
          <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-ember" />
            Rules & Guidelines
          </h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap">{contest.rules}</p>
          </div>
        </div>
      )}

      {/* Submit Entry Section */}
      {status === 'active' && !userEntry && (
        <div className="card p-6 border-2 border-dashed border-ember/30">
          <div className="text-center">
            <Upload className="w-12 h-12 text-ember mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold text-white mb-2">
              Ready to Enter?
            </h3>
            <p className="text-gray-400 mb-4">
              Submit your decklist to participate in this contest.
            </p>
            <button 
              onClick={() => setShowSubmitModal(true)}
              className="btn-primary"
            >
              Submit Entry
            </button>
          </div>
        </div>
      )}

      {/* User's Entry */}
      {userEntry && (
        <div className="card p-6 border border-green-500/30 bg-green-500/5">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-display font-bold text-white">
              Your Entry
            </h3>
          </div>
          <p className="text-gray-400 mb-2">
            Submitted on {formatDate(userEntry.created_at)}
          </p>
          {userEntry.decklist_url && (
            <a 
              href={userEntry.decklist_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-ember hover:text-ember-light"
            >
              View Decklist <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      )}

      {/* Entries List */}
      <div className="card p-6">
        <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-ember" />
          All Entries ({entries.length})
        </h2>

        {entries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No entries yet. Be the first to submit!
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div 
                key={entry.id}
                className="flex items-center justify-between p-4 bg-slate/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-abyss flex items-center justify-center text-gray-400 font-mono">
                    #{index + 1}
                  </span>
                  <div>
                    <Link 
                      to={`/profile/${entry.player?.id}`}
                      className="text-white hover:text-ember transition-colors font-medium"
                    >
                      {entry.player?.username}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="badge badge-secondary">
                    {entry.player?.elo} ELO
                  </span>
                  {entry.decklist_url && (
                    <a 
                      href={entry.decklist_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-ember transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-display font-bold text-white mb-4">
              Submit Contest Entry
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Method Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSubmitMethod('url')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    submitMethod === 'url' 
                      ? 'bg-ember text-white' 
                      : 'bg-slate text-gray-400 hover:bg-slate/80'
                  }`}
                >
                  Import URL
                </button>
                <button
                  type="button"
                  onClick={() => setSubmitMethod('text')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    submitMethod === 'text' 
                      ? 'bg-ember text-white' 
                      : 'bg-slate text-gray-400 hover:bg-slate/80'
                  }`}
                >
                  Paste List
                </button>
              </div>

              {submitMethod === 'url' ? (
                <div>
                  <label className="label">Decklist URL</label>
                  <input
                    type="url"
                    className="input"
                    placeholder="https://moxfield.com/decks/..."
                    value={decklistUrl}
                    onChange={(e) => setDecklistUrl(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Moxfield or Archidekt links supported
                  </p>
                </div>
              ) : (
                <div>
                  <label className="label">Decklist</label>
                  <textarea
                    className="input min-h-[200px] font-mono text-sm"
                    placeholder="1 Sol Ring&#10;1 Command Tower&#10;..."
                    value={decklistText}
                    onChange={(e) => setDecklistText(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Entry'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
