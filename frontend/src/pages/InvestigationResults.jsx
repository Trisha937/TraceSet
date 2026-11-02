/**
 * InvestigationResults.jsx — Forensic attribution results page
 * Connects to mocked matchingService (VITE_USE_MOCK_MATCHING=true)
 * Upload selector → Run Analysis → Ranked candidates + evidence
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, ChevronDown, AlertCircle, Clock, BarChart2 } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import SectionHeader from '../components/ui/SectionHeader'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import CandidateRankCard from '../components/domain/CandidateRankCard'
import UncertaintyWarning from '../components/domain/UncertaintyWarning'
import { leakService } from '../services/leakService'
import { matchingService } from '../services/matchingService'
import { useToast } from '../components/ui/Toast'

function formatDate(iso) {
  if (!iso) return '—'

  // Backend timestamps are UTC but arrive without a timezone marker.
  const utcTimestamp = /Z$|[+-]\d{2}:\d{2}$/.test(iso)
    ? iso
    : `${iso}Z`

  return new Date(utcTimestamp).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

// ── Upload selector dropdown ─────────────────────────────────────────────────
function UploadSelector({ uploads, selectedId, onChange }) {
  const [open, setOpen] = useState(false)
  const selected = uploads.find(u => u.id === selectedId)

  const eligible = uploads.filter(u => u.status === 'EXTRACTED')
  const ineligible = uploads.filter(u => u.status !== 'EXTRACTED')

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={[
          'flex items-center justify-between gap-4 px-4 py-3 rounded-ts w-full text-left',
          'transition-all duration-150',
          'border',
          open ? 'border-ts-cyan bg-ts-elevated' : 'border-ts-border bg-ts-surface hover:border-ts-border-active',
        ].join(' ')}
        style={{ minWidth: 420 }}
      >
        <div>
          {selected ? (
            <div>
              <p className="font-sora font-medium text-ts-text" style={{ fontSize: 14 }}>
                {selected.filename}
              </p>
              <p className="font-mono text-ts-muted" style={{ fontSize: 11 }}>
                {selected.file_type?.split('/')[1]?.toUpperCase()} ·{' '}
                {formatDate(selected.created_at)}
              </p>
            </div>
          ) : (
            <p className="font-sora text-ts-muted" style={{ fontSize: 14 }}>
              Select a leak upload to investigate…
            </p>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-ts-muted transition-transform duration-150 shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-ts overflow-hidden z-30"
          style={{ background: '#111', border: '1px solid #333', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}
        >
          {eligible.length === 0 && ineligible.length === 0 && (
            <p className="px-4 py-3 font-sora text-ts-muted" style={{ fontSize: 13 }}>
              No uploads found. Upload a file first.
            </p>
          )}

          {eligible.length > 0 && (
            <div>
              <p className="px-4 py-2 ts-label" style={{ borderBottom: '1px solid #1A1A1A' }}>
                Ready for Analysis (EXTRACTED)
              </p>
              {eligible.map(u => (
                <button
                  key={u.id}
                  onClick={() => { onChange(u.id); setOpen(false) }}
                  className={[
                    'w-full text-left px-4 py-3 flex items-center justify-between gap-4',
                    'transition-colors duration-100',
                    u.id === selectedId ? 'bg-ts-cyan-dim' : 'hover:bg-ts-elevated',
                  ].join(' ')}
                  style={{ borderBottom: '1px solid #1A1A1A' }}
                >
                  <div>
                    <p className="font-sora font-medium text-ts-text" style={{ fontSize: 13 }}>
                      {u.filename}
                    </p>
                    <p className="font-mono text-ts-muted" style={{ fontSize: 10 }}>
                      {formatDate(u.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={u.status} />
                </button>
              ))}
            </div>
          )}

          {ineligible.length > 0 && (
            <div>
              <p className="px-4 py-2 ts-label" style={{ borderBottom: '1px solid #1A1A1A' }}>
                Not Ready
              </p>
              {ineligible.map(u => (
                <div
                  key={u.id}
                  className="px-4 py-3 flex items-center justify-between gap-4 opacity-40"
                  style={{ borderBottom: '1px solid #1A1A1A' }}
                >
                  <p className="font-sora text-ts-secondary" style={{ fontSize: 13 }}>{u.filename}</p>
                  <StatusBadge status={u.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Analysis Loading State ──────────────────────────────────────────────────
function AnalysingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div
        className="flex items-center justify-center mb-6"
        style={{
          width: 56, height: 56,
          background: '#003D4D',
          border: '1px solid #00D4FF33',
          borderRadius: 4,
          animation: 'pulseDot 1.4s infinite',
        }}
      >
        <Search size={22} className="text-ts-cyan" />
      </div>
      <p className="font-sora font-semibold text-ts-text" style={{ fontSize: 16 }}>
        Running Forensic Analysis
      </p>
      <p className="font-sora text-ts-muted mt-2" style={{ fontSize: 13 }}>
        Matching extracted questions against all paper version fingerprints…
      </p>
      <div className="flex items-center gap-2 mt-4">
        <span
          className="rounded-full"
          style={{ width: 6, height: 6, background: '#00D4FF', animation: 'pulseDot 1.4s 0ms infinite' }}
        />
        <span
          className="rounded-full"
          style={{ width: 6, height: 6, background: '#00D4FF', animation: 'pulseDot 1.4s 200ms infinite' }}
        />
        <span
          className="rounded-full"
          style={{ width: 6, height: 6, background: '#00D4FF', animation: 'pulseDot 1.4s 400ms infinite' }}
        />
      </div>
    </div>
  )
}

// ── Result summary header ───────────────────────────────────────────────────
function ResultHeader({ result, upload }) {
  const statusColors = {
    possible_match:        { color: '#30A46C', bg: '#0A2018' },
    multiple_candidates:   { color: '#F5A623', bg: '#2A1F00' },
    insufficient_evidence: { color: '#E5484D', bg: '#200A0A' },
    no_match:              { color: '#555555', bg: '#1A1A1A' },
    processing_error:      { color: '#E5484D', bg: '#200A0A' },
  }
  const sc = statusColors[result.status] || { color: '#555', bg: '#1A1A1A' }

  return (
    <div
      className="px-6 py-5 rounded-ts mb-6"
      style={{ background: sc.bg, border: `1px solid ${sc.color}33`, borderLeft: `3px solid ${sc.color}` }}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <StatusBadge status={result.status} size="lg" />
          </div>
          {result.explanation && (
            <p className="font-sora text-ts-secondary leading-relaxed" style={{ fontSize: 14 }}>
              {result.explanation}
            </p>
          )}
          {result.warnings?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.warnings.map((w, i) => (
                <li key={i} className="font-mono text-ts-muted" style={{ fontSize: 11 }}>
                  · {w}
                </li>
              ))}
            </ul>
          )}
        </div>

        {result.top_similarity_score !== null && result.top_similarity_score !== undefined && (
          <div className="text-right shrink-0">
            <p
              className="font-mono font-bold"
              style={{ fontSize: 40, color: sc.color, lineHeight: 1, letterSpacing: '-0.02em' }}
            >
              {result.top_similarity_score.toFixed(1)}
            </p>
            <p className="font-mono text-ts-muted" style={{ fontSize: 10, letterSpacing: '0.06em' }}>
              TOP SCORE
            </p>
            <p className="font-mono text-ts-muted mt-1" style={{ fontSize: 11 }}>
              {result.total_matched_questions} questions matched
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function InvestigationResults() {
  const { uploadId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [uploads, setUploads] = useState([])
  const [selectedUploadId, setSelectedUploadId] = useState(uploadId || null)
  const [result, setResult] = useState(null)
  const [analysing, setAnalysing] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [loadingUploads, setLoadingUploads] = useState(true)

  // Load uploads on mount
  useEffect(() => {
    leakService.getLeakUploads()
      .then(data => setUploads(data || []))
      .catch(() => toast.error('Could not load uploads.'))
      .finally(() => setLoadingUploads(false))
  }, [])

  // Auto-load existing result if uploadId provided in URL
  useEffect(() => {
    if (uploadId && !hasRun) {
      setSelectedUploadId(uploadId)
      loadExistingResult(uploadId)
    }
  }, [uploadId])

  async function loadExistingResult(id) {
    try {
      const existing = await matchingService.getAnalysisResult(id)
      if (existing) {
        setResult(existing)
        setHasRun(true)
      }
    } catch { /* no existing result is fine */ }
  }

  async function handleRunAnalysis() {
    if (!selectedUploadId) return
    setAnalysing(true)
    setResult(null)
    try {
      const res = await matchingService.runAnalysis(selectedUploadId)
      setResult(res)
      setHasRun(true)
      // Update URL
      navigate(`/results/${selectedUploadId}`, { replace: true })
      if (res.status === 'possible_match') {
  toast.success('Analysis complete. A possible source match was found.')
} else if (
  res.status === 'ambiguous_match' ||
  res.status === 'no_match'
) {
  toast.warning('Analysis complete. Source could not be reliably identified.')
} else {
  toast.info('Analysis complete.')
}
    } catch (err) {
      toast.error(err.message || 'Analysis failed.')
    } finally {
      setAnalysing(false)
    }
  }

  function handleSelectUpload(id) {
    setSelectedUploadId(id)
    setResult(null)
    setHasRun(false)
    navigate('/results', { replace: true })
    // Try to load existing result
    loadExistingResult(id)
  }

