/**
 * FingerprintDetailPanel.jsx — Expandable forensic fingerprint per paper version
 * Shows question-level fingerprints: variant, option_order, features
 */
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

function FeatureItem({ label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="font-mono text-ts-muted shrink-0" style={{ fontSize: 10, letterSpacing: '0.06em', width: 80, marginTop: 2 }}>
        {label}
      </span>
      <span className="font-mono text-ts-code" style={{ fontSize: 11, wordBreak: 'break-all' }}>
        {typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}
      </span>
    </div>
  )
}

function FingerprintRow({ fp, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid #1A1A1A' }}>
      {/* Row header */}
      <div
        className="flex items-center gap-4 px-4 py-2.5 cursor-pointer hover:bg-ts-elevated transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        {open ? <ChevronDown size={12} className="text-ts-muted shrink-0" /> : <ChevronRight size={12} className="text-ts-muted shrink-0" />}
        <span className="font-mono text-ts-muted" style={{ fontSize: 11, minWidth: 24 }}>
          Q{fp.question_order}
        </span>
        <span className="font-mono text-ts-code flex-1 truncate" style={{ fontSize: 11 }}>
          {fp.question_code}
        </span>
        <span
          className="font-mono shrink-0 px-2 py-0.5 rounded"
          style={{ fontSize: 10, color: '#00D4FF', background: '#003D4D', border: '1px solid #00D4FF22' }}
        >
          {fp.variant_id}
        </span>
        <span className="font-mono text-ts-muted shrink-0" style={{ fontSize: 10 }}>
          {fp.marks}m · {fp.difficulty}
        </span>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="px-10 pb-3 space-y-2" style={{ background: '#050505' }}>
          <FeatureItem label="VARIANT TXT" value={fp.variant_text} />
          <FeatureItem label="OPTION MAP"  value={fp.option_order} />
          <FeatureItem label="FEATURES"    value={fp.distinguishing_features} />
        </div>
      )}
    </div>
  )
}

export default function FingerprintDetailPanel({ fingerprint }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="rounded-ts overflow-hidden"
      style={{ border: '1px solid #222' }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-ts-elevated transition-colors"
        style={{ background: '#0A0A0A' }}
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-4">
          <span
            className="font-mono font-medium"
            style={{ fontSize: 14, color: '#00D4FF' }}
          >
            {fingerprint.version_code}
          </span>
          <span className="font-sora text-ts-muted" style={{ fontSize: 13 }}>
            {fingerprint.centre_name} ({fingerprint.centre_code})
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="font-mono text-ts-muted" style={{ fontSize: 11 }}>
            {fingerprint.total_questions} fingerprints
          </span>
          {open ? <ChevronDown size={14} className="text-ts-muted" /> : <ChevronRight size={14} className="text-ts-muted" />}
        </div>
      </div>

      {/* Fingerprint rows */}
      {open && (
        <div style={{ borderTop: '1px solid #1A1A1A' }}>
          {fingerprint.fingerprints?.length > 0 ? (
            fingerprint.fingerprints.map((fp, i) => (
              <FingerprintRow key={fp.question_id || i} fp={fp} index={i} />
            ))
          ) : (
            <p className="font-mono text-ts-muted px-5 py-4" style={{ fontSize: 12 }}>
              No fingerprint data available.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
