
/**
 * ModuleStatusPanel.jsx — System module status panel
 * Displays backend health and frontend integration status.
 */
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

const MODULE_CONFIG = [
  {
    key: 'member_1_paper_generation',
    label: 'Paper Generation',
    description: 'Question bank, paper versions & digital fingerprinting',
    member: '1',
  },
  {
    key: 'member_2_ocr_extraction',
    label: 'OCR Extraction',
    description: 'Leak file ingestion & text extraction',
    member: '2',
  },
  {
    key: 'member_3_ai_matching',
    label: 'AI Matching',
    description: 'Forensic attribution & source identification',
    member: '3',
  },
  {
    key: 'member_4_frontend',
    label: 'Investigation Dashboard',
    description: 'Investigation dashboard & system integration',
    member: '4',
  },
]

function StatusIcon({ status }) {
  if (status === 'ONLINE' || status === 'ACTIVE') {
    return <CheckCircle size={14} className="text-ts-green shrink-0" />
  }

  if (status === 'READY_FOR_INTEGRATION') {
    return <Clock size={14} className="text-ts-amber shrink-0" />
  }

  return <AlertCircle size={14} className="text-ts-red shrink-0" />
}

function statusColor(status) {
  if (status === 'ONLINE' || status === 'ACTIVE') return '#30A46C'
  if (status === 'READY_FOR_INTEGRATION') return '#F5A623'
  return '#E5484D'
}

function statusLabel(status) {
  if (status === 'ONLINE') return 'Online'
  if (status === 'ACTIVE') return 'Active'
  if (status === 'READY_FOR_INTEGRATION') return 'Pending Integration'
  return status
}

export default function ModuleStatusPanel({ modules = {}, loading = false }) {
  return (
    <div className="ts-card overflow-hidden">
      <div
        className="px-5 pt-4 pb-3"
        style={{ borderBottom: '1px solid #1A1A1A' }}
      >
        <p className="ts-label">System Modules</p>
      </div>

      <div>
        {MODULE_CONFIG.map((mod, i) => {
          // The frontend dashboard is already integrated.
          // Its status should not depend on the backend's old placeholder.
          const status = mod.key === 'member_4_frontend'
            ? 'ONLINE'
            : modules[mod.key]

          return (
            <div
              key={mod.key}
              className="flex items-center justify-between px-5 py-3 hover:bg-ts-elevated transition-colors"
              style={{
                borderBottom: i < MODULE_CONFIG.length - 1
                  ? '1px solid #1A1A1A'
                  : 'none'
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="font-mono shrink-0 flex items-center justify-center"
                  style={{
                    width: 22,
                    height: 22,
                    background: '#1A1A1A',
                    border: '1px solid #222',
                    borderRadius: 2,
                    fontSize: 10,
                    color: '#555',
                  }}
                >
                  M{mod.member}
                </div>

                <div>
                  <p
                    className="font-sora font-medium text-ts-text"
                    style={{ fontSize: 13 }}
                  >
                    {mod.label}
                  </p>

                  {!loading && (
                    <p
                      className="font-mono text-ts-muted"
                      style={{ fontSize: 10 }}
                    >
                      {mod.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {loading ? (
                  <div className="skeleton h-3 w-16 rounded" />
                ) : status ? (
                  <>
                    <StatusIcon status={status} />
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 11,
                        color: statusColor(status)
                      }}
                    >
                      {statusLabel(status)}
                    </span>
                  </>
                ) : (
                  <span
                    className="font-mono text-ts-muted"
                    style={{ fontSize: 11 }}
                  >
                    Unknown
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
