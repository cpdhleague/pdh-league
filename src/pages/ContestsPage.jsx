import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Sparkles, Calendar, Users, Clock, Trophy,
  ChevronRight, Loader2, Filter, Search, Star
} from 'lucide-react'
import { useContestStore, useAuthStore } from '../lib/store'
import { format, isPast, isFuture, isWithinInterval } from 'date-fns'

export default function ContestsPage() {
  const { contests, loading, fetchContests } = useContestStore()
  const { user } = useAuthStore()
  const [filter, setFilter] = useState('all') // all, active, upcoming, past
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchContests()
  }, [fetchContests])

  // Get contest status
  const getContestStatus = (contest) => {
    const now = new Date()
    const start = new Date(contest.start_date)
    const end = new Date(contest.end_date)

    if (isFuture(start)) return 'upcoming'
    if (isPast(end)) return 'ended'
    return 'active'
  }

  // Filter contests
  const filteredContests = contests
    .filter(contest => {
      if (filter !== 'all') {
        const status = getContestStatus(contest)
        if (filter === 'active' && status !== 'active') return false
        if (filter === 'upcoming' && status !== 'upcoming') return false
        if (filter === 'past' && status !== 'ended') return false
      }
      if (searchQuery) {
        return contest.title?.toLowerCase().includes(searchQuery.toLowerCase())
      }
      return true
    })
    .sort((a, b) => {
      // Active first, then upcoming, then past
      const statusA = getContestStatus(a)
      const statusB = getContestStatus(b)
      const order = { active: 0, upcoming: 1, ended: 2 }
      return order[statusA] - order[statusB]
    })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-arcane" />
            Deckbuilding Contests
          </h1>
          <p className="text-gray-400 mt-1">
            Compete in themed challenges and show off your brewing skills
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contests..."
              className="input-field pl-10"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'past', label: 'Past' }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.value
                    ? 'bg-arcane text-white'
                    : 'bg-surface text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contests Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-arcane" />
        </div>
      ) : filteredContests.length === 0 ? (
        <div className="card p-12 text-center">
          <Sparkles className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-display font-semibold mb-2">No Contests Found</h3>
          <p className="text-gray-400">
            {searchQuery 
              ? 'Try a different search term' 
              : 'Check back soon for new contests!'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredContests.map(contest => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}

      {/* How It Works */}
      <div className="card p-6">
        <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-gold" />
          How Contests Work
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-arcane/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-arcane font-display font-bold text-xl">1</span>
            </div>
            <h4 className="font-medium mb-2">Read the Rules</h4>
            <p className="text-sm text-gray-400">
              Each contest has unique requirements and restrictions for your deck.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-arcane/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-arcane font-display font-bold text-xl">2</span>
            </div>
            <h4 className="font-medium mb-2">Build & Submit</h4>
            <p className="text-sm text-gray-400">
              Create your deck on Moxfield/Archidekt and submit the link before the deadline.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-arcane/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-arcane font-display font-bold text-xl">3</span>
            </div>
            <h4 className="font-medium mb-2">Win Prizes</h4>
            <p className="text-sm text-gray-400">
              Community voting or judge review determines winners for prizes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Contest Card Component
function ContestCard({ contest }) {
  const status = getContestStatus(contest)
  const entryCount = contest.contest_entries?.[0]?.count || 0

  const statusConfig = {
    active: { 
      label: 'Active', 
      color: 'text-green-500', 
      bg: 'bg-green-500/20',
      border: 'border-green-500/30'
    },
    upcoming: { 
      label: 'Upcoming', 
      color: 'text-blue-400', 
      bg: 'bg-blue-400/20',
      border: 'border-blue-400/30'
    },
    ended: { 
      label: 'Ended', 
      color: 'text-gray-500', 
      bg: 'bg-gray-500/20',
      border: 'border-gray-500/30'
    }
  }

  const config = statusConfig[status]

  return (
    <Link
      to={`/contest/${contest.id}`}
      className={`card p-6 hover:border-arcane/50 transition-all group ${
        status === 'active' ? 'border-green-500/30' : ''
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
          <Trophy className={`w-8 h-8 ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-display font-bold text-lg group-hover:text-arcane transition-colors truncate">
              {contest.title}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.color} flex-shrink-0`}>
              {config.label}
            </span>
          </div>

          <p className="text-gray-400 text-sm line-clamp-2 mb-3">
            {contest.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(contest.start_date), 'MMM d')} - {format(new Date(contest.end_date), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{entryCount} entries</span>
            </div>
            {status === 'active' && (
              <div className="flex items-center gap-1 text-green-500">
                <Clock className="w-4 h-4" />
                <span>
                  {Math.ceil((new Date(contest.end_date) - new Date()) / (1000 * 60 * 60 * 24))} days left
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-arcane group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>
    </Link>
  )
}

// Helper to get contest status
function getContestStatus(contest) {
  const now = new Date()
  const start = new Date(contest.start_date)
  const end = new Date(contest.end_date)

  if (isFuture(start)) return 'upcoming'
  if (isPast(end)) return 'ended'
  return 'active'
}
