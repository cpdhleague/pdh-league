import { useState } from 'react'
import { 
  User, Mail, Lock, Bell, 
  Save, Loader2, Eye, EyeOff, Info
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore, useToastStore } from '../lib/store'

export default function SettingsPage() {
  const { user, profile } = useAuthStore()
  const { addToast } = useToastStore()

  // Password change
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Notification settings
  const [notifications, setNotifications] = useState({
    matchReady: true,
    lobbyFull: true,
    contestStart: true,
    weeklyDigest: false
  })
  const [savingNotifications, setSavingNotifications] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      addToast({ type: 'error', message: 'Password must be at least 8 characters' })
      return
    }

    if (newPassword !== confirmPassword) {
      addToast({ type: 'error', message: 'Passwords do not match' })
      return
    }

    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setNewPassword('')
      setConfirmPassword('')
      addToast({ type: 'success', message: 'Password changed successfully' })
    } catch (error) {
      addToast({ type: 'error', message: error.message || 'Failed to change password' })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSavingNotifications(true)
    try {
      // In a real app, save to database
      await new Promise(resolve => setTimeout(resolve, 500))
      addToast({ type: 'success', message: 'Notification preferences saved' })
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to save preferences' })
    } finally {
      setSavingNotifications(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-display font-bold text-white">Account Settings</h1>

      {/* Profile Information (Read-Only) */}
      <div className="card p-6">
        <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-ember" />
          Profile Information
        </h2>

        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate/50 rounded-lg border border-gray-800">
              <Mail className="w-5 h-5 text-gray-500" />
              <span className="text-gray-300">{user?.email}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Email cannot be changed</p>
          </div>

          {/* Username (Read-Only) */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Username
              <span className="text-gray-600 font-normal ml-2">• This is what others see you as</span>
            </label>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate/50 rounded-lg border border-gray-800">
              <User className="w-5 h-5 text-gray-500" />
              <span className="text-white font-medium">{profile?.username}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Username cannot be changed after account creation</p>
          </div>

          {/* Legal Name (Read-Only) */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Legal Name
            </label>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate/50 rounded-lg border border-gray-800">
              <span className="text-gray-300">{profile?.legal_name || 'Not provided'}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Contact an admin if you need to update your legal name
            </p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-ember" />
          Change Password
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                className="w-full px-4 py-3 bg-slate/50 rounded-lg border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember pr-12"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Confirm New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              className="w-full px-4 py-3 bg-slate/50 rounded-lg border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary flex items-center gap-2"
            disabled={changingPassword || !newPassword || !confirmPassword}
          >
            {changingPassword ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Changing...
              </>
            ) : (
              'Change Password'
            )}
          </button>
        </form>
      </div>

      {/* Notification Settings */}
      <div className="card p-6">
        <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-ember" />
          Notifications
        </h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-slate/30 transition-colors">
            <span className="text-gray-300">Match ready notifications</span>
            <input
              type="checkbox"
              className="toggle"
              checked={notifications.matchReady}
              onChange={(e) => setNotifications({...notifications, matchReady: e.target.checked})}
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-slate/30 transition-colors">
            <span className="text-gray-300">Lobby full alerts</span>
            <input
              type="checkbox"
              className="toggle"
              checked={notifications.lobbyFull}
              onChange={(e) => setNotifications({...notifications, lobbyFull: e.target.checked})}
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-slate/30 transition-colors">
            <span className="text-gray-300">New contest announcements</span>
            <input
              type="checkbox"
              className="toggle"
              checked={notifications.contestStart}
              onChange={(e) => setNotifications({...notifications, contestStart: e.target.checked})}
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-slate/30 transition-colors">
            <span className="text-gray-300">Weekly stats digest</span>
            <input
              type="checkbox"
              className="toggle"
              checked={notifications.weeklyDigest}
              onChange={(e) => setNotifications({...notifications, weeklyDigest: e.target.checked})}
            />
          </label>
        </div>

        <button 
          onClick={handleSaveNotifications}
          className="btn-secondary flex items-center gap-2 mt-4"
          disabled={savingNotifications}
        >
          {savingNotifications ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Preferences
            </>
          )}
        </button>

        <p className="text-xs text-gray-600 mt-4">
          Note: Email notifications will be sent to {user?.email}
        </p>
      </div>

      {/* Account Info */}
      <div className="card p-6 bg-slate/30">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-arcane mt-0.5" />
          <div>
            <h3 className="text-white font-medium mb-1">About Your Account</h3>
            <p className="text-sm text-gray-400">
              Your match history and ELO ratings are permanently tied to your account to maintain 
              the integrity of league rankings. If you need assistance with your account, please 
              contact an administrator.
            </p>
          </div>
        </div>
      </div>

      {/* Custom toggle styles */}
      <style>{`
        .toggle {
          appearance: none;
          width: 44px;
          height: 24px;
          background: #1a1a24;
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          transition: background 0.2s;
          border: 1px solid #333;
        }
        .toggle::before {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #666;
          top: 2px;
          left: 2px;
          transition: all 0.2s;
        }
        .toggle:checked {
          background: #ff6b35;
          border-color: #ff6b35;
        }
        .toggle:checked::before {
          transform: translateX(20px);
          background: white;
        }
      `}</style>
    </div>
  )
}
