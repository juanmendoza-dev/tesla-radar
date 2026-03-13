import useAnimatedValue from '../hooks/useAnimatedValue.js'

export default function SpeedOverlay({ speed, speedLimit }) {
  const animatedSpeed = useAnimatedValue(speed, 400)
  const isOverLimit = speedLimit && speed > speedLimit

  return (
    <div
      className="absolute bottom-4 left-4 z-20 select-none"
      style={{
        background: 'var(--panel-bg)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${isOverLimit ? 'rgba(255,45,45,0.3)' : 'rgba(255,255,255,0.04)'}`,
        borderRadius: '16px',
        padding: '12px 20px',
        minWidth: '90px',
        textAlign: 'center',
        transition: 'border-color 0.3s ease',
      }}
    >
      <div
        className="tabular-nums leading-none"
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '36px',
          color: isOverLimit ? '#ff2d2d' : 'var(--text-primary)',
          transition: 'color 0.3s ease',
        }}
      >
        {Math.round(animatedSpeed)}
      </div>
      <div
        className="uppercase tracking-[0.2em] mt-1"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          color: 'var(--text-tertiary)',
        }}
      >
        mph
      </div>
      {speedLimit && (
        <div
          className="mt-1.5 pt-1.5"
          style={{ borderTop: '1px solid var(--card-border)' }}
        >
          <span
            className="tabular-nums"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text-secondary)',
            }}
          >
            limit {speedLimit}
          </span>
        </div>
      )}
    </div>
  )
}
