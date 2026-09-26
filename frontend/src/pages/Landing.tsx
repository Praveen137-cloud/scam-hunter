import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Shield, Zap, Eye, Brain, Lock, Globe,
  ArrowRight, ChevronDown, CheckCircle,
  AlertTriangle, Activity, Search, Sun, Moon,
  Loader2, ShieldAlert, Info, Terminal, X
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { registryApi } from '../services/api'
import { RiskBadge } from '../components/ui/RiskBadge'
import toast from 'react-hot-toast'

const stats = [
  { label: 'Scams Detected', value: '2.4M+', color: 'text-cyber-400' },
  { label: 'Threat Types', value: '10+', color: 'text-purple-400' },
  { label: 'Accuracy Rate', value: '94.7%', color: 'text-green-400' },
  { label: 'Avg. Response', value: '<3s', color: 'text-yellow-400' },
]

const features = [
  { icon: Brain, title: 'AI-Powered Detection', desc: 'Groq LLM analyzes content for sophisticated scam patterns and social engineering tactics in real time.', color: 'cyber' },
  { icon: Eye, title: 'OCR Screenshot Analysis', desc: 'Upload screenshots of suspicious messages. EasyOCR extracts and analyzes text automatically.', color: 'purple' },
  { icon: Globe, title: 'Threat Intelligence', desc: 'Cross-references URLs and IPs against VirusTotal, URLScan, and AbuseIPDB databases.', color: 'blue' },
  { icon: Activity, title: 'Risk Scoring Engine', desc: 'Multi-factor scoring algorithm produces a 0–100 risk score with Safe / Medium / High / Critical labels.', color: 'green' },
  { icon: Search, title: 'Entity Extraction', desc: 'Automatically identifies URLs, emails, phone numbers, UPI IDs, and crypto wallet addresses.', color: 'orange' },
  { icon: Lock, title: 'PDF Investigation Reports', desc: 'Generate professional PDF reports detailing findings, IOCs, techniques, and recommendations.', color: 'red' },
]

const scamTypes = [
  'Phishing', 'UPI Fraud', 'Job Scam', 'Lottery Scam', 'Investment Scam',
  'Romance Scam', 'Crypto Scam', 'Delivery Scam', 'Tech Support', 'Government'
]

const steps = [
  { n: '01', title: 'Submit Content', desc: 'Paste SMS, email, URLs, or upload a screenshot' },
  { n: '02', title: 'AI Analysis', desc: 'Our pipeline extracts entities and runs threat checks' },
  { n: '03', title: 'Risk Assessment', desc: 'Receive a detailed risk score and scam classification' },
  { n: '04', title: 'Download Report', desc: 'Export a professional PDF investigation report' },
]

function ColorDot({ color }: { color: string }) {
  const map: Record<string, string> = {
    cyber: 'bg-cyber-500', purple: 'bg-purple-500', blue: 'bg-blue-500',
    green: 'bg-green-500', orange: 'bg-orange-500', red: 'bg-red-500',
  }
  return <span className={`w-2 h-2 rounded-full ${map[color] || 'bg-cyber-500'}`} />
}

