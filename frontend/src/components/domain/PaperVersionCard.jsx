/**
 * PaperVersionCard.jsx — Displays a generated paper version (SET_A / B / C)
 */
import { ArrowRight, BookOpen, Target } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'
import Button from '../ui/Button'

const VERSION_ACCENTS = {
  SET_A: '#00D4FF',
  SET_B: '#F5A623',
  SET_C: '#30A46C',
}

function DifficultyPip({ label, count, color }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="font-mono font-medium"
        style={{ fontSize: 18, color, lineHeight: 1 }}
      >
        {count ?? 0}
      </span>
      <span className="font-mono text-ts-muted" style={{ fontSize: 10, letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export default function PaperVersionCard({ version, onView }) {
  const accent = VERSION_ACCENTS[version.version_code] || '#555'
  const diff = version.difficulty_summary || {}

  return (
    <div
      className="ts-card flex flex-col transition-all duration-200 hover:shadow-ts-cyan"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #1A1A1A' }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className="font-mono font-medium"
              style={{ fontSize: 18, color: accent, letterSpacing: '0.02em' }}
            >
              {version.version_code}
            </p>
            <p className="font-sora text-ts-secondary mt-0.5" style={{ fontSize: 13 }}>
              {version.centre_name || version.centre_code || 'No centre assigned'}
            </p>
          </div>
          <StatusBadge status={version.status} />
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 flex items-center gap-6" style={{ borderBottom: '1px solid #1A1A1A' }}>
        <div className="flex items-center gap-1.5">
          <BookOpen size={13} className="text-ts-muted" />
          <span className="font-mono text-ts-code" style={{ fontSize: 13 }}>
            {version.total_questions ?? '—'}
          </span>
          <span className="font-sora text-ts-muted" style={{ fontSize: 12 }}>Qs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Target size={13} className="text-ts-muted" />
          <span className="font-mono text-ts-code" style={{ fontSize: 13 }}>
            {version.total_marks ?? '—'}
          </span>
          <span className="font-sora text-ts-muted" style={{ fontSize: 12 }}>marks</span>
        </div>
      </div>

      {/* ── Difficulty distribution ──────────────────────────────────────── */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1A1A1A' }}>
        <p className="ts-label mb-3">Difficulty</p>
        <div className="flex gap-5">
          <DifficultyPip label="EASY"   count={diff.EASY}   color="#30A46C" />
          <DifficultyPip label="MEDIUM" count={diff.MEDIUM} color="#F5A623" />
          <DifficultyPip label="HARD"   count={diff.HARD}   color="#E5484D" />
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 flex items-center justify-between">
        <span className="font-mono text-ts-muted" style={{ fontSize: 11 }}>
          {formatDate(version.created_at)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowRight}
          onClick={() => onView?.(version)}
        >
          View
        </Button>
      </div>
    </div>
  )
}
