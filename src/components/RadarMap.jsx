import { useEffect, useRef, useCallback, useState } from 'react'
import maplibregl from 'maplibre-gl'
import mapStyle from '../styles/mapStyle.js'
import RadarSweep from './RadarSweep.jsx'

const ALERT_COLORS = {
  police: '#ff2d2d',
  speed_trap: '#ff8c00',
  hazard: '#ffaa00',
  accident: '#a855f7',
  camera: '#ff6b35',
  speed_camera: '#ff6b35',
  other: '#666666',
  unknown: '#666666',
}

const ALERT_ICONS = {
  police: '🚔',
  speed_trap: '📸',
  hazard: '⚠️',
  accident: '💥',
  camera: '📷',
  speed_camera: '📷',
  other: '❗',
  unknown: '❗',
}

export default function RadarMap({ position, alerts, heading }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const userMarkerRef = useRef(null)
  const alertMarkersRef = useRef([])
  const [sweepCenter, setSweepCenter] = useState(null)

  // Update sweep center when map moves or position changes
  const updateSweepCenter = useCallback(() => {
    if (!mapRef.current || !position) return
    const point = mapRef.current.project([position.lng, position.lat])
    setSweepCenter({ x: point.x, y: point.y })
  }, [position])

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: position ? [position.lng, position.lat] : [-122.4194, 37.7749],
      zoom: 14,
      attributionControl: false,
      pitchWithRotate: false,
    })

    map.on('move', updateSweepCenter)
    map.on('zoom', updateSweepCenter)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Create user marker element with pulsing rings
  const createUserMarkerElement = useCallback(() => {
    const container = document.createElement('div')
    container.style.cssText = 'position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;'

    // Pulse ring 1
    const ring1 = document.createElement('span')
    ring1.style.cssText = 'position:absolute;width:6px;height:6px;border-radius:50%;border:2px solid #00b4ff;animation:pulse-ring 2s ease-out infinite;'
    container.appendChild(ring1)

    // Pulse ring 2 (staggered)
    const ring2 = document.createElement('span')
    ring2.style.cssText = 'position:absolute;width:6px;height:6px;border-radius:50%;border:2px solid #00b4ff;animation:pulse-ring 2s ease-out 1s infinite;'
    container.appendChild(ring2)

    // Core dot
    const core = document.createElement('span')
    core.style.cssText = 'position:relative;width:6px;height:6px;border-radius:50%;background:#fff;box-shadow:0 0 6px 2px rgba(0,180,255,0.6);z-index:1;'
    container.appendChild(core)

    return container
  }, [])

  // Update user position marker
  useEffect(() => {
    if (!mapRef.current || !position) return

    if (!userMarkerRef.current) {
      const el = createUserMarkerElement()
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([position.lng, position.lat])
        .addTo(mapRef.current)
    } else {
      userMarkerRef.current.setLngLat([position.lng, position.lat])
    }

    // Smoothly follow user
    mapRef.current.easeTo({
      center: [position.lng, position.lat],
      duration: 1000,
    })

    updateSweepCenter()
  }, [position, heading, createUserMarkerElement, updateSweepCenter])

  // Update alert markers
  useEffect(() => {
    if (!mapRef.current) return

    // Clear old markers
    alertMarkersRef.current.forEach((m) => m.remove())
    alertMarkersRef.current = []

    if (!alerts) return

    alerts.forEach((alert) => {
      const color = ALERT_COLORS[alert.type] || ALERT_COLORS.unknown
      const icon = ALERT_ICONS[alert.type] || ALERT_ICONS.unknown
      const isClose = alert.distance < 0.5

      const el = document.createElement('div')
      el.style.cssText = `
        display:flex;align-items:center;justify-content:center;
        width:36px;height:36px;
        background:${color}15;
        border:1.5px solid ${color}60;
        border-radius:50%;
        font-size:16px;
        cursor:pointer;
        box-shadow:0 0 12px ${color}30;
        animation:${isClose ? 'breathe-fast' : 'breathe'} ${isClose ? '1s' : '2.5s'} ease-in-out infinite;
      `
      el.textContent = icon
      el.title = `${alert.type} — ${alert.description} (${alert.distance} mi)`

      const popupContent = `
        <div style="font-family:var(--font-body);">
          <div style="font-family:var(--font-heading);font-weight:600;color:${color};font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">
            ${(alert.type || '').replace('_', ' ')}
          </div>
          <div style="font-family:var(--font-mono);color:var(--text-secondary);font-size:11px;margin-top:4px;">
            ${alert.description || ''}
          </div>
          <div style="font-family:var(--font-heading);color:var(--text-primary);font-size:14px;margin-top:6px;">
            ${alert.distance} mi
            <span style="font-family:var(--font-mono);color:var(--text-tertiary);font-size:10px;margin-left:6px;">
              confidence ${alert.confidence || '—'}
            </span>
          </div>
        </div>
      `

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([alert.lng, alert.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(popupContent)
        )
        .addTo(mapRef.current)

      alertMarkersRef.current.push(marker)
    })
  }, [alerts])

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {sweepCenter && (
        <RadarSweep center={sweepCenter} radius={180} />
      )}
    </div>
  )
}
