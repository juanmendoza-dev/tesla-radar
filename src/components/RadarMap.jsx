import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import mapStyle from '../styles/mapStyle.js'

// Speed-adaptive zoom: city streets = 17, highway = 15
function zoomForSpeed(speed) {
  if (speed == null || speed <= 0) return 17
  if (speed >= 55) return 15
  if (speed >= 35) return 16
  return 17
}

export default function RadarMap({ position, alerts, heading, speed, route }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const userMarkerRef = useRef(null)
  const alertMarkersRef = useRef([])
  const flashIntervalsRef = useRef([])
  const routeAnimRef = useRef(null)
  const isFirstFixRef = useRef(true)

  // Initialize map — heading-up mode
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const initialCenter = position ? [position.lng, position.lat] : [-122.4194, 37.7749]
    const initialBearing = heading || 0

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: initialCenter,
      zoom: 17,
      bearing: -initialBearing, // negative because heading-up means map rotates opposite
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false, // user shouldn't manually rotate in heading-up mode
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Create chevron marker — always points UP (map rotates under it)
  const createUserMarkerElement = useCallback(() => {
    const container = document.createElement('div')
    container.style.cssText = 'position:relative;width:60px;height:60px;display:flex;align-items:center;justify-content:center;'

    // Heading cone (always points up)
    const cone = document.createElement('div')
    cone.style.cssText = `
      position:absolute;
      width:0;height:0;
      border-left:20px solid transparent;
      border-right:20px solid transparent;
      border-bottom:40px solid rgba(0,180,255,0.08);
      top:-20px;left:50%;transform:translateX(-50%);
      filter:blur(4px);
      pointer-events:none;
    `
    container.appendChild(cone)

    // Pulse ring 1
    const ring1 = document.createElement('span')
    ring1.style.cssText = 'position:absolute;width:10px;height:10px;border-radius:50%;border:1.5px solid #00b4ff;animation:pulse-ring 2s ease-out infinite;'
    container.appendChild(ring1)

    // Pulse ring 2 (staggered)
    const ring2 = document.createElement('span')
    ring2.style.cssText = 'position:absolute;width:10px;height:10px;border-radius:50%;border:1.5px solid #00b4ff;animation:pulse-ring 2s ease-out 1s infinite;'
    container.appendChild(ring2)

    // Chevron arrow (points up — the map rotates, not the chevron)
    const chevron = document.createElement('div')
    chevron.style.cssText = `
      position:relative;z-index:2;
      width:0;height:0;
      border-left:7px solid transparent;
      border-right:7px solid transparent;
      border-bottom:12px solid #ffffff;
      filter:drop-shadow(0 0 4px rgba(0,180,255,0.6));
    `
    container.appendChild(chevron)

    return container
  }, [])

  // ── Core: Follow user position + heading-up rotation + adaptive zoom ──
  useEffect(() => {
    if (!mapRef.current || !position) return

    const map = mapRef.current

    // Place user marker at center
    if (!userMarkerRef.current) {
      const el = createUserMarkerElement()
      userMarkerRef.current = new maplibregl.Marker({
        element: el,
        rotationAlignment: 'map',
        pitchAlignment: 'map',
      })
        .setLngLat([position.lng, position.lat])
        .addTo(map)
    } else {
      userMarkerRef.current.setLngLat([position.lng, position.lat])
    }

    // Heading-up: map bearing = negative heading so user's direction faces up
    const mapBearing = heading != null ? -heading : 0
    const targetZoom = zoomForSpeed(speed)

    if (isFirstFixRef.current) {
      // First GPS fix — jump instantly
      map.jumpTo({
        center: [position.lng, position.lat],
        bearing: mapBearing,
        zoom: targetZoom,
      })
      isFirstFixRef.current = false
    } else {
      // Smooth follow on every subsequent update
      map.easeTo({
        center: [position.lng, position.lat],
        bearing: mapBearing,
        zoom: targetZoom,
        duration: 300,
        easing: (t) => t, // linear for smooth continuous tracking
      })
    }
  }, [position, heading, speed, createUserMarkerElement])

  // ── Police pins: alternating blue/red flash ──
  const createPolicePin = useCallback((alert) => {
    const isClose = alert.distance < 0.5
    const flashSpeed = isClose ? 250 : 500
    const size = Math.max(20, Math.min(40, 20 + (alert.confidence / 100) * 20))
    const glowSize = isClose ? size * 2.5 : size * 1.5

    const container = document.createElement('div')
    container.style.cssText = `
      position:relative;width:${glowSize}px;height:${glowSize}px;
      display:flex;align-items:center;justify-content:center;cursor:pointer;
    `

    const glow = document.createElement('div')
    glow.style.cssText = `
      position:absolute;width:${glowSize}px;height:${glowSize}px;
      border-radius:50%;
      background:radial-gradient(circle, rgba(0,64,255,0.3) 0%, transparent 70%);
      animation:breathe ${isClose ? '0.5s' : '1.5s'} ease-in-out infinite;
    `
    container.appendChild(glow)

    const dot = document.createElement('div')
    dot.style.cssText = `
      position:relative;z-index:1;
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:#0040ff;
      box-shadow:0 0 ${isClose ? 20 : 10}px rgba(0,64,255,0.8);
    `
    container.appendChild(dot)

    let isBlue = true
    const interval = setInterval(() => {
      isBlue = !isBlue
      const color = isBlue ? '#0040ff' : '#ff0000'
      const glowColor = isBlue ? 'rgba(0,64,255,0.8)' : 'rgba(255,0,0,0.8)'
      dot.style.background = color
      dot.style.boxShadow = `0 0 ${isClose ? 20 : 10}px ${glowColor}`
      glow.style.background = `radial-gradient(circle, ${isBlue ? 'rgba(0,64,255,0.3)' : 'rgba(255,0,0,0.3)'} 0%, transparent 70%)`
    }, flashSpeed)

    flashIntervalsRef.current.push(interval)
    return container
  }, [])

  // ── Camera pins: solid yellow, steady glow ──
  const createCameraPin = useCallback((alert) => {
    const size = Math.max(14, Math.min(28, 14 + (alert.confidence / 100) * 14))

    const container = document.createElement('div')
    container.style.cssText = `
      position:relative;width:${size + 16}px;height:${size + 16}px;
      display:flex;align-items:center;justify-content:center;cursor:pointer;
    `

    const glow = document.createElement('div')
    glow.style.cssText = `
      position:absolute;width:${size + 12}px;height:${size + 12}px;
      border-radius:50%;
      background:radial-gradient(circle, rgba(255,204,0,0.2) 0%, transparent 70%);
    `
    container.appendChild(glow)

    const dot = document.createElement('div')
    dot.style.cssText = `
      position:relative;z-index:1;
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:#ffcc00;
      box-shadow:0 0 8px rgba(255,204,0,0.6);
    `
    container.appendChild(dot)

    return container
  }, [])

  // ── Alert markers (anchored to real GPS coordinates) ──
  useEffect(() => {
    if (!mapRef.current) return

    // Clear old
    alertMarkersRef.current.forEach((m) => m.remove())
    alertMarkersRef.current = []
    flashIntervalsRef.current.forEach((id) => clearInterval(id))
    flashIntervalsRef.current = []

    if (!alerts) return

    alerts.forEach((alert) => {
      let el
      if (alert.type === 'police' || alert.type === 'speed_trap') {
        el = createPolicePin(alert)
      } else if (alert.type === 'camera') {
        el = createCameraPin(alert)
      } else {
        const size = 16
        el = document.createElement('div')
        el.style.cssText = `
          width:${size}px;height:${size}px;border-radius:50%;
          background:#ffaa00;cursor:pointer;
          box-shadow:0 0 8px rgba(255,170,0,0.5);
        `
      }

      const label = alert.confidence_label || ''
      const popupContent = `
        <div style="font-family:'DM Mono',monospace;">
          <div style="font-family:'Rajdhani',sans-serif;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;color:#fff;">
            ${(alert.type || '').replace('_', ' ')}
          </div>
          <div style="color:rgba(255,255,255,0.5);font-size:11px;margin-top:4px;">
            ${alert.description || ''}
          </div>
          <div style="font-family:'Rajdhani',sans-serif;color:#fff;font-size:16px;margin-top:6px;">
            ${alert.distance} mi
            <span style="font-size:11px;margin-left:8px;color:${alert.confidence >= 90 ? '#00ff64' : alert.confidence >= 60 ? '#ffb400' : '#ff5050'};">
              ${alert.confidence}% ${label}
            </span>
          </div>
        </div>
      `

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([alert.lng, alert.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(popupContent))
        .addTo(mapRef.current)

      alertMarkersRef.current.push(marker)
    })

    return () => {
      flashIntervalsRef.current.forEach((id) => clearInterval(id))
    }
  }, [alerts, createPolicePin, createCameraPin])

  // ── Route layer ──
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const addRoute = () => {
      if (map.getLayer('route-glow')) map.removeLayer('route-glow')
      if (map.getLayer('route-line')) map.removeLayer('route-line')
      if (map.getSource('route')) map.removeSource('route')

      if (!route || !route.geometry) {
        if (routeAnimRef.current) {
          cancelAnimationFrame(routeAnimRef.current)
          routeAnimRef.current = null
        }
        return
      }

      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: route.geometry },
      })

      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#00b4ff',
          'line-width': 14,
          'line-blur': 12,
          'line-opacity': 0.2,
        },
      }, 'road-label')

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#00b4ff',
          'line-width': 4,
          'line-dasharray': [2, 3],
          'line-opacity': 0.9,
        },
      }, 'road-label')

      let dashOffset = 0
      const animateDash = () => {
        dashOffset -= 0.15
        map.setPaintProperty('route-line', 'line-dasharray', [2, 3])
        routeAnimRef.current = requestAnimationFrame(animateDash)
      }
      animateDash()
    }

    if (map.isStyleLoaded()) {
      addRoute()
    } else {
      map.on('load', addRoute)
    }

    return () => {
      if (routeAnimRef.current) cancelAnimationFrame(routeAnimRef.current)
    }
  }, [route])

  return <div ref={containerRef} className="w-full h-full" />
}
