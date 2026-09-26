import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, PlusCircle, Scale, ShieldAlert, FileText, CheckCircle,
  AlertTriangle, ExternalLink, Clock, ArrowRight, Shield, Copy,
  Download, User, Check, FileCheck, Info, Terminal, ChevronRight
} from 'lucide-react'
import { registryApi, getErrorMessage } from '../services/api'
import { RiskBadge } from '../components/ui/RiskBadge'
import toast from 'react-hot-toast'

type TabType = 'lookup' | 'report' | 'grievance' | 'bookmarklet'

export default function Registry() {
  const [activeTab, setActiveTab] = useState<TabType>('lookup')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2">
          <Scale className="text-cyber-500" size={24} />
          Threat Registry & Grievance Center
        </h1>
        <p className="text-dark-400 text-sm mt-1">
          Crowdsourced scam database, real-time safety checks, and official grievance document generator.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-dark-800 gap-1 overflow-x-auto">
        {[
          { id: 'lookup', label: 'Safety Registry', icon: Search },
          { id: 'report', label: 'Report Scammer', icon: PlusCircle },
          { id: 'grievance', label: 'Grievance Builder', icon: FileCheck },
          { id: 'bookmarklet', label: 'Scam Radar Bookmarklet', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                active
                  ? 'border-cyber-500 text-cyber-400 font-semibold'
                  : 'border-transparent text-dark-400 hover:text-dark-200 hover:border-dark-800'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'lookup' && <LookupTab />}
            {activeTab === 'report' && <ReportTab onReportSuccess={() => setActiveTab('lookup')} />}
            {activeTab === 'grievance' && <GrievanceTab />}
            {activeTab === 'bookmarklet' && <BookmarkletTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ==========================================================================
   1. LOOKUP TAB (SEARCH & COMMUNITY LEDGER)
   ========================================================================== */
function LookupTab() {
  const [searchVal, setSearchVal] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [recentReports, setRecentReports] = useState<any[]>([])
  const [loadingRecent, setLoadingRecent] = useState(true)

  const fetchRecent = async () => {
    try {
      const res = await registryApi.getRecent()
      setRecentReports(res.data)
    } catch {
      toast.error('Failed to load recent reports')
    } finally {
      setLoadingRecent(false)
    }
  }

  useEffect(() => {
    fetchRecent()
  }, [])

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchVal.trim()) {
      toast.error('Please enter a value to search')
      return
    }

    setChecking(true)
    setResult(null)
    try {
      const res = await registryApi.check(searchVal.trim())
      setResult(res.data)
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Search failed'))
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-start">
      {/* Left panel: Search & Results */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <h3 className="font-semibold text-dark-100 mb-2">Safety Search</h3>
          <p className="text-dark-400 text-xs mb-4">
            Verify if a UPI ID, phone number, bank account number, or domain has active scam reports logged by community members.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Check UPI ID (e.g. badactor@okaxis), phone, or domain..."
                className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-3 pr-10 py-2.5 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-cyber-500 transition-colors text-sm font-mono"
              />
              <Search className="absolute right-3 top-3 text-dark-500" size={16} />
            </div>
            <button
              type="submit"
              disabled={checking}
              className="bg-cyber-500 hover:bg-cyber-400 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              Verify
            </button>
          </form>
        </div>

        {/* Loading details */}
        {checking && (
          <div className="bg-dark-900 border border-dark-800 rounded-xl p-8 flex flex-col items-center justify-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyber-500" />
            <p className="text-dark-400 text-xs">Querying blockchain ledgers & blacklist nodes...</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
            {/* Alert bar based on result.exists */}
            <div className={`p-4 border-b ${
              result.exists
                ? 'bg-red-500/10 border-red-500/20 text-red-500'
                : 'bg-green-500/10 border-green-500/20 text-green-500'
            } flex items-center gap-3`}>
              {result.exists ? (
                <ShieldAlert size={20} className="shrink-0 animate-bounce" />
              ) : (
                <CheckCircle size={20} className="shrink-0" />
              )}
              <div>
                <h4 className="font-bold text-sm">
                  {result.exists ? 'HIGH RISK THREAT IDENTIFIED' : 'NO KNOWN RECORD FOUND'}
                </h4>
                <p className="text-[10px] opacity-80 leading-normal">
                  {result.exists
                    ? `This indicator has been flagged by ${result.total_reports} analyst reports.`
                    : 'This indicator is not yet flagged in the crowdsourced registry. Fallback safety rules applied.'}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Threat details grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-dark-950/40 border border-dark-800 p-4 rounded-lg space-y-1">
                  <span className="text-[10px] text-dark-500 uppercase tracking-wider font-semibold">Checked Value</span>
                  <p className="text-sm font-mono font-bold text-dark-100 truncate">{result.value}</p>
                </div>
                <div className="bg-dark-950/40 border border-dark-800 p-4 rounded-lg space-y-1">
                  <span className="text-[10px] text-dark-500 uppercase tracking-wider font-semibold">Classification Type</span>
                  <p className="text-sm font-bold text-dark-100">{result.type}</p>
                </div>
              </div>

              {/* Aggregated Risk Score */}
              <div className="bg-dark-950/40 border border-dark-800 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-dark-500 uppercase tracking-wider font-semibold block">Aggregated Risk Status</span>
                  <span className="text-sm font-bold text-dark-200 mt-1 inline-block">
                    Score: {result.risk_score}/100 ({result.risk_level})
                  </span>
                </div>
                <RiskBadge level={result.risk_level} />
              </div>

              {/* Report history logs or OSINT simulated logs */}
              {result.exists ? (
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-dark-200 border-b border-dark-800 pb-2">Community Incident Logs</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {result.reports.map((report: any, idx: number) => (
                      <div key={idx} className="bg-dark-950/40 border border-dark-850 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-cyber-400 font-semibold flex items-center gap-1">
                            <User size={10} /> {report.reporter}
                          </span>
                          <span className="text-dark-500 flex items-center gap-1">
                            <Clock size={10} /> {new Date(report.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 font-bold">
                            {report.scam_type}
                          </span>
                        </div>
                        <p className="text-xs text-dark-400 leading-normal">{report.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                result.osint_analysis && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-xs text-dark-200 border-b border-dark-800 pb-2 flex items-center gap-1.5">
                      <Terminal size={14} className="text-cyber-500" />
                      Fallback Network OSINT Checks ({result.osint_analysis.provider})
                    </h4>
                    <div className="bg-dark-950/60 border border-dark-800 rounded-lg p-4 space-y-4 font-mono text-xs">
                      <div className="grid gap-2 border-b border-dark-850 pb-3">
                        {result.osint_analysis.safety_checks.map((check: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-dark-400">⚡ {check.check}:</span>
                            <span className={check.status.includes('Passed') || check.status.includes('Safe') ? 'text-green-500 font-semibold' : 'text-yellow-500 font-semibold'}>
                              {check.status}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[11px] text-dark-400 leading-normal flex items-start gap-1.5">
                        <Info size={12} className="text-cyber-500 shrink-0 mt-0.5" />
                        <span>{result.osint_analysis.note}</span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right panel: Recent Database Ledger */}
      <div className="lg:col-span-5 space-y-4 bg-dark-900 border border-dark-800 rounded-xl p-5">
        <div className="flex justify-between items-center pb-3 border-b border-dark-800 mb-3">
          <h3 className="font-semibold text-dark-100 flex items-center gap-1.5">
            <ShieldAlert size={15} className="text-red-500" />
            Registry Incident Ledger
          </h3>
          <span className="text-[10px] text-dark-400 font-semibold uppercase">Latest reports</span>
        </div>

        {loadingRecent ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-cyber-500" />
          </div>
        ) : recentReports.length > 0 ? (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {recentReports.map((item: any) => (
              <div
                key={item.id}
                onClick={() => setSearchVal(item.value)}
                className="bg-dark-950/40 hover:bg-dark-800/40 border border-dark-850 hover:border-cyber-500/25 rounded-lg p-3 space-y-2 cursor-pointer transition-all"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-dark-200 truncate max-w-[150px]">{item.value}</span>
                  <RiskBadge level={item.risk_level} />
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-dark-500">{item.type}</span>
                  <span className="text-red-500/80 font-bold">{item.scam_type}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-dark-500 text-xs">
            No crowdsourced reports recorded yet.
          </div>
        )}
      </div>
    </div>
  )
}

/* ==========================================================================
   2. REPORT TAB (ADD NEW SCAMMER THREAT TO DB)
   ========================================================================== */
interface ReportTabProps {
  onReportSuccess: () => void
}

function ReportTab({ onReportSuccess }: ReportTabProps) {
  const [value, setValue] = useState('')
  const [type, setType] = useState('UPI ID')
  const [scamType, setScamType] = useState('UPI Fraud')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) {
      toast.error('Please enter the scammer identifier')
      return
    }

    setSubmitting(true)
    try {
      await registryApi.report({
        value: value.trim(),
        type,
        scam_type: scamType,
        description: description.trim(),
      })
      toast.success('Threat successfully reported to registry')
      setValue('')
      setDescription('')
      onReportSuccess()
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to file threat report'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-xl p-6 max-w-2xl mx-auto">
      <h3 className="font-semibold text-dark-100 mb-2">Report Scammer threat</h3>
      <p className="text-dark-400 text-xs mb-5">
        Help protect the community by logging new fraudulent nodes (VPAs, phone accounts, bank details, or domains). All submissions are logged and indexed immediately.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-dark-300 uppercase mb-1.5">Indicator Value</label>
          <input
            type="text"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. scammersupi@okaxis, +91-9988776655, scamsite.com"
            className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-cyber-500 text-sm font-mono"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-dark-300 uppercase mb-1.5">Indicator Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 focus:outline-none focus:border-cyber-500 text-sm"
            >
              <option value="UPI ID">UPI ID</option>
              <option value="Phone Number">Phone Number</option>
              <option value="Bank Account">Bank Account</option>
              <option value="Domain">Domain</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-dark-300 uppercase mb-1.5">Scam Category</label>
            <select
              value={scamType}
              onChange={(e) => setScamType(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 focus:outline-none focus:border-cyber-500 text-sm"
            >
              <option value="Phishing">Phishing</option>
              <option value="UPI Fraud">UPI Fraud</option>
              <option value="Job Scam">Job Scam</option>
              <option value="Investment Scam">Investment Scam</option>
              <option value="Lottery Scam">Lottery Scam</option>
              <option value="Tech Support Scam">Tech Support Scam</option>
              <option value="Government Scam">Government Scam</option>
              <option value="Crypto Scam">Crypto Scam</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-dark-300 uppercase mb-1.5">Incident Details / Evidence</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide context, e.g. 'Scammer offered job on WhatsApp, asked for deposit, then requested UPI transfer to this ID.'"
            rows={4}
            className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-cyber-500 text-sm resize-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            Submit Report
          </button>
        </div>
      </form>
    </div>
  )
}

/* ==========================================================================
   3. GRIEVANCE TAB (INTERACTIVE DRAFT COMPLAINT GENERATOR)
   ========================================================================== */
function GrievanceTab() {
  const [step, setStep] = useState(1)
  
  // Wizard state values
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [scamType, setScamType] = useState('UPI Fraud')
  const [platform, setPlatform] = useState('WhatsApp')
  const [date, setDate] = useState('')
  const [amount, setAmount] = useState('')
  
  const [scammerUpi, setScammerUpi] = useState('')
  const [scammerPhone, setScammerPhone] = useState('')
  const [scammerBank, setScammerBank] = useState('')
  
  const [userBank, setUserBank] = useState('')
  const [userAccount, setUserAccount] = useState('')
  const [txnId, setTxnId] = useState('')
  const [narrative, setNarrative] = useState('')
  
  const [drafts, setDrafts] = useState<Record<string, string> | null>(null)
  const [activeDraftTab, setActiveDraftTab] = useState<'cybercrime' | 'bank' | 'abuse'>('cybercrime')
  
  const handleGenerate = () => {
    if (!userName.trim() || !amount.trim() || !txnId.trim()) {
      toast.error('Name, transaction amount, and Reference ID are required.')
      return
    }

    const cyberDraft = `To,
The Officer-in-Charge,
Cyber Crime Reporting Cell,

Subject: Complaint regarding online fraud of Rs. ${amount} via ${platform}

Sir/Madam,
I am writing to report a financial cyber scam that occurred on ${date || '[Date]'}. I was deceived into transferring a sum of Rs. ${amount} to a fraudulent account under the pretext of a "${scamType}".

The scam was executed on the platform: ${platform}.

Fraudulent Account/Identifier details:
- Scammer UPI ID (VPA): ${scammerUpi || 'Not Available'}
- Scammer Phone Number: ${scammerPhone || 'Not Available'}
- Scammer Bank Account: ${scammerBank || 'Not Available'}

My Bank Transaction Information:
- My Bank Name: ${userBank || '[Bank Name]'}
- My Bank Account: ${userAccount || '[Account Number]'}
- UPI Ref / Transaction ID: ${txnId}
- Amount Transferred: Rs. ${amount}
- Date and Time: ${date || '[Date and Time]'}

Brief Description of Incident:
${narrative || `I received a message on ${platform} requesting payments. Deceived by the fraudster, I initiated a transaction of Rs. ${amount} via UPI, which cleared instantly.`}

Evidence Preservation Notice:
Under Section 102 and Section 91 of the Code of Criminal Procedure (CrPC), I request the immediate freezing of the recipient UPI handle and banking node associated with the transaction ID ${txnId} to prevent the siphoning of these stolen funds.

Sincerely,
${userName}
Phone: ${userPhone || 'Provided in logs'}`;

    const bankDraft = `To,
The Nodal Officer / Grievance Redressal Officer,
${userBank || '[Your Bank Name]'}

Subject: Dispute of unauthorized / fraudulent UPI transaction of Rs. ${amount}

Dear Sir/Madam,

I am writing to report a fraudulent debit of Rs. ${amount} from my account number ${userAccount || '[Account Number]'} on ${date || '[Date]'}.

In accordance with the Reserve Bank of India (RBI) Circular on "Customer Protection – Limiting Liability of Customers in Unauthorised Electronic Banking Transactions" (Ref: RBI/2017-18/15 DBR.No.Leg.BC.78/09.07.005/2017-18), I am reporting this incident immediately within the 3-day reporting window.

Transaction Summary:
- Debited Account: ${userAccount || '[Account Number]'}
- Transaction Ref / UPI ID: ${txnId}
- Credited UPI ID (Destination): ${scammerUpi || '[Scammer UPI]'}
- Total Lost: Rs. ${amount}
- Transaction Date: ${date || '[Date]'}

I request your office to:
1. Contact the sponsor bank / NPCI gateway to place a freeze hold on the recipient wallet node.
2. Initiate chargeback proceedings to retrieve the funds.
3. Record this dispute and provide a shadow reversal credit to my account as per RBI customer liability limits.

A copy of the cybercrime cell report is enclosed.

Sincerely,
${userName}
Phone: ${userPhone || 'Provided in logs'}`;

    const abuseDraft = `Subject: Domain Abuse Report / Takedown Request - Phishing Domain

Dear Abuse Team,

This is an urgent domain abuse report regarding suspicious pages linked to: ${scammerUpi || 'Target URLs'}

Our isolated visual threat sandbox has verified active phishing, typosquatting brand manipulation, and credential harvesting forms hosted on this domain.

We request you to immediately suspend this domain to protect internet users from credential theft and financial losses.

Regards,
Security Incident Response Unit
Threat ID Ref: SH-${Math.floor(Math.random() * 9000 + 1000)}`;

    setDrafts({
      cybercrime: cyberDraft,
      bank: bankDraft,
      abuse: abuseDraft
    })
    setStep(4)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Complaint draft copied to clipboard!')
  }

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    toast.success('Dossier downloaded as .txt')
  }

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-xl p-6 max-w-3xl mx-auto space-y-4">
      {/* Step indicator header */}
      <div className="flex justify-between items-center pb-4 border-b border-dark-800 mb-2">
        <div>
          <h3 className="font-semibold text-dark-100">Grievance Wizard</h3>
          <p className="text-dark-400 text-xs mt-0.5">
            Compile official, legally-backed report templates to submit to banks or authorities.
          </p>
        </div>
        <span className="text-xs bg-cyber-500/10 text-cyber-400 font-mono px-3 py-1 rounded-full border border-cyber-500/20">
          STEP {step} OF 4
        </span>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase text-dark-300">Step 1: Contact & Scam Context</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-dark-400 uppercase mb-1">Your Full Name</label>
              <input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="Enter your name" className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-cyber-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-400 uppercase mb-1">Your Phone Number</label>
              <input type="text" value={userPhone} onChange={e => setUserPhone(e.target.value)} placeholder="Your contact number" className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-cyber-500" />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-dark-400 uppercase mb-1">Scam Type</label>
              <select value={scamType} onChange={e => setScamType(e.target.value)} className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-cyber-500">
                <option value="UPI Fraud">UPI Fraud</option>
                <option value="Phishing">Phishing</option>
                <option value="Job Scam">Job Scam</option>
                <option value="Investment Scam">Investment Scam</option>
                <option value="Lottery Scam">Lottery Scam</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-400 uppercase mb-1">Scam Platform</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-cyber-500">
                <option value="WhatsApp">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="Website URL">Website URL</option>
                <option value="Phone Call">Phone Call</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-400 uppercase mb-1">Loss Amount (INR)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Rs." className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-cyber-500 font-mono" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button onClick={() => setStep(2)} className="flex items-center gap-1 bg-cyber-500 hover:bg-cyber-400 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase text-dark-300">Step 2: Scammer Details</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-dark-400 uppercase mb-1">Scammer UPI ID / VPA</label>
              <input type="text" value={scammerUpi} onChange={e => setScammerUpi(e.target.value)} placeholder="e.g. badactor@okaxis" className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-cyber-500 font-mono" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-dark-400 uppercase mb-1">Scammer Phone</label>
                <input type="text" value={scammerPhone} onChange={e => setScammerPhone(e.target.value)} placeholder="e.g. +91 98765-43210" className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-cyber-500 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-400 uppercase mb-1">Scammer Bank Details</label>
                <input type="text" value={scammerBank} onChange={e => setScammerBank(e.target.value)} placeholder="e.g. HDFC 0002131923" className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-cyber-500 font-mono" />
              </div>
            </div>
          </div>
          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(1)} className="bg-dark-850 hover:bg-dark-800 border border-dark-700 text-dark-300 font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
              Back
            </button>
            <button onClick={() => setStep(3)} className="flex items-center gap-1 bg-cyber-500 hover:bg-cyber-400 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase text-dark-300">Step 3: Bank Transaction Details</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-dark-400 uppercase mb-1">Your Bank Name</label>
              <input type="text" value={userBank} onChange={e => setUserBank(e.target.value)} placeholder="e.g. SBI, ICICI" className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-cyber-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-400 uppercase mb-1">Your Account Number</label>
              <input type="text" value={userAccount} onChange={e => setUserAccount(e.target.value)} placeholder="Your account digits" className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-cyber-500 font-mono" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-dark-400 uppercase mb-1">UPI Transaction ID / Ref Number</label>
              <input type="text" value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="12-digit Ref or UPI ID" className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-cyber-500 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-400 uppercase mb-1">Date & Time of Debit</label>
              <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-cyber-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-dark-400 uppercase mb-1">Brief Description of the Incident</label>
            <textarea value={narrative} onChange={e => setNarrative(e.target.value)} placeholder="Example: I got a SMS from electricity board saying my power will disconnect. I called the number and they asked me to pay Rs. 10 via this UPI ID. When I did, I lost Rs. 20,000." rows={3} className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-cyber-500 resize-none" />
          </div>
          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(2)} className="bg-dark-850 hover:bg-dark-800 border border-dark-700 text-dark-300 font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
              Back
            </button>
            <button onClick={handleGenerate} className="flex items-center gap-1 bg-cyber-500 hover:bg-cyber-400 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
              Generate Drafts <FileText size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 4 && drafts && (
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-dark-800">
            <h4 className="font-bold text-xs uppercase text-dark-300">Step 4: Your Actionable Grievance Dossiers</h4>
            <button onClick={() => setStep(1)} className="text-xs text-cyber-500 hover:underline">
              Restart Wizard
            </button>
          </div>

          <div className="flex border-b border-dark-850 gap-1 overflow-x-auto">
            {[
              { id: 'cybercrime', label: '1. Cybercrime Cell Draft' },
              { id: 'bank', label: '2. Bank Nodal Letter' },
              { id: 'abuse', label: '3. Abuse Registrar Report' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveDraftTab(tab.id as any)}
                className={`px-4 py-2 border-b-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  activeDraftTab === tab.id
                    ? 'border-cyber-500 text-cyber-400'
                    : 'border-transparent text-dark-400 hover:text-dark-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 text-xs font-semibold pt-1">
            <button
              onClick={() => handleCopy(drafts[activeDraftTab])}
              className="flex items-center gap-1.5 bg-dark-850 hover:bg-dark-800 border border-dark-750 text-dark-200 px-3.5 py-2 rounded-lg transition-all"
            >
              <Copy size={13} /> Copy Text
            </button>
            <button
              onClick={() => handleDownload(drafts[activeDraftTab], `${activeDraftTab}_complaint_draft.txt`)}
              className="flex items-center gap-1.5 bg-cyber-500/10 hover:bg-cyber-500/20 border border-cyber-500/20 text-cyber-400 px-3.5 py-2 rounded-lg transition-all"
            >
              <Download size={13} /> Save Dossier
            </button>
          </div>

          <div className="bg-black border border-dark-850 rounded-xl p-5 relative max-h-96 overflow-y-auto font-mono text-[11px] leading-relaxed text-green-400 whitespace-pre-wrap select-all">
            {drafts[activeDraftTab]}
          </div>

          <div className="bg-dark-950 border border-dark-800 rounded-xl p-4 flex items-start gap-3">
            <Info size={16} className="text-cyber-500 shrink-0 mt-0.5" />
            <div className="text-[10px] text-dark-400 space-y-1 leading-normal">
              <p className="font-semibold text-dark-200">Legal Reference Guidelines:</p>
              {activeDraftTab === 'cybercrime' && (
                <p>
                  Submit this copy to <strong>cybercrime.gov.in</strong> or visit your local police station. Request them to file a First Information Report (FIR) under Section 420 IPC and Section 66D of the IT Act.
                </p>
              )}
              {activeDraftTab === 'bank' && (
                <p>
                  RBI customer liability rules limit your liability to <strong>Zero</strong> if reported within 3 days. Send this nodal dispatch immediately to your bank.
                </p>
              )}
              {activeDraftTab === 'abuse' && (
                <p>
                  Email this notice to the abuse team of the registrar hosting the scam domain (check registrar details in the Sandbox tab).
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ==========================================================================
   4. BOOKMARKLET TAB (URL SCAN RADAR INTEGRATION)
   ========================================================================== */
function BookmarkletTab() {
  const bookmarkletScript = `javascript:(function(){const url=encodeURIComponent(window.location.href);const title=encodeURIComponent(document.title);window.open('http://localhost:5173/analyzer?url='+url+'&title='+title,'_blank');})();`

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-xl p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h3 className="font-semibold text-dark-100 mb-1">One-Click Scam Radar Bookmarklet</h3>
        <p className="text-dark-400 text-xs">
          Analyze suspicious sites instantly. Click the radar button on any webpage to route it straight into the Scam Hunter Visual Sandbox.
        </p>
      </div>

      {/* Bookmarklet installer card */}
      <div className="border border-dark-800 bg-dark-950/40 rounded-xl p-8 flex flex-col items-center justify-center space-y-4 text-center">
        <span className="text-xs uppercase font-bold text-cyber-500 tracking-wider">Drag and Drop Installer</span>
        
        {/* The draggable button */}
        <a
          href={bookmarkletScript}
          onClick={(e) => e.preventDefault()}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyber-500 to-indigo-600 hover:from-cyber-400 hover:to-indigo-500 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-lg cursor-move transition-transform duration-150 hover:-translate-y-0.5 select-none text-sm uppercase tracking-wider"
          title="Drag this button to your browser bookmarks bar"
        >
          <Shield size={18} />
          Scam Radar
        </a>

        <p className="text-[10px] text-dark-400 max-w-md leading-normal">
          Drag the button above directly into your browser's <strong>Bookmarks / Favorites Bar</strong>. 
          If the bar is hidden, enable it via <kbd className="bg-dark-800 px-1 py-0.5 rounded border border-dark-700">Ctrl + Shift + B</kbd> (or <kbd className="bg-dark-800 px-1 py-0.5 rounded border border-dark-700">Cmd + Shift + B</kbd> on Mac).
        </p>
      </div>

      {/* Guide steps */}
      <div className="space-y-4">
        <h4 className="font-bold text-xs uppercase text-dark-300 border-b border-dark-850 pb-2">How to use Scam Radar</h4>
        
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { step: '01', title: 'Visit any site', desc: 'Browse the web normally. When you encounter a suspicious store, crypto token, or invoice page, stop.' },
            { step: '02', title: 'Click Scam Radar', desc: 'Click the "Scam Radar" link in your bookmarks bar. It reads the current site context securely.' },
            { step: '03', title: 'View Sandbox', desc: 'A new tab opens in Scam Hunter, instantly initiating a sandboxed registrar DNS, WHOIS, and form-harvesting analysis.' }
          ].map(col => (
            <div key={col.step} className="bg-dark-950/20 border border-dark-800 p-4 rounded-lg space-y-2">
              <span className="text-lg font-black text-cyber-500/30 font-mono block">{col.step}</span>
              <h5 className="font-bold text-xs text-dark-100">{col.title}</h5>
              <p className="text-[10px] text-dark-400 leading-normal">{col.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
