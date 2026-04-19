import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ShieldCheck, RotateCcw } from 'lucide-react'

function CircularGauge({ probability, isFraud }) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const percentage = Math.round(probability * 100)
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference
  const color = isFraud ? '#ef4444' : '#22c55e'
  const bgColor = isFraud ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)'

  useEffect(() => {
    let start = 0
    const end = percentage
    const duration = 1200
    const stepTime = 16
    const steps = Math.ceil(duration / stepTime)
    const increment = (end - start) / steps
    let current = start
    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        setAnimatedValue(end)
        clearInterval(timer)
      } else {
        setAnimatedValue(Math.round(current))
      }
    }, stepTime)
    return () => clearInterval(timer)
  }, [percentage])

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="200" height="200" className="circular-progress">
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth="10"
        />
        {/* Progress circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color }}>
          {animatedValue}%
        </span>
        <span className="text-xs text-slate-400 mt-1">Fraud Probability</span>
      </div>
    </div>
  )
}

export default function ResultCard({ result, onReset }) {
  const isFraud = result.is_fraud
  const borderClass = isFraud ? 'fraud-pulse border-red-500/60' : 'legit-glow border-green-500/60'
  const bgGradient = isFraud
    ? 'from-red-500/10 via-transparent to-transparent'
    : 'from-green-500/10 via-transparent to-transparent'

  const riskColors = {
    HIGH: 'bg-red-500/20 text-red-400 border-red-500/30',
    MEDIUM: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    LOW: 'bg-green-500/20 text-green-400 border-green-500/30',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 30 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className={`glass-card border-2 ${borderClass} bg-gradient-to-b ${bgGradient} p-8`}
      id="result-card"
    >
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Gauge */}
        <div className="flex-shrink-0">
          <CircularGauge probability={result.fraud_probability} isFraud={isFraud} />
        </div>

        {/* Info */}
        <div className="flex-1 text-center lg:text-left space-y-4">
          {/* Status Header */}
          <div className="flex items-center justify-center lg:justify-start gap-3">
            {isFraud ? (
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <AlertTriangle size={36} className="text-red-400" />
              </motion.div>
            ) : (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <ShieldCheck size={36} className="text-green-400" />
              </motion.div>
            )}
            <div>
              <h2
                className={`text-2xl font-extrabold ${
                  isFraud ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {isFraud ? '⚠️ FRAUD DETECTED' : '✅ LEGITIMATE TRANSACTION'}
              </h2>
              <p className="text-sm text-slate-400">
                {isFraud
                  ? 'This transaction shows patterns consistent with fraudulent activity'
                  : 'This transaction appears to be normal and legitimate'}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="glass-card p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Probability</p>
              <p className="text-lg font-bold text-slate-200 font-mono">
                {(result.fraud_probability * 100).toFixed(2)}%
              </p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Risk Level</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${
                  riskColors[result.risk_level]
                }`}
              >
                {result.risk_level}
              </span>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Threshold</p>
              <p className="text-lg font-bold text-slate-200 font-mono">
                {result.threshold_used}
              </p>
            </div>
          </div>

          {/* Analyze Another */}
          <button
            onClick={onReset}
            className="flex items-center gap-2 mx-auto lg:mx-0 px-6 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 hover:text-white transition-all"
          >
            <RotateCcw size={16} />
            Analyze Another Transaction
          </button>
        </div>
      </div>
    </motion.div>
  )
}
