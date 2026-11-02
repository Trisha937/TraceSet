
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import SimilarityBar from './SimilarityBar'
import EvidenceTag from './EvidenceTag'

export default function CandidateRankCard({ candidate, rank }) {
  const [expanded, setExpanded] = useState(rank === 1)
  const [centre, setCentre] = useState(null)
  const isTop = rank === 1

  useEffect(() => {
    async function loadCentre() {
      try {
        const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
        const response = await fetch(`${API_BASE_URL}/api/papers/centres`)

        if (!response.ok) {
          throw new Error('Could not fetch examination centres')
        }

        const result = await response.json()
        const centres = result.data || []

        const matchedCentre = centres.find(
          item => item.id === candidate.centre_id
        )

        setCentre(matchedCentre || null)
      } catch (error) {
        console.error('Failed to load centre details:', error)
      }
    }

    if (candidate.centre_id) {
      loadCentre()
    }
  }, [candidate.centre_id])

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
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-4">
          <div
            className="font-mono font-medium shrink-0 flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              background: isTop ? '#003D4D' : '#1A1A1A',
              border: `1px solid ${isTop ? '#00D4FF33' : '#222'}`,
              borderRadius: 4,
              fontSize: 13,
              color: isTop ? '#00D4FF' : '#555',
            }}
          >
            #{rank}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-sora font-semibold text-ts-text" style={{ fontSize: 15 }}>
                {centre?.name || `Centre ID: ${candidate.centre_id || 'Unknown'}`}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-0.5">
              <span className="font-mono text-ts-muted" style={{ fontSize: 11 }}>
                {centre?.code || `Paper: ${candidate.paper_version_id || 'Unknown'}`}
              </span>

              <span className="text-ts-muted" style={{ fontSize: 11 }}>·</span>

              <span className="font-mono text-ts-muted" style={{ fontSize: 11 }}>
                {candidate.matched_questions ?? 0} questions matched
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5 shrink-0">
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
              {Number(candidate.similarity_score ?? 0).toFixed(1)}
            </p>

            <p className="font-mono text-ts-muted" style={{ fontSize: 10, letterSpacing: '0.04em' }}>
              SIMILARITY
            </p>
          </div>

          {expanded
            ? <ChevronUp size={16} className="text-ts-muted" />
            : <ChevronDown size={16} className="text-ts-muted" />
          }
        </div>
      </div>

      <div className="px-5 pb-4">
        <SimilarityBar
          score={candidate.similarity_score ?? 0}
          height={3}
          showLabel={false}
        />
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #1A1A1A' }}>
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
