import { useEffect, useRef } from 'react'
import { playAlertSound } from '../services/audio.js'

export default function AlertBanner({ alert }) {
  const lastAlertRef = useRef(null)

  useEffect(() => {
    if (!alert) return
    // Play sound only when a new closest alert appears
    if (lastAlertRef.current !== alert.id) {
      lastAlertRef.current = alert.id
      playAlertSound(alert.type)
    }
  }, [alert])

  if (!alert) return null

  const urgency = alert.distance < 0.5 ? 'critical' : alert.distance < 1 ? 'warning' : 'info'
  const bgColor = urgency === 'critical'
    ? 'bg-red-600/90'
    : urgency === 'warning'
      ? 'bg-yellow-600/90'
      : 'bg-blue-600/80'

  const pulseClass = urgency === 'critical' ? 'animate-pulse' : ''

  return (
    <div className={`
      absolute top-0 left-0 right-[200px] z-20
      ${bgColor} ${pulseClass}
      backdrop-blur-sm px-6 py-3
      flex items-center justify-between
      border-b border-white/10
    `}>
      <div className="flex items-center gap-4">
        <span className="text-2xl">
          {alert.type === 'police' ? '🚔' : alert.type === 'speed_trap' ? '📸' : '⚠️'}
        </span>
        <div>
          <div className="font-bold text-base uppercase tracking-wide">
            {alert.type.replace('_', ' ')} AHEAD
          </div>
          <div className="text-sm opacity-80">
            {alert.description}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold tabular-nums">{alert.distance} mi</div>
        <div className="text-sm opacity-80">{alert.direction}</div>
      </div>
    </div>
  )
}
