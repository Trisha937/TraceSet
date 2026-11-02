/**
 * LeakUploadRow.jsx — Single row in upload history table
 * Shows file info, status badge, and action buttons
 */
import { FileText, Image, Trash2, Search, Eye } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'
import Button from '../ui/Button'

function FileTypeIcon({ type }) {
  if (type === 'application/pdf') return <FileText size={14} className="text-ts-red" />
  return <Image size={14} className="text-ts-cyan" />
}

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

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

function typeLabel(type) {
  const map = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
  }
  return map[type] || type
}

export default function LeakUploadRow({ upload, onDelete, onInvestigate, onView }) {
  const isProcessing = upload.status === 'PROCESSING'
  const canInvestigate = upload.status === 'EXTRACTED'

  return (
    <tr
      className="border-b border-ts-border hover:bg-ts-surface transition-colors duration-100"
    >
      {/* Filename */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <FileTypeIcon type={upload.file_type} />
          <div>
            <p className="font-sora font-medium text-ts-text" style={{ fontSize: 13 }}>
              {upload.filename}
            </p>
            {upload.processing_warnings?.length > 0 && (
              <p className="font-mono text-ts-amber mt-0.5" style={{ fontSize: 10 }}>
                ⚠ {upload.processing_warnings[0]}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Type */}
      <td className="px-4 py-3">
        <span className="font-mono text-ts-muted" style={{ fontSize: 12 }}>
          {typeLabel(upload.file_type)}
        </span>
      </td>

      {/* Size */}
      <td className="px-4 py-3">
        <span className="font-mono text-ts-muted" style={{ fontSize: 12 }}>
          {formatBytes(upload.file_size_bytes)}
        </span>
      </td>

      {/* Pages */}
      <td className="px-4 py-3">
        <span className="font-mono text-ts-muted" style={{ fontSize: 12 }}>
          {upload.total_pages ?? '—'}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isProcessing && (
            <span
              className="inline-block rounded-full shrink-0"
              style={{
                width: 6, height: 6,
                background: '#F5A623',
                animation: 'pulseDot 1.4s ease-in-out infinite',
              }}
            />
          )}
          <StatusBadge status={upload.status} />
        </div>
      </td>

      {/* Date */}
      <td className="px-4 py-3">
        <span className="font-mono text-ts-muted" style={{ fontSize: 11 }}>
          {formatDate(upload.created_at)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {canInvestigate && (
            <Button
              variant="secondary"
              size="sm"
              icon={Search}
              onClick={() => onInvestigate?.(upload)}
              title="Run Investigation"
            >
              Investigate
            </Button>
          )}
          {onView && upload.status === 'EXTRACTED' && (
            <Button
              variant="ghost"
              size="sm"
              icon={Eye}
              onClick={() => onView?.(upload)}
              title="View extracted questions"
            />
          )}
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => onDelete?.(upload.id)}
            title="Delete upload"
          />
        </div>
      </td>
    </tr>
  )
}
