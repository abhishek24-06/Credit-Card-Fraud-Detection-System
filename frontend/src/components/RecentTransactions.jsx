import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, AlertTriangle, ShieldCheck, Clock } from 'lucide-react'
import axios from 'axios'

export default function RecentTransactions({ apiUrl, addToast }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = async (showLoading = false) => {
    if (showLoading) setRefreshing(true)
    try {
      const { data } = await axios.get(`${apiUrl}/stats`)
      setStats(data)
    } catch {
      addToast('Failed to fetch transaction history', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(() => fetchStats(), 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-200">Transaction History</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing last 10 analyzed transactions • Auto-refreshes every 30s
          </p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-all disabled:opacity-50"
          id="refresh-history-btn"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </motion.div>

      {/* Stats Bar */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">Total Analyzed</p>
            <p className="text-xl font-bold text-violet-400">{stats.total_analyzed}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">Fraud Detected</p>
            <p className="text-xl font-bold text-red-400">{stats.fraud_detected}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">Legitimate</p>
            <p className="text-xl font-bold text-green-400">{stats.legit_count}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">Fraud Rate</p>
            <p className="text-xl font-bold text-orange-400">{stats.fraud_rate}%</p>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        ) : stats?.recent?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">
                    Probability
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">
                    Risk Level
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">
                    Threshold
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((tx, i) => (
                  <motion.tr
                    key={tx.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`border-b border-slate-700/30 transition-colors hover:bg-slate-800/30 ${
                      tx.is_fraud ? 'bg-red-500/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-300 font-mono">#{tx.id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(tx.fraud_probability || 0) * 100}%` }}
                            transition={{ delay: i * 0.05 + 0.2, duration: 0.5 }}
                            className="h-full rounded-full"
                            style={{
                              backgroundColor:
                                tx.fraud_probability > 0.7
                                  ? '#ef4444'
                                  : tx.fraud_probability > 0.3
                                  ? '#f97316'
                                  : '#22c55e',
                            }}
                          />
                        </div>
                        <span className="text-slate-300 font-mono text-xs">
                          {((tx.fraud_probability || 0) * 100).toFixed(2)}%
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
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                      {tx.threshold_used}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`flex items-center gap-1.5 text-xs font-bold ${
                          tx.is_fraud ? 'text-red-400' : 'text-green-400'
                        }`}
                      >
                        {tx.is_fraud ? (
                          <>
                            <AlertTriangle size={14} />
                            FRAUD
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={14} />
                            LEGIT
                          </>
                        )}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center">
              <Clock size={28} className="text-slate-500" />
            </div>
            <p className="text-slate-400 font-medium">No transactions yet</p>
            <p className="text-sm text-slate-500">
              Start by analyzing a transaction or uploading a batch CSV
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
