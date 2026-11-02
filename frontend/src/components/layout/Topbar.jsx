/**
 * Topbar.jsx — Sticky top navigation bar per page
 * Each page passes its own title and action buttons.
 */
export default function Topbar({ title, subtitle, actions }) {
  return (
    <header
      className="flex items-center justify-between shrink-0 px-8 bg-ts-base"
      style={{
        height: 56,
        borderBottom: '1px solid #1A1A1A',
      }}
    >
      {/* ── Left: Title ───────────────────────────────────────────────── */}
      <div>
        <h1
          className="font-sora font-semibold text-ts-text"
          style={{ fontSize: 18, lineHeight: 1 }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="font-mono text-ts-muted mt-0.5" style={{ fontSize: 11 }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* ── Right: Actions ────────────────────────────────────────────── */}
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  )
}
