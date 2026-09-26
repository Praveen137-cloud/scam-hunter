import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, Trash2, Eye, Clock, ChevronRight } from 'lucide-react'
import { analysisApi } from '../services/api'
import { RiskBadge } from '../components/ui/RiskBadge'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const SCAM_TYPES = [
  'All', 'Phishing', 'UPI Fraud', 'Job Scam', 'Lottery Scam',
  'Investment Scam', 'Romance Scam', 'Crypto Scam', 'Delivery Scam',
  'Tech Support Scam', 'Government Scam', 'Unknown', 'Safe'
]

export default function History() {
  const [analyses, setAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [scamFilter, setScamFilter] = useState('All')
  const [page, setPage] = useState(0)

  const fetchAnalyses = async () => {
    setLoading(true)
    try {
      const params: any = { skip: page * 20, limit: 20 }
      if (search) params.search = search
      if (scamFilter !== 'All') params.scam_type = scamFilter
      const res = await analysisApi.getHistory(params)
      setAnalyses(res.data)
    } catch {
      toast.error('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAnalyses() }, [page, scamFilter])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchAnalyses() }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Delete this analysis?')) return
    try {
      await analysisApi.deleteAnalysis(id)
      setAnalyses(a => a.filter(x => x.id !== id))
      toast.success('Deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-100">Investigation History</h1>
        <p className="text-dark-400 text-sm mt-1">All your previous scam analyses</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search analyses..."
            className="w-full bg-dark-900 border border-dark-800 rounded-lg pl-9 pr-4 py-2.5 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-cyber-500 text-sm"
          />
        </form>
        <div className="relative">
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <select
            value={scamFilter}
            onChange={e => setScamFilter(e.target.value)}
            className="bg-dark-900 border border-dark-800 rounded-lg pl-9 pr-8 py-2.5 text-dark-100 focus:outline-none focus:border-cyber-500 text-sm appearance-none"
          >
            {SCAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyber-500" />
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-16">
            <Search size={32} className="text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">No analyses found</p>
            <Link to="/analyzer" className="text-cyber-400 text-sm mt-2 inline-block">Run an analysis →</Link>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-dark-800 text-xs font-medium text-dark-500 uppercase tracking-wider">
              <div className="col-span-5">Title / Type</div>
              <div className="col-span-2">Scam Type</div>
              <div className="col-span-2">Risk</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1"></div>
            </div>
            <div className="divide-y divide-dark-800">
              {analyses.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                >
                  <Link
                    to={`/history/${a.id}`}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-dark-800/50 transition-colors items-center group"
                  >
                    <div className="col-span-11 md:col-span-5">
                      <p className="text-sm font-medium text-dark-100 truncate">{a.title}</p>
                      <span className="text-xs text-dark-500 font-mono">{a.input_type}</span>
                    </div>
                    <div className="hidden md:block col-span-2">
                      <span className="text-xs text-dark-400">{a.scam_type}</span>
                    </div>
                    <div className="hidden md:block col-span-2">
                      <RiskBadge level={a.risk_level} score={Math.round(a.risk_score)} />
                    </div>
                    <div className="hidden md:flex col-span-2 items-center gap-1 text-xs text-dark-500">
                      <Clock size={11} />
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => handleDelete(a.id, e)}
                        className="p-1.5 text-dark-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                      <ChevronRight size={14} className="text-dark-600" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {analyses.length === 20 || page > 0 ? (
        <div className="flex justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-4 py-2 bg-dark-900 border border-dark-800 rounded-lg text-sm text-dark-300 disabled:opacity-40 hover:bg-dark-800 transition-colors">
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-dark-400">Page {page + 1}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={analyses.length < 20}
            className="px-4 py-2 bg-dark-900 border border-dark-800 rounded-lg text-sm text-dark-300 disabled:opacity-40 hover:bg-dark-800 transition-colors">
            Next
          </button>
        </div>
      ) : null}
    </div>
  )
}
