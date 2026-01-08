import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { 
  Shield, Users, Swords, Trophy, Flag, Plus, Search,
  Check, X, Loader2, ChevronDown, AlertTriangle, Trash2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore, useToastStore } from '../lib/store'
import { formatDate } from '../lib/utils'

export default function AdminPage() {
  const { profile } = useAuthStore()
  const { addToast } = useToastStore()

  const [activeTab, setActiveTab] = useState('reports')
  const [loading, setLoading] = useState(true)

  // Data states
  const [reports, setReports] = useState([])
  const [commanders, setCommanders] = useState([])
  const [players, setPlayers] = useState([])
  const [stats, setStats] = useState(null)

  // Modal states
  const [showAddCommander, setShowAddCommander] = useState(false)
  const [newCommander, setNewCommander] = useState({ name: '', color_identity: '' })
  const [addingCommander, setAddingCommander] = useState(false)

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // Redirect non-admins
  if (profile && !profile.is_admin) {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'reports') {
        await fetchReports()
      } else if (activeTab === 'commanders') {
        await fetchCommanders()
      } else if (activeTab === 'players') {
        await fetchPlayers()
      } else if (activeTab === 'stats') {
        await fetchStats()
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reporter_id(username),
        reported_player:profiles!reported_player_id(username)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reports:', error)
      return
    }
    setReports(data || [])
  }

  const fetchCommanders = async () => {
    const { data, error } = await supabase
      .from('commanders')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching commanders:', error)
      return
    }
    setCommanders(data || [])
  }

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('elo', { ascending: false })

    if (error) {
      console.error('Error fetching players:', error)
      return
    }
    setPlayers(data || [])
  }

  const fetchStats = async () => {
    try {
      const [playersRes, matchesRes, decksRes, lobbiesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('matches').select('id', { count: 'exact' }),
        supabase.from('decks').select('id', { count: 'exact' }),
        supabase.from('lobbies').select('id', { count: 'exact' }).eq('status', 'waiting')
      ])

      setStats({
        totalPlayers: playersRes.count || 0,
        totalMatches: matchesRes.count || 0,
        totalDecks: decksRes.count || 0,
        activeLobbies: lobbiesRes.count || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleReportAction = async (reportId, action) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: action })
        .eq('id', reportId)

      if (error) throw error
      
      addToast(`Report ${action}`, 'success')
      fetchReports()
    } catch (error) {
      addToast('Failed to update report', 'error')
    }
  }

  const handleAddCommander = async (e) => {
    e.preventDefault()
    
    if (!newCommander.name.trim()) {
      addToast('Commander name is required', 'error')
      return
    }

    setAddingCommander(true)
    try {
      const { error } = await supabase
        .from('commanders')
        .insert({
          name: newCommander.name.trim(),
          color_identity: newCommander.color_identity.trim().toUpperCase(),
          is_legal: true
        })

      if (error) throw error

      addToast('Commander added successfully', 'success')
      setShowAddCommander(false)
      setNewCommander({ name: '', color_identity: '' })
      fetchCommanders()
    } catch (error) {
      addToast(error.message || 'Failed to add commander', 'error')
    } finally {
      setAddingCommander(false)
    }
  }

  const toggleCommanderLegality = async (commanderId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('commanders')
        .update({ is_legal: !currentStatus })
        .eq('id', commanderId)

      if (error) throw error
      
      addToast(`Commander ${currentStatus ? 'banned' : 'unbanned'}`, 'success')
      fetchCommanders()
    } catch (error) {
      addToast('Failed to update commander', 'error')
    }
  }

  const filteredCommanders = commanders.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredPlayers = players.filter(p =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs = [
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'commanders', label: 'Commanders', icon: Swords },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'stats', label: 'Stats', icon: Trophy }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-red-400" />
        <h1 className="text-3xl font-display font-bold text-white">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setSearchQuery('')
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-ember text-white'
                : 'text-gray-400 hover:text-white hover:bg-slate'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-ember" />
        </div>
      ) : (
        <>
          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="card p-6">
              <h2 className="text-xl font-display font-bold text-white mb-4">
                Player Reports ({reports.filter(r => r.status === 'pending').length} pending)
              </h2>

              {reports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reports</p>
              ) : (
                <div className="space-y-4">
                  {reports.map(report => (
                    <div 
                      key={report.id}
                      className={`p-4 rounded-lg border ${
                        report.status === 'pending' 
                          ? 'bg-yellow-500/5 border-yellow-500/30' 
                          : 'bg-slate/50 border-gray-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`badge ${
                              report.status === 'pending' ? 'badge-warning' :
                              report.status === 'resolved' ? 'badge-success' :
                              'badge-secondary'
                            }`}>
                              {report.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDate(report.created_at)}
                            </span>
                          </div>
                          <p className="text-white mb-1">
                            <span className="text-gray-400">Reporter:</span>{' '}
                            {report.reporter?.username}
                          </p>
                          <p className="text-white mb-2">
                            <span className="text-gray-400">Reported:</span>{' '}
                            <span className="text-red-400">{report.reported_player?.username}</span>
                          </p>
                          <p className="text-gray-300">
                            <strong>Reason:</strong> {report.reason}
                          </p>
                          {report.details && (
                            <p className="text-gray-400 text-sm mt-1">{report.details}</p>
                          )}
                        </div>

                        {report.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReportAction(report.id, 'resolved')}
                              className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                              title="Resolve"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReportAction(report.id, 'dismissed')}
                              className="p-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30"
                              title="Dismiss"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Commanders Tab */}
          {activeTab === 'commanders' && (
            <div className="card p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-display font-bold text-white">
                  Legal Commanders ({commanders.filter(c => c.is_legal).length})
                </h2>
                <button
                  onClick={() => setShowAddCommander(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Commander
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Search commanders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredCommanders.map(commander => (
                  <div 
                    key={commander.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      commander.is_legal ? 'bg-slate/50' : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    <div>
                      <p className={`font-medium ${commander.is_legal ? 'text-white' : 'text-red-400'}`}>
                        {commander.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {commander.color_identity || 'Colorless'}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleCommanderLegality(commander.id, commander.is_legal)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        commander.is_legal
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      {commander.is_legal ? 'Ban' : 'Unban'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Players Tab */}
          {activeTab === 'players' && (
            <div className="card p-6">
              <h2 className="text-xl font-display font-bold text-white mb-4">
                All Players ({players.length})
              </h2>

              <div className="relative mb-4">
                <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500 text-sm border-b border-gray-800">
                      <th className="pb-3 font-medium">Username</th>
                      <th className="pb-3 font-medium">ELO</th>
                      <th className="pb-3 font-medium">W/L</th>
                      <th className="pb-3 font-medium">Joined</th>
                      <th className="pb-3 font-medium">Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.map(player => (
                      <tr key={player.id} className="border-b border-gray-800/50">
                        <td className="py-3 text-white">{player.username}</td>
                        <td className="py-3 text-gold font-mono">{player.elo}</td>
                        <td className="py-3 text-gray-400">
                          {player.wins}-{player.losses}
                        </td>
                        <td className="py-3 text-gray-500 text-sm">
                          {formatDate(player.created_at)}
                        </td>
                        <td className="py-3">
                          {player.is_admin && (
                            <Shield className="w-4 h-4 text-red-400" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stat-card">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-ember" />
                  <span className="text-gray-400">Total Players</span>
                </div>
                <div className="text-3xl font-display font-bold text-white">
                  {stats.totalPlayers}
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center gap-2 mb-2">
                  <Swords className="w-5 h-5 text-gold" />
                  <span className="text-gray-400">Total Matches</span>
                </div>
                <div className="text-3xl font-display font-bold text-white">
                  {stats.totalMatches}
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400">Registered Decks</span>
                </div>
                <div className="text-3xl font-display font-bold text-white">
                  {stats.totalDecks}
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center gap-2 mb-2">
                  <Flag className="w-5 h-5 text-arcane" />
                  <span className="text-gray-400">Active Lobbies</span>
                </div>
                <div className="text-3xl font-display font-bold text-white">
                  {stats.activeLobbies}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Commander Modal */}
      {showAddCommander && (
        <div className="modal-overlay" onClick={() => setShowAddCommander(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-display font-bold text-white mb-4">
              Add Legal Commander
            </h3>

            <form onSubmit={handleAddCommander} className="space-y-4">
              <div>
                <label className="label">Commander Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Tatyova, Benthic Druid"
                  value={newCommander.name}
                  onChange={(e) => setNewCommander({...newCommander, name: e.target.value})}
                />
              </div>

              <div>
                <label className="label">Color Identity</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., UG, WBR, C"
                  value={newCommander.color_identity}
                  onChange={(e) => setNewCommander({...newCommander, color_identity: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use WUBRG notation (C for colorless)
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddCommander(false)}
                  className="btn-secondary flex-1"
                  disabled={addingCommander}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={addingCommander}
                >
                  {addingCommander ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    'Add Commander'
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
