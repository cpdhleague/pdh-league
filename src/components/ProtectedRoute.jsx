import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../lib/store'
import { Loader2 } from 'lucide-react'

function ProtectedRoute() {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-ember animate-spin" />
          <p className="text-dim">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
