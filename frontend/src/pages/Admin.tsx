import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Activity, AlertTriangle, Trash2,
  Shield, FileText, Search, RefreshCw
} from 'lucide-react'
import { adminApi } from '../services/api'
import { RiskBadge } from '../components/ui/RiskBadge'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

type Tab = 'stats' | 'users' | 'analyses'

export default function Admin() {
  const [tab, setTab] = useState<Tab>('stats')
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [analyses, setAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sRes, uRes, aRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
        adminApi.getAnalyses(),
      ])
      setStats(sRes.data)
      setUsers(uRes.data)
      setAnalyses(aRes.data)
    } catch {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const deleteUser = async (id: number) => {
    if (!confirm('Permanently delete this user and all their data?')) return
    try {
      await adminApi.deleteUser(id)
      setUsers(u => u.filter(x => x.id !== id))
      toast.success('User deleted')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Delete failed')
    }
  }

  const deleteAnalysis = async (id: number) => {
    if (!confirm('Delete this analysis?')) return
    try {
      await adminApi.deleteAnalysis(id)
      setAnalyses(a => a.filter(x => x.id !== id))
      toast.success('Analysis deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  const statCards = stats ? [
    { label: 'Total Users', value: stats.total_users, icon: Users, color: 'text-cyber-400', bg: 'bg-cyber-500/10' },
    { label: 'Total Analyses', value: stats.total_analyses, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Reports', value: stats.total_reports, icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Critical Today', value: stats.critical_threats_today, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ] : []

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )
  const filteredAnalyses = analyses.filter(a =>
    (a.title || '').toLowerCase().includes(search.toLowerCase())
  )

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'stats', label: 'Overview', icon: Shield },
    { id: 'users', label: `Users (${users.length})`, icon: Users },
    { id: 'analyses', label: `Analyses (${analyses.length})`, icon: Activity },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2">
            <Shield size={22} className="text-red-400" />
            Admin Dashboard
          </h1>
          <p className="text-dark-400 text-sm mt-1">System management and oversight</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-dark-900 border border-dark-800 text-dark-300 hover:text-dark-100 px-3 py-2 rounded-lg text-sm transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-900 border border-dark-800 p-1 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? 'bg-dark-800 text-dark-100 shadow'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyber-500" />
        </div>
      ) : (
        <>
          {/* Stats tab */}
          {tab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => {
                  const Icon = card.icon
                  return (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-dark-900 border border-dark-800 rounded-xl p-5"
                    >
                      <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                        <Icon size={16} className={card.color} />
                      </div>
                      <div className="text-3xl font-black text-dark-100">{card.value}</div>
                      <div className="text-xs text-dark-400 mt-1">{card.label}</div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Recent analyses preview */}
              <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-dark-800">
                  <h3 className="font-semibold text-dark-100">Latest System Analyses</h3>
                </div>
                <div className="divide-y divide-dark-800">
                  {analyses.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center gap-4 px-6 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-dark-200 truncate">{a.title}</p>
                        <p className="text-xs text-dark-500 font-mono">user_id:{a.user_id} · {a.input_type}</p>
                      </div>
                      <RiskBadge level={a.risk_level} score={Math.round(a.risk_score)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users tab */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full max-w-sm bg-dark-900 border border-dark-800 rounded-lg pl-9 pr-4 py-2 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-cyber-500 text-sm"
                />
              </div>

              <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-3 border-b border-dark-800 text-xs font-medium text-dark-500 uppercase">
                  <div className="col-span-1">#</div>
                  <div className="col-span-3">Username</div>
                  <div className="col-span-4">Email</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">Role</div>
                  <div className="col-span-1"></div>
                </div>
                <div className="divide-y divide-dark-800">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="grid grid-cols-12 gap-3 px-6 py-3 items-center hover:bg-dark-800/30 transition-colors">
                      <div className="col-span-1 text-xs text-dark-500 font-mono">{u.id}</div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-cyber-500/15 flex items-center justify-center text-xs font-bold text-cyber-400">
                            {u.username[0].toUpperCase()}
                          </div>
                          <span className="text-sm text-dark-200 font-mono">{u.username}</span>
                        </div>
                      </div>
                      <div className="col-span-4 text-sm text-dark-400 truncate">{u.email}</div>
                      <div className="col-span-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          u.is_active
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="col-span-1">
                        {u.is_admin && (
                          <span className="text-xs text-red-400 font-medium">Admin</span>
                        )}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="p-1.5 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analyses tab */}
          {tab === 'analyses' && (
            <div className="space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search analyses..."
                  className="w-full max-w-sm bg-dark-900 border border-dark-800 rounded-lg pl-9 pr-4 py-2 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-cyber-500 text-sm"
                />
              </div>

              <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-3 border-b border-dark-800 text-xs font-medium text-dark-500 uppercase">
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">Title</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Risk</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-1"></div>
                </div>
                <div className="divide-y divide-dark-800">
                  {filteredAnalyses.map((a) => (
                    <div key={a.id} className="grid grid-cols-12 gap-3 px-6 py-3 items-center hover:bg-dark-800/30 transition-colors">
                      <div className="col-span-1 text-xs text-dark-500 font-mono">{a.id}</div>
                      <div className="col-span-4 text-sm text-dark-200 truncate">{a.title}</div>
                      <div className="col-span-2 text-xs text-dark-400 font-mono">{a.input_type}</div>
                      <div className="col-span-2">
                        <RiskBadge level={a.risk_level} />
                      </div>
                      <div className="col-span-2 text-xs text-dark-500">
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => deleteAnalysis(a.id)}
                          className="p-1.5 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
