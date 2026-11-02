/**
 * Sidebar.jsx — Persistent left navigation sidebar
 * Width: 240px fixed, full viewport height
 */
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Upload,
  Search,
  Activity,
  ShieldAlert,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { getHealth } from '../../services/paperService'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/papers',    icon: FileText,         label: 'Paper Management' },
  { to: '/upload',    icon: Upload,           label: 'Leak Upload' },
  { to: '/results',   icon: Search,           label: 'Investigation' },
]

export default function Sidebar() {
  const location = useLocation()
  const [health, setHealth] = useState(null) // null = loading, true = online, false = offline

  useEffect(() => {
    let cancelled = false
    getHealth()
      .then(() => { if (!cancelled) setHealth(true) })
      .catch(() => { if (!cancelled) setHealth(false) })
    const interval = setInterval(() => {
      getHealth()
        .then(() => { if (!cancelled) setHealth(true) })
        .catch(() => { if (!cancelled) setHealth(false) })
    }, 30_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return (
    <aside
      className="flex flex-col shrink-0 h-screen bg-ts-base"
      style={{ width: 240, borderRight: '1px solid #1A1A1A' }}
    >
      {/* ── Brand ─────────────────────────────────────────────────────── */}
      <div className="px-6 py-5" style={{ borderBottom: '1px solid #1A1A1A' }}>
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div
            className="flex items-center justify-center shrink-0 font-mono text-ts-cyan font-medium"
            style={{
              width: 34, height: 34,
              background: '#003D4D',
              border: '1px solid #00D4FF33',
              borderRadius: 4,
              fontSize: 13,
              letterSpacing: '0.02em',
            }}
          >
            TS
          </div>
          <div>
            <p className="font-sora font-semibold text-ts-text" style={{ fontSize: 15, lineHeight: 1.2 }}>
              TraceSet
            </p>
            <p className="font-mono text-ts-muted uppercase tracking-widest" style={{ fontSize: 9 }}>
              Forensic Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <p className="ts-label px-6 mb-3">Navigation</p>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={[
                'relative flex items-center gap-3 px-6 py-2.5 text-sm2 font-sora font-medium',
                'transition-all duration-200',
                isActive
                  ? 'text-ts-text nav-active'
                  : 'text-ts-muted hover:text-ts-secondary hover:bg-ts-elevated',
              ].join(' ')}
              style={isActive ? { background: '#0D1F26' } : {}}
            >
              <Icon
                size={16}
                className={isActive ? 'text-ts-cyan' : 'text-ts-muted'}
                strokeWidth={isActive ? 2 : 1.5}
              />
              {label}
              {isActive && (
                <span
                  className="absolute left-0 top-0 bottom-0 rounded-r"
                  style={{ width: 2, background: '#00D4FF' }}
                />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* ── System Status ─────────────────────────────────────────────── */}
      <div className="px-6 py-5" style={{ borderTop: '1px solid #1A1A1A' }}>
        <p className="ts-label mb-3">Backend Status</p>
        <div className="flex items-center gap-2.5">
          <span
            className="shrink-0 rounded-full"
            style={{
              width: 7, height: 7,
              background: health === null ? '#555' : health ? '#30A46C' : '#E5484D',
              animation: health === true ? 'pulseDot 1.4s ease-in-out infinite' : 'none',
            }}
          />
          <span className="font-mono text-ts-code" style={{ fontSize: 11 }}>
            {health === null && 'Checking…'}
            {health === true  && 'API Online · :8000'}
            {health === false && 'API Offline'}
          </span>
        </div>

        {/* Build info */}
        <p className="font-mono text-ts-muted mt-3" style={{ fontSize: 10 }}>
          TraceSet v1.0.0 · Core Engine
        </p>
      </div>
    </aside>
  )
}
