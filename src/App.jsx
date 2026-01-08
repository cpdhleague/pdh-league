import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore, useMatchStore } from './lib/store'
import { supabase } from './lib/supabase'

// Layout
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import DecksPage from './pages/DecksPage'
import RegisterDeckPage from './pages/RegisterDeckPage'
import LobbiesPage from './pages/LobbiesPage'
import LobbyPage from './pages/LobbyPage'
import MatchPage from './pages/MatchPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ContestsPage from './pages/ContestsPage'
import ContestPage from './pages/ContestPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import ValidationPage from './pages/ValidationPage'
import AdminPage from './pages/AdminPage'

// Components
import Toast from './components/Toast'

function App() {
  const { initialize, setUser, user } = useAuthStore()
  const { fetchPendingValidation } = useMatchStore()

  useEffect(() => {
    // Initialize auth
    initialize()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          setUser(session?.user || null)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [initialize, setUser])

  // Check for pending validation when user logs in
  useEffect(() => {
    if (user) {
      fetchPendingValidation()
    }
  }, [user, fetchPendingValidation])

  return (
    <>
      {/* Subtle noise overlay for texture */}
      <div className="noise-overlay" />
      
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/decks" element={<DecksPage />} />
            <Route path="/decks/register" element={<RegisterDeckPage />} />
            <Route path="/lobbies" element={<LobbiesPage />} />
            <Route path="/lobby/:id" element={<LobbyPage />} />
            <Route path="/match/:id" element={<MatchPage />} />
            <Route path="/contests" element={<ContestsPage />} />
            <Route path="/contest/:id" element={<ContestPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/validate" element={<ValidationPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Toast notifications */}
      <Toast />
    </>
  )
}

export default App
