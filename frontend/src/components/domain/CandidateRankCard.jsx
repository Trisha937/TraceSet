/**
 * CandidateRankCard.jsx — Forensic attribution candidate result card
 * Rank #1 has cyan left border accent; others use muted border.
 */
import { useState } from 'react'
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import SimilarityBar from './SimilarityBar'
import EvidenceTag from './EvidenceTag'

export default function CandidateRankCard({ candidate, rank }) {
  const [expanded, setExpanded] = useState(rank === 1)
  const isTop = rank === 1

  return (
    <div
      className="rounded-ts overflow-hidden transition-all duration-200 animate-slide-up"
      style={{
        background: '#0A0A0A',
        border: `1px solid ${isTop ? '#00D4FF44' : '#222'}`,
        borderLeft: `3px solid ${isTop ? '#00D4FF' : '#333'}`,
        animationDelay: `${(rank - 1) * 60}ms`,
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-4">
          {/* Rank number */}
          <div
            className="font-mono font-medium shrink-0 flex items-center justify-center"
            style={{
              width: 28, height: 28,
              background: isTop ? '#003D4D' : '#1A1A1A',
              border: `1px solid ${isTop ? '#00D4FF33' : '#222'}`,
              borderRadius: 4,
              fontSize: 13,
              color: isTop ? '#00D4FF' : '#555',
            }}
          >
            #{rank}
          </div>

          {/* Centre info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sora font-semibold text-ts-text" style={{ fontSize: 15 }}>
                {candidate.centre_name}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="font-mono text-ts-muted" style={{ fontSize: 11 }}>
                {candidate.centre_code}
              </span>
              <span className="text-ts-muted" style={{ fontSize: 11 }}>·</span>
              <span className="font-mono text-ts-muted" style={{ fontSize: 11 }}>
                {candidate.matched_questions} questions matched
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5 shrink-0">
          {/* Score */}
          <div className="text-right">
            <p
              className="font-mono font-medium"
              style={{
                fontSize: 22,
                color: candidate.similarity_score >= 70
                  ? '#30A46C'
                  : candidate.similarity_score >= 40
                  ? '#F5A623'
                  : '#E5484D',
                lineHeight: 1,
              }}
            >
              {candidate.similarity_score.toFixed(1)}
            </p>
            <p className="font-mono text-ts-muted" style={{ fontSize: 10, letterSpacing: '0.04em' }}>
              SIMILARITY
            </p>
          </div>
          {/* Expand toggle */}
          {expanded
            ? <ChevronUp size={16} className="text-ts-muted" />
            : <ChevronDown size={16} className="text-ts-muted" />
          }
        </div>
      </div>

      {/* ── Similarity Bar ─────────────────────────────────────────────── */}
      <div className="px-5 pb-4">
        <SimilarityBar score={candidate.similarity_score} height={3} showLabel={false} />
      </div>

      {/* ── Expanded Details ──────────────────────────────────────────── */}
      {expanded && (
        <div style={{ borderTop: '1px solid #1A1A1A' }}>
          {/* Evidence tags */}
          {candidate.detailed_evidence?.length > 0 && (
            <div className="px-5 py-4">
              <p className="ts-label mb-3">Evidence Breakdown</p>
              <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {candidate.detailed_evidence.map((e, i) => (
                  <EvidenceTag key={i} {...e} />
                ))}
              </div>
            </div>
          )}

          {/* Evidence text list */}
          {candidate.evidence?.length > 0 && (
            <div className="px-5 py-3" style={{ borderTop: '1px solid #1A1A1A' }}>
              <p className="ts-label mb-2">Forensic Observations</p>
              <ul className="space-y-1.5">
                {candidate.evidence.map((ev, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-ts-cyan mt-0.5" style={{ fontSize: 10 }}>◆</span>
                    <span className="font-sora text-ts-secondary leading-snug" style={{ fontSize: 13 }}>
                      {ev}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
