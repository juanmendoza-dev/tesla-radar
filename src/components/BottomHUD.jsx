import useAnimatedValue from '../hooks/useAnimatedValue.js'

export default function BottomHUD({ speed, speedLimit, heading }) {
  const animatedSpeed = useAnimatedValue(speed || 0, 300)
  const displaySpeed = Math.round(animatedSpeed)

  // Compass cardinal direction
  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const cardinalIndex = heading != null
    ? Math.round(((heading % 360) + 360) % 360 / 45) % 8
    : 0
  const cardinal = heading != null ? cardinals[cardinalIndex] : '—'

  const isOverLimit = speedLimit && speed && speed > speedLimit

  return (
    <>
      {/* Speed + limit — bottom left */}
      <div className="absolute bottom-6 left-6 z-20">
        {/* Speed number */}
        <div className="flex items-baseline gap-1">
          <span
            className="tabular-nums leading-none"
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 300,
              fontSize: '72px',
              color: isOverLimit ? '#ff4444' : '#ffffff',
              textShadow: isOverLimit ? '0 0 20px rgba(255,68,68,0.4)' : 'none',
            }}
          >
            {displaySpeed}
          </span>
          <span
            className="text-sm uppercase tracking-wider"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'rgba(255,255,255,0.3)',
              marginBottom: '8px',
            }}
          >
            MPH
          </span>
        </div>

        {/* Speed limit badge */}
        {speedLimit && (
          <div
            className="flex items-center justify-center mt-1"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: `2px solid ${isOverLimit ? '#ff4444' : 'rgba(255,255,255,0.2)'}`,
              background: isOverLimit ? 'rgba(255,68,68,0.1)' : 'rgba(0,0,0,0.6)',
            }}
          >
            <span
              className="tabular-nums"
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: '16px',
                color: isOverLimit ? '#ff4444' : 'rgba(255,255,255,0.7)',
              }}
            >
              {speedLimit}
            </span>
          </div>
        )}
      </div>

      {/* Compass — bottom center */}
      <div
        className="absolute bottom-6 left-1/2 z-20 flex flex-col items-center"
        style={{ transform: 'translateX(-50%)' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <span
            className="text-xs font-semibold"
            style={{
              fontFamily: 'var(--font-heading)',
              color: cardinal === 'N' ? '#00b4ff' : 'rgba(255,255,255,0.5)',
            }}
          >
            {cardinal}
          </span>
        </div>
      </div>
    </>
  )
}