const showUncertainty = result && (
  result.status === 'insufficient_evidence' ||
  result.status === 'multiple_candidates' ||
  result.status === 'ambiguous_match' ||
  result.status === 'no_match'
)
const selectedUpload = uploads.find(
  (upload) => upload.id === selectedUploadId
) || null
  return (
    <div className="ts-page">
      <Topbar
        title="Investigation Results"
        subtitle="Forensic attribution — AI matching engine"
        actions={
          selectedUploadId && !analysing && (
            <Button
              variant="primary"
              size="md"
              icon={Search}
              onClick={handleRunAnalysis}
              disabled={!selectedUploadId || analysing}
            >
              {hasRun ? 'Re-run Analysis' : 'Run Analysis'}
            </Button>
          )
        }
      />

      <div className="ts-page-body">
        {/* ── Upload Selector ────────────────────────────────────────────── */}
        <div className="mb-6">
          <SectionHeader label="Select Leak Upload" />
          {loadingUploads ? (
            <div className="skeleton h-14 rounded-ts w-96" />
          ) : (
            <div className="flex items-center gap-4">
              <UploadSelector
                uploads={uploads}
                selectedId={selectedUploadId}
                onChange={handleSelectUpload}
              />
              {selectedUploadId && !hasRun && (
                <Button
                  variant="primary"
                  size="md"
                  icon={Search}
                  onClick={handleRunAnalysis}
                  loading={analysing}
                >
                  Run Analysis
                </Button>
              )}
            </div>
          )}

          {selectedUpload && (
            <div className="flex items-center gap-3 mt-3">
              <span className="font-mono text-ts-muted" style={{ fontSize: 11 }}>
                {selectedUpload.filename}
              </span>
              <span className="text-ts-muted" style={{ fontSize: 11 }}>·</span>
              <StatusBadge status={selectedUpload.status} />
              {selectedUpload.status !== 'EXTRACTED' && (
                <span className="font-mono text-ts-amber" style={{ fontSize: 11 }}>
                  ⚠ Only EXTRACTED uploads can be analysed.
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── No selection state ────────────────────────────────────────── */}
        {!selectedUploadId && !analysing && (
          <div className="flex flex-col items-center justify-center py-24">
            <div
              className="flex items-center justify-center mb-4"
              style={{
                width: 52, height: 52,
                background: '#0A0A0A',
                border: '1px solid #222',
                borderRadius: 4,
              }}
            >
              <BarChart2 size={22} className="text-ts-muted" />
            </div>
            <p className="font-sora font-medium text-ts-secondary" style={{ fontSize: 15 }}>
              Select a leak upload above to begin investigation
            </p>
            <p className="font-sora text-ts-muted mt-2 text-center" style={{ fontSize: 13, maxWidth: 420 }}>
              TraceSet will match OCR-extracted questions against all paper version fingerprints
              and rank probable source examination centres.
            </p>
          </div>
        )}

        {/* ── Analysing state ───────────────────────────────────────────── */}
        {analysing && <AnalysingState />}

        {/* ── Results ───────────────────────────────────────────────────── */}
        {!analysing && result && (
          <div className="animate-fade-in">
            {/* Result summary */}
            <ResultHeader result={result} upload={selectedUpload} />

            {/* Uncertainty warning */}
            {showUncertainty && (
              <UncertaintyWarning
                explanation={result.explanation}
                warnings={result.warnings}
              />
            )}

            {/* Ranked candidates */}
            {result.ranked_candidates?.length > 0 && (
              <div>
                <SectionHeader
                  label={`Ranked Candidates · ${result.ranked_candidates.length} paper versions evaluated`}
                />
                <div className="space-y-3">
                  {result.ranked_candidates.map((candidate, i) => (
                    <CandidateRankCard
                      key={candidate.paper_version_id}
                      candidate={candidate}
                      rank={i + 1}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No candidates */}
            {result.ranked_candidates?.length === 0 && !showUncertainty && (
              <div className="ts-card flex flex-col items-center justify-center py-16">
                <AlertCircle size={28} className="text-ts-muted mb-4" strokeWidth={1} />
                <p className="font-mono text-ts-muted" style={{ fontSize: 12 }}>No candidate matches found.</p>
              </div>
            )}

            {/* Disclaimer */}
            <div
              className="mt-6 px-4 py-3 rounded-ts"
              style={{ background: '#0A0A0A', border: '1px solid #1A1A1A' }}
            >
              <p className="font-sora text-ts-muted leading-relaxed" style={{ fontSize: 12 }}>
  Similarity scores represent statistical likelihood of source match, not absolute proof.
  TraceSet reports transparent evidence breakdowns and abstains from low-confidence attributions.
</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
