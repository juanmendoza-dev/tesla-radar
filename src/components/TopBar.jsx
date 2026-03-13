export default function TopBar({ navigation }) {
  if (!navigation || !navigation.active) return null

  const { nextManeuver, eta, arrivalTime, nextStreet, nextDistance } = navigation

  // Maneuver icons
  const maneuverIcons = {
    'turn-left': '\u2190',
    'turn-right': '\u2192',
    'straight': '\u2191',
    'slight-left': '\u2196',
    'slight-right': '\u2197',
    'sharp-left': '\u21B0',
    'sharp-right': '\u21B1',
    'uturn': '\u21BA',
    'merge': '\u21C8',
    'arrive': '\u2691',
  }

  const icon = maneuverIcons[nextManeuver] || '\u2191'

  return (
    <>
      {/* Turn-by-turn card — top left */}
      <div
        className="absolute top-4 left-4 z-20 flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          minWidth: '180px',
        }}
      >
        {/* Maneuver icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(0,180,255,0.12)',
            border: '1px solid rgba(0,180,255,0.2)',
          }}
        >
          <span
            className="text-xl"
            style={{ fontFamily: 'var(--font-heading)', color: '#00b4ff' }}
          >
            {icon}
          </span>
        </div>

        <div className="min-w-0">
          {/* Distance to next turn */}
          <div
            className="text-lg tabular-nums leading-none"
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: '#fff' }}
          >
            {nextDistance || '—'}
          </div>
          {/* Street name */}
          <div
            className="text-xs mt-0.5 truncate max-w-[140px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)' }}
          >
            {nextStreet || 'Continue'}
          </div>
        </div>
      </div>

      {/* ETA card — top right */}
      <div
        className="absolute top-4 z-20 flex flex-col items-end px-4 py-3 rounded-2xl"
        style={{
          right: '226px', // 210px panel + 16px gap
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="text-lg tabular-nums leading-none"
          style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: '#fff' }}
        >
          {eta != null ? `${eta} min` : '—'}
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)' }}
        >
          {arrivalTime || ''}
        </div>
      </div>
    </>
  )
}
