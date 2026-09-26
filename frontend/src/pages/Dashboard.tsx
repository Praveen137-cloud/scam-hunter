import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Activity, AlertTriangle, Shield, FileText,
  TrendingUp, Eye, ArrowRight, Clock,
  Globe, ShieldAlert, Wifi
} from 'lucide-react'
import { analysisApi } from '../services/api'
import { RiskBadge } from '../components/ui/RiskBadge'
import { useAuth } from '../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const RISK_COLORS: Record<string, string> = {
  Safe: '#22c55e', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444'
}

interface ThreatFeedItem {
  id: string
  timestamp: string
  type: string
  details: string
  location: string
  severity: 'Critical' | 'High' | 'Medium' | 'Safe'
}

const INITIAL_FEED: ThreatFeedItem[] = [
  { id: '1', timestamp: 'Just now', type: 'Phishing', details: 'Domain renewal-netflix-billing.net flagged for login credential theft.', location: 'Global', severity: 'Critical' },
  { id: '2', timestamp: '2m ago', type: 'UPI Fraud', details: 'SMS request impersonating electricity board with UPI ID power.bill@okaxis.', location: 'Mumbai, IN', severity: 'High' },
  { id: '3', timestamp: '5m ago', type: 'Job Scam', details: 'WhatsApp messages offering Rs. 5000/day part-time jobs from +91-98765-43210.', location: 'Delhi, IN', severity: 'Medium' },
  { id: '4', timestamp: '12m ago', type: 'Government', details: 'Phishing portal update-uidai-service.org impersonating Aadhaar KYC portal.', location: 'Bengaluru, IN', severity: 'Critical' },
  { id: '5', timestamp: '20m ago', type: 'Crypto Scam', details: 'Active token drainer smart contract detected targeting MetaMask wallets.', location: 'Global', severity: 'High' }
]

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [feed, setFeed] = useState<ThreatFeedItem[]>(INITIAL_FEED)

  useEffect(() => {
    analysisApi.getDashboard()
      .then(r => setStats(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const feedTemplates: Omit<ThreatFeedItem, 'id' | 'timestamp'>[] = [
      { type: 'Phishing', details: 'Fake package delivery SMS from custom-post-tracking.com asking for credit card.', location: 'Global', severity: 'High' },
      { type: 'UPI Fraud', details: 'Cashback refund link sent via SMS redirecting to fake GPay portal.', location: 'Kolkata, IN', severity: 'High' },
      { type: 'Tech Support', details: 'Pop-up scam domain system-error-repair-991.info urging remote access install.', location: 'Global', severity: 'Medium' },
      { type: 'Lottery Scam', details: 'Unsolicited KBC winner PDF certificate sent via WhatsApp from foreign number.', location: 'Chennai, IN', severity: 'Medium' },
      { type: 'Government', details: 'Income Tax refund alert message linking to fake portal refund-incometax.gov-in.in.', location: 'Hyderabad, IN', severity: 'Critical' },
      { type: 'Crypto Scam', details: 'Fake Binance support agent targeting users with phishing security credentials.', location: 'Global', severity: 'Critical' },
      { type: 'Romance Scam', details: 'Social engineering campaign on dating apps asking for travel expenses.', location: 'Global', severity: 'Medium' }
    ]

    const interval = setInterval(() => {
      const template = feedTemplates[Math.floor(Math.random() * feedTemplates.length)]
      const newItem: ThreatFeedItem = {
        id: Math.random().toString(),
        timestamp: 'Just now',
        ...template
      }

      setFeed(prev => {
        const updated = prev.map(item => {
          if (item.timestamp === 'Just now') return { ...item, timestamp: '1m ago' }
          if (item.timestamp.endsWith('m ago')) {
            const mins = parseInt(item.timestamp)
            return { ...item, timestamp: `${mins + 1}m ago` }
          }
          return item
        })
        return [newItem, ...updated.slice(0, 4)]
      })
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-cyber-500" />
    </div>
  )

  const riskDist = Object.entries(stats?.risk_distribution || {}).map(([name, value]) => ({ name, value }))
  const scamDist = Object.entries(stats?.scam_type_distribution || {})
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name: name.replace(' Scam', ''), value }))

  const statCards = [
    { label: 'Total Analyses', value: stats?.total_analyses || 0, icon: Activity, color: 'text-cyber-400', bg: 'bg-cyber-500/10' },
    { label: 'Critical Threats', value: stats?.critical_threats || 0, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'High Risk', value: stats?.high_threats || 0, icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Reports', value: stats?.total_reports || 0, icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">
            Welcome back, <span className="text-cyber-400">{user?.username}</span>
          </h1>
          <p className="text-dark-400 text-sm mt-1">Here's your threat intelligence overview</p>
        </div>
        <Link
          to="/analyzer"
          className="inline-flex items-center gap-2 bg-cyber-500 hover:bg-cyber-400 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Eye size={15} /> New Analysis
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-dark-900 border border-dark-800 rounded-xl p-5"
            >
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                <Icon size={16} className={card.color} />
              </div>
              <div className="text-2xl font-black text-dark-100">{card.value}</div>
              <div className="text-xs text-dark-400 mt-1">{card.label}</div>
            </motion.div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Risk distribution pie */}
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <h3 className="font-semibold text-dark-100 mb-6">Risk Distribution</h3>
          {riskDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={riskDist} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {riskDist.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-dark-500 text-sm">
              No analyses yet
            </div>
          )}
        </div>

        {/* Scam type bar */}
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <h3 className="font-semibold text-dark-100 mb-6">Scam Types Detected</h3>
          {scamDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scamDist} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a', fontSize: 12 }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-dark-500 text-sm">
              No analyses yet
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Recent Investigations & Live Feed */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent investigations (left) */}
        <div className="lg:col-span-3 bg-dark-900 border border-dark-800 rounded-xl">
          <div className="flex items-center justify-between p-6 border-b border-dark-800">
            <h3 className="font-semibold text-dark-100">Recent Investigations</h3>
            <Link to="/history" className="text-sm text-cyber-400 hover:text-cyber-300 flex items-center gap-1">
              View all <ArrowRight size={13} />
            </Link>
          </div>

          {stats?.recent_analyses?.length > 0 ? (
            <div className="divide-y divide-dark-800">
              {stats.recent_analyses.map((a: any) => (
                <Link
                  key={a.id}
                  to={`/history/${a.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-dark-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-100 truncate">{a.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-dark-400 font-mono">{a.input_type}</span>
                      <span className="text-xs text-dark-500">{a.scam_type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RiskBadge level={a.risk_level} score={Math.round(a.risk_score)} />
                    <div className="flex items-center gap-1 text-xs text-dark-500">
                      <Clock size={11} />
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Shield size={32} className="text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400 text-sm">No analyses yet</p>
              <Link to="/analyzer" className="text-cyber-400 hover:text-cyber-300 text-sm mt-2 inline-block">
                Run your first analysis →
              </Link>
            </div>
          )}
        </div>

        {/* Live Scam Intelligence Feed (right) */}
        <div className="lg:col-span-2 bg-dark-900 border border-dark-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-dark-800 mb-4">
              <h3 className="font-semibold text-dark-100 flex items-center gap-2">
                <ShieldAlert size={16} className="text-cyber-400" />
                Live Alert Feed
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-green-400 font-semibold bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                ACTIVE
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {feed.map((item, idx) => {
                  const severityColors: Record<string, string> = {
                    Critical: 'bg-red-500/10 text-red-700 border-red-500/20',
                    High: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
                    Medium: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
                    Safe: 'bg-green-500/10 text-green-700 border-green-500/20'
                  }
                  return (
                    <motion.div
                      key={item.id}
                      initial={idx === 0 ? { opacity: 0, height: 0, y: -20 } : false}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="border border-dark-800 bg-dark-950/40 rounded-xl p-4 space-y-2 relative overflow-hidden"
                    >
                      {idx === 0 && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyber-500" />
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-dark-100 flex items-center gap-1">
                          <Globe size={11} className="text-dark-500" />
                          {item.type}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-dark-400 font-mono">{item.location}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${severityColors[item.severity]}`}>
                            {item.severity}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-dark-400 leading-normal">{item.details}</p>
                      <div className="flex items-center justify-end text-[10px] text-dark-500 gap-1 pt-1 border-t border-dark-800/40">
                        <Clock size={10} />
                        {item.timestamp}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-dark-800 text-center">
            <span className="text-[10px] text-dark-500 flex items-center justify-center gap-1">
              <Wifi size={10} className="text-cyber-500" />
              Monitoring active global cybersecurity channels
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
