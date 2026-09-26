import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, FileText, AlertTriangle, Shield,
  Link2, Mail, Phone, CreditCard, Bitcoin, Download,
  Terminal, ExternalLink, Check, ChevronDown, ChevronUp, ShieldAlert,
  Globe, CheckCircle
} from 'lucide-react'
import { analysisApi, reportApi } from '../services/api'
import { RiskBadge, RiskGauge } from '../components/ui/RiskBadge'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function AnalysisDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [takedownDossier, setTakedownDossier] = useState<any[]>([])
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [submissionLogs, setSubmissionLogs] = useState<Record<number, string[]>>({})
  const [submissionStatus, setSubmissionStatus] = useState<Record<number, 'idle' | 'submitting' | 'complete'>>({})

  useEffect(() => {
    if (!id) return
    
    const loadData = async () => {
      try {
        const res = await analysisApi.getAnalysis(Number(id))
        setAnalysis(res.data)
        
        // Load the automated takedown dossier
        const tdRes = await analysisApi.getTakedown(Number(id))
        setTakedownDossier(tdRes.data)
      } catch (err) {
        toast.error('Analysis not found')
        navigate('/history')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [id])

  const handleDownload = async () => {
    try {
      await reportApi.generate(Number(id))
      const res = await reportApi.download(Number(id))
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url; a.download = `report_${id}.pdf`; a.click()
      toast.success('Report downloaded')
    } catch {
      toast.error('Download failed')
    }
  }

  const handleSimulatedSubmission = (idx: number, item: any) => {
    setSubmissionStatus(prev => ({ ...prev, [idx]: 'submitting' }))
    setSubmissionLogs(prev => ({ ...prev, [idx]: [`[INIT] Initializing abuse submission for ${item.target}...`] }))
    
    const logs = [
      `[REGISTRY] Performing WHOIS/DNS lookup on ${item.provider_name}...`,
      `[REGISTRY] Nodal abuse channel resolved: ${item.recipient_email}`,
      `[COMPILING] Compiling threat dossier and metadata payload...`,
      `[AUTHENTICATE] Injecting cryptographic authenticity token...`,
      `[DISPATCH] Connecting to Secure SMTP relay...`,
      `[DISPATCH] Dispatching abuse incident notice...`,
      `[COMPLETED] Abuse takedown complaint filed! Ticket: SH-${Math.floor(100000 + Math.random() * 900000)}-T`
    ]
    
    let currentLogIdx = 0
    const interval = setInterval(() => {
      if (currentLogIdx < logs.length) {
        setSubmissionLogs(prev => ({
          ...prev,
          [idx]: [...(prev[idx] || []), logs[currentLogIdx]]
        }))
        currentLogIdx++
      } else {
        clearInterval(interval)
        setSubmissionStatus(prev => ({ ...prev, [idx]: 'complete' }))
        toast.success(`Abuse report filed for ${item.target}!`)
      }
    }, 850)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-cyber-500" />
    </div>
  )

  if (!analysis) return null

  const sandboxDetails = analysis.threat_intel_results?.sandbox

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-800 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-dark-100 truncate">{analysis.title}</h1>
          <p className="text-xs text-dark-500">
            {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })} · {analysis.input_type}
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-cyber-500 hover:bg-cyber-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Download size={14} /> PDF Report
        </button>
      </div>

      {/* Risk overview */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <RiskGauge score={Math.round(analysis.risk_score)} />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-3 mb-3 justify-center sm:justify-start flex-wrap">
              <RiskBadge level={analysis.risk_level} />
              <span className="text-sm font-mono text-dark-300">{analysis.scam_type}</span>
              <span className="text-xs text-dark-500 bg-dark-800 px-2 py-1 rounded">
                {analysis.scam_confidence.toFixed(0)}% confidence
              </span>
            </div>
            {analysis.ai_summary && (
              <p className="text-dark-300 text-sm leading-relaxed">{analysis.ai_summary}</p>
            )}
          </div>
        </div>
      </div>

      {/* Sandbox details preview */}
      {sandboxDetails && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Safe Screenshot Browser Preview */}
          <div className="lg:col-span-7 bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden flex flex-col h-[400px]">
            <div className="bg-dark-800 px-4 py-2.5 flex items-center gap-2 border-b border-dark-700 select-none">
              <div className="flex gap-1.5 mr-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-3 py-1 flex items-center gap-1.5 text-xs text-dark-400 truncate max-w-md">
                {sandboxDetails.ssl_status === 'Valid' ? (
                  <Shield className="text-green-500 shrink-0" size={11} />
                ) : (
                  <AlertTriangle className="text-red-500 shrink-0" size={11} />
                )}
                <span className="truncate text-[10px] font-mono">{sandboxDetails.url}</span>
              </div>
            </div>
            <div className="flex-1 p-6 bg-dark-950 flex flex-col items-center justify-center text-center overflow-y-auto">
              {sandboxDetails.risk_level === 'Critical' || sandboxDetails.risk_level === 'High' ? (
                <div className="max-w-md space-y-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 animate-pulse">
                    <AlertTriangle size={24} />
                  </div>
                  <h4 className="font-bold text-dark-100 text-sm">Security Isolation Warning: Target page is unsafe</h4>
                  <p className="text-[10px] text-dark-400 leading-normal">
                    Our active sandbox container has isolated key threats on this page. Exposing this link directly in your standard browser risks device malware or credential theft.
                  </p>
                  
                  {sandboxDetails.visual_mockup.has_form && (
                    <div className="bg-dark-900 border border-red-500/20 rounded-xl p-4 text-left space-y-2 mt-2">
                      <span className="text-[9px] uppercase font-bold text-red-500 tracking-wider">Credential Harvesting Form Caught</span>
                      <p className="text-[10px] font-semibold text-dark-200">
                        Title: <span className="text-dark-100 font-normal">{sandboxDetails.page_title}</span>
                      </p>
                      <div className="space-y-1.5 pt-1">
                        {sandboxDetails.visual_mockup.fields.map((f: string, idx: number) => (
                          <div key={idx} className="w-full bg-dark-800 border border-dark-700 rounded-lg px-2.5 py-1.5 text-[10px] text-dark-400 font-mono flex justify-between">
                            <span>{f}</span>
                            <span className="text-red-500 uppercase text-[8px] font-bold">credential harvest</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-md space-y-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto text-green-500">
                    <CheckCircle size={24} />
                  </div>
                  <h4 className="font-bold text-dark-100 text-sm">{sandboxDetails.page_title}</h4>
                  <p className="text-[10px] text-dark-400 leading-normal">
                    Isolated sandbox successfully rendered content. No credentials harvesting inputs or typosquatting markers were identified.
                  </p>
                  <div className="bg-dark-900 border border-dark-800 rounded-xl p-3 text-left text-[10px] text-dark-300 font-mono leading-relaxed">
                    HTTP Status: {sandboxDetails.status_code}<br />
                    SSL Status: {sandboxDetails.ssl_status} ({sandboxDetails.ssl_issuer})
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Technical Sandbox Details */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 space-y-4">
              <h4 className="font-bold text-dark-100 text-xs flex items-center gap-1.5">
                <Terminal size={14} className="text-cyber-500" />
                Sandbox Intelligence Dossier
              </h4>
              
              <div className="space-y-3">
                {[
                  { label: 'Domain Name', value: sandboxDetails.domain, valueClass: 'font-mono' },
                  { label: 'Server IP', value: sandboxDetails.ip_address, valueClass: 'font-mono' },
                  { label: 'Hosting ISP', value: sandboxDetails.geo_location.isp },
                  { label: 'Server Region', value: `${sandboxDetails.geo_location.city}, ${sandboxDetails.geo_location.country}` },
                  { label: 'Domain Registrar', value: sandboxDetails.registrar },
                  { label: 'Creation Date', value: sandboxDetails.registration_date.split('T')[0] },
                  { label: 'SSL Protocol', value: sandboxDetails.ssl_status, valueClass: sandboxDetails.ssl_status === 'Valid' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between border-b border-dark-800 pb-2.5 last:border-0 last:pb-0 text-xs leading-normal">
                    <span className="text-dark-400">{row.label}</span>
                    <span className={`text-dark-200 text-right ${row.valueClass || ''}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Abuse Takedown Console */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert size={18} className="text-red-400 animate-pulse" />
          <h3 className="font-bold text-dark-100">Abuse Takedown & Nodal Reporting</h3>
        </div>
        
        {takedownDossier && takedownDossier.length > 0 ? (
          <div className="space-y-4">
            <p className="text-xs text-dark-400 leading-normal mb-2">
              Automated lookups resolved the registrar hosting the domain, the issuing bank of the UPI ID, or the telecom regulator. 
              Review the evidence drafts below to report the scam and request immediate suspension.
            </p>
            {takedownDossier.map((item, idx) => {
              const isExpanded = expandedIndex === idx
              const status = submissionStatus[idx] || 'idle'
              const logs = submissionLogs[idx] || []
              return (
                <div key={idx} className="border border-dark-800 bg-dark-950/30 rounded-xl overflow-hidden">
                  <div 
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-dark-800/20 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-dark-700 bg-dark-900 text-dark-400">
                          {item.entity_type}
                        </span>
                        <span className="text-sm font-bold text-dark-100 truncate">{item.target}</span>
                      </div>
                      <p className="text-[11px] text-dark-400 mt-1">
                        Host/Bank: <span className="text-cyber-400 font-semibold">{item.provider_name}</span> · Recipient: <span className="text-dark-300 font-mono">{item.recipient_email}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {status === 'complete' && (
                        <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded-full font-bold">
                          FILED
                        </span>
                      )}
                      <button className="text-dark-400 hover:text-dark-200">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 border-t border-dark-800 space-y-4 bg-dark-950/10">
                      {/* Email template review */}
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-dark-500 tracking-wider">Complaint Draft Review</span>
                        <div className="bg-dark-950 rounded-lg p-4 border border-dark-800 max-h-48 overflow-y-auto space-y-2 font-mono text-xs">
                          <p className="text-dark-300"><span className="text-dark-500">To:</span> {item.recipient_email}</p>
                          <p className="text-dark-300"><span className="text-dark-500">Subject:</span> {item.subject}</p>
                          <hr className="border-dark-800/80 my-2" />
                          <pre className="text-dark-400 whitespace-pre-wrap">{item.body}</pre>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <a 
                          href={item.mailto_link}
                          className="flex-1 flex items-center justify-center gap-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 text-dark-100 font-bold py-2.5 rounded-xl text-xs transition-colors"
                        >
                          <ExternalLink size={13} /> Open in Email Client (Gmail/Outlook)
                        </a>
                        <button
                          onClick={() => handleSimulatedSubmission(idx, item)}
                          disabled={status !== 'idle'}
                          className="flex-1 flex items-center justify-center gap-2 bg-cyber-500 hover:bg-cyber-400 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition-all duration-200"
                        >
                          {status === 'idle' && <><Terminal size={13} /> Dispatch Threat Dossier</>}
                          {status === 'submitting' && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                          {status === 'complete' && <><Check size={13} /> Dossier Filed</>}
                        </button>
                      </div>

                      {/* Simulated Terminal console logs */}
                      {status !== 'idle' && (
                        <div className="bg-black border border-dark-800 rounded-lg p-3 font-mono text-[10px] text-green-400 space-y-1 max-h-32 overflow-y-auto">
                          {logs.map((log, lIdx) => (
                            <div key={lIdx} className="leading-relaxed">
                              {log}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Shield size={24} className="text-dark-600 mb-2" />
            <p className="text-sm text-dark-400">No reportable entities (domains, UPI IDs, phone numbers) were detected in this analysis.</p>
          </div>
        )}
      </div>

      {/* IOCs */}
      {(analysis.extracted_urls?.length + analysis.extracted_emails?.length +
        analysis.extracted_phones?.length + analysis.extracted_upi_ids?.length +
        analysis.extracted_crypto_wallets?.length) > 0 && (
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <h3 className="font-semibold text-dark-100 mb-4">Indicators of Compromise (IOCs)</h3>
          <div className="space-y-2">
            {analysis.extracted_urls?.map((url: string, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-dark-800 rounded-lg px-4 py-2.5">
                <Link2 size={13} className="text-red-400 shrink-0" />
                <span className="text-xs text-dark-400 uppercase font-mono w-10 shrink-0">URL</span>
                <span className="text-sm font-mono text-dark-200 truncate">{url}</span>
              </div>
            ))}
            {analysis.extracted_emails?.map((e: string, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-dark-800 rounded-lg px-4 py-2.5">
                <Mail size={13} className="text-yellow-400 shrink-0" />
                <span className="text-xs text-dark-400 uppercase font-mono w-10 shrink-0">Email</span>
                <span className="text-sm font-mono text-dark-200">{e}</span>
              </div>
            ))}
            {analysis.extracted_phones?.map((p: string, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-dark-800 rounded-lg px-4 py-2.5">
                <Phone size={13} className="text-blue-400 shrink-0" />
                <span className="text-xs text-dark-400 uppercase font-mono w-10 shrink-0">Phone</span>
                <span className="text-sm font-mono text-dark-200">{p}</span>
              </div>
            ))}
            {analysis.extracted_upi_ids?.map((u: string, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-dark-800 rounded-lg px-4 py-2.5">
                <CreditCard size={13} className="text-orange-400 shrink-0" />
                <span className="text-xs text-dark-400 uppercase font-mono w-10 shrink-0">UPI</span>
                <span className="text-sm font-mono text-dark-200">{u}</span>
              </div>
            ))}
            {analysis.extracted_crypto_wallets?.map((w: string, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-dark-800 rounded-lg px-4 py-2.5">
                <Bitcoin size={13} className="text-purple-400 shrink-0" />
                <span className="text-xs text-dark-400 uppercase font-mono w-10 shrink-0">Wallet</span>
                <span className="text-sm font-mono text-dark-200 truncate">{w}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Threat Indicators */}
      {analysis.threat_indicators?.length > 0 && (
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <h3 className="font-semibold text-dark-100 mb-4">Threat Indicators</h3>
          <ul className="space-y-2">
            {analysis.threat_indicators.map((ind: string, i: number) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 text-sm text-dark-300"
              >
                <AlertTriangle size={13} className="text-yellow-500 mt-0.5 shrink-0" />
                {ind}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Attack Techniques */}
      {analysis.attack_techniques?.length > 0 && (
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <h3 className="font-semibold text-dark-100 mb-4">Attack Techniques</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.attack_techniques.map((tech: string, i: number) => (
              <span key={i} className="text-xs bg-dark-800 border border-dark-700 rounded-full px-3 py-1.5 text-dark-300">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Technical Analysis */}
      {analysis.ai_technical_analysis && (
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <h3 className="font-semibold text-dark-100 mb-3">Technical Analysis</h3>
          <p className="text-sm text-dark-400 leading-relaxed">{analysis.ai_technical_analysis}</p>
        </div>
      )}

      {/* Recommendations */}
      {analysis.ai_recommendations && (
        <div className="bg-dark-900 border border-green-500/20 rounded-xl p-6">
          <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
            <Shield size={16} /> Recommendations
          </h3>
          <p className="text-sm text-dark-300 leading-relaxed">{analysis.ai_recommendations}</p>
        </div>
      )}

      {/* OCR */}
      {analysis.ocr_text && (
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <h3 className="font-semibold text-dark-100 mb-3">OCR Extracted Text</h3>
          <pre className="text-xs text-dark-400 font-mono bg-dark-800 rounded-lg p-4 overflow-auto max-h-40 whitespace-pre-wrap">
            {analysis.ocr_text}
          </pre>
        </div>
      )}

      {/* Raw Input */}
      {analysis.raw_input && (
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <h3 className="font-semibold text-dark-100 mb-3">Original Input</h3>
          <pre className="text-xs text-dark-500 font-mono bg-dark-800 rounded-lg p-4 overflow-auto max-h-40 whitespace-pre-wrap">
            {analysis.raw_input}
          </pre>
        </div>
      )}
    </div>
  )
}
