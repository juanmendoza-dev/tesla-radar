import { useEffect, useRef, useState } from 'react'
import { playAlertSound } from '../services/audio.js'

const TYPE_CONFIG = {
  police: { icon: '🚔', label: 'POLICE AHEAD' },
  speed_trap: { icon: '📸', label: 'SPEED TRAP AHEAD' },
  hazard: { icon: '⚠️', label: 'HAZARD AHEAD' },
  accident: { icon: '💥', label: 'ACCIDENT AHEAD' },
  camera: { icon: '📷', label: 'CAMERA AHEAD' },
  other: { icon: '❗', label: 'ALERT' },
  unknown: { icon: '❗', label: 'ALERT' },
}

export default function AlertBanner({ alert }) {
  const lastAlertRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  useEffect(() => {
    if (alert) {
      setDismissing(false)
      setVisible(true)
      // Play sound only on new alert
      if (lastAlertRef.current !== alert.id) {
        lastAlertRef.current = alert.id
        playAlertSound(alert.type)
      }
    } else if (visible) {
      // Slide up dismiss
      setDismissing(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setDismissing(false)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [alert]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null

  const displayAlert = alert || lastAlertRef.current
  if (!displayAlert) return null

  const config = TYPE_CONFIG[displayAlert.type] || TYPE_CONFIG.unknown
  const isCritical = displayAlert.distance < 0.5
  const isWarning = displayAlert.distance < 1

  return (
    <div
      className="absolute top-0 left-0 right-[200px] z-30 pointer-events-none"
      style={{
        animation: dismissing ? 'slide-up 0.4s ease-in forwards' : 'slide-down 0.4s ease-out',
      }}
    >
      <div
        className="pointer-events-auto px-5 py-3 flex items-center justify-between"
        style={{
          background: isCritical
            ? 'linear-gradient(135deg, rgba(255,45,45,0.25), rgba(255,45,45,0.1))'
            : isWarning
              ? 'linear-gradient(135deg, rgba(255,140,0,0.2), rgba(255,140,0,0.08))'
              : 'linear-gradient(135deg, rgba(0,180,255,0.15), rgba(0,180,255,0.05))',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${isCritical ? 'rgba(255,45,45,0.2)' : 'rgba(255,255,255,0.04)'}`,
          animation: isCritical ? 'red-flash 1.5s ease-in-out infinite' : 'none',
        }}
      >
        {/* Left: icon + label */}
        <div className="flex items-center gap-4">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <div
              className="text-sm font-semibold uppercase tracking-wider"
              style={{
                fontFamily: 'var(--font-heading)',
                color: isCritical ? '#ff2d2d' : 'var(--text-primary)',
              }}
            >
              {config.label}
            </div>
            {displayAlert.description && (
              <div
                className="text-xs mt-0.5"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}
              >
                {displayAlert.description}
              </div>
            )}
          </div>
        </div>

        {/* Right: distance + direction */}
        <div className="text-right">
          <div
            className="text-2xl tabular-nums leading-none"
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: isCritical ? '#ff2d2d' : 'var(--text-primary)',
            }}
          >
            {displayAlert.distance} mi
          </div>
          <div
            className="text-xs mt-1"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}
          >
            {displayAlert.direction}
          </div>
        </div>
      </div>
    </div>
  )
}
