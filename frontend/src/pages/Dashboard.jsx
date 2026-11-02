
/**
 * Dashboard.jsx — Overview: stats, recent uploads, module status
 * Connects to the real backend for paper, centre and leak upload data.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Upload, BarChart2, MapPin,
  AlertTriangle
} from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import StatCard from '../components/ui/StatCard'
import SectionHeader from '../components/ui/SectionHeader'
import StatusBadge from '../components/ui/StatusBadge'
import ModuleStatusPanel from '../components/domain/ModuleStatusPanel'
import { getHealth, getPaperVersions, getCentres } from '../services/paperService'
import { leakService } from '../services/leakService'

function formatDate(iso) {
  if (!iso) return '—'

  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [health, setHealth] = useState(null)
  const [versions, setVersions] = useState([])
  const [centres, setCentres] = useState([])
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)

      try {
        const [h, v, c, u] = await Promise.allSettled([
          getHealth(),
          getPaperVersions(),
          getCentres(),
          leakService.getLeakUploads(),
        ])

        if (h.status === 'fulfilled') setHealth(h.value)
        if (v.status === 'fulfilled') setVersions(v.value || [])
        if (c.status === 'fulfilled') setCentres(c.value || [])
        if (u.status === 'fulfilled') setUploads(u.value || [])

        if (v.status === 'rejected' && c.status === 'rejected') {
          setError('Backend unavailable. Start the FastAPI server on port 8000.')
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const analysedCount = uploads.filter(
    u => u.status === 'EXTRACTED'
  ).length

  const modules = health?.modules || {}

  return (
    <div className="ts-page">
      <Topbar
        title="Dashboard"
        subtitle={`TraceSet Forensic Intelligence Platform · ${new Date().toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}`}
      />

      <div className="ts-page-body">

        {/* Error Banner */}
        {error && !loading && (
          <div
            className="flex items-start gap-3 px-4 py-3 mb-6 rounded-ts"
            style={{
              background: '#1A0A00',
              border: '1px solid #F5A62333',
              borderLeft: '3px solid #F5A623'
            }}
          >
            <AlertTriangle
              size={15}
              className="text-ts-amber shrink-0 mt-0.5"
            />
            <p
              className="font-sora text-ts-secondary"
              style={{ fontSize: 13 }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Statistics Cards */}
        <div
          className="grid gap-4 mb-8 stagger-children"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
        >
          <StatCard
            label="Paper Versions"
            value={loading ? 0 : versions.length}
            icon={FileText}
            loading={loading}
            accent
          />

          <StatCard
            label="Active Centres"
            value={loading ? 0 : centres.length}
            icon={MapPin}
            loading={loading}
          />

          <StatCard
            label="Leak Uploads"
            value={loading ? 0 : uploads.length}
            icon={Upload}
            loading={loading}
          />

          <StatCard
            label="Analysed"
            value={loading ? 0 : analysedCount}
            icon={BarChart2}
            loading={loading}
          />
        </div>

        {/* Main Dashboard Content */}
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: '1.6fr 1fr' }}
        >

          {/* LEFT — Recent Uploads */}
          <div>
            <SectionHeader
              label="Recent Leak Uploads"
              action={() => navigate('/upload')}
              actionLabel="Manage Uploads →"
            />

            <div className="ts-card overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid #222' }}>
                    {['Filename', 'Type', 'Status', 'Date'].map(h => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 font-mono text-ts-muted uppercase"
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.06em'
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr
                        key={i}
                        className="border-b border-ts-border"
                      >
                        {[80, 40, 60, 70].map((w, j) => (
                          <td key={j} className="px-4 py-3">
                            <div
                              className="skeleton h-3 rounded"
                              style={{ width: `${w}%` }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : uploads.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center font-mono text-ts-muted"
                        style={{ fontSize: 12 }}
                      >
                        No uploads yet. Go to Leak Upload to add files.
                      </td>
                    </tr>
                  ) : (
                    uploads.slice(0, 5).map(upload => (
                      <tr
                        key={upload.id}
                        className="border-b border-ts-border hover:bg-ts-elevated transition-colors cursor-pointer"
                        onClick={() => navigate('/upload')}
                      >
                        <td
                          className="px-4 py-3 font-sora text-ts-secondary"
                          style={{ fontSize: 13 }}
                        >
                          <span className="truncate block max-w-xs">
                            {upload.filename}
                          </span>
                        </td>

                        <td
                          className="px-4 py-3 font-mono text-ts-muted"
                          style={{ fontSize: 11 }}
                        >
                          {upload.file_type?.split('/')[1]?.toUpperCase() || '—'}
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={upload.status} />
                        </td>

                        <td
                          className="px-4 py-3 font-mono text-ts-muted"
                          style={{ fontSize: 11 }}
                        >
                          {formatDate(upload.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT — System Modules */}
          <div>
            <SectionHeader label="System Modules" />

            <ModuleStatusPanel
              modules={modules}
              loading={loading}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
