import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Zap, RotateCcw, ScanSearch, Loader2 } from 'lucide-react'
import axios from 'axios'
import ResultCard from './ResultCard'

const FRAUD_SAMPLE = {
  Time: 0,
  V1: -1.3598,
  V2: -0.0728,
  V3: 2.5363,
  V4: 1.3782,
  V5: -0.3383,
  V6: 0.4624,
  V7: 0.2396,
  V8: 0.0987,
  V9: 0.3638,
  V10: 0.0908,
  V11: -0.5517,
  V12: -0.6178,
  V13: -0.9914,
  V14: -0.3112,
  V15: 1.4682,
  V16: -0.4704,
  V17: 0.2080,
  V18: 0.0258,
  V19: 0.4040,
  V20: 0.2514,
  V21: -0.0183,
  V22: 0.2778,
  V23: -0.1105,
  V24: 0.0669,
  V25: 0.1285,
  V26: -0.1891,
  V27: 0.1336,
  V28: -0.0211,
  Amount: 149.62,
}

const LEGIT_SAMPLE = {
  Time: 406,
  V1: -2.3122,
  V2: 1.9520,
  V3: -1.6099,
  V4: 3.9979,
  V5: -0.5223,
  V6: -1.4265,
  V7: -2.5372,
  V8: 1.3916,
  V9: -2.7701,
  V10: -2.7723,
  V11: 3.2020,
  V12: -2.8991,
  V13: -0.5953,
  V14: -4.2894,
  V15: 0.3896,
  V16: -1.1408,
  V17: -2.8300,
  V18: -0.0168,
  V19: 0.4163,
  V20: 0.1260,
  V21: 0.5170,
  V22: -0.0354,
  V23: -0.4652,
  V24: 0.3200,
  V25: 0.0445,
  V26: 0.1780,
  V27: 0.2617,
  V28: -0.1432,
  Amount: 2.69,
}

const EMPTY_FORM = {
  Time: '',
  ...Object.fromEntries(Array.from({ length: 28 }, (_, i) => [`V${i + 1}`, ''])),
  Amount: '',
}

const SECTIONS = [
  {
    title: 'Transaction Info',
    fields: ['Time', 'Amount'],
    description: 'Basic transaction metadata',
  },
  {
    title: 'PCA Features V1–V14',
    fields: Array.from({ length: 14 }, (_, i) => `V${i + 1}`),
    description: 'Principal component features (first half)',
  },
  {
    title: 'PCA Features V15–V28',
    fields: Array.from({ length: 14 }, (_, i) => `V${i + 15}`),
    description: 'Principal component features (second half)',
  },
]

export default function TransactionForm({ apiUrl, addToast }) {
  const [formData, setFormData] = useState({ ...EMPTY_FORM })
  const [threshold, setThreshold] = useState(0.5)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    'Transaction Info': true,
    'PCA Features V1–V14': true,
    'PCA Features V15–V28': false,
  })

  const toggleSection = (title) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const fillSample = (sample) => {
    const filled = {}
    for (const key of Object.keys(EMPTY_FORM)) {
      filled[key] = sample[key] !== undefined ? sample[key].toString() : ''
    }
    setFormData(filled)
    setResult(null)
    // Expand all sections to show filled data
    setExpandedSections({
      'Transaction Info': true,
      'PCA Features V1–V14': true,
      'PCA Features V15–V28': true,
    })
    addToast('Sample data loaded', 'info')
  }

  const handleReset = () => {
    setFormData({ ...EMPTY_FORM })
    setResult(null)
    setThreshold(0.5)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate all fields are filled
    const emptyFields = Object.entries(formData).filter(([, v]) => v === '' || v === null || v === undefined)
    if (emptyFields.length > 0) {
      addToast(`Please fill all fields. Missing: ${emptyFields.map(([k]) => k).join(', ')}`, 'error')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const payload = {}
      for (const [key, value] of Object.entries(formData)) {
        payload[key] = parseFloat(value)
      }
      payload.threshold = threshold

      const { data } = await axios.post(`${apiUrl}/predict`, payload)
      setResult(data)
      addToast(
        data.is_fraud ? '⚠️ Fraud detected!' : '✅ Transaction looks legitimate',
        data.is_fraud ? 'error' : 'success'
      )
    } catch (err) {
      addToast(
        err.response?.data?.detail || 'Failed to analyze transaction. Is the API running?',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Quick Demo Buttons */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-300">Quick Demo</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Load sample data to test the model instantly
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fillSample(FRAUD_SAMPLE)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all"
            >
              <AlertTriangleIcon />
              Fraud Sample
            </button>
            <button
              onClick={() => fillSample(LEGIT_SAMPLE)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-all"
            >
              <ShieldIcon />
              Legit Sample
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-800 border border-navy-700 text-slate-400 text-sm font-medium hover:text-slate-200 hover:bg-navy-700 transition-all"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Collapsible Sections */}
        {SECTIONS.map((section, sIdx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.1 }}
            className="glass-card overflow-hidden"
          >
            {/* Section Header */}
            <button
              type="button"
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center justify-between p-5 hover:bg-navy-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <span className="text-blue-400 text-xs font-bold">
                    {sIdx + 1}
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-slate-200">
                    {section.title}
                  </h3>
                  <p className="text-xs text-slate-500">{section.description}</p>
                </div>
              </div>
              {expandedSections[section.title] ? (
                <ChevronUp size={18} className="text-slate-400" />
              ) : (
                <ChevronDown size={18} className="text-slate-400" />
              )}
            </button>

            {/* Section Content */}
            <AnimatePresence>
              {expandedSections[section.title] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-1">
                    <div
                      className={`grid gap-3 ${
                        section.fields.length <= 2
                          ? 'grid-cols-1 sm:grid-cols-2'
                          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7'
                      }`}
                    >
                      {section.fields.map((field) => (
                        <div key={field} className="space-y-1">
                          <label className="text-xs font-medium text-slate-400 block">
                            {field}
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={formData[field]}
                            onChange={(e) => handleChange(field, e.target.value)}
                            placeholder="0.0"
                            className="input-field text-xs"
                            id={`input-${field}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Threshold Slider */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Decision Threshold
              </h3>
              <p className="text-xs text-slate-500">
                Adjust the sensitivity of fraud detection
              </p>
            </div>
            <span className="text-2xl font-bold text-blue-400 font-mono">
              {threshold.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-green-400 font-medium">Sensitive</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-navy-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-blue-500
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:shadow-blue-500/30
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-all
                [&::-webkit-slider-thumb]:hover:scale-110"
              id="threshold-slider"
            />
            <span className="text-xs text-red-400 font-medium">Strict</span>
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            type="submit"
            disabled={loading}
            className="btn-gradient w-full flex items-center justify-center gap-3 text-lg py-4"
            id="analyze-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <ScanSearch size={22} />
                Analyze Transaction
              </>
            )}
          </button>
        </motion.div>
      </form>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <ResultCard result={result} onReset={handleReset} />
        )}
      </AnimatePresence>
    </div>
  )
}

function AlertTriangleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
