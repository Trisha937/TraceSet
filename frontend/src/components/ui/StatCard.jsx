/**
 * StatCard.jsx — Dashboard metric card with count-up animation
 */
import { useEffect, useRef, useState } from 'react'

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) return
    const start = performance.now()
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(Math.round(ease * target))
      if (progress < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return value
}

export default function StatCard({
  label,
  value,
  suffix = '',
  delta,
  deltaLabel,
  loading = false,
  icon: Icon,
  accent = false,
}) {
  const displayed = useCountUp(typeof value === 'number' ? value : 0)

  if (loading) {
    return (
      <div className="ts-card px-6 py-5 flex flex-col gap-3">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-10 w-16 rounded" />
        <div className="skeleton h-2 w-20 rounded" />
      </div>
    )
  }

  return (
    <div
      className={[
        'ts-card px-6 py-5 flex flex-col gap-1',
        'transition-all duration-200 cursor-default',
        'hover:border-ts-border-active hover:shadow-ts-cyan',
        accent ? 'border-l-2 border-l-ts-cyan' : '',
      ].join(' ')}
    >
      {/* Label */}
      <div className="flex items-center justify-between">
        <p className="ts-label">{label}</p>
        {Icon && <Icon size={14} className="text-ts-muted" />}
      </div>

      {/* Value */}
      <p
        className="font-sora font-bold text-ts-text"
        style={{ fontSize: 44, lineHeight: 1.1, letterSpacing: '-0.02em' }}
      >
        {typeof value === 'number' ? displayed : value}
        {suffix && (
          <span className="font-sora text-ts-muted font-medium ml-1" style={{ fontSize: 20 }}>
            {suffix}
          </span>
        )}
      </p>

      {/* Delta */}
      {delta !== undefined && (
        <p className="font-mono text-xs2">
          <span className={delta >= 0 ? 'text-ts-green' : 'text-ts-red'}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}
          </span>
          {deltaLabel && (
            <span className="text-ts-muted ml-1">{deltaLabel}</span>
          )}
        </p>
      )}
    </div>
  )
}
