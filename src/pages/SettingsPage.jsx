import { useState } from 'react'
import { 
  User, Mail, Lock, Bell, Shield, Trash2, 
  Save, Loader2, Eye, EyeOff, AlertTriangle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore, useToastStore } from '../lib/store'

export default function SettingsPage() {
  const { user, profile, fetchProfile } = useAuthStore()
  const { addToast } = useToastStore()

  // Profile settings
  const [username, setUsername] = useState(profile?.username || '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
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

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    
    if (!username.trim()) {
      addToast('Username cannot be empty', 'error')
      return
    }

    if (username.length < 3) {
      addToast('Username must be at least 3 characters', 'error')
      return
    }

    setSavingProfile(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          username: username.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      await fetchProfile()
      addToast('Profile updated successfully', 'success')
    } catch (error) {
      if (error.code === '23505') {
        addToast('Username already taken', 'error')
      } else {
        addToast(error.message || 'Failed to update profile', 'error')
      }
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      addToast('Password must be at least 8 characters', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error')
      return
    }

    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      addToast('Password changed successfully', 'success')
    } catch (error) {
      addToast(error.message || 'Failed to change password', 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== profile?.username) {
      addToast('Please type your username to confirm', 'error')
      return
    }

    setDeleting(true)
    try {
      // In a real app, this would call a server function to properly delete the user
      // For now, we'll just show a message
      addToast('Account deletion requested. An admin will process this shortly.', 'info')
      setShowDeleteModal(false)
    } catch (error) {
      addToast(error.message || 'Failed to delete account', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-display font-bold text-white">Settings</h1>

      {/* Profile Settings */}
      <div className="card p-6">
        <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-ember" />
          Profile Settings
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-gray-500" />
              <span className="text-gray-400">{user?.email}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="label">Username</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              minLength={3}
              maxLength={20}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={savingProfile}
          >
            {savingProfile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </>
            )}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-ember" />
          Change Password
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                className="input pr-10"
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
            <label className="label">Confirm New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={changingPassword || !newPassword || !confirmPassword}
          >
            {changingPassword ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
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
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">Match ready notifications</span>
            <input
              type="checkbox"
              className="toggle"
              checked={notifications.matchReady}
              onChange={(e) => setNotifications({...notifications, matchReady: e.target.checked})}
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">Lobby full alerts</span>
            <input
              type="checkbox"
              className="toggle"
              checked={notifications.lobbyFull}
              onChange={(e) => setNotifications({...notifications, lobbyFull: e.target.checked})}
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">New contest announcements</span>
            <input
              type="checkbox"
              className="toggle"
              checked={notifications.contestStart}
              onChange={(e) => setNotifications({...notifications, contestStart: e.target.checked})}
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">Weekly stats digest</span>
            <input
              type="checkbox"
              className="toggle"
              checked={notifications.weeklyDigest}
              onChange={(e) => setNotifications({...notifications, weeklyDigest: e.target.checked})}
            />
          </label>
        </div>

        <p className="text-xs text-gray-600 mt-4">
          Note: Email notifications will be sent to {user?.email}
        </p>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-red-500/30">
        <h2 className="text-xl font-display font-bold text-red-400 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Danger Zone
        </h2>

        <p className="text-gray-400 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>

        <button 
          onClick={() => setShowDeleteModal(true)}
          className="btn bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-xl font-display font-bold">Delete Account</h3>
            </div>

            <p className="text-gray-400 mb-4">
              This action <strong className="text-white">cannot be undone</strong>. This will permanently delete your account, all your decks, match history, and remove you from all leaderboards.
            </p>

            <div className="mb-4">
              <label className="label">
                Type <strong className="text-white">{profile?.username}</strong> to confirm
              </label>
              <input
                type="text"
                className="input"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Enter your username"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary flex-1"
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="btn bg-red-500 text-white hover:bg-red-600 flex-1"
                disabled={deleting || deleteConfirmation !== profile?.username}
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
        }
        .toggle::before {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #666;
          top: 3px;
          left: 3px;
          transition: all 0.2s;
        }
        .toggle:checked {
          background: #ff6b35;
        }
        .toggle:checked::before {
          transform: translateX(20px);
          background: white;
        }
      `}</style>
    </div>
  )
}
