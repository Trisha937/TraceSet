/**
 * PaperManagement.jsx — Four-tab view connected to live Member 1 backend
 * Tabs: Examinations | Paper Versions | Centres | Fingerprints
 *
 * All data fetched from real FastAPI endpoints:
 *   GET /api/papers/examinations
 *   GET /api/papers/versions
 *   GET /api/papers/centres
 *   GET /api/papers/fingerprints
 */
import { useEffect, useState, useCallback } from 'react'
import { FileText, MapPin, Grid, Fingerprint, RefreshCw, AlertTriangle } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import TabBar from '../components/ui/TabBar'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import PaperVersionCard from '../components/domain/PaperVersionCard'
import FingerprintDetailPanel from '../components/domain/FingerprintDetailPanel'
import {
  getExaminations,
  getPaperVersions,
  getCentres,
  getFingerprints,
  getPaperVersion,
} from '../services/paperService'
import { useToast } from '../components/ui/Toast'

const TABS = [
  { key: 'examinations', label: 'Examinations', icon: FileText },
  { key: 'versions',     label: 'Paper Versions', icon: Grid },
  { key: 'centres',      label: 'Centres', icon: MapPin },
  { key: 'fingerprints', label: 'Fingerprints', icon: Fingerprint },
]

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDuration(mins) {
  if (!mins) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}` : `${m}m`
}

// ── Examinations Tab ────────────────────────────────────────────────────────
function ExaminationsTab({ data, loading, error }) {
  const cols = [
    { key: 'code',             header: 'Code',     mono: true, width: 180 },
    { key: 'name',             header: 'Name',     sortable: false },
    { key: 'subject',          header: 'Subject' },
    { key: 'total_marks',      header: 'Marks',    mono: true, width: 80 },
    { key: 'duration_minutes', header: 'Duration', mono: true, width: 100,
      render: (v) => formatDuration(v) },
    { key: 'created_at',       header: 'Created',  mono: true, width: 130,
      render: (v) => formatDate(v) },
  ]

  if (error) return <ErrorState message={error} />

  return (
    <div className="ts-card overflow-hidden">
      <DataTable
        columns={cols}
        data={data}
        loading={loading}
        emptyMessage="No examinations found."
        emptySubMessage="Seed the database: python sample_data/seed_data.py"
      />
    </div>
  )
}

// ── Paper Versions Tab ──────────────────────────────────────────────────────
function PaperVersionsTab({ data, loading, error }) {
  const [detailId, setDetailId] = useState(null)
  const [detail, setDetail]     = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const { toast } = useToast()

  async function handleView(version) {
    if (detailId === version.id) {
      setDetailId(null); setDetail(null); return
    }
    setDetailId(version.id)
    setDetailLoading(true)
    try {
      const d = await getPaperVersion(version.id)
      setDetail(d)
    } catch {
      toast.error('Could not load version detail.')
      setDetailId(null)
    } finally {
      setDetailLoading(false)
    }
  }

  if (error) return <ErrorState message={error} />

  if (loading) {
    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[0,1,2].map(i => (
          <div key={i} className="ts-card px-5 py-5 space-y-3">
            <div className="skeleton h-5 w-20 rounded" />
            <div className="skeleton h-3 w-40 rounded" />
            <div className="skeleton h-3 w-32 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="ts-card flex flex-col items-center justify-center py-16">
        <p className="font-mono text-ts-muted" style={{ fontSize: 12 }}>No paper versions generated yet.</p>
        <p className="font-sora text-ts-muted mt-2" style={{ fontSize: 13 }}>
          Use the API: <span className="font-mono text-ts-code">POST /api/papers/generate</span>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {data.map(v => (
          <PaperVersionCard key={v.id} version={v} onView={handleView} />
        ))}
      </div>

      {/* Detail panel */}
      {detailId && (
        <div className="ts-card overflow-hidden">
          {detailLoading ? (
            <div className="px-6 py-6 space-y-3">
              <div className="skeleton h-4 w-32 rounded" />
              {[0,1,2,3].map(i => <div key={i} className="skeleton h-3 w-full rounded" />)}
            </div>
          ) : detail ? (
            <div>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #1A1A1A' }}>
                <p className="font-mono text-ts-cyan" style={{ fontSize: 13 }}>
                  {detail.version_code} — Question Details
                </p>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid #222' }}>
                    {['#', 'Code', 'Variant', 'Question Text', 'Options', 'Marks', 'Difficulty'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-mono text-ts-muted uppercase"
                        style={{ fontSize: 10, letterSpacing: '0.06em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(detail.questions || []).map(q => (
                    <tr key={q.question_id} className="border-b border-ts-border hover:bg-ts-elevated">
                      <td className="px-4 py-2.5 font-mono text-ts-muted" style={{ fontSize: 12 }}>{q.order}</td>
                      <td className="px-4 py-2.5 font-mono text-ts-code" style={{ fontSize: 11 }}>{q.question_code}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono" style={{ fontSize: 10, color: '#00D4FF', background: '#003D4D', border: '1px solid #00D4FF22', borderRadius: 2, padding: '1px 5px' }}>
                          {q.variant_id}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-sora text-ts-secondary max-w-xs" style={{ fontSize: 12 }}>
                        <span className="line-clamp-2">{q.text}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-ts-muted" style={{ fontSize: 11 }}>
                        {Object.entries(q.options || {}).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-ts-code" style={{ fontSize: 12 }}>{q.marks}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={q.difficulty} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ── Centres Tab ─────────────────────────────────────────────────────────────
function CentresTab({ data, loading, error }) {
  const cols = [
    { key: 'code',          header: 'Code',    mono: true, width: 140 },
    { key: 'name',          header: 'Name',    sortable: false },
    { key: 'city',          header: 'City' },
    { key: 'state',         header: 'State' },
    { key: 'contact_email', header: 'Email',   sortable: false },
    { key: 'created_at',    header: 'Created', mono: true, width: 130,
      render: (v) => formatDate(v) },
  ]

  if (error) return <ErrorState message={error} />

  return (
    <div className="ts-card overflow-hidden">
      <DataTable
        columns={cols}
        data={data}
        loading={loading}
        emptyMessage="No centres registered."
        emptySubMessage="Seed the database: python sample_data/seed_data.py"
      />
    </div>
  )
}

// ── Fingerprints Tab ─────────────────────────────────────────────────────────
function FingerprintsTab({ data, loading, error }) {
  if (error) return <ErrorState message={error} />

  if (loading) {
    return (
      <div className="space-y-3">
        {[0,1,2].map(i => (
          <div key={i} className="ts-card px-5 py-4 flex justify-between">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-4 w-32 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="ts-card flex flex-col items-center justify-center py-16">
        <p className="font-mono text-ts-muted" style={{ fontSize: 12 }}>No fingerprints found.</p>
        <p className="font-sora text-ts-muted mt-2" style={{ fontSize: 13 }}>Generate papers first to create fingerprints.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        className="px-5 py-3 rounded-ts flex items-center gap-3"
        style={{ background: '#0D1F26', border: '1px solid #00D4FF22' }}
      >
        <Fingerprint size={14} className="text-ts-cyan" />
        <p className="font-sora text-ts-secondary" style={{ fontSize: 13 }}>
          {data.length} paper version{data.length !== 1 ? 's' : ''} with question-level forensic fingerprints.
          Click a version to expand its fingerprint records.
        </p>
      </div>
      {data.map(fp => (
        <FingerprintDetailPanel key={fp.paper_version_id} fingerprint={fp} />
      ))}
    </div>
  )
}

// ── Error state ─────────────────────────────────────────────────────────────
function ErrorState({ message }) {
  return (
    <div
      className="flex items-start gap-3 px-5 py-4 rounded-ts"
      style={{ background: '#1A0A00', border: '1px solid #F5A62333', borderLeft: '3px solid #F5A623' }}
    >
      <AlertTriangle size={15} className="text-ts-amber shrink-0 mt-0.5" />
      <div>
        <p className="font-sora font-medium text-ts-amber" style={{ fontSize: 13 }}>Backend Connection Error</p>
        <p className="font-sora text-ts-secondary mt-1" style={{ fontSize: 13 }}>{message}</p>
        <p className="font-mono text-ts-muted mt-1" style={{ fontSize: 11 }}>
          Start the server: uvicorn backend.app.main:app --reload --port 8000
        </p>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function PaperManagement() {
  const [activeTab, setActiveTab] = useState('examinations')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState({ examinations: [], versions: [], centres: [], fingerprints: [] })
  const [counts, setCounts] = useState({ examinations: null, versions: null, centres: null, fingerprints: null })
  const { toast } = useToast()

  const loadTab = useCallback(async (tab) => {
    setLoading(true)
    setError(null)
    try {
      let result
      switch (tab) {
        case 'examinations': result = await getExaminations();  break
        case 'versions':     result = await getPaperVersions(); break
        case 'centres':      result = await getCentres();        break
        case 'fingerprints': result = await getFingerprints();   break
        default: result = []
      }
      const arr = Array.isArray(result) ? result : []
      setData(prev => ({ ...prev, [tab]: arr }))
      setCounts(prev => ({ ...prev, [tab]: arr.length }))
    } catch (err) {
      setError(err.message || 'Failed to fetch data from backend.')
      toast.error(`Failed to load ${tab}. Is the backend running on port 8000?`)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadTab(activeTab) }, [activeTab])

  const tabs = TABS.map(t => ({
    ...t,
    count: counts[t.key] ?? undefined,
  }))

  return (
    <div className="ts-page">
      <Topbar
        title="Paper Management"
        subtitle="GET /api/papers/* — Live Member 1 Backend"
        actions={
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={() => loadTab(activeTab)}
            loading={loading}
          >
            Refresh
          </Button>
        }
      />

      {/* Tab bar */}
      <div className="px-8 pt-5" style={{ borderBottom: '1px solid #222' }}>
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </div>

      <div className="ts-page-body">
        {activeTab === 'examinations' && (
          <ExaminationsTab data={data.examinations} loading={loading} error={error} />
        )}
        {activeTab === 'versions' && (
          <PaperVersionsTab data={data.versions} loading={loading} error={error} />
        )}
        {activeTab === 'centres' && (
          <CentresTab data={data.centres} loading={loading} error={error} />
        )}
        {activeTab === 'fingerprints' && (
          <FingerprintsTab data={data.fingerprints} loading={loading} error={error} />
        )}
      </div>
    </div>
  )
}
