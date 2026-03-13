const TYPE_CONFIG = {
  police: { label: 'POLICE', color: '#ff2d2d' },
  speed_trap: { label: 'SPEED TRAP', color: '#ff8c00' },
  hazard: { label: 'HAZARD', color: '#ffaa00' },
  accident: { label: 'ACCIDENT', color: '#a855f7' },
  camera: { label: 'CAMERA', color: '#ffcc00' },
  other: { label: 'ALERT', color: '#666' },
  unknown: { label: 'ALERT', color: '#666' },
}

function confidenceBorderColor(score) {
  if (score >= 90) return 'rgba(0,255,100,0.3)'
  if (score >= 60) return 'rgba(255,180,0,0.3)'
  return 'rgba(255,80,80,0.3)'
}

function confidenceBarColor(score) {
  if (score >= 90) return '#00ff64'
  if (score >= 60) return '#ffb400'
  return '#ff5050'
}

export default function ReportCard({ report, index }) {
  const config = TYPE_CONFIG[report.type] || TYPE_CONFIG.unknown
  const confidence = Math.min(100, Math.max(0, report.confidence || 0))
  const label = report.confidence_label || ''

  // Don't show below 40
  if (confidence < 40) return null

  return (
    <div
      className="px-3 py-3 touch-manipulation cursor-pointer transition-colors hover:bg-white/[0.03]"
      style={{
        animation: `slide-in-right 0.3s ease-out ${index * 0.05}s both`,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        borderLeft: `3px solid ${confidenceBorderColor(confidence)}`,
      }}
    >
      <div className="flex items-start justify-between">
        {/* Left: type + distance */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-mono)', color: config.color }}
            >
              {config.label}
            </span>
            {label && (
              <span
                className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: confidenceBarColor(confidence),
                  background: `${confidenceBarColor(confidence)}15`,
                }}
              >
                {label}
              </span>
            )}
          </div>

          {/* Distance + direction */}
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="text-sm tabular-nums"
              style={{ fontFamily: 'var(--font-heading)', color: '#fff' }}
            >
              {report.distance} mi
            </span>
            <span
              className="text-[10px]"
              style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)' }}
            >
              {report.direction || ''}
            </span>
          </div>
        </div>

        {/* Right: confidence percentage */}
        <div className="text-right flex-shrink-0 ml-2">
          <span
            className="text-lg tabular-nums leading-none"
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              color: confidenceBarColor(confidence),
            }}
          >
            {confidence}%
          </span>
        </div>
      </div>

      {/* Confidence progress bar */}
      <div
        className="mt-2 h-[2px] rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${confidence}%`,
            background: confidenceBarColor(confidence),
          }}
        />
      </div>
    </div>
  )
}
