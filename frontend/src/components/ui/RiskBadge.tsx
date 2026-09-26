export function RiskBadge({ level, score }: { level: string; score?: number }) {
  const map: Record<string, string> = {
    Safe:     'bg-green-500/15 text-green-700 border-green-500/30',
    Medium:   'bg-amber-500/15 text-amber-700 border-amber-500/30',
    High:     'bg-orange-500/15 text-orange-700 border-orange-500/30',
    Critical: 'bg-red-500/15 text-red-700 border-red-500/30',
  }
  const cls = map[level] || 'bg-dark-700 text-dark-400 border-dark-600'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {level}{score !== undefined ? ` (${score})` : ''}
    </span>
  )
}

export function RiskGauge({ score }: { score: number }) {
  const level = score <= 20 ? 'Safe' : score <= 55 ? 'Medium' : score <= 80 ? 'High' : 'Critical'
  const colors: Record<string, string> = {
    Safe: '#22c55e', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444'
  }
  const pct = (score / 100) * 100
  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15.9155" fill="none"
          stroke={colors[level]} strokeWidth="3"
          strokeDasharray={`${pct} ${100 - pct}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black" style={{ color: colors[level] }}>{score}</span>
        <span className="text-xs text-dark-400">/100</span>
      </div>
    </div>
  )
}
