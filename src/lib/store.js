import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from './supabase'

// Auth Store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: true,
      
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      
      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            set({ user: session.user })
            await get().fetchProfile(session.user.id)
          }
        } catch (error) {
          console.error('Auth init error:', error)
        } finally {
          set({ loading: false })
        }
      },
      
      fetchProfile: async (userId) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
          
          if (error && error.code !== 'PGRST116') throw error
          set({ profile: data })
        } catch (error) {
          console.error('Profile fetch error:', error)
        }
      },
      
      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        set({ user: data.user })
        await get().fetchProfile(data.user.id)
        return data
      },
      
      signUp: async (email, password, username) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username }
          }
        })
        if (error) throw error
        set({ user: data.user })
        return data
      },
      
      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null })
      },
      
      updateProfile: async (updates) => {
        const { user } = get()
        if (!user) throw new Error('Not authenticated')
        
        const { data, error } = await supabase
          .from('profiles')
          .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
          .select()
          .single()
        
        if (error) throw error
        set({ profile: data })
        return data
      }
    }),
    {
      name: 'pdh-auth',
      partialize: (state) => ({ user: state.user })
    }
  )
)

// Lobby Store
export const useLobbyStore = create((set, get) => ({
  lobbies: [],
  currentLobby: null,
  loading: false,
  
  setLobbies: (lobbies) => set({ lobbies }),
  setCurrentLobby: (lobby) => set({ currentLobby: lobby }),
  setLoading: (loading) => set({ loading }),
  
  fetchLobbies: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('lobbies')
        .select(`
          *,
          lobby_players (
            *,
            profiles (id, username, elo),
            decks (id, name, commander_name)
          )
        `)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      set({ lobbies: data || [] })
    } catch (error) {
      console.error('Fetch lobbies error:', error)
    } finally {
      set({ loading: false })
    }
  },
  
  createLobby: async (name, deckId) => {
    const user = useAuthStore.getState().user
    if (!user) throw new Error('Not authenticated')
    
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .insert({ name, created_by: user.id })
      .select()
      .single()
    
    if (lobbyError) throw lobbyError
    
    // Join the lobby as creator
    const { error: joinError } = await supabase
      .from('lobby_players')
      .insert({
        lobby_id: lobby.id,
        player_id: user.id,
        deck_id: deckId,
        is_ready: false
      })
    
    if (joinError) throw joinError
    
    // Log activity
    await logActivity(user.id, 'lobby_create', { lobby_id: lobby.id })
    
    return lobby
  },
  
  joinLobby: async (lobbyId, deckId) => {
    const user = useAuthStore.getState().user
    if (!user) throw new Error('Not authenticated')
    
    const { error } = await supabase
      .from('lobby_players')
      .insert({
        lobby_id: lobbyId,
        player_id: user.id,
        deck_id: deckId,
        is_ready: false
      })
    
    if (error) throw error
    
    await logActivity(user.id, 'lobby_join', { lobby_id: lobbyId })
  },
  
  leaveLobby: async (lobbyId) => {
    const user = useAuthStore.getState().user
    if (!user) throw new Error('Not authenticated')
    
    const { error } = await supabase
      .from('lobby_players')
      .delete()
      .eq('lobby_id', lobbyId)
      .eq('player_id', user.id)
    
    if (error) throw error
    
    await logActivity(user.id, 'lobby_leave', { lobby_id: lobbyId })
  },
  
  setReady: async (lobbyId, isReady) => {
    const user = useAuthStore.getState().user
    if (!user) throw new Error('Not authenticated')
    
    const { error } = await supabase
      .from('lobby_players')
      .update({ is_ready: isReady, ready_at: isReady ? new Date().toISOString() : null })
      .eq('lobby_id', lobbyId)
      .eq('player_id', user.id)
    
    if (error) throw error
    
    await logActivity(user.id, 'lobby_ready', { lobby_id: lobbyId, is_ready: isReady })
  },
  
  subscribeToLobby: (lobbyId, callback) => {
    const channel = supabase
      .channel(`lobby:${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobby_players',
          filter: `lobby_id=eq.${lobbyId}`
        },
        callback
      )
      .subscribe()
    
    return () => supabase.removeChannel(channel)
  }
}))

// Deck Store
export const useDeckStore = create((set, get) => ({
  decks: [],
  commanders: [],
  loading: false,
  
  fetchDecks: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('player_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      set({ decks: data || [] })
    } catch (error) {
      console.error('Fetch decks error:', error)
    } finally {
      set({ loading: false })
    }
  },
  
  fetchCommanders: async () => {
    try {
      const { data, error } = await supabase
        .from('commanders')
        .select('*')
        .eq('is_legal', true)
        .order('name')
      
      if (error) throw error
      set({ commanders: data || [] })
    } catch (error) {
      console.error('Fetch commanders error:', error)
    }
  },
  
  registerDeck: async (deckData) => {
    const user = useAuthStore.getState().user
    if (!user) throw new Error('Not authenticated')
    
    const { data, error } = await supabase
      .from('decks')
      .insert({
        player_id: user.id,
        ...deckData,
        is_active: true
      })
      .select()
      .single()
    
    if (error) throw error
    
    await logActivity(user.id, 'deck_register', { deck_id: data.id })
    
    set({ decks: [data, ...get().decks] })
    return data
  }
}))

// Match Store
export const useMatchStore = create((set, get) => ({
  matches: [],
  pendingValidation: null,
  loading: false,
  
  fetchMatches: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('match_results')
        .select(`
          *,
          matches (
            *,
            match_results (
              *,
              profiles (id, username)
            )
          )
        `)
        .eq('player_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      set({ matches: data || [] })
    } catch (error) {
      console.error('Fetch matches error:', error)
    } finally {
      set({ loading: false })
    }
  },
  
  fetchPendingValidation: async () => {
    const user = useAuthStore.getState().user
    if (!user) return null
    
    const { data, error } = await supabase
      .from('match_results')
      .select(`
        *,
        matches (
          *,
          match_results (
            *,
            profiles (id, username)
          )
        )
      `)
      .eq('player_id', user.id)
      .eq('validated', false)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Fetch pending error:', error)
    }
    
    set({ pendingValidation: data || null })
    return data
  },
  
  validateResult: async (matchResultId, validated, challenged = false, challengeReason = null) => {
    const user = useAuthStore.getState().user
    if (!user) throw new Error('Not authenticated')
    
    const { error } = await supabase
      .from('match_results')
      .update({
        validated,
        challenged,
        challenge_reason: challengeReason,
        validated_at: new Date().toISOString()
      })
      .eq('id', matchResultId)
      .eq('player_id', user.id)
    
    if (error) throw error
    
    await logActivity(user.id, 'match_validate', {
      match_result_id: matchResultId,
      validated,
      challenged
    })
    
    set({ pendingValidation: null })
  },
  
  submitMatchResult: async (matchId, winnerId, placements) => {
    const user = useAuthStore.getState().user
    if (!user) throw new Error('Not authenticated')
    
    // Update match
    const { error: matchError } = await supabase
      .from('matches')
      .update({
        winner_id: winnerId,
        status: 'pending_validation',
        completed_at: new Date().toISOString()
      })
      .eq('id', matchId)
    
    if (matchError) throw matchError
    
    // Update placements for all players
    for (const placement of placements) {
      const { error } = await supabase
        .from('match_results')
        .update({ placement: placement.place })
        .eq('match_id', matchId)
        .eq('player_id', placement.playerId)
    }
    
    await logActivity(user.id, 'match_submit_result', { match_id: matchId, winner_id: winnerId })
  }
}))

// Leaderboard Store
export const useLeaderboardStore = create((set) => ({
  leaderboard: [],
  loading: false,
  
  fetchLeaderboard: async (limit = 50) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, elo, wins, losses, matches_played')
        .gt('matches_played', 0)
        .order('elo', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      set({ leaderboard: data || [] })
    } catch (error) {
      console.error('Fetch leaderboard error:', error)
    } finally {
      set({ loading: false })
    }
  }
}))

// Contest Store
export const useContestStore = create((set, get) => ({
  contests: [],
  currentContest: null,
  loading: false,
  
  fetchContests: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('contests')
        .select(`
          *,
          contest_entries (count)
        `)
        .order('end_date', { ascending: false })
      
      if (error) throw error
      set({ contests: data || [] })
    } catch (error) {
      console.error('Fetch contests error:', error)
    } finally {
      set({ loading: false })
    }
  },
  
  fetchContest: async (contestId) => {
    const { data, error } = await supabase
      .from('contests')
      .select(`
        *,
        contest_entries (
          *,
          profiles (id, username)
        )
      `)
      .eq('id', contestId)
      .single()
    
    if (error) throw error
    set({ currentContest: data })
    return data
  },
  
  submitEntry: async (contestId, decklistUrl, decklistText) => {
    const user = useAuthStore.getState().user
    if (!user) throw new Error('Not authenticated')
    
    const { data, error } = await supabase
      .from('contest_entries')
      .insert({
        contest_id: contestId,
        player_id: user.id,
        decklist_url: decklistUrl,
        decklist_text: decklistText
      })
      .select()
      .single()
    
    if (error) throw error
    
    await logActivity(user.id, 'contest_submit', { contest_id: contestId })
    
    return data
  }
}))

// Report Store
export const useReportStore = create((set) => ({
  submitReport: async (reportedPlayerId, matchId, reason, details) => {
    const user = useAuthStore.getState().user
    if (!user) throw new Error('Not authenticated')
    
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_player_id: reportedPlayerId,
        match_id: matchId,
        reason,
        details
      })
      .select()
      .single()
    
    if (error) throw error
    
    await logActivity(user.id, 'report_submit', {
      reported_player_id: reportedPlayerId,
      match_id: matchId
    })
    
    return data
  }
}))

// Toast/Notification Store
export const useToastStore = create((set, get) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = Date.now()
    set({ toasts: [...get().toasts, { ...toast, id }] })
    
    setTimeout(() => {
      set({ toasts: get().toasts.filter(t => t.id !== id) })
    }, toast.duration || 5000)
  },
  
  removeToast: (id) => {
    set({ toasts: get().toasts.filter(t => t.id !== id) })
  }
}))

// Activity logging helper
async function logActivity(userId, action, metadata = {}) {
  try {
    await supabase
      .from('activity_log')
      .insert({
        player_id: userId,
        action,
        metadata,
        timestamp: new Date().toISOString(),
        ip_hash: null // Will be set server-side if needed
      })
  } catch (error) {
    console.error('Activity log error:', error)
  }
}

export { logActivity }
