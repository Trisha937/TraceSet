/**
 * UncertaintyWarning.jsx — Forensic abstention / ambiguity banner
 * Shown when status is insufficient_evidence or multiple_candidates
 */
import { AlertTriangle } from 'lucide-react'

export default function UncertaintyWarning({ explanation, warnings = [] }) {
  return (
    <div
      className="flex gap-4 px-5 py-4 rounded-ts mb-6"
      style={{
        background: '#1A0F00',
        border: '1px solid #F5A62333',
        borderLeft: '3px solid #F5A623',
      }}
    >
      <AlertTriangle
        size={18}
        className="text-ts-amber shrink-0 mt-0.5"
        strokeWidth={1.5}
      />
      <div className="flex-1 min-w-0">
        <p className="font-sora font-semibold text-ts-amber" style={{ fontSize: 13 }}>
          Insufficient Evidence — Source Cannot Be Reliably Identified
        </p>
        {explanation && (
          <p className="font-sora text-ts-secondary mt-1.5 leading-relaxed" style={{ fontSize: 13 }}>
            {explanation}
          </p>
        )}
        {warnings.length > 0 && (
          <ul className="mt-2 space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="font-mono text-ts-muted" style={{ fontSize: 11 }}>
                · {w}
              </li>
            ))}
          </ul>
        )}
        <p className="font-mono text-ts-muted mt-2" style={{ fontSize: 10, letterSpacing: '0.04em' }}>
          FORENSIC PRINCIPLE: TraceSet abstains rather than making low-confidence attributions.
        </p>
      </div>
    </div>
  )
}
