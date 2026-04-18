import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Activity,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import axios from 'axios'
import StatsPanel from './StatsPanel'

const STAT_CARDS = [
  {
    key: 'total_analyzed',
    label: 'Total Analyzed',
    icon: TrendingUp,
    color: 'blue',
    gradient: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    iconBg: 'bg-blue-500/15',
  },
  {
    key: 'fraud_detected',
    label: 'Fraud Detected',
    icon: AlertTriangle,
    color: 'red',
    gradient: 'from-red-500/20 to-red-600/5',
    border: 'border-red-500/20',
    text: 'text-red-400',
    iconBg: 'bg-red-500/15',
  },
  {
    key: 'legit_count',
    label: 'Legitimate',
    icon: ShieldCheck,
    color: 'green',
    gradient: 'from-green-500/20 to-green-600/5',
    border: 'border-green-500/20',
    text: 'text-green-400',
    iconBg: 'bg-green-500/15',
  },
  {
    key: 'fraud_rate',
    label: 'Fraud Rate',
    icon: Activity,
    color: 'orange',
    gradient: 'from-orange-500/20 to-orange-600/5',
    border: 'border-orange-500/20',
    text: 'text-orange-400',
    iconBg: 'bg-orange-500/15',
    suffix: '%',
  },
]

const PIE_COLORS = ['#22c55e', '#ef4444']

function AnimatedCounter({ value, suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let start = 0
    const end = parseFloat(value) || 0
    if (start === end) {
      setDisplayValue(end)
      return
    }
    const duration = 1000
    const stepTime = 16
    const steps = Math.ceil(duration / stepTime)
    const increment = (end - start) / steps
    let current = start
    const timer = setInterval(() => {
      current += increment
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        setDisplayValue(end)
        clearInterval(timer)
      } else {
        setDisplayValue(current)
      }
    }, stepTime)
    return () => clearInterval(timer)
  }, [value])

  const formatted = suffix === '%'
    ? displayValue.toFixed(2)
    : Math.round(displayValue).toLocaleString()

  return <span>{formatted}{suffix}</span>
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="text-slate-300 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard({ apiUrl, addToast }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/stats`)
      setStats(data)
    } catch {
      addToast('Failed to fetch dashboard stats', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const pieData = stats
    ? [
        { name: 'Legitimate', value: stats.legit_count || 0 },
        { name: 'Fraud', value: stats.fraud_detected || 0 },
      ]
    : []

  const riskData = stats?.recent
    ? (() => {
        const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 }
        stats.recent.forEach((t) => {
          if (counts[t.risk_level] !== undefined) counts[t.risk_level]++
        })
        return [
          { name: 'HIGH', count: counts.HIGH, fill: '#ef4444' },
          { name: 'MEDIUM', count: counts.MEDIUM, fill: '#f97316' },
          { name: 'LOW', count: counts.LOW, fill: '#22c55e' },
        ]
      })()
    : []

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card p-5 bg-gradient-to-br ${card.gradient} ${card.border}`}
            >
              {loading ? (
                <div className="space-y-3">
                  <div className="skeleton h-4 w-24" />
                  <div className="skeleton h-8 w-16" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {card.label}
                    </span>
                    <div className={`p-2 rounded-lg ${card.iconBg}`}>
                      <Icon size={18} className={card.text} />
                    </div>
                  </div>
                  <p className={`text-3xl font-bold ${card.text}`}>
                    <AnimatedCounter
                      value={stats?.[card.key] || 0}
                      suffix={card.suffix || ''}
                    />
                  </p>
                </>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
            Transaction Distribution
          </h3>
          {loading ? (
            <div className="skeleton h-64 w-full" />
          ) : stats?.total_analyzed > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              No transactions analyzed yet. Start by analyzing a transaction.
            </div>
          )}
          {stats?.total_analyzed > 0 && (
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-slate-400">Legitimate</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-slate-400">Fraud</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
            Risk Level Distribution
          </h3>
          {loading ? (
            <div className="skeleton h-64 w-full" />
          ) : stats?.total_analyzed > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={riskData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  name="Count"
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                >
                  {riskData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              No risk data available yet.
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Transactions Table */}
      {stats?.recent?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
            Recent Transactions
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-700/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Probability</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Risk</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Result</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((tx, i) => (
                  <tr
                    key={i}
                    className={`border-b border-navy-700/30 transition-colors hover:bg-navy-800/30 ${
                      tx.is_fraud ? 'bg-red-500/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-300 font-mono">#{tx.id}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      ${tx.Amount_scaled?.toFixed(4) || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-navy-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(tx.fraud_probability || 0) * 100}%`,
                              backgroundColor: tx.fraud_probability > 0.7 ? '#ef4444' : tx.fraud_probability > 0.3 ? '#f97316' : '#22c55e',
                            }}
                          />
                        </div>
                        <span className="text-slate-400 font-mono text-xs">
                          {((tx.fraud_probability || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          tx.risk_level === 'HIGH'
                            ? 'bg-red-500/15 text-red-400'
                            : tx.risk_level === 'MEDIUM'
                            ? 'bg-orange-500/15 text-orange-400'
                            : 'bg-green-500/15 text-green-400'
                        }`}
                      >
                        {tx.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          tx.is_fraud
                            ? 'bg-red-500/15 text-red-400'
                            : 'bg-green-500/15 text-green-400'
                        }`}
                      >
                        {tx.is_fraud ? '⚠ FRAUD' : '✓ LEGIT'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}
