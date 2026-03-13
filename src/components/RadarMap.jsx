import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import mapStyle from '../styles/mapStyle.js'

export default function RadarMap({ position, alerts, heading, route }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const userMarkerRef = useRef(null)
  const alertMarkersRef = useRef([])
  const flashIntervalsRef = useRef([])
  const routeAnimRef = useRef(null)

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

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Create chevron user marker with heading cone + double pulse
  const createUserMarkerElement = useCallback(() => {
    const container = document.createElement('div')
    container.style.cssText = 'position:relative;width:60px;height:60px;display:flex;align-items:center;justify-content:center;'

    // Heading cone (directional wedge)
    const cone = document.createElement('div')
    cone.className = 'user-heading-cone'
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

    // Chevron arrow
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

  // Update user position + heading
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

    // Rotate marker to match heading
    if (heading != null && heading !== 0) {
      const el = userMarkerRef.current.getElement()
      el.style.transform = `rotate(${heading}deg)`
    }

    mapRef.current.easeTo({
      center: [position.lng, position.lat],
      duration: 1000,
    })
  }, [position, heading, createUserMarkerElement])

  // Create police pin with alternating blue/red flash
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

    // Outer glow ring
    const glow = document.createElement('div')
    glow.style.cssText = `
      position:absolute;width:${glowSize}px;height:${glowSize}px;
      border-radius:50%;
      background:radial-gradient(circle, rgba(0,64,255,0.3) 0%, transparent 70%);
      animation:breathe ${isClose ? '0.5s' : '1.5s'} ease-in-out infinite;
    `
    container.appendChild(glow)

    // Core dot
    const dot = document.createElement('div')
    dot.style.cssText = `
      position:relative;z-index:1;
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:#0040ff;
      box-shadow:0 0 ${isClose ? 20 : 10}px rgba(0,64,255,0.8);
    `
    container.appendChild(dot)

    // Alternating flash
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

  // Create camera pin (solid yellow, steady glow)
  const createCameraPin = useCallback((alert) => {
    const size = Math.max(14, Math.min(28, 14 + (alert.confidence / 100) * 14))

    const container = document.createElement('div')
    container.style.cssText = `
      position:relative;width:${size + 16}px;height:${size + 16}px;
      display:flex;align-items:center;justify-content:center;cursor:pointer;
    `

    // Steady glow
    const glow = document.createElement('div')
    glow.style.cssText = `
      position:absolute;width:${size + 12}px;height:${size + 12}px;
      border-radius:50%;
      background:radial-gradient(circle, rgba(255,204,0,0.2) 0%, transparent 70%);
    `
    container.appendChild(glow)

    // Core dot
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

  // Update alert markers
  useEffect(() => {
    if (!mapRef.current) return

    // Clear old markers and flash intervals
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
        // Other alert types — small colored dot
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
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(popupContent)
        )
        .addTo(mapRef.current)

      alertMarkersRef.current.push(marker)
    })

    return () => {
      flashIntervalsRef.current.forEach((id) => clearInterval(id))
    }
  }, [alerts, createPolicePin, createCameraPin])

  // Route layer — animated dashed line
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Wait for map to load style
    const addRoute = () => {
      // Remove existing route layers
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
        data: {
          type: 'Feature',
          geometry: route.geometry,
        },
      })

      // Glow under the route
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

      // Animated dashed line
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

      // Animate the dashes flowing forward
      let dashOffset = 0
      const animateDash = () => {
        dashOffset -= 0.15
        const dash = 2
        const gap = 3
        const phase = ((dashOffset % (dash + gap)) + (dash + gap)) % (dash + gap)
        map.setPaintProperty('route-line', 'line-dasharray', [dash, gap])
        // MapLibre doesn't support line-dashoffset natively, so we shift the pattern
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
      if (routeAnimRef.current) {
        cancelAnimationFrame(routeAnimRef.current)
      }
    }
  }, [route])

  return <div ref={containerRef} className="w-full h-full" />
}
