import { useMemo } from 'react'

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

export default function Compass({ heading = 0 }) {
  const label = useMemo(() => {
    return DIRS[Math.round(((heading % 360) + 360) % 360 / 45) % 8]
  }, [heading])

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 select-none">
      {/* Compass ring */}
      <div
        className="relative w-12 h-12 rounded-full border border-white/[0.06]"
        style={{ background: 'var(--panel-bg)', backdropFilter: 'blur(20px)' }}
      >
        {/* Rotating needle */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          {/* North indicator */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: '8px solid var(--accent)',
            }}
          />
          {/* South indicator */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '3px solid transparent',
              borderRight: '3px solid transparent',
              borderTop: '6px solid rgba(255,255,255,0.1)',
            }}
          />
        </div>
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        </div>
      </div>

      {/* Heading readout */}
      <div className="flex flex-col items-start">
        <span
          className="text-sm tabular-nums leading-none"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}
        >
          {Math.round(heading)}°
        </span>
        <span
          className="text-[10px] uppercase tracking-widest leading-none mt-0.5"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
