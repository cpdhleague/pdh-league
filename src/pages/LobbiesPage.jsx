import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLobbyStore, useDeckStore, useAuthStore, useToastStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { formatRelativeTime, generateLobbyCode } from '../lib/utils'
import { 
  Plus, 
  Users, 
  Search, 
  RefreshCw, 
  Loader2,
  Clock,
  User,
  ChevronRight,
  X,
  Layers
} from 'lucide-react'

function LobbiesPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { lobbies, fetchLobbies, createLobby, joinLobby, loading } = useLobbyStore()
  const { decks, fetchDecks } = useDeckStore()
  const { addToast } = useToastStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [selectedLobby, setSelectedLobby] = useState(null)
  const [selectedDeck, setSelectedDeck] = useState(null)
  const [lobbyName, setLobbyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    fetchLobbies()
    fetchDecks()
    
    // Subscribe to lobby changes for real-time updates
    const channel = supabase
      .channel('lobbies-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lobbies' },
        () => fetchLobbies()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lobby_players' },
        () => fetchLobbies()
      )
      .subscribe()
    
    return () => supabase.removeChannel(channel)
  }, [fetchLobbies, fetchDecks])

  const activeDecks = decks.filter(d => d.is_active)
  
  const filteredLobbies = lobbies.filter(lobby => {
    const matchesSearch = lobby.name.toLowerCase().includes(searchQuery.toLowerCase())
    const notFull = (lobby.lobby_players?.length || 0) < 4
    const notAlreadyJoined = !lobby.lobby_players?.some(p => p.player_id === user?.id)
    return matchesSearch && notFull && notAlreadyJoined
  })

  // Lobbies the user is already in
  const myLobbies = lobbies.filter(lobby => 
    lobby.lobby_players?.some(p => p.player_id === user?.id)
  )

  const handleCreateLobby = async () => {
    if (!selectedDeck || !lobbyName.trim()) return
    
    setCreating(true)
    try {
      const lobby = await createLobby(lobbyName, selectedDeck.id)
      addToast({ type: 'success', message: 'Lobby created!' })
      setShowCreateModal(false)
      navigate(`/lobby/${lobby.id}`)
    } catch (error) {
      addToast({ type: 'error', message: error.message })
    } finally {
      setCreating(false)
    }
  }

  const handleJoinLobby = async () => {
    if (!selectedDeck || !selectedLobby) return
    
    setJoining(true)
    try {
      await joinLobby(selectedLobby.id, selectedDeck.id)
      addToast({ type: 'success', message: 'Joined lobby!' })
      setShowJoinModal(false)
      navigate(`/lobby/${selectedLobby.id}`)
    } catch (error) {
      addToast({ type: 'error', message: error.message })
    } finally {
      setJoining(false)
    }
  }

  const openJoinModal = (lobby) => {
    setSelectedLobby(lobby)
    setSelectedDeck(null)
    setShowJoinModal(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-pale mb-2">
            Game Lobbies
          </h1>
          <p className="text-dim">
            Create or join a lobby to start a match
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fetchLobbies()}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={() => {
              setSelectedDeck(null)
              setLobbyName('')
              setShowCreateModal(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Lobby
          </button>
        </div>
      </div>

      {/* My Active Lobbies */}
      {myLobbies.length > 0 && (
        <div className="card border-ember/30 bg-ember/5">
          <h2 className="font-display font-semibold text-lg text-pale mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-ember" />
            Your Active Lobbies
          </h2>
          <div className="space-y-3">
            {myLobbies.map(lobby => (
              <Link
                key={lobby.id}
                to={`/lobby/${lobby.id}`}
                className="flex items-center justify-between p-4 bg-stone/50 rounded-lg 
                  hover:bg-stone transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-ember/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-ember" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-pale group-hover:text-ember transition-colors">
                      {lobby.name}
                    </h3>
                    <p className="text-sm text-dim">
                      {lobby.lobby_players?.length || 0}/4 players • 
                      Created {formatRelativeTime(lobby.created_at)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-dim group-hover:text-ember transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dim" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-12"
          placeholder="Search lobbies..."
        />
      </div>

      {/* Available Lobbies */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="card">
              <div className="skeleton h-6 w-3/4 mb-4" />
              <div className="skeleton h-4 w-1/2 mb-2" />
              <div className="skeleton h-10 w-full mt-4" />
            </div>
          ))}
        </div>
      ) : filteredLobbies.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLobbies.map((lobby, index) => (
            <div 
              key={lobby.id} 
              className="card animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-arcane/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-arcane-glow" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-pale">
                      {lobby.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-dim">
                      <Clock className="w-4 h-4" />
                      {formatRelativeTime(lobby.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Players */}
              <div className="mb-4">
                <p className="text-sm text-dim mb-2">Players ({lobby.lobby_players?.length || 0}/4)</p>
                <div className="flex gap-2">
                  {[0,1,2,3].map(slot => {
                    const player = lobby.lobby_players?.[slot]
                    return (
                      <div
                        key={slot}
                        className={`flex-1 h-10 rounded-lg flex items-center justify-center
                          ${player 
                            ? 'bg-arcane/20 border border-arcane/30' 
                            : 'bg-stone/50 border border-dashed border-mist'}`}
                      >
                        {player ? (
                          <span className="text-sm text-arcane-glow font-medium truncate px-2">
                            {player.profiles?.username}
                          </span>
                        ) : (
                          <User className="w-4 h-4 text-mist" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={() => openJoinModal(lobby)}
                disabled={activeDecks.length === 0}
                className="btn-primary w-full"
              >
                {activeDecks.length === 0 ? 'No Active Decks' : 'Join Lobby'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Users className="w-16 h-16 text-mist mx-auto mb-4" />
          <h3 className="font-display font-semibold text-xl text-pale mb-2">
            {searchQuery ? 'No lobbies found' : 'No open lobbies'}
          </h3>
          <p className="text-dim mb-6 max-w-md mx-auto">
            {searchQuery 
              ? 'Try adjusting your search'
              : 'Be the first to create a lobby and start a match'}
          </p>
          {!searchQuery && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create a Lobby
            </button>
          )}
        </div>
      )}

      {/* Create Lobby Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-mist">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-xl text-pale">
                  Create New Lobby
                </h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-stone rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-dim" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-pale mb-2">
                  Lobby Name
                </label>
                <input
                  type="text"
                  value={lobbyName}
                  onChange={(e) => setLobbyName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Casual Game #1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pale mb-2">
                  Select Your Deck
                </label>
                {activeDecks.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {activeDecks.map(deck => (
                      <button
                        key={deck.id}
                        onClick={() => setSelectedDeck(deck)}
                        className={`w-full p-4 rounded-lg text-left transition-all flex items-center gap-4
                          ${selectedDeck?.id === deck.id 
                            ? 'bg-ember/20 border-2 border-ember' 
                            : 'bg-stone/50 border-2 border-transparent hover:bg-stone'}`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-arcane/20 flex items-center justify-center">
                          <Layers className="w-5 h-5 text-arcane-glow" />
                        </div>
                        <div>
                          <p className="font-medium text-pale">{deck.name}</p>
                          <p className="text-sm text-ember">{deck.commander_name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-stone/30 rounded-lg">
                    <p className="text-dim mb-2">No active decks</p>
                    <Link to="/decks/register" className="text-ember hover:text-ember-glow">
                      Register a deck first
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-mist flex gap-3">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateLobby}
                disabled={!selectedDeck || !lobbyName.trim() || creating}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {creating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Lobby
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Lobby Modal */}
      {showJoinModal && selectedLobby && (
        <div className="modal-backdrop" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-mist">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-xl text-pale">
                  Join {selectedLobby.name}
                </h2>
                <button 
                  onClick={() => setShowJoinModal(false)}
                  className="p-2 hover:bg-stone rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-dim" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-pale mb-2">
                  Select Your Deck
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activeDecks.map(deck => (
                    <button
                      key={deck.id}
                      onClick={() => setSelectedDeck(deck)}
                      className={`w-full p-4 rounded-lg text-left transition-all flex items-center gap-4
                        ${selectedDeck?.id === deck.id 
                          ? 'bg-ember/20 border-2 border-ember' 
                          : 'bg-stone/50 border-2 border-transparent hover:bg-stone'}`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-arcane/20 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-arcane-glow" />
                      </div>
                      <div>
                        <p className="font-medium text-pale">{deck.name}</p>
                        <p className="text-sm text-ember">{deck.commander_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-mist flex gap-3">
              <button 
                onClick={() => setShowJoinModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button 
                onClick={handleJoinLobby}
                disabled={!selectedDeck || joining}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {joining ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Users className="w-5 h-5" />
                    Join Lobby
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LobbiesPage
