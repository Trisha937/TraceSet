/**
 * SectionHeader.jsx — Section label + optional action link
 */
export default function SectionHeader({ label, action, actionLabel }) {
  return (
    <div
      className="flex items-center justify-between pb-3 mb-4"
      style={{ borderBottom: '1px solid #1A1A1A' }}
    >
      <p className="ts-label">{label}</p>
      {action && (
        <button
          onClick={action}
          className="font-mono text-ts-muted hover:text-ts-cyan transition-colors duration-150"
          style={{ fontSize: 11, letterSpacing: '0.04em' }}
        >
          {actionLabel || 'View All →'}
        </button>
      )}
    </div>
  )
}
