import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Bot, ArrowLeft, AlertTriangle,
  CheckCircle2, XCircle, ShieldAlert, Info, Play
} from 'lucide-react'

interface DialogueOption {
  text: string
  nextNode: string | null // null means end of scenario
  isSafe: boolean
  outcomeMessage?: string
}

interface DialogueNode {
  scammerText: string
  explanation: string
  redFlags: string[]
  options: DialogueOption[]
}

interface Scenario {
  id: string
  title: string
  icon: any
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  initialNode: string
  nodes: Record<string, DialogueNode>
}

const SCENARIOS: Scenario[] = [
  {
    id: 'upi',
    title: 'UPI Cashback Trap',
    icon: MessageSquare,
    description: 'A scammer impersonating a Google Pay representative offers a cashback prize but requests your UPI PIN to claim it.',
    difficulty: 'Easy',
    initialNode: 'start',
    nodes: {
      start: {
        scammerText: "Congratulations! A cash reward of Rs. 4,999 has been credited to your GPay account from our lucky draw. I have sent a request. Please open Google Pay, click 'Pay', and enter your UPI PIN to instantly deposit the money.",
        explanation: "Scammers use the allure of 'free money' or 'cashback' and exploit users' lack of understanding of how UPI works.",
        redFlags: ["Unsolicited lucky draw winnings.", "Instruction to enter a UPI PIN to receive money."],
        options: [
          {
            text: "Why do I need to enter my PIN to receive money? That sounds suspicious.",
            nextNode: 'suspicious',
            isSafe: true
          },
          {
            text: "Oh great! Let me open my GPay app and enter my UPI PIN to claim it.",
            nextNode: 'scammed_pin',
            isSafe: false,
            outcomeMessage: "CRITICAL: You entered your UPI PIN! The scammer instantly withdrew Rs. 4,999 from your account."
          }
        ]
      },
      suspicious: {
        scammerText: "Sir/Madam, this is Google Pay security protocol. It is double-verification. If you don't enter your PIN within 2 minutes, the transaction will expire and your GPay account will be temporarily locked.",
        explanation: "Scammers create artificial urgency and invoke fear of penalty (locking your account) to bypass your rational defenses.",
        redFlags: ["Creating a 2-minute deadline.", "Threatening to lock your account."],
        options: [
          {
            text: "No. You never need a PIN to receive money. I am reporting this UPI ID and hanging up.",
            nextNode: 'evaded_success',
            isSafe: true,
            outcomeMessage: "EXCELLENT DECISION: You refused to provide your PIN and recognized that receiving payments never requires authorization."
          },
          {
            text: "Wait, I don't want my account locked. I will enter my PIN just to verify.",
            nextNode: 'scammed_pin',
            isSafe: false,
            outcomeMessage: "CRITICAL: You panicked and entered your UPI PIN. The scammer successfully withdrew Rs. 4,999."
          }
        ]
      },
      scammed_pin: {
        scammerText: "Oh, sorry! The system failed due to network lag. The Rs. 4,999 was debited by mistake. Don't worry, I am sending a reverse transaction request of Rs. 9,998 to refund everything. Enter your PIN again now to cancel the debit.",
        explanation: "Once a victim falls for the initial scam, the scammer uses a 'recovery trap' to steal even more under the guise of 'refunding' the mistake.",
        redFlags: ["Demanding another PIN entry.", "Asking for double the amount to 'reverse' a mistake."],
        options: [
          {
            text: "Wait, you already stole my money! I am calling my bank and reporting this to cybercrime.",
            nextNode: 'evaded_recovery',
            isSafe: true,
            outcomeMessage: "REFUND ATTEMPT PREVENTED: You stopped further damage. Reporting immediately to your bank offers the best chance of reversing the transaction."
          },
          {
            text: "Okay, please refund it! Entering the PIN now.",
            nextNode: 'scammed_double',
            isSafe: false,
            outcomeMessage: "CRITICAL: You entered your PIN again. The scammer stole an additional Rs. 9,998, bringing your total loss to Rs. 14,997."
          }
        ]
      },
      scammed_double: {
        scammerText: "System error continues. I am calling my senior manager to approve a manual refund. Please do not close the call...",
        explanation: "The scammer keeps you on the line to prevent you from calling your bank, maximizing the time they have to transfer the money out.",
        redFlags: ["Keeping you on hold.", "Vague promises of 'senior managers' or manual overrides."],
        options: [
          {
            text: "Hang up immediately and contact the bank.",
            nextNode: null,
            isSafe: true,
            outcomeMessage: "SCENARIO ENDED: You finally hung up. You lost Rs. 14,997. Immediately contact your bank's fraud helpline to freeze your account."
          }
        ]
      },
      evaded_success: {
        scammerText: "Fine, if you think this is a scam, you will lose the reward. Goodbye.",
        explanation: "Once the scammer realizes you know how UPI works and cannot be coerced, they will typically abort and hang up.",
        redFlags: ["Abruptly ending the call when challenged."],
        options: [
          {
            text: "Hooray! I successfully identified and blocked the threat.",
            nextNode: null,
            isSafe: true
          }
        ]
      },
      evaded_recovery: {
        scammerText: "No wait, please don't report! It will be refunded...",
        explanation: "Threat of reporting causes the scammer to panic, but they will still try to stall you.",
        redFlags: ["Pleading not to be reported."],
        options: [
          {
            text: "Finish and review my threat compliance report.",
            nextNode: null,
            isSafe: true
          }
        ]
      }
    }
  },
  {
    id: 'tech_support',
    title: 'Microsoft Tech Support',
    icon: Bot,
    description: 'A pop-up alert warns that your computer is infected with a Trojan. You are instructed to call a helpline to prevent data deletion.',
    difficulty: 'Medium',
    initialNode: 'start',
    nodes: {
      start: {
        scammerText: "ALERT! Microsoft Security Essentials detected a Trojan virus stealing your banking passwords. Do not restart your computer. Call +1-800-444-2191 immediately to clean your files or your system registry will be deleted!",
        explanation: "Pop-up support scams mimic official system dialogue boxes using full-screen browsers to freeze your screen and induce panic.",
        redFlags: ["Warning numbers that do not match official support sites.", "Instructions never to restart your PC.", "Threats of automatic registry deletion."],
        options: [
          {
            text: "Call the number to see what they want me to do.",
            nextNode: 'on_call',
            isSafe: false,
            outcomeMessage: "VULNERABILITY: You called the scam number. You are now speaking to a scammer in an offshore call center pretending to be an engineer."
          },
          {
            text: "Ignore the popup, force-close the browser (Alt+F4), and run a local antivirus scan.",
            nextNode: 'safe_close',
            isSafe: true,
            outcomeMessage: "EXCELLENT DECISION: You recognized it was a fake browser alert. Force-closing the browser safely ended the script."
          }
        ]
      },
      on_call: {
        scammerText: "Thank you for calling Microsoft Support. To inspect the infected directories, please open a run command, type 'www.anydesk.com' and download our official diagnostics tool. Give me the 9-digit address so I can scan.",
        explanation: "Scammers demand remote control software (AnyDesk, TeamViewer, UltraViewer) under the guise of running diagnostics.",
        redFlags: ["Requests to install remote control software.", "Asking for access credentials (ids/passwords)."],
        options: [
          {
            text: "Install AnyDesk and read him the ID so he can clean the virus.",
            nextNode: 'remote_controlled',
            isSafe: false,
            outcomeMessage: "CRITICAL: You gave the scammer full remote control of your computer. They are now viewing your screen."
          },
          {
            text: "No, Microsoft never requests remote access over phone calls. I am hanging up.",
            nextNode: 'safe_close',
            isSafe: true,
            outcomeMessage: "SUCCESS: You hung up before granting access. System intact."
          }
        ]
      },
      remote_controlled: {
        scammerText: "Look at your system files (shows command prompt writing fake errors). The virus has corrupted your partition index. To secure your computer, we must install a premium protection vault costing $199. Open your banking portal to transfer the license fee.",
        explanation: "Once inside, the scammer displays regular system directories (like Event Viewer or tree listings) claiming they are 'viruses' and demands fee transfers.",
        redFlags: ["Command prompts showing fake errors.", "Demanding banking transfers/gift cards to purchase 'licenses'."],
        options: [
          {
            text: "Log in to my online bank account to pay the license fee.",
            nextNode: 'bank_hijacked',
            isSafe: false,
            outcomeMessage: "CRITICAL: You logged in with the scammer remote-connected! They captured your passwords and initiated unauthorized transfers."
          },
          {
            text: "Shut down the computer physically (hold power button) and sever the internet connection.",
            nextNode: 'mitigated_remote',
            isSafe: true,
            outcomeMessage: "MITIGATED: You disconnected the scammer mid-session. Immediately change all credentials on a clean device."
          }
        ]
      },
      bank_hijacked: {
        scammerText: "Payment verification failed. I am locking your system temporarily while I re-verify the transaction.",
        explanation: "After stealing funds, scammers lock you out of your computer using system passwords (like Syskey or lock screens) to buy time to run.",
        redFlags: ["System locking during payment.", "Stalling tactics."],
        options: [
          {
            text: "End scenario and review report.",
            nextNode: null,
            isSafe: false
          }
        ]
      },
      safe_close: {
        scammerText: "Browser closed successfully. System scan reports 0 threats.",
        explanation: "Simply exiting the webpage or ignoring the scammer prevents any damage.",
        redFlags: [],
        options: [
          {
            text: "Finish and review training results.",
            nextNode: null,
            isSafe: true
          }
        ]
      },
      mitigated_remote: {
        scammerText: "Connection lost...",
        explanation: "Powering down the device immediately terminates remote access protocols.",
        redFlags: [],
        options: [
          {
            text: "Finish and review training results.",
            nextNode: null,
            isSafe: true
          }
        ]
      }
    }
  }
]

