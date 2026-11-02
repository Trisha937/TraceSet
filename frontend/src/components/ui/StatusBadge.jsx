/**
 * StatusBadge.jsx — Status label aligned to backend enum values
 *
 * Backend status strings (from models):
 *   LeakUpload:    PENDING | PROCESSING | EXTRACTED | FAILED
 *   PaperVersion:  GENERATED | ASSIGNED | ARCHIVED
 *   AnalysisResult: possible_match | multiple_candidates | insufficient_evidence | no_match | processing_error
 */

const CONFIG = {
  // Leak upload statuses
  PENDING:    { label: 'PENDING',    color: '#555555', bg: '#1A1A1A' },
  PROCESSING: { label: 'PROCESSING', color: '#F5A623', bg: '#2A1F00' },
  EXTRACTED:  { label: 'EXTRACTED',  color: '#30A46C', bg: '#0A2018' },
  FAILED:     { label: 'FAILED',     color: '#E5484D', bg: '#200A0A' },

  // Paper version statuses
  GENERATED:  { label: 'GENERATED',  color: '#00D4FF', bg: '#003D4D' },
  ASSIGNED:   { label: 'ASSIGNED',   color: '#A0A0A0', bg: '#1A1A1A' },
  ARCHIVED:   { label: 'ARCHIVED',   color: '#555555', bg: '#111111' },

  // Analysis result statuses
  possible_match:       { label: 'POSSIBLE MATCH',  color: '#30A46C', bg: '#0A2018' },
  multiple_candidates:  { label: 'AMBIGUOUS',        color: '#F5A623', bg: '#2A1F00' },
  insufficient_evidence:{ label: 'INSUFFICIENT',     color: '#E5484D', bg: '#200A0A' },
  no_match:             { label: 'NO MATCH',          color: '#555555', bg: '#1A1A1A' },
  processing_error:     { label: 'ERROR',             color: '#E5484D', bg: '#200A0A' },

  // Extraction quality
  HIGH:       { label: 'HIGH',        color: '#30A46C', bg: '#0A2018' },
  MEDIUM:     { label: 'MEDIUM',      color: '#F5A623', bg: '#2A1F00' },
  LOW:        { label: 'LOW',         color: '#E5484D', bg: '#200A0A' },
  UNCERTAIN:  { label: 'UNCERTAIN',   color: '#555555', bg: '#1A1A1A' },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const cfg = CONFIG[status] || { label: status?.toUpperCase() || '—', color: '#555', bg: '#1A1A1A' }

  return (
    <span
      className="font-mono uppercase inline-block"
      style={{
        fontSize: size === 'lg' ? 12 : 10,
        letterSpacing: '0.08em',
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}33`,
        borderRadius: 2,
        padding: size === 'lg' ? '3px 8px' : '2px 6px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  )
}