export default function Landing() {
  const { theme, toggleTheme } = useTheme()
  const [searchVal, setSearchVal] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchVal.trim()) {
      toast.error('Please enter a UPI ID, phone number, or domain')
      return
    }
    setChecking(true)
    setResult(null)
    try {
      const res = await registryApi.check(searchVal.trim())
      setResult(res.data)
      toast.success('Scan complete')
    } catch (err: any) {
      toast.error('Verification failed. Try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 text-dark-100 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-dark-950/80 backdrop-blur-lg border-b border-dark-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={22} className="text-cyber-400" />
            <span className="font-bold text-dark-100">ScamHunter<span className="text-cyber-400">AI</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-dark-400 hover:text-cyber-500 hover:bg-dark-800 transition-colors mr-1"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <Link to="/login" className="text-sm text-dark-300 hover:text-dark-100 px-4 py-2 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="text-sm bg-cyber-500 hover:bg-cyber-400 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-500/10 border border-cyber-500/20 text-cyber-400 text-sm font-medium mb-8">
              <Zap size={14} />
              <span>AI-Powered Cyber Threat Detection</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
              Hunt Scams.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyber-400 to-blue-400">
                Protect Yourself.
              </span>
            </h1>

            <p className="text-xl text-dark-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload screenshots, paste suspicious messages, or enter URLs.
              Our AI investigates threats, scores risk, and generates professional reports in seconds.
            </p>

            {/* Safety Radar Search Input */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8 bg-dark-900 border border-dark-800 rounded-xl p-2 flex gap-2 shadow-lg shadow-black/20 focus-within:border-cyber-500 transition-colors">
              <div className="relative flex-1 flex items-center">
                <Search className="absolute left-3 text-dark-500" size={18} />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Quick check: Enter UPI ID, Phone, or Domain..."
                  className="w-full bg-transparent pl-10 pr-3 py-3 text-dark-100 placeholder-dark-500 focus:outline-none text-sm font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={checking}
                className="bg-cyber-500 hover:bg-cyber-400 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm flex items-center gap-1.5 shrink-0"
              >
                {checking ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                Verify
              </button>
            </form>

            {/* Search Result Display */}
            <AnimatePresence>
              {(checking || result) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="max-w-xl mx-auto mb-10 bg-dark-900 border border-dark-800 rounded-xl overflow-hidden shadow-2xl text-left relative"
                >
                  <button
                    onClick={() => { setResult(null); setSearchVal('') }}
                    className="absolute right-4 top-4 p-1 text-dark-500 hover:text-dark-200 transition-colors"
                  >
                    <X size={16} />
                  </button>

                  {checking ? (
                    <div className="p-8 flex flex-col items-center justify-center space-y-3">
                      <Loader2 size={24} className="text-cyber-500 animate-spin" />
                      <p className="text-dark-400 text-xs font-medium">Analyzing global scam registries & OSINT nodes...</p>
                    </div>
                  ) : (
                    <div>
                      {/* Risk Alert Header */}
                      <div className={`p-4 border-b flex items-center gap-2.5 ${
                        result.exists
                          ? 'bg-red-500/10 border-red-500/20 text-red-500'
                          : 'bg-green-500/10 border-green-500/20 text-green-500'
                      }`}>
                        {result.exists ? <ShieldAlert size={18} /> : <CheckCircle size={18} />}
                        <div>
                          <h4 className="font-bold text-xs uppercase tracking-wider">
                            {result.exists ? 'VERIFIED FRAUD INDICATOR' : 'CLEAN SCAN RESULT'}
                          </h4>
                          <p className="text-[10px] opacity-80 leading-normal">
                            {result.exists ? `Logged in our community registry (${result.total_reports} reports)` : 'No threat logs registered. OSINT verified.'}
                          </p>
                        </div>
                      </div>

                      {/* Detail body */}
                      <div className="p-5 space-y-4 text-xs">
                        <div className="flex justify-between border-b border-dark-800 pb-2">
                          <span className="text-dark-400 font-medium">Target Value:</span>
                          <span className="font-mono font-bold text-dark-200 truncate max-w-[280px]">{result.value}</span>
                        </div>
                        <div className="flex justify-between border-b border-dark-800 pb-2">
                          <span className="text-dark-400 font-medium">Risk Label:</span>
                          <span className="font-bold text-dark-200 flex items-center gap-1.5">
                            {result.risk_level} ({result.risk_score}/100)
                            <RiskBadge level={result.risk_level} />
                          </span>
                        </div>

                        {result.exists ? (
                          <div className="space-y-3">
                            <span className="text-dark-400 font-bold block">Community Incident Log:</span>
                            <div className="bg-dark-950/50 rounded-lg p-3 text-[11px] text-dark-350 leading-relaxed border border-dark-850">
                              <p className="font-semibold text-cyber-500 mb-1">Scam Type: {result.scam_type}</p>
                              <p>"{result.reports[0]?.description}"</p>
                            </div>
                            
                            <div className="pt-2 text-center">
                              <Link
                                to="/register"
                                className="inline-flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-semibold px-4 py-2 rounded-lg text-[11px] transition-colors"
                              >
                                Sign Up to File Recovery Grievance Letter <ArrowRight size={12} />
                              </Link>
                            </div>
                          </div>
                        ) : (
                          result.osint_analysis && (
                            <div className="space-y-3">
                              <span className="text-dark-400 font-bold block flex items-center gap-1">
                                <Terminal size={12} className="text-cyber-500" />
                                Fallback OSINT Checks ({result.osint_analysis.provider})
                              </span>
                              <div className="bg-dark-950/60 border border-dark-850 rounded-lg p-3 font-mono text-[10px] space-y-1.5 leading-normal text-dark-350">
                                {result.osint_analysis.safety_checks.map((check: any, idx: number) => (
                                  <div key={idx} className="flex justify-between">
                                    <span>⚡ {check.check}:</span>
                                    <span className={check.status.includes('Passed') || check.status.includes('Safe') ? 'text-green-500' : 'text-yellow-500'}>
                                      {check.status}
                                    </span>
                                  </div>
                                ))}
                                <div className="pt-2 border-t border-dark-800 text-[10px] text-dark-400 flex items-start gap-1 font-sans">
                                  <Info size={12} className="text-cyber-500 shrink-0 mt-0.5" />
                                  <span>{result.osint_analysis.note}</span>
                                </div>
                              </div>
                              <div className="pt-1 text-center">
                                <Link
                                  to="/register"
                                  className="inline-flex items-center gap-1 bg-cyber-500/10 hover:bg-cyber-500/20 border border-cyber-500/20 text-cyber-400 font-semibold px-4 py-2 rounded-lg text-[11px] transition-colors"
                                >
                                  Sign Up to Report This Scammer <ArrowRight size={12} />
                                </Link>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-cyber-500 hover:bg-cyber-400 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 text-lg shadow-lg shadow-cyber-500/20"
              >
                Start Analyzing Free
                <ArrowRight size={20} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-dark-800 hover:bg-dark-700 text-dark-100 font-semibold px-8 py-4 rounded-xl border border-dark-700 transition-all duration-200 text-lg"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="flex justify-center mt-16"
        >
          <ChevronDown size={24} className="text-dark-600 animate-bounce" />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-dark-800/50 bg-dark-900/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              className="text-center"
            >
              <div className={`text-4xl font-black ${s.color} mb-1`}>{s.value}</div>
              <div className="text-sm text-dark-400">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Complete Threat Analysis Suite</h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">
              Every tool an investigator needs to detect, classify, and document digital scams.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                  className="p-6 bg-dark-900 border border-dark-800 rounded-xl hover:border-cyber-500/30 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center mb-4 group-hover:border-cyber-500/30">
                    <Icon size={18} className="text-cyber-400" />
                  </div>
                  <h3 className="font-bold text-dark-100 mb-2">{f.title}</h3>
                  <p className="text-sm text-dark-400 leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Scam Types */}
      <section className="py-20 px-6 bg-dark-900/30 border-y border-dark-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">Detects 10+ Scam Categories</h2>
          <p className="text-dark-400 mb-10">Trained on real-world fraud patterns from India and globally</p>
          <div className="flex flex-wrap justify-center gap-3">
            {scamTypes.map((type, i) => (
              <motion.span
                key={type}
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }} viewport={{ once: true }}
                className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 rounded-full text-sm text-dark-200"
              >
                <ColorDot color="cyber" />
                {type}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="relative text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-cyber-500/10 border border-cyber-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="font-black text-cyber-400 font-mono">{step.n}</span>
                </div>
                <h3 className="font-bold text-dark-100 mb-2">{step.title}</h3>
                <p className="text-sm text-dark-400">{step.desc}</p>
                {i < steps.length - 1 && (
                  <ArrowRight size={16} className="hidden md:block absolute top-5 -right-3 text-dark-600" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-10 bg-gradient-to-br from-cyber-500/10 to-purple-500/10 border border-cyber-500/20 rounded-2xl">
            <AlertTriangle size={40} className="text-cyber-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black mb-4">Don't Be the Next Victim</h2>
            <p className="text-dark-400 mb-8 text-lg">
              Scammers are getting smarter. Our AI stays ahead — analyze any suspicious content for free.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-cyber-500 hover:bg-cyber-400 text-white font-bold px-10 py-4 rounded-xl transition-all duration-200 text-lg"
            >
              Analyze Your First Message
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-cyber-400" />
            <span className="font-bold">ScamHunter<span className="text-cyber-400">AI</span></span>
          </div>
          <p className="text-dark-500 text-sm">Report cybercrime: cybercrime.gov.in | Helpline: 1930</p>
          <p className="text-dark-600 text-sm">© 2024 ScamHunter AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
