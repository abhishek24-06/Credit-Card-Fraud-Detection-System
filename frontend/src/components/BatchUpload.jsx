import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  Download,
  AlertTriangle,
  ShieldCheck,
  X,
  Trash2,
} from 'lucide-react'
import axios from 'axios'

export default function BatchUpload({ apiUrl, addToast }) {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile)
      setResults(null)
    } else {
      addToast('Please upload a CSV file', 'error')
    }
  }

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResults(null)
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      addToast('Please select a file first', 'error')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await axios.post(`${apiUrl}/predict/batch`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResults(data)
      addToast(`Batch analysis complete: ${data.total} transactions processed`, 'success')
    } catch (err) {
      addToast(
        err.response?.data?.detail || 'Batch analysis failed. Check your CSV format.',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    if (!results) return
    const header = 'Index,Fraud_Probability,Is_Fraud,Risk_Level,Threshold\n'
    const rows = results.results
      .map(
        (r, i) =>
          `${i + 1},${r.fraud_probability},${r.is_fraud},${r.risk_level},${r.threshold_used}`
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fraud_detection_results.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearAll = () => {
    setFile(null)
    setResults(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`drop-zone p-10 text-center cursor-pointer transition-all ${
          dragOver ? 'drag-over' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          id="batch-file-input"
        />
        <motion.div
          animate={dragOver ? { scale: 1.05 } : { scale: 1 }}
          className="space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-500/15 flex items-center justify-center">
            <Upload size={28} className="text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-200">
              Drop your CSV file here
            </p>
            <p className="text-sm text-slate-400 mt-1">
              or click to browse • CSV files with transaction data
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Required columns: Time, V1–V28, Amount (optional: threshold)
          </p>
        </motion.div>
      </motion.div>

      {/* File Preview */}
      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center">
                  <FileSpreadsheet size={22} className="text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{file.name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={clearAll}
                  className="p-2 rounded-lg hover:bg-navy-800 text-slate-400 hover:text-red-400 transition-all"
                  title="Remove file"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-gradient flex items-center gap-2 px-6 py-2.5 text-sm"
                  id="batch-analyze-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Run Batch Analysis
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card p-5 text-center">
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Total Rows</p>
                <p className="text-3xl font-bold text-blue-400">{results.total}</p>
              </div>
              <div className="glass-card p-5 text-center">
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Fraud Detected</p>
                <p className="text-3xl font-bold text-red-400">{results.fraud_count}</p>
              </div>
              <div className="glass-card p-5 text-center">
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Fraud Rate</p>
                <p className="text-3xl font-bold text-orange-400">
                  {results.total > 0
                    ? ((results.fraud_count / results.total) * 100).toFixed(2)
                    : '0.00'}
                  %
                </p>
              </div>
            </div>

            {/* Download Button */}
            <div className="flex justify-end">
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-800 border border-navy-700 text-slate-300 text-sm font-medium hover:bg-navy-700 transition-all"
                id="download-results-btn"
              >
                <Download size={16} />
                Download Results CSV
              </button>
            </div>

            {/* Results Table */}
            <div className="glass-card p-6 overflow-hidden">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
                Batch Results
              </h3>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-navy-800 z-10">
                    <tr className="border-b border-navy-700/50">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">
                        #
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">
                        Probability
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">
                        Risk
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">
                        Result
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">
                        Threshold
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.results.map((r, i) => (
                      <tr
                        key={i}
                        className={`border-b border-navy-700/30 transition-colors hover:bg-navy-800/30 ${
                          r.is_fraud ? 'bg-red-500/5' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 text-slate-400 font-mono text-xs">
                          {i + 1}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-navy-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${r.fraud_probability * 100}%`,
                                  backgroundColor:
                                    r.fraud_probability > 0.7
                                      ? '#ef4444'
                                      : r.fraud_probability > 0.3
                                      ? '#f97316'
                                      : '#22c55e',
                                }}
                              />
                            </div>
                            <span className="text-slate-300 font-mono text-xs">
                              {(r.fraud_probability * 100).toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              r.risk_level === 'HIGH'
                                ? 'bg-red-500/15 text-red-400'
                                : r.risk_level === 'MEDIUM'
                                ? 'bg-orange-500/15 text-orange-400'
                                : 'bg-green-500/15 text-green-400'
                            }`}
                          >
                            {r.risk_level}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`flex items-center gap-1.5 text-xs font-bold ${
                              r.is_fraud ? 'text-red-400' : 'text-green-400'
                            }`}
                          >
                            {r.is_fraud ? (
                              <>
                                <AlertTriangle size={12} /> FRAUD
                              </>
                            ) : (
                              <>
                                <ShieldCheck size={12} /> LEGIT
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 font-mono text-xs">
                          {r.threshold_used}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