export default function Simulator() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [currentNodeId, setCurrentNodeId] = useState<string>('')
  const [history, setHistory] = useState<{ sender: 'scammer' | 'user' | 'system'; text: string }[]>([])
  const [vulnerabilitiesCount, setVulnerabilitiesCount] = useState(0)
  const [currentNode, setCurrentNode] = useState<DialogueNode | null>(null)
  const [isFinished, setIsFinished] = useState(false)

  const handleStartScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario)
    setCurrentNodeId(scenario.initialNode)
    const node = scenario.nodes[scenario.initialNode]
    setCurrentNode(node)
    setHistory([
      { sender: 'system', text: `Scenario Started: ${scenario.title}` },
      { sender: 'scammer', text: node.scammerText }
    ])
    setVulnerabilitiesCount(0)
    setIsFinished(false)
  }

  const handleOptionSelect = (option: DialogueOption) => {
    if (!selectedScenario || !currentNode) return

    // Add user response to history
    const nextHistory = [...history, { sender: 'user' as const, text: option.text }]

    if (!option.isSafe) {
      setVulnerabilitiesCount(prev => prev + 1)
    }

    if (option.outcomeMessage) {
      nextHistory.push({ sender: 'system' as const, text: option.outcomeMessage })
    }

    if (option.nextNode === null) {
      setHistory(nextHistory)
      setIsFinished(true)
      setCurrentNode(null)
      return
    }

    const nextNode = selectedScenario.nodes[option.nextNode]
    nextHistory.push({ sender: 'scammer' as const, text: nextNode.scammerText })

    setHistory(nextHistory)
    setCurrentNodeId(option.nextNode)
    setCurrentNode(nextNode)
  }

  const handleExit = () => {
    setSelectedScenario(null)
    setCurrentNode(null)
    setHistory([])
    setIsFinished(false)
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center gap-4">
        {selectedScenario && (
          <button onClick={handleExit} className="p-2 bg-dark-900 border border-dark-800 hover:border-cyber-500/40 rounded-lg text-dark-300 transition-colors">
            <ArrowLeft size={16} />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Scammer Simulator</h1>
          <p className="text-dark-400 text-sm mt-1">Practice responding to phishing and social engineering attacks safely.</p>
        </div>
      </div>

      {!selectedScenario ? (
        // Scenario Selection Cards
        <div className="grid md:grid-cols-2 gap-6">
          {SCENARIOS.map(sc => {
            const Icon = sc.icon
            const diffColors: Record<string, string> = {
              Easy: 'text-green-700 bg-green-500/10 border-green-500/20',
              Medium: 'text-amber-700 bg-amber-500/10 border-amber-500/20',
              Hard: 'text-red-700 bg-red-500/10 border-red-500/20'
            }
            return (
              <motion.div
                key={sc.id}
                whileHover={{ y: -4 }}
                className="bg-dark-900 border border-dark-800 rounded-2xl p-6 flex flex-col justify-between hover:border-cyber-500/30 transition-all duration-200"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-cyber-500/10 border border-cyber-500/20 flex items-center justify-center text-cyber-400">
                      <Icon size={24} />
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${diffColors[sc.difficulty]}`}>
                      {sc.difficulty}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-dark-100">{sc.title}</h3>
                    <p className="text-sm text-dark-400 leading-normal">{sc.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleStartScenario(sc)}
                  className="mt-6 flex items-center justify-center gap-2 bg-cyber-500 hover:bg-cyber-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors w-full"
                >
                  <Play size={14} fill="currentColor" /> Start Scenario
                </button>
              </motion.div>
            )
          })}
        </div>
      ) : (
        // Simulator Interface
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Chat Window (Left) */}
          <div className="lg:col-span-7 bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden flex flex-col h-[520px] shadow-lg relative">
            {/* Chat header */}
            <div className="p-4 border-b border-dark-800 flex items-center gap-3 bg-dark-950/40">
              <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold">
                !
              </div>
              <div>
                <p className="text-sm font-bold text-dark-100 flex items-center gap-1.5">
                  Suspicious Caller
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </p>
                <p className="text-[10px] text-dark-500 font-mono">active threat simulation</p>
              </div>
            </div>

            {/* Chat history */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-sm">
              {history.map((msg, i) => {
                if (msg.sender === 'system') {
                  const isSuccess = msg.text.includes('EXCELLENT') || msg.text.includes('SUCCESS') || msg.text.includes('MITIGATED')
                  return (
                    <div key={i} className="flex justify-center">
                      <div className={`text-xs px-3.5 py-2 rounded-lg border max-w-lg ${
                        isSuccess ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  )
                }

                const isScammer = msg.sender === 'scammer'
                return (
                  <div key={i} className={`flex ${isScammer ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 border leading-relaxed ${
                      isScammer
                        ? 'bg-dark-950/70 border-dark-800 text-dark-100 rounded-tl-none'
                        : 'bg-cyber-500/15 border-cyber-500/25 text-cyber-700 rounded-tr-none'
                    }`}>
                      <p className="text-xs text-dark-500 font-bold mb-1">
                        {isScammer ? 'Scammer' : 'You'}
                      </p>
                      {msg.text}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Dialogue response options */}
            <div className="p-4 border-t border-dark-800 bg-dark-950/40 min-h-[120px] flex items-center justify-center">
              {currentNode ? (
                <div className="w-full grid gap-3">
                  {currentNode.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleOptionSelect(opt)}
                      className="w-full text-left bg-dark-800 border border-dark-700 hover:border-cyber-500/40 hover:bg-dark-800/80 rounded-xl px-4 py-3 text-xs font-semibold text-dark-200 transition-all duration-200 flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-dark-700 text-dark-400 font-mono text-[10px] flex items-center justify-center shrink-0 border border-dark-600">
                        {i + 1}
                      </span>
                      <span className="leading-normal">{opt.text}</span>
                    </button>
                  ))}
                </div>
              ) : isFinished ? (
                <div className="text-center space-y-4">
                  <div className="flex justify-center text-cyber-400">
                    {vulnerabilitiesCount === 0 ? (
                      <CheckCircle2 size={40} className="text-green-400" />
                    ) : (
                      <XCircle size={40} className="text-red-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-dark-100">Scenario Evaluation Complete</h4>
                    <p className="text-xs text-dark-400 mt-1">
                      {vulnerabilitiesCount === 0
                        ? "Perfect! You successfully detected all threat triggers and avoided falling for the scam."
                        : `Vulnerable! You fell for ${vulnerabilitiesCount} deception trigger(s) during this scenario.`}
                    </p>
                  </div>
                  <button
                    onClick={handleExit}
                    className="bg-cyber-500 hover:bg-cyber-400 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors inline-block"
                  >
                    Select Another Scenario
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Analysis Console (Right) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Analyst Advice */}
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-cyber-500" />
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert size={18} className="text-cyber-400 animate-pulse" />
                <h3 className="font-bold text-dark-100">Threat Analysis Console</h3>
              </div>

              {currentNode ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-cyber-400 tracking-wider font-mono">Deception Method</span>
                    <p className="text-sm text-dark-200 mt-1.5 leading-relaxed">{currentNode.explanation}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider font-mono">Detected Red Flags</span>
                    <ul className="mt-2.5 space-y-2">
                      {currentNode.redFlags.map((flag, idx) => (
                        <li key={idx} className="flex gap-2 text-xs text-dark-400 leading-normal">
                          <AlertTriangle size={13} className="text-orange-400 shrink-0 mt-0.5" />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Info size={28} className="text-dark-600 mx-auto mb-3" />
                  <p className="text-sm text-dark-400">Select options on the chat terminal to begin dynamic threat intelligence analysis.</p>
                </div>
              )}
            </div>

            {/* Scorecard panel */}
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-dark-100">Compliance & Vulnerability</h4>
                <p className="text-xs text-dark-400 mt-0.5">Tracking mistakes in real-time</p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-black ${vulnerabilitiesCount === 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {vulnerabilitiesCount}
                </div>
                <div className="text-[9px] text-dark-500 font-mono uppercase font-bold mt-0.5">Vulnerabilities</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
