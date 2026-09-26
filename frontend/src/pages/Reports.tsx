import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Clock, AlertCircle } from 'lucide-react'
import { reportApi, analysisApi } from '../services/api'
import { RiskBadge } from '../components/ui/RiskBadge'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function Reports() {
  const [reports, setReports] = useState<any[]>([])
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      reportApi.list(),
      analysisApi.getHistory({ limit: 10 })
    ])
      .then(([rRes, aRes]) => {
        setReports(rRes.data)
        setRecentAnalyses(aRes.data)
      })
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false))
  }, [])

  const handleDownload = async (analysisId: number) => {
    setDownloading(analysisId)
    try {
      await reportApi.generate(analysisId)
      const res = await reportApi.download(analysisId)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `scam_report_${analysisId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Report downloaded!')
    } catch {
      toast.error('Download failed')
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-cyber-500" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-dark-100">PDF Reports</h1>
        <p className="text-dark-400 text-sm mt-1">Download investigation reports for any analysis</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-cyber-500/5 border border-cyber-500/20 rounded-xl">
        <AlertCircle size={16} className="text-cyber-400 mt-0.5 shrink-0" />
        <p className="text-sm text-dark-300">
          Click <strong className="text-cyber-400">Download PDF</strong> on any analysis below to generate and download a professional cybersecurity investigation report.
        </p>
      </div>

      {/* Analyses with download */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-800">
          <h2 className="font-semibold text-dark-100">Generate Reports</h2>
          <p className="text-xs text-dark-500 mt-0.5">All your recent analyses — click to generate PDF</p>
        </div>

        {recentAnalyses.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={32} className="text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 text-sm">No analyses yet. Run an analysis to generate reports.</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-800">
            {recentAnalyses.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-dark-800/40 transition-colors"
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center shrink-0">
                  <FileText size={15} className="text-dark-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-100 truncate">{a.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-dark-500 font-mono">{a.input_type}</span>
                    <span className="text-xs text-dark-600">·</span>
                    <span className="text-xs text-dark-500">{a.scam_type}</span>
                    <span className="text-xs text-dark-600">·</span>
                    <span className="flex items-center gap-1 text-xs text-dark-500">
                      <Clock size={10} />
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Risk */}
                <RiskBadge level={a.risk_level} score={Math.round(a.risk_score)} />

                {/* Download */}
                <button
                  onClick={() => handleDownload(a.id)}
                  disabled={downloading === a.id}
                  className="flex items-center gap-2 bg-dark-800 hover:bg-cyber-500/10 border border-dark-700 hover:border-cyber-500/30 text-dark-300 hover:text-cyber-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                >
                  {downloading === a.id ? (
                    <div className="w-3 h-3 border border-cyber-500/40 border-t-cyber-500 rounded-full animate-spin" />
                  ) : (
                    <Download size={13} />
                  )}
                  PDF
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Previously generated */}
      {reports.length > 0 && (
        <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-800">
            <h2 className="font-semibold text-dark-100">Previously Generated ({reports.length})</h2>
          </div>
          <div className="divide-y divide-dark-800">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-6 py-4">
                <FileText size={15} className="text-cyber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark-200 truncate">{r.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-dark-500">
                      {r.file_size ? `${(r.file_size / 1024).toFixed(0)} KB` : ''}
                    </span>
                    <span className="text-xs text-dark-500">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(r.analysis_id)}
                  className="flex items-center gap-2 text-xs text-cyber-400 hover:text-cyber-300 px-3 py-1.5 rounded-lg hover:bg-cyber-500/10 transition-colors"
                >
                  <Download size={13} /> Re-download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
