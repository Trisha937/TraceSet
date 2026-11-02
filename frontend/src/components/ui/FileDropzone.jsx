/**
 * FileDropzone.jsx — Drag-and-drop file upload zone
 * Accepts: PDF, JPG, JPEG, PNG
 */
import { useState, useRef } from 'react'
import { Upload, FileText, Image, X } from 'lucide-react'
import Button from './Button'

const ACCEPTED_TYPES = {
  'application/pdf': 'PDF',
  'image/jpeg':      'JPG / JPEG',
  'image/jpg':       'JPG',
  'image/png':       'PNG',
}

const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50MB

function FileIcon({ type }) {
  if (type === 'application/pdf') return <FileText size={20} className="text-ts-red" />
  return <Image size={20} className="text-ts-cyan" />
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileDropzone({ onUpload, uploading = false }) {
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  function validate(file) {
    if (!file) return 'No file selected.'
    if (!ACCEPTED_TYPES[file.type]) return `Unsupported file type. Accepted: PDF, JPG, JPEG, PNG.`
    if (file.size > MAX_SIZE_BYTES) return `File exceeds 50 MB limit.`
    return null
  }

  function handleFile(file) {
    const err = validate(file)
    if (err) { setError(err); setSelectedFile(null); return }
    setError(null)
    setSelectedFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  function handleChange(e) {
    handleFile(e.target.files[0])
    e.target.value = ''
  }

  function handleSubmit() {
    if (selectedFile && !uploading) {
      onUpload(selectedFile)
      setSelectedFile(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          'relative flex flex-col items-center justify-center gap-3 cursor-pointer',
          'border rounded-ts transition-all duration-150',
          'select-none',
          dragging
            ? 'border-ts-cyan bg-ts-cyan-dim'
            : 'border-ts-border-active bg-ts-surface hover:border-ts-cyan hover:bg-[#0D1F26]',
        ].join(' ')}
        style={{
          borderStyle: 'dashed',
          minHeight: 180,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          onChange={handleChange}
        />

        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 44, height: 44,
            background: dragging ? '#003D4D' : '#1A1A1A',
            border: `1px solid ${dragging ? '#00D4FF33' : '#222'}`,
          }}
        >
          <Upload size={20} className={dragging ? 'text-ts-cyan' : 'text-ts-muted'} />
        </div>

        <div className="text-center">
          <p className="font-sora text-sm2 font-medium text-ts-secondary">
            Drop file here, or{' '}
            <span className="text-ts-cyan">click to browse</span>
          </p>
          <p className="font-mono text-ts-muted mt-1" style={{ fontSize: 11 }}>
            PDF · JPG · JPEG · PNG · Max 50 MB
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="font-mono text-ts-red" style={{ fontSize: 12 }}>
          ⚠ {error}
        </p>
      )}

      {/* Selected File Preview */}
      {selectedFile && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-ts"
          style={{ background: '#0A0A0A', border: '1px solid #333' }}
        >
          <div className="flex items-center gap-3">
            <FileIcon type={selectedFile.type} />
            <div>
              <p className="font-sora font-medium text-sm2 text-ts-text">{selectedFile.name}</p>
              <p className="font-mono text-ts-muted" style={{ fontSize: 11 }}>
                {ACCEPTED_TYPES[selectedFile.type]} · {formatBytes(selectedFile.size)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              loading={uploading}
              onClick={handleSubmit}
            >
              Upload & Analyse
            </Button>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
              className="text-ts-muted hover:text-ts-secondary transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
