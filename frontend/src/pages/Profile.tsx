import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Calendar, Shield, Edit3, Save, X, Activity } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      await authApi.updateProfile(form)
      await refreshUser()
      setEditing(false)
      toast.success('Profile updated')
    } catch {
      toast.error('Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm({ full_name: user?.full_name || '', bio: user?.bio || '' })
    setEditing(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-100">Profile</h1>
        <p className="text-dark-400 text-sm mt-1">Manage your account information</p>
      </div>

      {/* Avatar & name card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-900 border border-dark-800 rounded-xl p-6"
      >
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-cyber-500/15 border border-cyber-500/30 flex items-center justify-center shrink-0">
            <span className="text-2xl font-black text-cyber-400">
              {user?.username?.[0]?.toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-dark-100">
                {user?.full_name || user?.username}
              </h2>
              {user?.is_admin && (
                <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-medium">
                  Admin
                </span>
              )}
            </div>
            <p className="text-sm text-dark-400 font-mono mt-0.5">@{user?.username}</p>
            {user?.bio && (
              <p className="text-sm text-dark-300 mt-2 leading-relaxed">{user.bio}</p>
            )}
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className="p-2 text-dark-400 hover:text-cyber-400 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <Edit3 size={16} />
          </button>
        </div>

        {/* Edit form */}
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-5 pt-5 border-t border-dark-800 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Full Name</label>
              <input
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Your full name"
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-cyber-500 text-sm transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Bio</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                rows={3}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-cyber-500 text-sm transition-colors resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-cyber-500 hover:bg-cyber-400 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 text-dark-300 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Account details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-dark-900 border border-dark-800 rounded-xl p-6"
      >
        <h3 className="font-semibold text-dark-100 mb-4">Account Details</h3>
        <div className="space-y-3">
          {[
            { icon: Mail, label: 'Email', value: user?.email },
            { icon: User, label: 'Username', value: `@${user?.username}`, mono: true },
            {
              icon: Calendar,
              label: 'Member Since',
              value: user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : '—'
            },
            {
              icon: Activity,
              label: 'Last Login',
              value: user?.last_login ? format(new Date(user.last_login), 'MMM d, yyyy HH:mm') : 'First session'
            },
            {
              icon: Shield,
              label: 'Account Status',
              value: user?.is_active ? 'Active' : 'Inactive',
            },
          ].map(({ icon: Icon, label, value, mono }) => (
            <div key={label} className="flex items-center gap-3 py-3 border-b border-dark-800 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-dark-800 flex items-center justify-center shrink-0">
                <Icon size={14} className="text-dark-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-dark-500 mb-0.5">{label}</p>
                <p className={`text-sm text-dark-200 ${mono ? 'font-mono' : ''}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security note */}
      <div className="p-4 bg-dark-900/50 border border-dark-800 rounded-xl">
        <div className="flex items-start gap-3">
          <Shield size={15} className="text-cyber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-dark-200">Password & Security</p>
            <p className="text-xs text-dark-500 mt-0.5">
              To change your password, log out and use the registration process to create a new account,
              or contact an administrator for a password reset.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
