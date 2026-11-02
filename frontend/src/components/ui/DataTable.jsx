/**
 * DataTable.jsx — Generic data table
 * columns: Array<{ key, header, render?, mono?, width? }>
 */
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'

function EmptyState({ message = 'No records found.', subMessage }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div
        className="font-mono text-ts-muted text-center"
        style={{ fontSize: 12, letterSpacing: '0.04em' }}
      >
        {message}
      </div>
      {subMessage && (
        <p className="font-sora text-ts-muted text-sm2 mt-2 text-center">{subMessage}</p>
      )}
    </div>
  )
}

function LoadingRows({ columns, rows = 5 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="border-b border-ts-border">
      {columns.map((col, j) => (
        <td key={j} className="px-4 py-3">
          <div className="skeleton h-3 rounded" style={{ width: j === 0 ? '60%' : '40%' }} />
        </td>
      ))}
    </tr>
  ))
}

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage,
  emptySubMessage,
  onRowClick,
  rowKey = 'id',
}) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const av = a[sortKey] ?? ''
    const bv = b[sortKey] ?? ''
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="overflow-x-auto" style={{ borderRadius: 4 }}>
      <table className="w-full border-collapse">
        {/* Header */}
        <thead>
          <tr style={{ borderBottom: '1px solid #222' }}>
            {columns.map(col => (
              <th
                key={col.key}
                className={[
                  'text-left px-4 py-3 font-mono text-ts-muted uppercase',
                  'select-none transition-colors duration-150',
                  col.sortable !== false ? 'cursor-pointer hover:text-ts-secondary' : '',
                ].join(' ')}
                style={{ fontSize: 11, letterSpacing: '0.06em', width: col.width }}
                onClick={col.sortable !== false ? () => handleSort(col.key) : undefined}
              >
                <div className="flex items-center gap-1.5">
                  {col.header}
                  {col.sortable !== false && (
                    sortKey === col.key
                      ? sortDir === 'asc'
                        ? <ChevronUp size={11} />
                        : <ChevronDown size={11} />
                      : <ChevronsUpDown size={11} className="opacity-30" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {loading ? (
            <LoadingRows columns={columns} />
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState message={emptyMessage} subMessage={emptySubMessage} />
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr
                key={row[rowKey]}
                className={[
                  'border-b border-ts-border',
                  'transition-colors duration-100',
                  onRowClick ? 'cursor-pointer hover:bg-ts-elevated' : 'hover:bg-ts-surface',
                ].join(' ')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={[
                      'px-4 py-3 text-sm2',
                      col.mono ? 'font-mono text-ts-code' : 'font-sora text-ts-secondary',
                    ].join(' ')}
                  >
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
