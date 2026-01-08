import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDeckStore, useToastStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { formatRelativeTime } from '../lib/utils'
import { 
  Plus, 
  Layers, 
  Trophy, 
  Swords, 
  MoreVertical,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  ChevronDown
} from 'lucide-react'

function DecksPage() {
  const { decks, fetchDecks, loading } = useDeckStore()
  const { addToast } = useToastStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState('all')
  const [activeMenu, setActiveMenu] = useState(null)

  useEffect(() => {
    fetchDecks()
  }, [fetchDecks])

  const filteredDecks = decks.filter(deck => {
    const matchesSearch = deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.commander_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterActive === 'all' || 
      (filterActive === 'active' && deck.is_active) ||
      (filterActive === 'inactive' && !deck.is_active)
    return matchesSearch && matchesFilter
  })

  const toggleDeckActive = async (deckId, currentState) => {
    try {
      const { error } = await supabase
        .from('decks')
        .update({ is_active: !currentState })
        .eq('id', deckId)
      
      if (error) throw error
      
      fetchDecks()
      addToast({ 
        type: 'success', 
        message: `Deck ${!currentState ? 'activated' : 'deactivated'}` 
      })
    } catch (error) {
      addToast({ type: 'error', message: error.message })
    }
    setActiveMenu(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-pale mb-2">
            My Decks
          </h1>
          <p className="text-dim">
            Manage your registered commanders and decks
          </p>
        </div>
        <Link to="/decks/register" className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          Register New Deck
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12"
            placeholder="Search decks or commanders..."
          />
        </div>
        <div className="relative">
          <button 
            onClick={() => setActiveMenu(activeMenu === 'filter' ? null : 'filter')}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            {filterActive === 'all' ? 'All Decks' : 
              filterActive === 'active' ? 'Active Only' : 'Inactive Only'}
            <ChevronDown className="w-4 h-4" />
          </button>
          {activeMenu === 'filter' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
              <div className="absolute right-0 mt-2 w-48 bg-slate border border-mist rounded-xl shadow-xl z-50 overflow-hidden">
                {['all', 'active', 'inactive'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => { setFilterActive(filter); setActiveMenu(null) }}
                    className={`w-full px-4 py-3 text-left hover:bg-stone transition-colors
                      ${filterActive === filter ? 'text-ember' : 'text-pale'}`}
                  >
                    {filter === 'all' ? 'All Decks' : 
                      filter === 'active' ? 'Active Only' : 'Inactive Only'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Decks Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="card">
              <div className="skeleton h-6 w-3/4 mb-4" />
              <div className="skeleton h-4 w-1/2 mb-2" />
              <div className="skeleton h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredDecks.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDecks.map((deck, index) => (
            <div 
              key={deck.id} 
              className={`card relative group animate-fade-in
                ${!deck.is_active ? 'opacity-60' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {deck.is_active ? (
                  <span className="badge-success">Active</span>
                ) : (
                  <span className="badge bg-mist/50 text-dim border-mist">Inactive</span>
                )}
                
                {/* Menu */}
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === deck.id ? null : deck.id)}
                    className="p-1 rounded hover:bg-stone transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-dim" />
                  </button>
                  {activeMenu === deck.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                      <div className="absolute right-0 mt-2 w-48 bg-slate border border-mist rounded-xl shadow-xl z-50 overflow-hidden">
                        <button 
                          onClick={() => toggleDeckActive(deck.id, deck.is_active)}
                          className="w-full px-4 py-3 text-left hover:bg-stone transition-colors flex items-center gap-3 text-pale"
                        >
                          {deck.is_active ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Activate
                            </>
                          )}
                        </button>
                        {deck.decklist_url && (
                          <a 
                            href={deck.decklist_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full px-4 py-3 text-left hover:bg-stone transition-colors flex items-center gap-3 text-pale"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Decklist
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Deck Info */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-arcane/20 flex items-center justify-center flex-shrink-0">
                  <Layers className="w-7 h-7 text-arcane-glow" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-lg text-pale truncate">
                    {deck.name}
                  </h3>
                  <p className="text-ember font-medium truncate">
                    {deck.commander_name}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-mist/30">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-dim mb-1">
                    <Swords className="w-4 h-4" />
                  </div>
                  <p className="font-display font-semibold text-pale">
                    {deck.matches_played || 0}
                  </p>
                  <p className="text-xs text-dim">Matches</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-dim mb-1">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <p className="font-display font-semibold text-success">
                    {deck.wins || 0}
                  </p>
                  <p className="text-xs text-dim">Wins</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-dim mb-1">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <p className="font-display font-semibold text-pale">
                    {deck.matches_played ? Math.round((deck.wins / deck.matches_played) * 100) : 0}%
                  </p>
                  <p className="text-xs text-dim">Win Rate</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-mist/30">
                <p className="text-sm text-dim">
                  Registered {formatRelativeTime(deck.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Layers className="w-16 h-16 text-mist mx-auto mb-4" />
          <h3 className="font-display font-semibold text-xl text-pale mb-2">
            {searchQuery || filterActive !== 'all' ? 'No decks found' : 'No decks registered yet'}
          </h3>
          <p className="text-dim mb-6 max-w-md mx-auto">
            {searchQuery || filterActive !== 'all' 
              ? 'Try adjusting your search or filter'
              : 'Register your first deck to start competing in the league'}
          </p>
          {!searchQuery && filterActive === 'all' && (
            <Link to="/decks/register" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Register Your First Deck
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default DecksPage
