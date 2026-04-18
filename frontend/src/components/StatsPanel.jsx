import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, AlertTriangle, ShieldCheck, Activity } from 'lucide-react'
import axios from 'axios'

const STATS_CONFIG = [
  {
    key: 'total_analyzed',
    label: 'Total Analyzed',
    icon: TrendingUp,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
  },
  {
    key: 'fraud_detected',
    label: 'Fraudulent',
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/15',
  },
  {
    key: 'legit_count',
    label: 'Legitimate',
    icon: ShieldCheck,
    color: 'text-green-400',
    bg: 'bg-green-500/15',
  },
  {
    key: 'fraud_rate',
    label: 'Fraud Rate',
    icon: Activity,
    color: 'text-orange-400',
    bg: 'bg-orange-500/15',
    suffix: '%',
  },
]

export default function StatsPanel({ apiUrl, addToast }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/stats`)
        setStats(data)
      } catch {
        addToast('Failed to refresh stats', 'error')
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [apiUrl])

  if (!stats) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {STATS_CONFIG.map((cfg, i) => {
        const Icon = cfg.icon
        return (
          <motion.div
            key={cfg.key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4 flex items-center gap-3"
          >
            <div className={`p-2 rounded-lg ${cfg.bg}`}>
              <Icon size={18} className={cfg.color} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{cfg.label}</p>
              <p className={`text-lg font-bold ${cfg.color}`}>
                {cfg.suffix === '%'
                  ? `${stats[cfg.key]?.toFixed(2) || '0.00'}%`
                  : stats[cfg.key]?.toLocaleString() || '0'}
              </p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
