/**
 * SimilarityBar.jsx — Animated score bar (0–100)
 * Color: red < 40, amber 40–70, green > 70
 */
import { useEffect, useState } from 'react'

function getColor(score) {
  if (score >= 70) return '#30A46C'
  if (score >= 40) return '#F5A623'
  return '#E5484D'
}

export default function SimilarityBar({ score = 0, showLabel = true, height = 5 }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(Math.max(score, 0), 100)), 120)
    return () => clearTimeout(t)
  }, [score])

  const color = getColor(score)

  return (
    <div className="flex items-center gap-3">
      {/* Bar */}
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height, background: '#1A1A1A' }}
      >
        <div
          style={{
            width: `${width}%`,
            height: '100%',
            background: color,
            borderRadius: 9999,
            transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
      {/* Label */}
      {showLabel && (
        <span
          className="font-mono shrink-0 font-medium"
          style={{ fontSize: 12, color, minWidth: 32, textAlign: 'right' }}
        >
          {score.toFixed(1)}
        </span>
      )}
    </div>
  )
}
