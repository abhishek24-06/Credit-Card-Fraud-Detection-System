import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ScanSearch,
  Upload,
  History,
  Shield,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import Dashboard from './components/Dashboard'
import TransactionForm from './components/TransactionForm'
import BatchUpload from './components/BatchUpload'
import RecentTransactions from './components/RecentTransactions'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analyze', label: 'Analyze Transaction', icon: ScanSearch },
  { id: 'batch', label: 'Batch Upload', icon: Upload },
  { id: 'history', label: 'History', icon: History },
]

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const colors = {
    error: 'bg-red-500/90 border-red-400',
    success: 'bg-green-500/90 border-green-400',
    info: 'bg-blue-500/90 border-blue-400',
  }

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className={`toast flex items-center gap-3 px-4 py-3 rounded-lg border ${colors[type]} text-white shadow-xl`}
    >
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="hover:opacity-70 transition-opacity">
        <X size={16} />
      </button>
    </motion.div>
  )
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [isConnected, setIsConnected] = useState(false)
  const [toasts, setToasts] = useState([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get(`${API_URL}/health`)
        setIsConnected(true)
      } catch {
        setIsConnected(false)
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 15000)
    return () => clearInterval(interval)
  }, [])

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard apiUrl={API_URL} addToast={addToast} />
      case 'analyze':
        return <TransactionForm apiUrl={API_URL} addToast={addToast} />
      case 'batch':
        return <BatchUpload apiUrl={API_URL} addToast={addToast} />
      case 'history':
        return <RecentTransactions apiUrl={API_URL} addToast={addToast} />
      default:
        return <Dashboard apiUrl={API_URL} addToast={addToast} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-navy-900">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="h-full flex flex-col border-r border-navy-700/50 bg-navy-900/95 backdrop-blur-xl z-20 flex-shrink-0"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-navy-700/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
            <Shield size={22} className="text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
                  FraudGuard AI
                </h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                  Fraud Detection
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800/50 border border-transparent'
                }`}
              >
                <Icon
                  size={20}
                  className={`flex-shrink-0 ${
                    isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="px-3 pb-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-navy-800/50 transition-all text-xs"
          >
            {sidebarCollapsed ? '→' : '← Collapse'}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-navy-700/50 bg-navy-900/80 backdrop-blur-xl flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">
              {NAV_ITEMS.find((n) => n.id === activePage)?.label || 'Dashboard'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time fraud detection powered by Random Forest ML model
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                isConnected
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isConnected ? 'API Connected' : 'API Offline'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
