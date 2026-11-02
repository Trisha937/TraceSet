/**
 * LeakUpload.jsx — File upload page with drag-drop zone and upload history
 * Uses mocked leakService (VITE_USE_MOCK_OCR=true)
 */
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, ChevronDown, ChevronUp } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import SectionHeader from '../components/ui/SectionHeader'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import FileDropzone from '../components/ui/FileDropzone'
import LeakUploadRow from '../components/domain/LeakUploadRow'
import { leakService } from '../services/leakService'
import { useToast } from '../components/ui/Toast'

// Extracted questions panel
function ExtractedQuestionsPanel({ upload, onClose }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    leakService.getLeakUpload(upload.id).then(u => {
      setQuestions(u?.extracted_questions || [])
      setLoading(false)
    })
  }, [upload.id])

  return (
    <div
      className="rounded-ts overflow-hidden animate-slide-up"
      style={{ border: '1px solid #333', background: '#050505' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid #222', background: '#0A0A0A' }}
      >
        <div>
          <p className="font-sora font-semibold text-ts-text" style={{ fontSize: 13 }}>
            Extracted Questions
          </p>
          <p className="font-mono text-ts-muted" style={{ fontSize: 11 }}>
            {upload.filename}
          </p>
        </div>
        <button onClick={onClose} className="text-ts-muted hover:text-ts-text transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Questions */}
      <div className="divide-y" style={{ borderColor: '#1A1A1A' }}>
        {loading ? (
          <div className="px-5 py-8 text-center font-mono text-ts-muted" style={{ fontSize: 12 }}>
            Loading extracted questions…
          </div>
        ) : questions.length === 0 ? (
          <div className="px-5 py-8 text-center font-mono text-ts-muted" style={{ fontSize: 12 }}>
            No questions extracted from this upload.
          </div>
        ) : (
          questions.map((q, i) => (
            <div key={q.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-ts-muted shrink-0" style={{ fontSize: 12 }}>Q{q.detected_order}</span>
                  <p className="font-sora text-ts-secondary leading-relaxed" style={{ fontSize: 13 }}>
                    {q.extracted_text}
                  </p>
                </div>
                <StatusBadge status={q.extraction_quality} />
              </div>
              {Object.keys(q.options || {}).length > 0 && (
                <div className="ml-8 grid gap-1" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  {Object.entries(q.options).map(([k, v]) => (
                    <div key={k} className="flex items-start gap-2">
                      <span className="font-mono text-ts-cyan shrink-0" style={{ fontSize: 11 }}>{k}.</span>
                      <span className="font-mono text-ts-muted" style={{ fontSize: 11 }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
              {q.warnings?.length > 0 && (
                <p className="font-mono text-ts-amber ml-8 mt-1" style={{ fontSize: 10 }}>
                  ⚠ {q.warnings[0]}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function LeakUpload() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showDropzone, setShowDropzone] = useState(false)
  const [viewingUpload, setViewingUpload] = useState(null)

  // Poll for status updates during PROCESSING
  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await leakService.getLeakUploads()
      setUploads(data || [])
    } catch {
      if (!silent) toast.error('Failed to load uploads.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    refresh()
    // Poll every 3s if any uploads are PROCESSING
    const interval = setInterval(async () => {
      const current = await leakService.getLeakUploads().catch(() => [])
      setUploads(current || [])
    }, 3_000)
    return () => clearInterval(interval)
  }, [])

  async function handleUpload(file) {
    setUploading(true)
    try {
      const newUpload = await leakService.uploadLeak(file)
      setUploads(prev => [newUpload, ...prev])
      toast.success(`"${file.name}" uploaded successfully. OCR processing started.`)
      setShowDropzone(false)
    } catch (err) {
      toast.error(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id) {
    try {
      await leakService.deleteLeakUpload(id)
      setUploads(prev => prev.filter(u => u.id !== id))
      if (viewingUpload?.id === id) setViewingUpload(null)
      toast.success('Upload deleted.')
    } catch {
      toast.error('Could not delete upload.')
    }
  }

  function handleInvestigate(upload) {
    navigate(`/results/${upload.id}`)
  }

  const processingCount = uploads.filter(u => u.status === 'PROCESSING').length

  return (
    <div className="ts-page">
      <Topbar
        title="Leak Upload"
        subtitle="Upload suspected leaked examination material for OCR extraction"
        actions={
          <Button
            variant="primary"
            size="md"
            icon={Upload}
            onClick={() => setShowDropzone(s => !s)}
          >
            {showDropzone ? 'Cancel' : 'Upload New File'}
          </Button>
        }
      />

      <div className="ts-page-body">
        {/* ── Upload Zone ───────────────────────────────────────────────── */}
        {showDropzone && (
          <div className="mb-6 animate-slide-up">
            <SectionHeader label="New Leak Upload" />
            <FileDropzone onUpload={handleUpload} uploading={uploading} />
          </div>
        )}

        {/* ── Processing banner ─────────────────────────────────────────── */}
        {processingCount > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-3 mb-5 rounded-ts"
            style={{ background: '#1A1400', border: '1px solid #F5A62333' }}
          >
            <span
              className="rounded-full shrink-0"
              style={{ width: 7, height: 7, background: '#F5A623', animation: 'pulseDot 1.4s infinite' }}
            />
            <p className="font-sora text-ts-amber" style={{ fontSize: 13 }}>
              {processingCount} upload{processingCount > 1 ? 's' : ''} currently processing OCR extraction…
            </p>
          </div>
        )}

        {/* ── Upload History ────────────────────────────────────────────── */}
        <div>
          <SectionHeader
            label={`Upload History${uploads.length > 0 ? ` · ${uploads.length} files` : ''}`}
            action={() => refresh()}
            actionLabel="Refresh ↺"
          />

          <div className="ts-card overflow-hidden">
            {loading ? (
              <table className="w-full">
                <tbody>
                  {[0,1,2].map(i => (
                    <tr key={i} className="border-b border-ts-border">
                      {[200,50,60,40,80,100,100].map((w, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="skeleton h-3 rounded" style={{ width: w }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : uploads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Upload size={32} className="text-ts-muted mb-4" strokeWidth={1} />
                <p className="font-mono text-ts-muted" style={{ fontSize: 12 }}>
                  No uploads yet.
                </p>
                <p className="font-sora text-ts-muted mt-1" style={{ fontSize: 13 }}>
                  Upload a PDF, JPG, JPEG or PNG to begin forensic analysis.
                </p>
                <Button
                  variant="secondary"
                  size="md"
                  icon={Upload}
                  className="mt-4"
                  onClick={() => setShowDropzone(true)}
                >
                  Upload First File
                </Button>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid #222' }}>
                    {['Filename', 'Type', 'Size', 'Pages', 'Status', 'Uploaded', 'Actions'].map(h => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 font-mono text-ts-muted uppercase"
                        style={{ fontSize: 10, letterSpacing: '0.06em' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploads.map(upload => (
                    <LeakUploadRow
                      key={upload.id}
                      upload={upload}
                      onDelete={handleDelete}
                      onInvestigate={handleInvestigate}
                      onView={(u) => setViewingUpload(v => v?.id === u.id ? null : u)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Extracted Questions Panel ─────────────────────────────────── */}
        {viewingUpload && (
          <div className="mt-6">
            <ExtractedQuestionsPanel
              upload={viewingUpload}
              onClose={() => setViewingUpload(null)}
            />
          </div>
        )}

        {/* ── Info note ─────────────────────────────────────────────────── */}
        <div
          className="mt-6 px-4 py-3 rounded-ts"
          style={{ background: '#0A0A0A', border: '1px solid #1A1A1A' }}
        >
          <p className="ts-label mb-1.5">Module Status</p>
          <p className="font-sora text-ts-muted leading-relaxed" style={{ fontSize: 12 }}>
            OCR extraction is currently running in <span className="font-mono text-ts-amber">MOCK MODE</span>.
            Set <span className="font-mono text-ts-code">VITE_USE_MOCK_OCR=false</span> when Member 2 delivers the OCR backend.
          </p>
        </div>
      </div>
    </div>
  )
}
