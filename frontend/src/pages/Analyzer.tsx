import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  MessageSquare, Mail, Link2, Image, Upload, Send,
  Loader2, Shield, AlertTriangle, CheckCircle,
  Eye, FileText, ChevronDown, ChevronUp, Terminal, Globe
} from 'lucide-react'
import { analysisApi, reportApi, getErrorMessage } from '../services/api'
import { RiskBadge, RiskGauge } from '../components/ui/RiskBadge'
import toast from 'react-hot-toast'

const INPUT_TYPES = [
  { id: 'SMS', label: 'SMS', icon: MessageSquare, placeholder: 'Paste the suspicious SMS message here...' },
  { id: 'WhatsApp', label: 'WhatsApp', icon: MessageSquare, placeholder: 'Paste the WhatsApp message...' },
  { id: 'Email', label: 'Email', icon: Mail, placeholder: 'Paste the suspicious email content here...' },
  { id: 'URL', label: 'URL', icon: Link2, placeholder: 'Enter a suspicious URL, e.g. https://suspicious-site.com' },
  { id: 'Image', label: 'Screenshot', icon: Image, placeholder: '' },
]

export default function Analyzer() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlParam = searchParams.get('url')

  const [activeType, setActiveType] = useState('SMS')
  const [text, setText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([])
  const [sandboxDetails, setSandboxDetails] = useState<any>(null)

  useEffect(() => {
    if (urlParam) {
      setActiveType('URL')
      const decodedUrl = decodeURIComponent(urlParam)
      setText(decodedUrl)

      const triggerAutoScan = async () => {
        setAnalyzing(true)
        setResult(null)
        setSandboxDetails(null)
        setSandboxLogs([`[INIT] Initializing secure visual sandbox container...`])
        
        const logs = [
          `[DNS] Contacting root nameservers to resolve host...`,
          `[DNS] Target IP resolved: running reputation check...`,
          `[GEO] Mapping IP geolocation: scanning hosting provider...`,
          `[RDAP] Fetching domain registration records (RDAP)...`,
          `[SSL] Validating certificate handshake details...`,
          `[SCAN] Parsing HTML source code tags and form nodes...`,
          `[COMPILE] Compiling sandbox metrics & visual mockup...`
        ]
        
        let i = 0
        const logInterval = setInterval(() => {
          if (i < logs.length) {
            setSandboxLogs(prev => [...prev, logs[i]])
            i++
          } else {
            clearInterval(logInterval)
          }
        }, 550)

        try {
          const fd = new FormData()
          fd.append('url', decodedUrl)
          const res = await analysisApi.analyzeSandboxUrl(fd)
          
          clearInterval(logInterval)
          setSandboxDetails(res.data.sandbox_details)
          setResult(res.data.record)
          toast.success('Auto-scan complete')
        } catch (err: any) {
          toast.error(getErrorMessage(err, 'Auto-scan failed'))
        } finally {
          setAnalyzing(false)
        }
      }

      const timer = setTimeout(() => {
        triggerAutoScan()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [urlParam])


  const onDrop = useCallback((files: File[]) => {
    if (files[0]) setImageFile(files[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  })

  const handleAnalyze = async () => {
    if (activeType === 'Image' && !imageFile) {
      toast.error('Please upload an image')
      return
    }
    if (activeType !== 'Image' && !text.trim()) {
      toast.error('Please enter content to analyze')
      return
    }

    setAnalyzing(true)
    setResult(null)
    setSandboxDetails(null)
    setSandboxLogs([])

    try {
      let res
      if (activeType === 'Image' && imageFile) {
        const fd = new FormData()
        fd.append('file', imageFile)
        res = await analysisApi.analyzeImage(fd)
        setResult(res.data)
      } else if (activeType === 'URL') {
        setSandboxLogs([`[INIT] Initializing secure visual sandbox container...`])
        const logs = [
          `[DNS] Contacting root nameservers to resolve host...`,
          `[DNS] Target IP resolved: running reputation check...`,
          `[GEO] Mapping IP geolocation: scanning hosting provider...`,
          `[RDAP] Fetching domain registration records (RDAP)...`,
          `[SSL] Validating certificate handshake details...`,
          `[SCAN] Parsing HTML source code tags and form nodes...`,
          `[COMPILE] Compiling sandbox metrics & visual mockup...`
        ]
        
        let i = 0
        const logInterval = setInterval(() => {
          if (i < logs.length) {
            setSandboxLogs(prev => [...prev, logs[i]])
            i++
          } else {
            clearInterval(logInterval)
          }
        }, 550)

        const fd = new FormData()
        fd.append('url', text)
        res = await analysisApi.analyzeSandboxUrl(fd)
        
        clearInterval(logInterval)
        setSandboxDetails(res.data.sandbox_details)
        setResult(res.data.record)
      } else {
        const fd = new FormData()
        fd.append('raw_input', text)
        fd.append('input_type', activeType)
        res = await analysisApi.analyzeText(fd)
        setResult(res.data)
      }
      toast.success('Analysis complete')
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Analysis failed'))
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!result) return
    try {
      await reportApi.generate(result.id)
      const res = await reportApi.download(result.id)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url; a.download = `scam_report_${result.id}.pdf`; a.click()
      toast.success('Report downloaded')
    } catch {
      toast.error('Failed to download report')
    }
  }

  const activeInput = INPUT_TYPES.find(t => t.id === activeType)!

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-100">Scam Analyzer</h1>
        <p className="text-dark-400 text-sm mt-1">Submit content for AI-powered threat analysis</p>
      </div>

      {/* Input type tabs */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-2 mb-5">
          {INPUT_TYPES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveType(id); setResult(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeType === id
                  ? 'bg-cyber-500/15 text-cyber-400 border border-cyber-500/30'
                  : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800 border border-transparent'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {activeType === 'Image' ? (
          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-cyber-400 bg-cyber-500/5' : 'border-dark-700 hover:border-dark-600'
          }`}>
            <input {...getInputProps()} />
            {imageFile ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle size={32} className="text-green-700" />
                <p className="text-dark-100 font-medium">{imageFile.name}</p>
                <p className="text-dark-400 text-sm">{(imageFile.size / 1024).toFixed(0)} KB</p>
                <button onClick={(e) => { e.stopPropagation(); setImageFile(null) }}
                  className="text-xs text-red-700 hover:text-red-800 mt-1 font-semibold">Remove</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload size={32} className="text-dark-500" />
                <p className="text-dark-300 font-medium">Drop a screenshot here</p>
                <p className="text-dark-500 text-sm">PNG, JPG, GIF up to 10MB</p>
                <p className="text-dark-600 text-xs">OCR will extract text automatically</p>
              </div>
            )}
          </div>
        ) : (
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={activeInput.placeholder}
            rows={6}
            className="w-full bg-dark-800 border border-dark-700 rounded-xl p-4 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-cyber-500 transition-colors text-sm resize-none font-mono"
          />
        )}

        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-dark-500">
            {activeType !== 'Image' && `${text.length} characters`}
          </span>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-2 bg-cyber-500 hover:bg-cyber-400 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg transition-all text-sm"
          >
            {analyzing ? (
              <><Loader2 size={15} className="animate-spin" /> Analyzing...</>
            ) : (
              <><Send size={15} /> Analyze Now</>
            )}
          </button>
        </div>
      </div>

      {/* Analyzing animation */}
      <AnimatePresence>
        {analyzing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-dark-900 border border-cyber-500/30 rounded-xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-cyber-500/30 flex items-center justify-center">
                  <Shield size={20} className="text-cyber-400" />
                </div>
                <div className="absolute inset-0 rounded-full border-t-2 border-cyber-500 animate-spin" />
              </div>
              <div>
                <p className="font-semibold text-dark-100">AI Analysis in Progress</p>
                <p className="text-sm text-dark-400">Extracting entities · Checking threat intel · Generating report...</p>
              </div>
            </div>
            <div className="mt-4 h-1 bg-dark-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }} animate={{ width: '90%' }}
                transition={{ duration: 8, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-cyber-500 to-purple-500 rounded-full"
              />
            </div>
            {activeType === 'URL' && sandboxLogs.length > 0 && (
              <div className="mt-4 bg-black border border-dark-800 rounded-lg p-3 font-mono text-[10px] text-green-400 space-y-1 max-h-36 overflow-y-auto">
                {sandboxLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !analyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Risk Overview */}
            <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <RiskGauge score={Math.round(result.risk_score)} />
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-3 justify-center sm:justify-start mb-2">
                    <RiskBadge level={result.risk_level} />
                    <span className="text-dark-400 text-sm font-mono">{result.scam_type}</span>
                    <span className="text-dark-500 text-xs">{result.scam_confidence.toFixed(0)}% confidence</span>
                  </div>
                  <h2 className="text-xl font-bold text-dark-100 mb-2">
                    {result.risk_level === 'Safe' ? '✅ No significant threat detected' : `⚠️ ${result.scam_type} Detected`}
                  </h2>
                  {result.ai_summary && (
                    <p className="text-dark-400 text-sm leading-relaxed">{result.ai_summary}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 text-dark-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <FileText size={15} /> Download PDF Report
                </button>
                <button
                  onClick={() => navigate(`/history/${result.id}`)}
                  className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 text-dark-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Eye size={15} /> Full Details
                </button>
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
            ) }

            {/* Entities */}
            {(result.extracted_urls?.length > 0 || result.extracted_emails?.length > 0 ||
              result.extracted_phones?.length > 0 || result.extracted_upi_ids?.length > 0 ||
              result.extracted_crypto_wallets?.length > 0) && (
              <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
                <h3 className="font-semibold text-dark-100 mb-4">Extracted Indicators</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {result.extracted_urls?.slice(0, 4).map((url: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-dark-800 rounded-lg px-3 py-2">
                      <Link2 size={12} className="text-red-400 shrink-0" />
                      <span className="text-xs font-mono text-dark-200 truncate">{url}</span>
                    </div>
                  ))}
                  {result.extracted_emails?.map((e: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-dark-800 rounded-lg px-3 py-2">
                      <Mail size={12} className="text-yellow-400 shrink-0" />
                      <span className="text-xs font-mono text-dark-200 truncate">{e}</span>
                    </div>
                  ))}
                  {result.extracted_upi_ids?.map((u: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-dark-800 rounded-lg px-3 py-2">
                      <AlertTriangle size={12} className="text-orange-400 shrink-0" />
                      <span className="text-xs font-mono text-dark-200 truncate">UPI: {u}</span>
                    </div>
                  ))}
                  {result.extracted_crypto_wallets?.map((w: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-dark-800 rounded-lg px-3 py-2">
                      <AlertTriangle size={12} className="text-purple-400 shrink-0" />
                      <span className="text-xs font-mono text-dark-200 truncate">{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical details toggle */}
            <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-dark-800/50 transition-colors"
              >
                <span className="font-semibold text-dark-100">Technical Analysis & Recommendations</span>
                {showDetails ? <ChevronUp size={16} className="text-dark-400" /> : <ChevronDown size={16} className="text-dark-400" />}
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 space-y-4 border-t border-dark-800">
                      {result.threat_indicators?.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-dark-300 mb-2">Threat Indicators</h4>
                          <ul className="space-y-1">
                            {result.threat_indicators.map((ind: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-dark-400">
                                <AlertTriangle size={13} className="text-yellow-500 mt-0.5 shrink-0" />
                                {ind}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.ai_technical_analysis && (
                        <div>
                          <h4 className="text-sm font-semibold text-dark-300 mb-2">Technical Analysis</h4>
                          <p className="text-sm text-dark-400 leading-relaxed">{result.ai_technical_analysis}</p>
                        </div>
                      )}
                      {result.ai_recommendations && (
                        <div>
                          <h4 className="text-sm font-semibold text-dark-300 mb-2">Recommendations</h4>
                          <p className="text-sm text-dark-400 leading-relaxed">{result.ai_recommendations}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* OCR result */}
            {result.ocr_text && (
              <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
                <h3 className="font-semibold text-dark-100 mb-3">OCR Extracted Text</h3>
                <pre className="text-xs text-dark-400 font-mono bg-dark-800 rounded-lg p-4 overflow-auto max-h-48 whitespace-pre-wrap">
                  {result.ocr_text}
                </pre>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
