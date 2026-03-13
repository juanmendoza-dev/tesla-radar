import { useEffect, useState } from 'react'
import { getBearingLabel } from '../services/geo.js'

export default function AlertPill({ alert }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (alert) {
      setExiting(false)
      setVisible(true)
    } else if (visible) {
      setExiting(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setExiting(false)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [alert]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null

  const direction = alert?.bearing != null ? getBearingLabel(alert.bearing) : ''
  const type = (alert?.type || '').replace('_', ' ').toUpperCase()

  return (
    <div
      className="absolute top-4 left-1/2 z-30"
      style={{
        transform: 'translateX(-50%)',
        animation: exiting ? 'slide-up 0.4s ease-in forwards' : 'slide-down 0.4s ease-out forwards',
      }}
    >
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-full"
        style={{
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(255,0,0,0.4)',
          animation: 'alert-pill-pulse 1.5s ease-in-out infinite',
          minWidth: '200px',
        }}
      >
        {/* Blinking dot */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{
            background: '#ff0000',
            animation: 'blink 0.8s ease-in-out infinite',
            boxShadow: '0 0 8px rgba(255,0,0,0.6)',
          }}
        />

        {/* Type */}
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-heading)', color: '#ff4444' }}
        >
          {type}
        </span>

        {/* Distance */}
        <span
          className="text-sm tabular-nums"
          style={{ fontFamily: 'var(--font-heading)', color: '#fff' }}
        >
          {alert?.distance} mi
        </span>

        {/* Direction */}
        {direction && (
          <span
            className="text-xs"
            style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)' }}
          >
            {direction}
          </span>
        )}
      </div>
    </div>
  )
}
