/**
 * EvidenceTag.jsx — Individual evidence item display
 * feature_type: text_similarity | option_order | question_order | semantic_similarity
 */

const FEATURE_CONFIG = {
  text_similarity: {
    icon: '📝',
    label: 'Text Match',
    color: '#00D4FF',
  },
  option_order: {
    icon: '🔀',
    label: 'Option Order',
    color: '#F5A623',
  },
  question_order: {
    icon: '📋',
    label: 'Question Seq',
    color: '#A0A0A0',
  },
  semantic_similarity: {
    icon: '🧠',
    label: 'Semantic Sim',
    color: '#30A46C',
  },
}

export default function EvidenceTag({ feature_type, score, description }) {
  const cfg = FEATURE_CONFIG[feature_type] || {
    icon: '◆',
    label: feature_type,
    color: '#555',
  }

  const pct = Math.round(score * 100)

  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-ts"
      style={{ background: '#0A0A0A', border: '1px solid #222' }}
      title={description}
    >
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 14 }}>{cfg.icon}</span>
        <span className="font-mono text-ts-secondary" style={{ fontSize: 11 }}>
          {cfg.label}
        </span>
      </div>
      <span
        className="font-mono font-medium"
        style={{ fontSize: 12, color: cfg.color }}
      >
        {pct}%
      </span>
    </div>
  )
}
