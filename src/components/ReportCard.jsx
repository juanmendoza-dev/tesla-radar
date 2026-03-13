const TYPE_CONFIG = {
  police: { icon: '🚔', color: '#ff2d2d', label: 'POLICE' },
  speed_trap: { icon: '📸', color: '#ff8c00', label: 'SPEED TRAP' },
  hazard: { icon: '⚠️', color: '#ffaa00', label: 'HAZARD' },
  accident: { icon: '💥', color: '#a855f7', label: 'ACCIDENT' },
  camera: { icon: '📷', color: '#ff6b35', label: 'CAMERA' },
  other: { icon: '❗', color: '#666', label: 'ALERT' },
  unknown: { icon: '❗', color: '#666', label: 'ALERT' },
}

function formatAge(ms) {
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h`
}

export default function ReportCard({ report, index }) {
  const config = TYPE_CONFIG[report.type] || TYPE_CONFIG.unknown
  const confidencePct = Math.min(100, Math.max(0, report.confidence || 50))

  return (
    <div
      className="px-3 py-2.5 touch-manipulation cursor-pointer transition-colors hover:bg-white/[0.02]"
      style={{
        animation: `slide-in-right 0.3s ease-out ${index * 0.05}s both`,
        borderBottom: '1px solid var(--card-border)',
      }}
    >
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
          style={{
            background: `${config.color}12`,
            border: `1px solid ${config.color}25`,
          }}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-mono)', color: config.color }}
            >
              {config.label}
            </span>
            <span
              className="text-[10px] tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}
            >
              {formatAge(report.age || 0)}
            </span>
          </div>

          {/* Distance + direction */}
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="text-sm tabular-nums"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
            >
              {report.distance} mi
            </span>
            <span
              className="text-[10px]"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}
            >
              {report.bearing != null ? report.direction || '' : ''}
            </span>
          </div>

          {/* Confidence bar */}
          <div className="mt-1.5 h-[2px] rounded-full overflow-hidden" style={{ background: 'var(--card-bg)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${confidencePct}%`,
                background: confidencePct > 70 ? config.color : 'var(--text-tertiary)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
