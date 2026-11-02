/**
 * Toast.jsx — Toast notification system
 * Usage: const { toast } = useToast()
 *        toast.success('Done!') | toast.error('Failed') | toast.info(...) | toast.warn(...)
 */
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: <CheckCircle size={16} className="text-ts-green shrink-0" />,
  error:   <XCircle    size={16} className="text-ts-red shrink-0"   />,
  warning: <AlertTriangle size={16} className="text-ts-amber shrink-0" />,
  info:    <Info       size={16} className="text-ts-cyan shrink-0"  />,
}

const BORDER = {
  success: 'border-l-ts-green',
  error:   'border-l-ts-red',
  warning: 'border-l-ts-amber',
  info:    'border-l-ts-cyan',
}

let _id = 0

// ── Individual Toast ──────────────────────────────────────────────────────
function ToastItem({ id, type = 'info', message, onClose }) {
  const [visible, setVisible] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true))
    timer.current = setTimeout(() => handleClose(), 4_500)
    return () => clearTimeout(timer.current)
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(() => onClose(id), 300)
  }

  return (
    <div
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-ts',
        'bg-ts-elevated border border-ts-border border-l-2',
        BORDER[type],
        'shadow-ts-modal min-w-[280px] max-w-[360px]',
        'transition-all duration-300',
        visible
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-4',
      ].join(' ')}
    >
      {ICONS[type]}
      <p className="flex-1 text-sm2 text-ts-secondary leading-snug font-sora">{message}</p>
      <button
        onClick={handleClose}
        className="text-ts-muted hover:text-ts-text transition-colors mt-0.5 shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ── Provider ───────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((type, message) => {
    const id = ++_id
    setToasts(prev => [...prev, { id, type, message }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    success: (msg) => addToast('success', msg),
    error:   (msg) => addToast('error',   msg),
    warning: (msg) => addToast('warning', msg),
    info:    (msg) => addToast('info',    msg),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container — top-right */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onClose={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
