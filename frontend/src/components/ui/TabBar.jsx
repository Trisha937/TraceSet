/**
 * TabBar.jsx — Horizontal tab navigation with sliding underline indicator
 */
export default function TabBar({ tabs, active, onChange }) {
  return (
    <div
      className="flex items-end gap-0 shrink-0"
      style={{ borderBottom: '1px solid #222222' }}
    >
      {tabs.map(tab => {
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={[
              'relative flex items-center gap-2 px-5 py-3 font-sora font-medium',
              'transition-all duration-200 shrink-0',
              isActive
                ? 'text-ts-text'
                : 'text-ts-muted hover:text-ts-secondary',
            ].join(' ')}
            style={{ fontSize: 13 }}
          >
            {tab.icon && <tab.icon size={14} strokeWidth={isActive ? 2 : 1.5} />}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className="font-mono"
                style={{
                  fontSize: 10,
                  color: isActive ? '#00D4FF' : '#555',
                  background: isActive ? '#003D4D' : '#1A1A1A',
                  border: `1px solid ${isActive ? '#00D4FF33' : '#222'}`,
                  borderRadius: 2,
                  padding: '1px 5px',
                }}
              >
                {tab.count}
              </span>
            )}

            {/* Active underline */}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0"
                style={{ height: 2, background: '#00D4FF', borderRadius: '2px 2px 0 0' }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
